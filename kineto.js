const Kineto = {
  /** Simple exercise plans by zone family */
  plans: {
    lombar: {
      faza1: [
        { name: "Activare transvers abdominal + multifizi", sets: "2–3 × 8–10" },
        { name: "Întindere blândă ischiogambieri / flexori șold", sets: "2–3 × 20–30 sec" },
        { name: "Respirație diafragmatică + control pelvin", sets: "2–3 × 8–10" }
      ],
      faza2: [
        { name: "Podul (bridge)", sets: "2–3 × 10–12" },
        { name: "Bird-dog (patrupedă braț-picior opus)", sets: "2–3 × 8–10 / parte" },
        { name: "Sprijin lateral modificat", sets: "2–3 × 20–30 sec / parte" }
      ],
      faza3: [
        { name: "Forță + control funcțional", sets: "2–3 × 10–15" },
        { name: "Mers / bicicletă staționară", sets: "10–15 min" },
        { name: "Întindere menținută", sets: "2–3 × 20–30 sec" }
      ]
    },
    cervical: {
      faza1: [
        { name: "Chin tuck (deep neck flexors)", sets: "2–3 × 8–10" },
        { name: "Întindere trapez / levator", sets: "2–3 × 20–30 sec" },
        { name: "Control scapular de bază", sets: "2–3 × 8–10" }
      ],
      faza2: [
        { name: "Stabilizare cervicală progresivă", sets: "2–3 × 10–12" },
        { name: "Întărire scapulară", sets: "2–3 × 10–12" },
        { name: "Întindere progresivă", sets: "2–3 × 20–30 sec" }
      ],
      faza3: [
        { name: "Control funcțional + postură", sets: "2–3 × 10–15" },
        { name: "Integrare activități zilnice", sets: "conform toleranței" }
      ]
    },
    genunchi: {
      faza1: [
        { name: "Contracții izometrice cvadriceps", sets: "2–3 × 8–10 (5–8 sec)" },
        { name: "Mobilizări blânde", sets: "2 × 8–10" },
        { name: "Întindere blândă", sets: "2–3 × 20–30 sec" }
      ],
      faza2: [
        { name: "Întărire progresivă", sets: "2–3 × 10–12" },
        { name: "Genuflexiune parțială", sets: "2–3 × 8–10" },
        { name: "Propriocepție", sets: "2–3 × 20–30 sec" }
      ],
      faza3: [
        { name: "Forță funcțională + trepte", sets: "2–3 × 10–12" },
        { name: "Aerobic impact redus", sets: "10–15 min" }
      ]
    },
    default: {
      faza1: [
        { name: "Activare + mobilizare blândă", sets: "2–3 × 8–10" },
        { name: "Întindere blândă", sets: "2–3 × 20–30 sec" }
      ],
      faza2: [
        { name: "Întărire progresivă", sets: "2–3 × 10–12" },
        { name: "Control neuromuscular", sets: "2–3 × 8–10" }
      ],
      faza3: [
        { name: "Forță funcțională", sets: "2–3 × 10–15" },
        { name: "Revenire activități zilnice", sets: "conform plan" }
      ]
    }
  },

  zoneFamily(zones) {
    const z = zones || [];
    if (z.some((x) => x === "lombar" || x === "toracal")) return "lombar";
    if (z.some((x) => x === "cervical")) return "cervical";
    if (z.some((x) => String(x).includes("genunchi"))) return "genunchi";
    if (z.some((x) => String(x).includes("umar"))) return "default";
    if (z.some((x) => String(x).includes("sold"))) return "default";
    if (z.some((x) => String(x).includes("glezna"))) return "default";
    return "default";
  },

  /** Algoritm B — intensitate din NRS + Impact */
  severity(nrs, impact) {
    const n = typeof nrs === "number" ? nrs : 5;
    const i = typeof impact === "number" ? impact : 3;
    return n + i;
  },

  intensity(nrs, impact) {
    const s = this.severity(nrs, impact);
    if (s >= 12) return "blanda";
    if (s <= 7) return "progresiva";
    return "standard";
  },

  intensityLabel(level) {
    return {
      blanda: "Blândă (control durere + activare)",
      standard: "Standard",
      progresiva: "Progresivă (forță mai devreme)"
    }[level] || "Standard";
  },

  /**
   * Algoritm C — faza curentă în funcție de ședință, total pachet, intensitate
   * Returnează 1 | 2 | 3
   */
  currentPhase(sessionNum, total, intensity) {
    const t = total || 10;
    const n = Math.min(Math.max(sessionNum, 1), t);
    let e1, e2; // end of phase 1 and 2
    if (intensity === "blanda") {
      e1 = Math.ceil(t * 0.5);
      e2 = Math.ceil(t * 0.8);
    } else if (intensity === "progresiva") {
      e1 = Math.ceil(t * 0.2);
      e2 = Math.ceil(t * 0.6);
    } else {
      e1 = Math.ceil(t / 3);
      e2 = Math.ceil((2 * t) / 3);
    }
    if (n <= e1) return 1;
    if (n <= e2) return 2;
    return 3;
  },

  /** Ajustează serii pentru intensitate blândă (mai puține repetiții la start) */
  scaleSets(setsStr, intensity, phase) {
    if (intensity !== "blanda" || phase !== 1) return setsStr;
    return setsStr
      .replace(/2–3/g, "2")
      .replace(/10–12/g, "8–10")
      .replace(/10–15/g, "8–10");
  },

  list() {
    const main = document.getElementById("main");
    const consults = Storage.listConsults().filter(
      (c) =>
        c.finalized &&
        ((c.devices && c.devices.length) || c.packageSessions)
    );
    if (!consults.length) {
      main.innerHTML = `
        <div class="card">
          <h1>Kinetoterapie</h1>
          <p class="lead">Nu există pachete. Medicul: consult → Plan → pachet 5/10 → Finalizează. Sau: Pacient demo.</p>
          <button type="button" class="btn btn-primary" onclick="App.go('home')">Acasă</button>
          <button type="button" class="btn btn-secondary" style="margin-top:0.5rem" onclick="Demo.seed();App.go('kineto')">Încarcă pacient demo</button>
        </div>`;
      return;
    }
    const rows = consults
      .map((c) => {
        const t = Storage.getTriage(c.triageId);
        const sc = t?.scores || {};
        const zones = (t?.zones || [])
          .map((id) => MSK_CONFIG.zones.find((z) => z.id === id)?.label || id)
          .join(", ");
        const done = (c.sessionsDone || 0);
        const total = c.packageSessions || 10;
        return `
          <button type="button" class="home-card" data-cid="${c.id}">
            <strong>${zones || "Pachet kineto"}</strong>
            <span>Ședința ${Math.min(done + 1, total)}/${total} · ${c.sessionMinutes || 45} min</span><br/>
            <span>NRS intrare: ${sc.scor_durere_intrare ?? "—"}/10</span>
            ${c.packageCompleted ? '<br/><span class="badge badge-ok">Pachet încheiat</span>' : ""}
          </button>`;
      })
      .join("");
    main.innerHTML = `
      <div class="card">
        <h1>Fișe kineto</h1>
        <p class="lead">Selectează pachetul de lucru.</p>
        <div class="home-grid">${rows}</div>
        <button type="button" class="btn btn-secondary" style="margin-top:1rem" onclick="App.go('home')">Acasă</button>
      </div>`;
    main.querySelectorAll("[data-cid]").forEach((btn) => {
      btn.addEventListener("click", () => App.go("kineto-sheet", { consultId: btn.dataset.cid }));
    });
  },

  sheet(consultId) {
    const c = Storage.getConsult(consultId);
    const main = document.getElementById("main");
    if (!c) {
      main.innerHTML = `<div class="card"><p>Consult negăsit.</p><button class="btn btn-primary" onclick="App.go('kineto')">Înapoi</button></div>`;
      return;
    }
    const t = Storage.getTriage(c.triageId);
    const sc = t?.scores || Scores.fromTriage(t || {});
    const family = this.zoneFamily(t?.zones);
    const plan = this.plans[family] || this.plans.default;
    const done = c.sessionsDone || 0;
    const total = c.packageSessions || 10;
    const sessionNum = Math.min(done + 1, total);
    const isLast = done >= total - 1 || c.packageCompleted;
    const intensity = this.intensity(sc.scor_durere_intrare, sc.scor_impact_intrare);
    const phase = this.currentPhase(sessionNum, total, intensity);
    const phaseExercises = (plan[`faza${phase}`] || plan.faza1).map((e) => ({
      name: e.name,
      sets: this.scaleSets(e.sets, intensity, phase)
    }));

    const dx =
      (c.diagnoses || []).map((d) => `${d.code} ${d.label}`).join("; ") ||
      c.diagnosisFree ||
      "—";

    const log = c.sessionLog || [];

    main.innerHTML = `
      <div class="card">
        <h1>Fișă kinetoterapeut</h1>
        <p><span class="badge badge-ok">Ședința ${sessionNum}/${total}</span>
           <span class="badge badge-warn">${c.sessionMinutes || 45} min</span>
           <span class="chip">Faza ${phase}</span>
           <span class="chip">${family}</span></p>
        <div class="summary-block">
          <h3>Diagnostic · obiective</h3>
          <p>${dx}</p>
          <p class="hint">Reducere durere, mobilitate, stabilizare, reluare activități</p>
        </div>
        <div class="summary-block">
          <h3>Scor de intrare (din triaj — doar vizualizare)</h3>
          <p>Durere: <strong>${sc.scor_durere_intrare ?? "—"}/10</strong> ·
             Impact: <strong>${Scores.labelImpact(sc.scor_impact_intrare)}</strong></p>
          <p><strong>Intensitate algoritm:</strong> ${this.intensityLabel(intensity)}
             <span class="hint">(NRS+Impact = ${this.severity(sc.scor_durere_intrare, sc.scor_impact_intrare)})</span></p>
        </div>
        <div class="summary-block">
          <h3>Aparate + zonă</h3>
          <p>${(c.devices || []).join(", ") || "—"}</p>
          <p><strong>Zonă / direcție:</strong> ${c.zoneDirection || "—"}</p>
        </div>
        <div class="summary-block">
          <h3>Plan exerciții personalizat — faza ${phase}</h3>
          <ul>
            ${phaseExercises.map((e) => `<li><strong>${e.name}</strong> — ${e.sets}</li>`).join("")}
          </ul>
        </div>
        <label class="field">Notare ședință curentă</label>
        <input id="k-in" type="text" placeholder="Intrare: oră + stare" style="width:100%;min-height:40px;margin-bottom:0.35rem;border:2px solid var(--border);border-radius:10px;padding:0.4rem;font:inherit" />
        <input id="k-do" type="text" placeholder="Efectuare: ce s-a făcut + parametri" style="width:100%;min-height:40px;margin-bottom:0.35rem;border:2px solid var(--border);border-radius:10px;padding:0.4rem;font:inherit" />
        <input id="k-out" type="text" placeholder="Final: oră + stare" style="width:100%;min-height:40px;margin-bottom:0.35rem;border:2px solid var(--border);border-radius:10px;padding:0.4rem;font:inherit" />
        <input id="k-prob" type="text" placeholder="Probleme (opțional)" style="width:100%;min-height:40px;margin-bottom:0.75rem;border:2px solid var(--border);border-radius:10px;padding:0.4rem;font:inherit" />

        ${
          isLast || c.packageCompleted
            ? `
          <div class="summary-block" style="border-color:var(--accent)">
            <h3>Chestionar final pachet (aceleași întrebări ca la preconsult)</h3>
            <p class="hint">Intrare: NRS ${sc.scor_durere_intrare ?? "—"} · Impact ${sc.scor_impact_intrare ?? "—"}</p>
            <label class="field">Cât de tare te doare acum? (0–10)</label>
            <div class="nrs" id="final-nrs">
              ${Array.from({ length: 11 }, (_, i) => `<button type="button" data-fnrs="${i}">${i}</button>`).join("")}
            </div>
            <label class="field" style="margin-top:0.75rem">Cât te limitează acum?</label>
            <div class="choice-grid" id="final-imp">
              ${MSK_CONFIG.impactOptions.map((o) => `<button type="button" class="choice" data-fimp="${o.id}">${o.label}</button>`).join("")}
            </div>
            <label class="field" style="margin-top:0.75rem">Cât de mult te-ai îmbunătățit față de început? (PGIC)</label>
            <div class="choice-grid" id="final-pgic">
              ${["Foarte mult","Mult","Moderată","Puțin","Nicio schimbare","Mai rău"].map((o,i)=>
                `<button type="button" class="choice" data-fpgic="${i+1}">${o}</button>`
              ).join("")}
            </div>
            <p id="delta-preview" class="hint" style="margin-top:0.5rem"></p>
          </div>`
            : ""
        }

        ${
          log.length
            ? `<div class="summary-block"><h3>Istoric ședințe</h3><ul>${log
                .map(
                  (l) =>
                    `<li>#${l.num} — ${l.at?.slice(0, 16) || ""} ${l.probleme ? "⚠ " + l.probleme : ""}</li>`
                )
                .join("")}</ul></div>`
            : ""
        }

        <div class="btn-row">
          <button type="button" class="btn btn-secondary" onclick="App.go('kineto')">Înapoi</button>
          <button type="button" class="btn btn-primary" id="finish-session">${
            isLast || c.packageCompleted ? "Închide pachetul" : "Am terminat ședința"
          }</button>
        </div>
      </div>`;

    let finalNrs = c.finalScores?.nrs ?? null;
    let finalImp = c.finalScores?.impact ?? null;
    let finalPgic = c.finalScores?.pgic ?? null;

    const updateDelta = () => {
      const el = document.getElementById("delta-preview");
      if (!el) return;
      const dN = Scores.delta(sc.scor_durere_intrare, finalNrs);
      const dI = Scores.delta(sc.scor_impact_intrare, finalImp);
      el.textContent =
        finalNrs != null
          ? `Δ durere: ${dN != null ? (dN > 0 ? "+" : "") + dN : "—"} puncte · Δ impact: ${
              dI != null ? (dI > 0 ? "+" : "") + dI : "—"
            }`
          : "";
    };

    document.querySelectorAll("[data-fnrs]").forEach((btn) => {
      btn.addEventListener("click", () => {
        finalNrs = Number(btn.dataset.fnrs);
        document.querySelectorAll("[data-fnrs]").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        updateDelta();
      });
    });
    document.querySelectorAll("[data-fimp]").forEach((btn) => {
      btn.addEventListener("click", () => {
        finalImp = Number(btn.dataset.fimp);
        document.querySelectorAll("[data-fimp]").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        updateDelta();
      });
    });
    document.querySelectorAll("[data-fpgic]").forEach((btn) => {
      btn.addEventListener("click", () => {
        finalPgic = Number(btn.dataset.fpgic);
        document.querySelectorAll("[data-fpgic]").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
      });
    });

    document.getElementById("finish-session")?.addEventListener("click", () => {
      const entry = {
        num: sessionNum,
        at: new Date().toISOString(),
        intrare: document.getElementById("k-in")?.value || "",
        efectuare: document.getElementById("k-do")?.value || "",
        final: document.getElementById("k-out")?.value || "",
        probleme: document.getElementById("k-prob")?.value || ""
      };
      if (!c.sessionLog) c.sessionLog = [];
      c.sessionLog.push(entry);
      c.sessionsDone = (c.sessionsDone || 0) + 1;

      if (isLast || c.sessionsDone >= total) {
        if (finalNrs == null || finalImp == null || finalPgic == null) {
          alert("La final de pachet completează chestionarul de evoluție (NRS, impact, PGIC).");
          return;
        }
        c.packageCompleted = true;
        c.finalScores = {
          nrs: finalNrs,
          impact: finalImp,
          pgic: finalPgic,
          deltaNrs: Scores.delta(sc.scor_durere_intrare, finalNrs),
          deltaImpact: Scores.delta(sc.scor_impact_intrare, finalImp),
          entryNrs: sc.scor_durere_intrare,
          entryImpact: sc.scor_impact_intrare,
          at: new Date().toISOString()
        };
      }
      Storage.saveConsult(c);
      alert(
        c.packageCompleted
          ? `Pachet închis. Δ durere: ${c.finalScores.deltaNrs ?? "—"} · PGIC: ${c.finalScores.pgic}`
          : `Ședința ${sessionNum} salvată.`
      );
      App.go("kineto");
    });
  }
};
