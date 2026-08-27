const Triage = {
  state: null,

  fresh() {
    return {
      id: "t_" + Date.now(),
      step: 1,
      consent: false,
      voiceRead: false,
      voiceWrite: false,
      headphonesClinic: false,
      inClinic: false,
      zones: [],
      redFlags: {},
      nrs: null,
      duration: null,
      painTypes: [],
      radiates: null,
      impact: null,
      mood: {},
      diseases: [],
      meds: [],
      kidneyNotes: [],
      contactPref: null
    };
  },

  start() {
    this.state = this.fresh();
    this.render();
  },

  resume(id) {
    const t = Storage.getTriage(id);
    if (!t) return Triage.start();
    this.state = { ...t, step: t.step || 1 };
    this.render();
  },

  setStep(n) {
    this.state.step = n;
    this.render();
    window.scrollTo(0, 0);
  },

  progress() {
    return ((this.state.step - 1) / 7) * 100;
  },

  canContinue() {
    const s = this.state;
    switch (s.step) {
      case 1: return s.consent;
      case 2: return s.zones.length > 0;
      case 3: return MSK_CONFIG.redFlags.every((f) => s.redFlags[f.id] === true || s.redFlags[f.id] === false);
      case 4: return s.nrs != null && s.duration && s.impact != null;
      case 5: return true;
      case 6: return true;
      case 7: return true;
      default: return false;
    }
  },

  finish() {
    const scores = Scores.fromTriage(this.state);
    this.state.scores = scores;
    this.state.completed = true;
    this.state.step = 7;
    Storage.saveTriage(this.state);
    if (typeof Api !== "undefined") {
      Api.savePublicTriage(this.state).catch(() => {});
    }
    App.go("triage-done", { id: this.state.id });
  },

  render() {
    const s = this.state;
    const main = document.getElementById("main");
    let html = `<div class="progress"><div class="progress-bar" style="width:${this.progress()}%"></div></div>`;
    html += `<div class="card">`;

    if (s.step === 1) html += this.step1();
    else if (s.step === 2) html += this.step2();
    else if (s.step === 3) html += this.step3();
    else if (s.step === 4) html += this.step4();
    else if (s.step === 5) html += this.step5();
    else if (s.step === 6) html += this.step6();
    else if (s.step === 7) html += this.step7();

    html += `</div>`;
    main.innerHTML = html;
    this.bind();
  },

  step1() {
    const s = this.state;
    return `
      <h1>Bun venit</h1>
      <p class="lead">În următoarele minute te ajutăm să ne spui ce te deranjează, ca medicul să fie pregătit când te primește. Durează aproximativ 3–5 minute. Poți răspunde prin atingere.</p>
      <label class="consent">
        <input type="checkbox" id="consent" ${s.consent ? "checked" : ""} />
        <span>Am citit și sunt de acord cu prelucrarea datelor medicale în scopul consultației.</span>
      </label>
      <div class="toggle-row">
        <span>Completez în clinică</span>
        <input type="checkbox" id="inClinic" ${s.inClinic ? "checked" : ""} />
      </div>
      ${s.inClinic ? `
        <div class="toggle-row">
          <span>Folosesc căști acum</span>
          <input type="checkbox" id="headphones" ${s.headphonesClinic ? "checked" : ""} />
        </div>
        <p class="hint">Pentru a nu deranja, vocea este disponibilă doar dacă folosești căști.</p>
      ` : ""}
      ${( !s.inClinic || s.headphonesClinic) ? `
        <div class="toggle-row"><span>Citire cu voce</span><input type="checkbox" id="voiceRead" ${s.voiceRead ? "checked" : ""} /></div>
        <div class="toggle-row"><span>Scriere cu voce</span><input type="checkbox" id="voiceWrite" ${s.voiceWrite ? "checked" : ""} /></div>
      ` : ""}
      <div class="btn-row">
        <button type="button" class="btn btn-primary" id="next" ${s.consent ? "" : "disabled"}>Încep</button>
      </div>
    `;
  },

  step2() {
    const s = this.state;
    const zones = MSK_CONFIG.zones.map((z) => {
      const sel = s.zones.includes(z.id) ? "selected" : "";
      return `<button type="button" class="body-zone ${sel}" data-zone="${z.id}">${z.label}</button>`;
    }).join("");
    return `
      <h1>Unde te doare?</h1>
      <p class="lead">Atinge zonele care te deranjează. Poți alege mai multe.</p>
      <div class="body-map">${zones}</div>
      <div class="chip-list" id="zone-chips"></div>
      <div class="btn-row">
        <button type="button" class="btn btn-secondary" id="back">Înapoi</button>
        <button type="button" class="btn btn-primary" id="next">Continuă</button>
      </div>
    `;
  },

  step3() {
    const s = this.state;
    const items = MSK_CONFIG.redFlags.map((f) => {
      const v = s.redFlags[f.id];
      return `
        <div style="margin-bottom:0.85rem">
          <p style="font-weight:600;margin-bottom:0.4rem">${f.text}</p>
          <div class="choice-grid" style="grid-template-columns:1fr 1fr">
            <button type="button" class="choice ${v === true ? "selected yes-danger" : ""}" data-rf="${f.id}" data-val="true">Da</button>
            <button type="button" class="choice ${v === false ? "selected" : ""}" data-rf="${f.id}" data-val="false">Nu</button>
          </div>
        </div>
      `;
    }).join("");
    return `
      <h1>Semne de alarmă</h1>
      <p class="lead">Câteva întrebări importante pentru siguranța ta. Răspunde cu Da sau Nu.</p>
      ${items}
      <div class="btn-row">
        <button type="button" class="btn btn-secondary" id="back">Înapoi</button>
        <button type="button" class="btn btn-primary" id="next">Continuă</button>
      </div>
    `;
  },

  step4() {
    const s = this.state;
    const nrsBtns = Array.from({ length: 11 }, (_, i) =>
      `<button type="button" data-nrs="${i}" class="${s.nrs === i ? "selected" : ""}">${i}</button>`
    ).join("");
    const dur = MSK_CONFIG.durationOptions.map((o) =>
      `<button type="button" class="choice ${s.duration === o.id ? "selected" : ""}" data-dur="${o.id}">${o.label}</button>`
    ).join("");
    const types = MSK_CONFIG.painTypes.map((o) =>
      `<button type="button" class="choice ${s.painTypes.includes(o.id) ? "selected" : ""}" data-pt="${o.id}">${o.label}</button>`
    ).join("");
    const impact = MSK_CONFIG.impactOptions.map((o) =>
      `<button type="button" class="choice ${s.impact === o.id ? "selected" : ""}" data-imp="${o.id}">${o.label}</button>`
    ).join("");
    return `
      <h1>Despre durere</h1>
      <label class="field">Cât de tare te doare acum? (0–10)</label>
      <div class="nrs">${nrsBtns}</div>
      <label class="field" style="margin-top:1rem">De când te doare?</label>
      <div class="choice-grid">${dur}</div>
      <label class="field" style="margin-top:1rem">Cum e durerea? (poți alege mai multe)</label>
      <div class="choice-grid">${types}</div>
      <label class="field" style="margin-top:1rem">Cât te limitează în activitățile zilnice?</label>
      <div class="choice-grid">${impact}</div>
      <div class="btn-row">
        <button type="button" class="btn btn-secondary" id="back">Înapoi</button>
        <button type="button" class="btn btn-primary" id="next">Continuă</button>
      </div>
    `;
  },

  step5() {
    const s = this.state;
    const opts = ["Deloc", "Câteva zile", "Mai mult de jumătate din zile", "Aproape zilnic"];
    const q = (key, label) => {
      const buttons = opts.map((o, i) =>
        `<button type="button" class="choice ${s.mood[key] === i ? "selected" : ""}" data-mood="${key}" data-val="${i}">${o}</button>`
      ).join("");
      return `<label class="field">${label}</label><div class="choice-grid" style="margin-bottom:0.75rem">${buttons}</div>`;
    };
    return `
      <h1>Cum te simți</h1>
      <p class="lead">Câteva întrebări scurte despre starea ta generală. Ne ajută să te sprijinim mai bine.</p>
      ${q("phq1", "În ultimele 2 săptămâni, cât de des te-ai simțit descurajat, deprimat sau fără speranță?")}
      ${q("phq2", "Cât de des ai avut puțin interes sau plăcere în a face lucruri?")}
      <label class="field">Cât de îngrijorat ești din cauza durerii?</label>
      <div class="choice-grid" style="margin-bottom:0.75rem">
        ${["Deloc","Puțin","Moderată","Mult","Foarte mult"].map((o,i)=>
          `<button type="button" class="choice ${s.mood.worry===i?"selected":""}" data-mood="worry" data-val="${i}">${o}</button>`
        ).join("")}
      </div>
      <label class="field">Crezi că vei reuși să urmezi tratamentul și exercițiile?</label>
      <div class="choice-grid">
        ${["Da, sigur","Probabil da","Nu sunt sigur","Probabil nu"].map((o,i)=>
          `<button type="button" class="choice ${s.mood.adherence===i?"selected":""}" data-mood="adherence" data-val="${i}">${o}</button>`
        ).join("")}
      </div>
      <div class="btn-row">
        <button type="button" class="btn btn-secondary" id="back">Înapoi</button>
        <button type="button" class="btn btn-primary" id="next">Continuă</button>
      </div>
    `;
  },

  step6() {
    const s = this.state;
    const list = (arr, key) => arr.map((name) => {
      const on = s[key].includes(name);
      return `<label class="check-item"><input type="checkbox" data-list="${key}" value="${name}" ${on?"checked":""}/> ${name}</label>`;
    }).join("");
    return `
      <h1>Boli și medicație</h1>
      <p class="lead">Selectează ce ți se potrivește. Ne ajută să evităm riscuri.</p>
      <label class="field">Boli asociate</label>
      <div class="check-list">${list(MSK_CONFIG.diseases, "diseases")}</div>
      <label class="field" style="margin-top:1rem">Medicație actuală</label>
      <div class="check-list">${list(MSK_CONFIG.meds, "meds")}</div>
      <label class="field" style="margin-top:1rem">Altele relevante</label>
      <div class="check-list">
        ${["Infecții urinare recente","Infecții / gripă recentă","Internare recentă","Tratamente stomatologice în lucru","Alergii medicamentoase"].map((name)=>{
          const on = (s.kidneyNotes||[]).includes(name);
          return `<label class="check-item"><input type="checkbox" data-list="kidneyNotes" value="${name}" ${on?"checked":""}/> ${name}</label>`;
        }).join("")}
      </div>
      <div class="btn-row">
        <button type="button" class="btn btn-secondary" id="back">Înapoi</button>
        <button type="button" class="btn btn-primary" id="next">Continuă</button>
      </div>
    `;
  },

  step7() {
    const scores = Scores.fromTriage(this.state);
    const pr = Scores.labelPriority(scores.prioritate_triaj);
    return `
      <h1>Finalizare</h1>
      <p class="lead">Am terminat. Informațiile tale ajung la medic, ca să fie pregătit când te primește.</p>
      <div class="summary-block">
        <h3>Rezumat scurt</h3>
        <p>Durere: <strong>${this.state.nrs ?? "—"}/10</strong> · Impact: <strong>${Scores.labelImpact(this.state.impact)}</strong></p>
        <p>Prioritate estimată: <span class="badge ${pr.cls}">${pr.text}</span></p>
      </div>
      <label class="consent">
        <input type="checkbox" id="confirmOk" checked />
        <span>Confirm că informațiile sunt corecte pe cât știu.</span>
      </label>
      <div class="btn-row">
        <button type="button" class="btn btn-secondary" id="back">Revizuiește</button>
        <button type="button" class="btn btn-primary" id="finish">Trimite către medic</button>
      </div>
    `;
  },

  bind() {
    const s = this.state;
    const next = document.getElementById("next");
    const back = document.getElementById("back");
    const finish = document.getElementById("finish");

    document.getElementById("consent")?.addEventListener("change", (e) => {
      s.consent = e.target.checked;
      if (next) next.disabled = !s.consent;
    });
    document.getElementById("inClinic")?.addEventListener("change", (e) => {
      s.inClinic = e.target.checked;
      if (!s.inClinic) s.headphonesClinic = false;
      this.render();
    });
    document.getElementById("headphones")?.addEventListener("change", (e) => {
      s.headphonesClinic = e.target.checked;
      this.render();
    });
    document.getElementById("voiceRead")?.addEventListener("change", (e) => { s.voiceRead = e.target.checked; });
    document.getElementById("voiceWrite")?.addEventListener("change", (e) => { s.voiceWrite = e.target.checked; });

    document.querySelectorAll("[data-zone]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.zone;
        if (s.zones.includes(id)) s.zones = s.zones.filter((z) => z !== id);
        else s.zones.push(id);
        this.render();
      });
    });

    document.querySelectorAll("[data-rf]").forEach((btn) => {
      btn.addEventListener("click", () => {
        s.redFlags[btn.dataset.rf] = btn.dataset.val === "true";
        this.render();
      });
    });

    document.querySelectorAll("[data-nrs]").forEach((btn) => {
      btn.addEventListener("click", () => { s.nrs = Number(btn.dataset.nrs); this.render(); });
    });
    document.querySelectorAll("[data-dur]").forEach((btn) => {
      btn.addEventListener("click", () => { s.duration = btn.dataset.dur; this.render(); });
    });
    document.querySelectorAll("[data-pt]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.pt;
        if (s.painTypes.includes(id)) s.painTypes = s.painTypes.filter((x) => x !== id);
        else s.painTypes.push(id);
        this.render();
      });
    });
    document.querySelectorAll("[data-imp]").forEach((btn) => {
      btn.addEventListener("click", () => { s.impact = Number(btn.dataset.imp); this.render(); });
    });
    document.querySelectorAll("[data-mood]").forEach((btn) => {
      btn.addEventListener("click", () => {
        s.mood[btn.dataset.mood] = Number(btn.dataset.val);
        this.render();
      });
    });
    document.querySelectorAll("[data-list]").forEach((inp) => {
      inp.addEventListener("change", () => {
        const key = inp.dataset.list;
        if (!s[key]) s[key] = [];
        if (inp.checked) {
          if (inp.value === "Niciuna" || inp.value === "Niciuna / nu știu") s[key] = [inp.value];
          else {
            s[key] = s[key].filter((x) => x !== "Niciuna" && x !== "Niciuna / nu știu");
            if (!s[key].includes(inp.value)) s[key].push(inp.value);
          }
        } else s[key] = s[key].filter((x) => x !== inp.value);
      });
    });

    next?.addEventListener("click", () => {
      if (!this.canContinue()) {
        alert("Completează câmpurile obligatorii înainte de a continua.");
        return;
      }
      Storage.saveTriage(s);
      this.setStep(s.step + 1);
    });
    back?.addEventListener("click", () => this.setStep(Math.max(1, s.step - 1)));
    finish?.addEventListener("click", () => this.finish());
  }
};
