const Consult = {
  state: null,

  icdByZone: {
    cervical: [
      { code: "M54.2", label: "Cervicalgie" },
      { code: "M54.12", label: "Radiculopatie cervicală" },
      { code: "M50.1", label: "Tulburare disc cervical cu radiculopatie" },
      { code: "M47.812", label: "Spondiloză cervicală cu radiculopatie" }
    ],
    lombar: [
      { code: "M54.5", label: "Lombalgie" },
      { code: "M54.16", label: "Radiculopatie lombară" },
      { code: "M51.1", label: "Tulburare disc lombar cu radiculopatie" },
      { code: "M54.4", label: "Lombosciatică" },
      { code: "M48.06", label: "Stenoză canal lombar" }
    ],
    toracal: [
      { code: "M54.6", label: "Durere toracică vertebrală" },
      { code: "M51.2", label: "Tulburare disc toracic" }
    ],
    umar_s: [
      { code: "M75.1", label: "Sindrom de coafă a rotatorilor" },
      { code: "M75.0", label: "Capsulită adezivă umăr" },
      { code: "M25.51", label: "Durere articulație umăr" }
    ],
    umar_d: [
      { code: "M75.1", label: "Sindrom de coafă a rotatorilor" },
      { code: "M75.0", label: "Capsulită adezivă umăr" },
      { code: "M25.51", label: "Durere articulație umăr" }
    ],
    genunchi_s: [
      { code: "M17.9", label: "Gonartroză, nespecificată" },
      { code: "M23.8", label: "Alte tulburări interne genunchi" },
      { code: "M25.56", label: "Durere articulație genunchi" }
    ],
    genunchi_d: [
      { code: "M17.9", label: "Gonartroză, nespecificată" },
      { code: "M23.8", label: "Alte tulburări interne genunchi" },
      { code: "M25.56", label: "Durere articulație genunchi" }
    ],
    sold_s: [
      { code: "M16.9", label: "Coxartroză, nespecificată" },
      { code: "M25.55", label: "Durere articulație șold" }
    ],
    sold_d: [
      { code: "M16.9", label: "Coxartroză, nespecificată" },
      { code: "M25.55", label: "Durere articulație șold" }
    ],
    glezna_s: [
      { code: "M25.57", label: "Durere articulație gleznă/picior" },
      { code: "M76.6", label: "Tendinită Achile" }
    ],
    glezna_d: [
      { code: "M25.57", label: "Durere articulație gleznă/picior" },
      { code: "M76.6", label: "Tendinită Achile" }
    ],
    alta: [{ code: "M25.5", label: "Durere articulară" }]
  },

  examCommon: [
    "Inspecție",
    "Palpare",
    "Mobilizare activă",
    "Mobilizare pasivă",
    "Forță musculară",
    "Reflexe",
    "Sensibilitate",
    "Semne de alarmă verificate"
  ],

  examSpecial: {
    cervical: ["Spurling", "Distraction test", "ULTT", "Hoffman", "Lhermitte"],
    lombar: ["Lasègue (SLR)", "Crossed SLR", "Femoral stretch", "Slump", "FABER", "Gaenslen", "Trendelenburg"],
    toracal: ["Mobilizare rotațională", "Compresie toracică"],
    umar_s: ["Neer", "Hawkins", "Jobe", "Speed"],
    umar_d: ["Neer", "Hawkins", "Jobe", "Speed"],
    genunchi_s: ["Lachman", "McMurray", "Valgus/Varus", "Patellar grind"],
    genunchi_d: ["Lachman", "McMurray", "Valgus/Varus", "Patellar grind"],
    sold_s: ["FABER", "FADIR", "Trendelenburg"],
    sold_d: ["FABER", "FADIR", "Trendelenburg"],
    glezna_s: ["Talar tilt", "Anterior drawer", "Thompson"],
    glezna_d: ["Talar tilt", "Anterior drawer", "Thompson"],
    alta: []
  },

  devices: [
    "TENS", "Laser HILT", "Laser MLS", "Tecar Indiba", "Tecar Winback",
    "Deep Oscillation", "Shockwave Storz", "Game Ready"
  ],

  infusions: [
    "Antiinflamator", "Analgezie intensă", "Magneziu + B Neural",
    "Glutation + Vitamina C", "Glutation + Fluimucil", "NAD+ Recuperare", "Energie & Sport / Myers"
  ],

  infiltrations: [
    "Corticoid ± anestezic", "Acid hialuronic", "PRP",
    "Colagen (GUNA / Arthrys)", "Polinucleotide / PDRN", "Sanakin"
  ],

  start(triageId) {
    const t = Storage.getTriage(triageId);
    if (!t) {
      alert("Triaj negăsit");
      App.go("doctor");
      return;
    }
    const existing = Storage.getConsultByTriage?.(triageId);
    this.state = existing || {
      id: "c_" + Date.now(),
      triageId,
      step: 1,
      examCommon: {},
      examSpecial: {},
      examNotes: "",
      diagnoses: [],
      diagnosisFree: "",
      diagnosisValidated: false,
      certainty: "probable",
      meds: "",
      infiltrations: [],
      devices: [],
      packageSessions: 10,
      sessionMinutes: 45,
      zoneDirection: "",
      infusions: [],
      followUp: true,
      documents: null,
      finalized: false
    };
    // prefill zone direction from triage
    if (!this.state.zoneDirection && t.zones?.length) {
      this.state.zoneDirection = t.zones
        .map((id) => MSK_CONFIG.zones.find((z) => z.id === id)?.label || id)
        .join(", ");
    }
    this.render();
  },

  specialList() {
    const t = Storage.getTriage(this.state.triageId);
    const set = new Set();
    (t?.zones || []).forEach((z) => {
      (this.examSpecial[z] || []).forEach((x) => set.add(x));
    });
    return [...set];
  },

  icdSuggestions() {
    const t = Storage.getTriage(this.state.triageId);
    const map = new Map();
    (t?.zones || []).forEach((z) => {
      (this.icdByZone[z] || this.icdByZone.alta).forEach((item) => {
        map.set(item.code, item);
      });
    });
    if (!map.size) {
      this.icdByZone.lombar.forEach((item) => map.set(item.code, item));
    }
    return [...map.values()];
  },

  setStep(n) {
    this.state.step = n;
    this.save();
    this.render();
    window.scrollTo(0, 0);
  },

  save() {
    Storage.saveConsult(this.state);
  },

  render() {
    const main = document.getElementById("main");
    const steps = ["Examen", "Diagnostic", "Plan", "Documente"];
    const s = this.state;
    let tabs = `<div class="chip-list" style="margin-bottom:0.75rem">`;
    steps.forEach((label, i) => {
      const n = i + 1;
      const active = s.step === n ? "selected" : "";
      tabs += `<span class="chip ${active}" style="cursor:pointer" data-gostep="${n}">${n}. ${label}</span>`;
    });
    tabs += `</div>`;

    let body = "";
    if (s.step === 1) body = this.viewExam();
    else if (s.step === 2) body = this.viewDx();
    else if (s.step === 3) body = this.viewPlan();
    else body = this.viewDocs();

    main.innerHTML = `<div class="card">${tabs}${body}</div>`;
    this.bind();
  },

  viewExam() {
    const s = this.state;
    const common = this.examCommon
      .map(
        (name) =>
          `<label class="check-item"><input type="checkbox" data-ex="common" value="${name}" ${
            s.examCommon[name] ? "checked" : ""
          }/> ${name}</label>`
      )
      .join("");
    const special = this.specialList()
      .map(
        (name) =>
          `<label class="check-item"><input type="checkbox" data-ex="special" value="${name}" ${
            s.examSpecial[name] ? "checked" : ""
          }/> ${name} <span class="hint" style="margin:0">ⓘ</span></label>`
      )
      .join("");
    return `
      <h1>Examen obiectiv</h1>
      <p class="lead">Bifează pe măsură ce examinezi. Testele speciale apar după zona din triaj.</p>
      <label class="field">Elemente comune</label>
      <div class="check-list">${common}</div>
      <label class="field" style="margin-top:1rem">Teste speciale</label>
      <div class="check-list">${special || "<p class='hint'>Niciun test special pentru zonele selectate</p>"}</div>
      <label class="field" style="margin-top:1rem">Note examen</label>
      <textarea id="examNotes" rows="3" style="width:100%;border:2px solid var(--border);border-radius:10px;padding:0.6rem;font:inherit">${
        s.examNotes || ""
      }</textarea>
      <div class="btn-row">
        <button type="button" class="btn btn-secondary" id="back-sum">Sumar</button>
        <button type="button" class="btn btn-primary" id="to-dx">Diagnostic →</button>
      </div>
    `;
  },

  viewDx() {
    const s = this.state;
    const suggestions = this.icdSuggestions()
      .map((item) => {
        const on = s.diagnoses.some((d) => d.code === item.code);
        return `<button type="button" class="choice ${on ? "selected" : ""}" data-icd="${item.code}" data-label="${item.label}"><strong>${item.code}</strong> — ${item.label}</button>`;
      })
      .join("");
    return `
      <h1>Diagnostic</h1>
      <p class="lead">Alege din sugestii ICD-10 sau completează liber. Validarea deblochează planul terapeutic.</p>
      <div class="choice-grid">${suggestions}</div>
      <label class="field" style="margin-top:1rem">Diagnostic liber</label>
      <textarea id="dxFree" rows="2" style="width:100%;border:2px solid var(--border);border-radius:10px;padding:0.6rem;font:inherit">${
        s.diagnosisFree || ""
      }</textarea>
      <label class="field" style="margin-top:0.75rem">Certitudine</label>
      <div class="choice-grid" style="grid-template-columns:1fr 1fr 1fr">
        ${["cert", "probable", "toconfirm"]
          .map((c) => {
            const labels = { cert: "Cert", probable: "Probabil", toconfirm: "De confirmat" };
            return `<button type="button" class="choice ${s.certainty === c ? "selected" : ""}" data-cert="${c}">${labels[c]}</button>`;
          })
          .join("")}
      </div>
      ${
        s.diagnosisValidated
          ? `<p class="hint" style="margin-top:0.75rem;color:var(--ok)">✓ Diagnostic validat — planul este deblocat</p>`
          : ""
      }
      <div class="btn-row">
        <button type="button" class="btn btn-secondary" id="to-exam">← Examen</button>
        <button type="button" class="btn btn-primary" id="validate-dx">${
          s.diagnosisValidated ? "Plan →" : "Validează diagnosticul"
        }</button>
      </div>
    `;
  },

  viewPlan() {
    const s = this.state;
    if (!s.diagnosisValidated) {
      return `
        <h1>Plan terapeutic</h1>
        <p class="lead">Planul se deblochează după validarea diagnosticului.</p>
        <button type="button" class="btn btn-primary" id="to-dx">← Diagnostic</button>
      `;
    }
    const inf = this.infiltrations
      .map(
        (name) =>
          `<label class="check-item"><input type="checkbox" data-inf value="${name}" ${
            s.infiltrations.includes(name) ? "checked" : ""
          }/> ${name}</label>`
      )
      .join("");
    const dev = this.devices
      .map(
        (name) =>
          `<label class="check-item"><input type="checkbox" data-dev value="${name}" ${
            s.devices.includes(name) ? "checked" : ""
          }/> ${name}</label>`
      )
      .join("");
    const per = this.infusions
      .map(
        (name) =>
          `<label class="check-item"><input type="checkbox" data-per value="${name}" ${
            s.infusions.includes(name) ? "checked" : ""
          }/> ${name}</label>`
      )
      .join("");
    return `
      <h1>Plan terapeutic</h1>
      <label class="field">Medicamente (text scurt)</label>
      <textarea id="meds" rows="2" style="width:100%;border:2px solid var(--border);border-radius:10px;padding:0.6rem;font:inherit">${
        s.meds || ""
      }</textarea>
      <label class="field" style="margin-top:0.75rem">Infiltrații</label>
      <div class="check-list">${inf}</div>
      <label class="field" style="margin-top:0.75rem">Kineto / Fizio – aparate</label>
      <div class="check-list">${dev}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-top:0.75rem">
        <div>
          <label class="field">Pachet</label>
          <div class="choice-grid">
            <button type="button" class="choice ${s.packageSessions===5?"selected":""}" data-pkg="5">5 ședințe</button>
            <button type="button" class="choice ${s.packageSessions===10?"selected":""}" data-pkg="10">10 ședințe</button>
          </div>
        </div>
        <div>
          <label class="field">Durată</label>
          <div class="choice-grid">
            <button type="button" class="choice ${s.sessionMinutes===30?"selected":""}" data-min="30">30 min</button>
            <button type="button" class="choice ${s.sessionMinutes===45?"selected":""}" data-min="45">45 min</button>
          </div>
        </div>
      </div>
      <label class="field" style="margin-top:0.75rem">Zonă și direcție de aplicare</label>
      <input id="zoneDir" type="text" value="${s.zoneDirection || ""}" style="width:100%;min-height:44px;border:2px solid var(--border);border-radius:10px;padding:0.5rem;font:inherit" />
      <label class="field" style="margin-top:0.75rem">Perfuzii</label>
      <div class="check-list">${per}</div>
      <label class="check-item" style="margin-top:0.75rem">
        <input type="checkbox" id="followUp" ${s.followUp ? "checked" : ""}/> Activează follow-up dinamic
      </label>
      <div class="btn-row">
        <button type="button" class="btn btn-secondary" id="to-dx">← Diagnostic</button>
        <button type="button" class="btn btn-primary" id="to-docs">Documente →</button>
      </div>
    `;
  },

  viewDocs() {
    const s = this.state;
    const t = Storage.getTriage(s.triageId);
    const sc = t?.scores || Scores.fromTriage(t || {});
    const dx =
      s.diagnoses.map((d) => `${d.code} ${d.label}`).join("; ") ||
      s.diagnosisFree ||
      "—";
    const patientText = this.buildPatientResult(t, s, sc, dx);
    const doctorText = this.buildDoctorResult(t, s, sc, dx);
    s.documents = { patientText, doctorText, generatedAt: new Date().toISOString() };
    this.save();

    return `
      <h1>Documente</h1>
      <p class="lead">Precompletate din diagnostic + plan. Verifică și finalizează.</p>
      <label class="field">Rezultat consult – versiune pacient</label>
      <textarea id="docPatient" rows="6" style="width:100%;border:2px solid var(--border);border-radius:10px;padding:0.6rem;font:inherit;font-size:0.9rem">${patientText}</textarea>
      <label class="field" style="margin-top:0.75rem">Rezultat consult – versiune medic</label>
      <textarea id="docDoctor" rows="6" style="width:100%;border:2px solid var(--border);border-radius:10px;padding:0.6rem;font:inherit;font-size:0.9rem">${doctorText}</textarea>
      <div class="btn-row">
        <button type="button" class="btn btn-secondary" id="to-plan">← Plan</button>
        <button type="button" class="btn btn-primary" id="finalize">Finalizează consult</button>
      </div>
    `;
  },

  buildPatientResult(t, s, sc, dx) {
    const zones = (t?.zones || [])
      .map((id) => MSK_CONFIG.zones.find((z) => z.id === id)?.label || id)
      .join(", ");
    return `Stimate pacient,

În urma consultației, diagnosticul stabilit este: ${dx}.

Durerea raportată la început: ${sc.scor_durere_intrare ?? "—"}/10. Zone: ${zones || "—"}.

Plan recomandat:
${s.meds ? "• Medicație: " + s.meds + "\n" : ""}${
      s.infiltrations.length ? "• Infiltrații: " + s.infiltrations.join(", ") + "\n" : ""
    }${
      s.devices.length
        ? "• Kinetoterapie / fizioterapie: pachet " +
          s.packageSessions +
          " ședințe à " +
          s.sessionMinutes +
          " min · aparate: " +
          s.devices.join(", ") +
          "\n"
        : ""
    }${s.infusions.length ? "• Perfuzii: " + s.infusions.join(", ") + "\n" : ""}
Zonă de lucru: ${s.zoneDirection || "—"}.

${s.followUp ? "Veți primi pe telefon scurte întrebări de urmărire (follow-up).\n" : ""}
Cu respect,
Echipa ${MSK_CONFIG.clinicName}`;
  },

  buildDoctorResult(t, s, sc, dx) {
    return `CONSULT MSK
Diagnostic: ${dx} (${s.certainty})
NRS intrare: ${sc.scor_durere_intrare ?? "—"} | Impact: ${sc.scor_impact_intrare ?? "—"}
Examen: ${Object.keys(s.examCommon).filter((k) => s.examCommon[k]).join(", ") || "—"}
Teste: ${Object.keys(s.examSpecial).filter((k) => s.examSpecial[k]).join(", ") || "—"}
Note: ${s.examNotes || "—"}
Medicație: ${s.meds || "—"}
Infiltrații: ${s.infiltrations.join(", ") || "—"}
Kineto: ${s.packageSessions} șed. × ${s.sessionMinutes} min | ${s.devices.join(", ") || "—"}
Zonă/direcție: ${s.zoneDirection || "—"}
Perfuzii: ${s.infusions.join(", ") || "—"}
Follow-up: ${s.followUp ? "da" : "nu"}
ID triaj: ${s.triageId}`;
  },

  bind() {
    const s = this.state;
    document.querySelectorAll("[data-gostep]").forEach((el) => {
      el.addEventListener("click", () => {
        const n = Number(el.dataset.gostep);
        if (n === 3 && !s.diagnosisValidated) {
          alert("Validează mai întâi diagnosticul.");
          return;
        }
        this.setStep(n);
      });
    });

    document.querySelectorAll("[data-ex]").forEach((inp) => {
      inp.addEventListener("change", () => {
        const bag = inp.dataset.ex === "common" ? s.examCommon : s.examSpecial;
        bag[inp.value] = inp.checked;
        this.save();
      });
    });
    document.getElementById("examNotes")?.addEventListener("input", (e) => {
      s.examNotes = e.target.value;
      this.save();
    });
    document.getElementById("to-dx")?.addEventListener("click", () => this.setStep(2));
    document.getElementById("to-exam")?.addEventListener("click", () => this.setStep(1));
    document.getElementById("back-sum")?.addEventListener("click", () =>
      App.go("summary", { id: s.triageId })
    );

    document.querySelectorAll("[data-icd]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const code = btn.dataset.icd;
        const label = btn.dataset.label;
        const idx = s.diagnoses.findIndex((d) => d.code === code);
        if (idx >= 0) s.diagnoses.splice(idx, 1);
        else s.diagnoses.push({ code, label });
        this.save();
        this.render();
      });
    });
    document.getElementById("dxFree")?.addEventListener("input", (e) => {
      s.diagnosisFree = e.target.value;
      this.save();
    });
    document.querySelectorAll("[data-cert]").forEach((btn) => {
      btn.addEventListener("click", () => {
        s.certainty = btn.dataset.cert;
        this.save();
        this.render();
      });
    });
    document.getElementById("validate-dx")?.addEventListener("click", () => {
      if (!s.diagnoses.length && !s.diagnosisFree.trim()) {
        alert("Selectează sau scrie un diagnostic.");
        return;
      }
      if (!s.diagnosisValidated) {
        s.diagnosisValidated = true;
        this.save();
        this.render();
        return;
      }
      this.setStep(3);
    });

    document.getElementById("meds")?.addEventListener("input", (e) => {
      s.meds = e.target.value;
      this.save();
    });
    const toggleList = (attr, key) => {
      document.querySelectorAll(`[${attr}]`).forEach((inp) => {
        inp.addEventListener("change", () => {
          if (inp.checked) {
            if (!s[key].includes(inp.value)) s[key].push(inp.value);
          } else s[key] = s[key].filter((x) => x !== inp.value);
          this.save();
        });
      });
    };
    toggleList("data-inf", "infiltrations");
    toggleList("data-dev", "devices");
    toggleList("data-per", "infusions");
    document.querySelectorAll("[data-pkg]").forEach((btn) => {
      btn.addEventListener("click", () => {
        s.packageSessions = Number(btn.dataset.pkg);
        this.save();
        this.render();
      });
    });
    document.querySelectorAll("[data-min]").forEach((btn) => {
      btn.addEventListener("click", () => {
        s.sessionMinutes = Number(btn.dataset.min);
        this.save();
        this.render();
      });
    });
    document.getElementById("zoneDir")?.addEventListener("input", (e) => {
      s.zoneDirection = e.target.value;
      this.save();
    });
    document.getElementById("followUp")?.addEventListener("change", (e) => {
      s.followUp = e.target.checked;
      this.save();
    });
    document.getElementById("to-docs")?.addEventListener("click", () => this.setStep(4));
    document.getElementById("to-plan")?.addEventListener("click", () => this.setStep(3));

    document.getElementById("docPatient")?.addEventListener("input", (e) => {
      if (!s.documents) s.documents = {};
      s.documents.patientText = e.target.value;
      this.save();
    });
    document.getElementById("docDoctor")?.addEventListener("input", (e) => {
      if (!s.documents) s.documents = {};
      s.documents.doctorText = e.target.value;
      this.save();
    });
    document.getElementById("finalize")?.addEventListener("click", () => {
      s.finalized = true;
      s.finalizedAt = new Date().toISOString();
      this.save();
      alert("Consult finalizat. Documentele sunt în dosar.\n(Fișele kineto – Sprint 3)");
      App.go("summary", { id: s.triageId });
    });
  }
};
