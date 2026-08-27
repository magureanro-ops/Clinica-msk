#!/usr/bin/env python3
"""Backend minim Clinica MSK — stdlib only (http.server + sqlite3)."""
from __future__ import annotations

import hashlib
import json
import mimetypes
import os
import secrets
import sqlite3
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, unquote

ROOT = os.path.dirname(os.path.abspath(__file__))
WEB_ROOT = ROOT if os.path.isfile(os.path.join(ROOT, "index.html")) else os.path.abspath(os.path.join(ROOT, ".."))
DB_PATH = os.path.join(ROOT, "msk.db")
HOST = os.environ.get("MSK_HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT") or os.environ.get("MSK_PORT", "8787"))

TOKENS: dict[str, dict] = {}


def db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = db()
    c = conn.cursor()
    c.execute(
        """CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL,
            name TEXT NOT NULL
        )"""
    )
    c.execute(
        """CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            kind TEXT NOT NULL,
            payload TEXT NOT NULL,
            updated_at REAL NOT NULL
        )"""
    )
    c.execute(
        """CREATE TABLE IF NOT EXISTS lists (
            kind TEXT PRIMARY KEY,
            payload TEXT NOT NULL,
            updated_at REAL NOT NULL
        )"""
    )
    conn.commit()
    defaults = [
        ("medic", "medic123", "doctor", "Medic MSK"),
        ("kineto", "kineto123", "kineto", "Kinetoterapeut MSK"),
        ("admin", "admin123", "admin", "Administrator"),
        ("pacient", "pacient123", "patient", "Pacient demo"),
    ]
    for user, pwd, role, name in defaults:
        c.execute("SELECT 1 FROM users WHERE username=?", (user,))
        if not c.fetchone():
            c.execute(
                "INSERT INTO users(username, password_hash, role, name) VALUES (?,?,?,?)",
                (user, hash_pwd(pwd), role, name),
            )
    conn.commit()
    conn.close()


def hash_pwd(pwd: str) -> str:
    return hashlib.sha256(("msk|" + pwd).encode()).hexdigest()


def json_body(handler: BaseHTTPRequestHandler) -> dict:
    length = int(handler.headers.get("Content-Length") or 0)
    raw = handler.rfile.read(length) if length else b"{}"
    try:
        return json.loads(raw.decode() or "{}")
    except json.JSONDecodeError:
        return {}


def get_list(kind: str) -> list:
    conn = db()
    row = conn.execute("SELECT payload FROM lists WHERE kind=?", (kind,)).fetchone()
    conn.close()
    if not row:
        return []
    try:
        return json.loads(row["payload"])
    except json.JSONDecodeError:
        return []


def set_list(kind: str, items: list) -> None:
    conn = db()
    conn.execute(
        "INSERT INTO lists(kind, payload, updated_at) VALUES(?,?,?) ON CONFLICT(kind) DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at",
        (kind, json.dumps(items, ensure_ascii=False), time.time()),
    )
    conn.commit()
    conn.close()


def upsert_item(kind: str, item: dict) -> dict:
    items = get_list(kind)
    item_id = item.get("id")
    if not item_id:
        item_id = kind[0] + "_" + secrets.token_hex(6)
        item["id"] = item_id
    item["savedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    found = False
    for i, existing in enumerate(items):
        if existing.get("id") == item_id:
            items[i] = item
            found = True
            break
    if not found:
        items.insert(0, item)
    set_list(kind, items)
    return item


def get_item(kind: str, item_id: str) -> dict | None:
    for item in get_list(kind):
        if item.get("id") == item_id:
            return item
    return None


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:
        print("[%s] %s" % (self.log_date_time_string(), fmt % args))

    def _cors(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")

    def _send(self, code: int, payload) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode()
        self.send_response(code)
        self._cors()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _auth(self) -> dict | None:
        header = self.headers.get("Authorization") or ""
        token = header.replace("Bearer ", "").strip()
        user = TOKENS.get(token)
        if not user:
            self._send(401, {"error": "Neautentificat"})
            return None
        return user

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self) -> None:
        path = urlparse(self.path).path.rstrip("/") or "/"
        if path == "/api/health":
            return self._send(200, {"ok": True, "service": "msk-backend-min", "users": ["medic", "kineto", "admin"]})
        if path == "/api/me":
            user = self._auth()
            if not user:
                return
            return self._send(200, user)
        mapping = {
            "/api/triages": "triages",
            "/api/consults": "consults",
            "/api/followups": "followUps",
            "/api/alerts": "followUpAlerts",
            "/api/escalations": "doctorEscalations",
        }
        if path in mapping:
            if not self._auth():
                return
            return self._send(200, {"items": get_list(mapping[path])})
        if path.startswith("/api/triages/"):
            if not self._auth():
                return
            item = get_item("triages", path.split("/")[-1])
            return self._send(200, item) if item else self._send(404, {"error": "Negăsit"})
        if path.startswith("/api/consults/"):
            if not self._auth():
                return
            item = get_item("consults", path.split("/")[-1])
            return self._send(200, item) if item else self._send(404, {"error": "Negăsit"})
        return self._serve_static()

    def do_POST(self) -> None:
        path = urlparse(self.path).path.rstrip("/") or "/"
        body = json_body(self)
        if path == "/api/login":
            username = (body.get("username") or "").strip()
            password = body.get("password") or ""
            conn = db()
            row = conn.execute(
                "SELECT username, password_hash, role, name FROM users WHERE username=?",
                (username,),
            ).fetchone()
            conn.close()
            if not row or row["password_hash"] != hash_pwd(password):
                return self._send(401, {"error": "Utilizator sau parolă greșită"})
            token = secrets.token_hex(16)
            user = {"username": row["username"], "role": row["role"], "name": row["name"]}
            TOKENS[token] = user
            return self._send(200, {"token": token, "user": user})
        mapping = {
            "/api/triages": "triages",
            "/api/consults": "consults",
            "/api/followups": "followUps",
            "/api/alerts": "followUpAlerts",
            "/api/escalations": "doctorEscalations",
        }
        if path in mapping:
            if not self._auth():
                return
            saved = upsert_item(mapping[path], body)
            return self._send(200, saved)
        if path == "/api/sync":
            if not self._auth():
                return
            # bulk replace lists from client
            for kind in ("triages", "consults", "followUps", "followUpAlerts", "doctorEscalations"):
                if kind in body and isinstance(body[kind], list):
                    set_list(kind, body[kind])
            return self._send(200, {"ok": True})
        if path == "/api/pull":
            if not self._auth():
                return
            return self._send(
                200,
                {
                    "triages": get_list("triages"),
                    "consults": get_list("consults"),
                    "followUps": get_list("followUps"),
                    "followUpAlerts": get_list("followUpAlerts"),
                    "doctorEscalations": get_list("doctorEscalations"),
                },
            )
        if path == "/api/public/triages":
            saved = upsert_item("triages", body)
            return self._send(200, saved)
        if path == "/api/public/followups":
            saved = upsert_item("followUps", body)
            alerts = get_list("followUpAlerts")
            alerts.insert(0, saved)
            set_list("followUpAlerts", alerts)
            return self._send(200, saved)
        return self._send(404, {"error": "Rută inexistentă"})

    def _serve_static(self) -> None:
        req = unquote(urlparse(self.path).path)
        if req in ("", "/"):
            req = "/index.html"
        # prevent path traversal
        full = os.path.normpath(os.path.join(WEB_ROOT, req.lstrip("/")))
        if not full.startswith(WEB_ROOT) or not os.path.isfile(full):
            self._send(404, {"error": "Fișier negăsit", "path": req})
            return
        ctype = mimetypes.guess_type(full)[0] or "application/octet-stream"
        with open(full, "rb") as f:
            data = f.read()
        self.send_response(200)
        self._cors()
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


def main() -> None:
    init_db()
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"MSK backend minim pe http://{HOST}:{PORT}")
    print("Conturi: medic/medic123 · kineto/kineto123 · admin/admin123 · pacient/pacient123")
    print("GET /api/health")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nOprit.")


if __name__ == "__main__":
    main()
