const App = {
  go(view, params = {}) {
    this.view = view;
    this.params = params;
    this.render();
  },

  render() {
    const role = Storage.getRole();
    const btn = document.getElementById("btn-role");
    if (btn) {
      const labels = { patient: "Pacient", doctor: "Medic", kineto: "Kineto" };
      btn.textContent = labels[role] || "Rol";
      btn.onclick = () => {
        const order = ["patient", "doctor", "kineto"];
        const next = order[(order.indexOf(role) + 1) % order.length];
        Storage.setRole(next);
        this.go("home");
      };
    }

    if (this.view === "home") this.home();
    else if (this.view === "login") this.login();
    else if (this.view === "triage") Triage.start();
    else if (this.view === "triage-done") this.triageDone();
    else if (this.view === "doctor") Doctor.list();
    else if (this.view === "summary") Doctor.summary(this.params.id);
    else if (this.view === "consult") Consult.start(this.params.triageId);
    else if (this.view === "kineto") Kineto.list();
    else if (this.view === "kineto-sheet") Kineto.sheet(this.params.consultId);
    else if (this.view === "followup-sim") FollowUp.simulate();
    else if (this.view === "followup-alerts") FollowUp.listAlerts();
    else if (this.view === "followup-doctor") FollowUp.doctorInbox();
    else if (this.view === "homecare") HomeCare.list();
    else if (this.view === "homecare-plan") HomeCare.plan(this.params.consultId);
    else this.home();
  },

  home() {
    const role = Storage.getRole();
    const main = document.getElementById("main");
    if (role === "doctor") {
      main.innerHTML = `
        <div class="card">
          <h1>Bun venit, medic</h1>
          <p class="lead">Triaj, consult, escaladări, home-care.</p>
          <div class="home-grid">
            <button type="button" class="home-card" id="go-queue"><strong>Coadă triaj</strong><span>Sumar · prioritate</span></button>
            <button type="button" class="home-card" id="go-kineto"><strong>Fișe kineto</strong><span>Ședințe · Δ final</span></button>
            <button type="button" class="home-card" id="go-esc"><strong>Escaladări follow-up</strong><span>De la kineto</span></button>
            <button type="button" class="home-card" id="go-hc"><strong>Home-care</strong><span>Planuri după pachet</span></button>
          </div>
        </div>`;
      document.getElementById("go-queue").onclick = () => this.go("doctor");
      document.getElementById("go-kineto").onclick = () => this.go("kineto");
      document.getElementById("go-esc").onclick = () => this.go("followup-doctor");
      document.getElementById("go-hc").onclick = () => this.go("homecare");
    } else if (role === "kineto") {
      main.innerHTML = `
        <div class="card">
          <h1>Bun venit, kinetoterapeut</h1>
          <p class="lead">Fișe, follow-up, home-care.</p>
          <div class="home-grid">
            <button type="button" class="home-card" id="go-kineto"><strong>Fișele mele</strong><span>Pachete · faze</span></button>
            <button type="button" class="home-card" id="go-fu"><strong>Alerte follow-up</strong><span>Algoritm D</span></button>
            <button type="button" class="home-card" id="go-hc"><strong>Home-care</strong><span>Algoritm F · întreținere</span></button>
          </div>
        </div>`;
      document.getElementById("go-kineto").onclick = () => this.go("kineto");
      document.getElementById("go-fu").onclick = () => this.go("followup-alerts");
      document.getElementById("go-hc").onclick = () => this.go("homecare");
    } else {
      main.innerHTML = `
        <div class="card">
          <h1>Bun venit</h1>
          <p class="lead">${MSK_CONFIG.clinicName}</p>
          <div class="home-grid">
            <button type="button" class="home-card" id="go-triage"><strong>Începe triajul</strong><span>3–5 minute</span></button>
            <button type="button" class="home-card" id="go-fu-sim"><strong>Follow-up</strong><span>Simulare link WhatsApp</span></button>
            <button type="button" class="home-card" id="go-demo"><strong>⚡ Pacient demo</strong><span>Încarcă date gata de test</span></button>
            <button type="button" class="home-card" id="go-login"><strong>Autentificare echipă</strong><span>Medic / kineto — date comune</span></button>
          </div>
          <p class="hint" style="margin-top:0.75rem">Pentru uz rapid: Pacient demo sau login echipă (backend).</p>
        </div>`;
      document.getElementById("go-triage").onclick = () => this.go("triage");
      document.getElementById("go-fu-sim").onclick = () => this.go("followup-sim");
      document.getElementById("go-demo").onclick = () => {
        Demo.seed();
        if (typeof Api !== "undefined" && Api.token()) Api.push();
        alert("Pacient demo încărcat (lombalgie, NRS 7, pachet 10×45).\nComută la Medic sau Kineto.");
        Storage.setRole("doctor");
        this.go("home");
      };
      document.getElementById("go-login").onclick = () => this.go("login");
    }
  },

  login() {
    const user = typeof Api !== "undefined" ? Api.currentUser() : null;
    const main = document.getElementById("main");
    main.innerHTML = `
      <div class="card">
        <h1>Autentificare echipă</h1>
        <p class="lead">Datele se salvează pe server. Medic și kineto văd același pacient.</p>
        ${user ? `<p class="hint">Autentificat: <strong>${user.name}</strong> (${user.role})</p>` : ""}
        <label class="field">Utilizator</label>
        <input id="u" type="text" autocomplete="username" placeholder="medic / kineto / admin" style="width:100%;min-height:44px;border:2px solid var(--border);border-radius:10px;padding:0.5rem;font:inherit;margin-bottom:0.5rem" />
        <label class="field">Parolă</label>
        <input id="p" type="password" autocomplete="current-password" placeholder="parolă" style="width:100%;min-height:44px;border:2px solid var(--border);border-radius:10px;padding:0.5rem;font:inherit" />
        <p id="login-err" class="hint" style="color:var(--danger);margin-top:0.5rem"></p>
        <div class="btn-row">
          <button type="button" class="btn btn-secondary" onclick="App.go('home')">Înapoi</button>
          <button type="button" class="btn btn-primary" id="do-login">Intră</button>
        </div>
        <p class="hint" style="margin-top:0.75rem">medic / medic123 · kineto / kineto123 · admin / admin123</p>
        ${user ? `<button type="button" class="btn btn-secondary" style="margin-top:0.5rem" id="do-logout">Ieșire</button>` : ""}
      </div>`;
    document.getElementById("do-login").onclick = async () => {
      const err = document.getElementById("login-err");
      err.textContent = "";
      try {
        const u = await Api.login(document.getElementById("u").value, document.getElementById("p").value);
        await Api.pull();
        document.getElementById("footer-hint").textContent = "Backend conectat · " + u.name;
        App.go("home");
      } catch (e) {
        err.textContent = e.message + " — pornește: python3 server/app.py";
      }
    };
    document.getElementById("do-logout")?.addEventListener("click", () => {
      Api.logout();
      document.getElementById("footer-hint").textContent = "Deconectat · date locale";
      App.go("home");
    });
  },

  triageDone() {
    const t = Storage.getTriage(this.params.id);
    const sc = t?.scores || {};
    const pr = Scores.labelPriority(sc.prioritate_triaj);
    document.getElementById("main").innerHTML = `
      <div class="card">
        <h1>Mulțumim</h1>
        <p class="lead">Medicul a primit informațiile tale.</p>
        <p>Durere: <strong>${sc.scor_durere_intrare ?? "—"}/10</strong> ·
           Prioritate: <span class="badge ${pr.cls}">${pr.text}</span></p>
        <button type="button" class="btn btn-primary" style="margin-top:1rem" onclick="App.go('home')">Închide</button>
        <button type="button" class="btn btn-secondary" style="margin-top:0.5rem" onclick="Storage.setRole('doctor');App.go('summary',{id:'${this.params.id}'})">Vezi ca medic</button>
      </div>`;
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  if (typeof Api !== "undefined") {
    const ok = await Api.health();
    const hint = document.getElementById("footer-hint");
    if (ok && hint) {
      hint.textContent = Api.token()
        ? "Backend conectat · " + (Api.currentUser()?.name || "sesiune")
        : "Backend online · autentifică echipa pentru date comune";
    }
    if (ok && Api.token()) await Api.pull().catch(() => {});
  }
  App.go("home");
});
