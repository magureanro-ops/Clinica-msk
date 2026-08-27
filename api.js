const Api = {
  base: (function () {
    if (typeof location !== "undefined" && location.port === "8787") return "";
    return localStorage.getItem("msk_api_base") || "http://127.0.0.1:8787";
  })(),
  tokenKey: "msk_token",
  online: false,

  token() {
    return localStorage.getItem(this.tokenKey) || "";
  },

  setToken(t) {
    if (t) localStorage.setItem(this.tokenKey, t);
    else localStorage.removeItem(this.tokenKey);
  },

  headers(auth) {
    const h = { "Content-Type": "application/json" };
    if (auth && this.token()) h.Authorization = "Bearer " + this.token();
    return h;
  },

  async health() {
    try {
      const r = await fetch(this.base + "/api/health");
      this.online = r.ok;
      return r.ok;
    } catch {
      this.online = false;
      return false;
    }
  },

  async login(username, password) {
    const r = await fetch(this.base + "/api/login", {
      method: "POST",
      headers: this.headers(false),
      body: JSON.stringify({ username, password })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Login eșuat");
    this.setToken(data.token);
    localStorage.setItem("msk_user", JSON.stringify(data.user));
    Storage.setRole(data.user.role === "doctor" ? "doctor" : data.user.role);
    return data.user;
  },

  logout() {
    this.setToken("");
    localStorage.removeItem("msk_user");
  },

  currentUser() {
    try {
      return JSON.parse(localStorage.getItem("msk_user") || "null");
    } catch {
      return null;
    }
  },

  async pull() {
    if (!this.token()) return false;
    const r = await fetch(this.base + "/api/pull", {
      method: "POST",
      headers: this.headers(true),
      body: "{}"
    });
    if (!r.ok) return false;
    const remote = await r.json();
    const local = Storage.load();
    local.triages = remote.triages || [];
    local.consults = remote.consults || [];
    local.followUps = remote.followUps || [];
    local.followUpAlerts = remote.followUpAlerts || [];
    local.doctorEscalations = remote.doctorEscalations || [];
    Storage.save(local, true);
    return true;
  },

  async push() {
    if (!this.token()) return false;
    const d = Storage.load();
    const r = await fetch(this.base + "/api/sync", {
      method: "POST",
      headers: this.headers(true),
      body: JSON.stringify({
        triages: d.triages || [],
        consults: d.consults || [],
        followUps: d.followUps || [],
        followUpAlerts: d.followUpAlerts || [],
        doctorEscalations: d.doctorEscalations || []
      })
    });
    return r.ok;
  },

  async savePublicTriage(triage) {
    try {
      const r = await fetch(this.base + "/api/public/triages", {
        method: "POST",
        headers: this.headers(false),
        body: JSON.stringify(triage)
      });
      if (!r.ok) return null;
      return await r.json();
    } catch {
      return null;
    }
  }
};
