const HomeCare = {
  /** Algoritm F — decizie după final pachet */
  decide(finalScores) {
    if (!finalScores) {
      return {
        status: "unknown",
        action: "review",
        message: "Lipsesc scorurile de final. Completează chestionarul de închidere pachet."
      };
    }
    const pgic = finalScores.pgic;
    const dN = finalScores.deltaNrs;
    if (pgic === 6 || (dN != null && dN >= 1)) {
      return {
        status: "worse",
        action: "escalate_doctor",
        message: "Evoluție nefavorabilă. Control medical recomandat înainte de home-care."
      };
    }
    if (pgic >= 4 || (dN != null && dN > -2)) {
      return {
        status: "partial",
        action: "extend_or_review",
        message: "Răspuns parțial. Propunere: prelungire pachet sau control medic."
      };
    }
    // PGIC 1–3 and good delta
    return {
      status: "success",
      action: "maintenance",
      message: "Succes. Plan de întreținere 2–3 exerciții, 3×/săptămână. Follow-up la 1 / 3 / 6 luni."
    };
  },

  maintenanceExercises(family) {
    const map = {
      lombar: [
        { name: "Activare transvers / control pelvin", sets: "2 × 8–10, 3×/săpt" },
        { name: "Podul (bridge) ușor", sets: "2 × 8–10, 3×/săpt" },
        { name: "Întindere ischiogambieri / flexori șold", sets: "2 × 20–30 sec, zilnic" }
      ],
      cervical: [
        { name: "Chin tuck", sets: "2 × 8–10, 3×/săpt" },
        { name: "Întindere trapez", sets: "2 × 20–30 sec, zilnic" },
        { name: "Control scapular", sets: "2 × 8–10, 3×/săpt" }
      ],
      genunchi: [
        { name: "Izometrie cvadriceps", sets: "2 × 8–10, 3×/săpt" },
        { name: "Genuflexiune parțială controlată", sets: "2 × 8–10, 3×/săpt" },
        { name: "Întindere blândă", sets: "2 × 20–30 sec, zilnic" }
      ],
      default: [
        { name: "Activare + mobilitate blândă", sets: "2 × 8–10, 3×/săpt" },
        { name: "Întindere menținută", sets: "2 × 20–30 sec, zilnic" },
        { name: "Mers / activitate ușoară", sets: "10–20 min, majoritatea zilelor" }
      ]
    };
    return map[family] || map.default;
  },

  list() {
    const main = document.getElementById("main");
    const completed = Storage.listConsults().filter((c) => c.packageCompleted);
    if (!completed.length) {
      main.innerHTML = `
        <div class="card">
          <h1>Home-care</h1>
          <p class="lead">Niciun pachet închis. După ultima ședință + chestionar final, apar aici planurile de întreținere.</p>
          <button type="button" class="btn btn-primary" onclick="App.go('home')">Acasă</button>
        </div>`;
      return;
    }
    const rows = completed
      .map((c) => {
        const t = Storage.getTriage(c.triageId);
        const zones = (t?.zones || [])
          .map((id) => MSK_CONFIG.zones.find((z) => z.id === id)?.label || id)
          .join(", ");
        const decision = this.decide(c.finalScores);
        const badge =
          decision.status === "success"
            ? "badge-ok"
            : decision.status === "worse"
              ? "badge-urgent"
              : "badge-warn";
        return `
          <button type="button" class="home-card" data-cid="${c.id}">
            <strong>${zones || "Pachet închis"}</strong>
            <span class="badge ${badge}">${decision.status}</span>
            <p class="hint" style="margin-top:0.25rem">Δ NRS: ${c.finalScores?.deltaNrs ?? "—"} · PGIC: ${c.finalScores?.pgic ?? "—"}</p>
          </button>`;
      })
      .join("");
    main.innerHTML = `
      <div class="card">
        <h1>Home-care</h1>
        <p class="lead">Planuri de întreținere după final de pachet (algoritmul F).</p>
        <div class="home-grid">${rows}</div>
        <button type="button" class="btn btn-secondary" style="margin-top:1rem" onclick="App.go('home')">Acasă</button>
      </div>`;
    main.querySelectorAll("[data-cid]").forEach((btn) => {
      btn.addEventListener("click", () => App.go("homecare-plan", { consultId: btn.dataset.cid }));
    });
  },

  plan(consultId) {
    const c = Storage.getConsult(consultId);
    const main = document.getElementById("main");
    if (!c) {
      main.innerHTML = `<div class="card"><p>Negăsit.</p><button class="btn btn-primary" onclick="App.go('homecare')">Înapoi</button></div>`;
      return;
    }
    const t = Storage.getTriage(c.triageId);
    const family = typeof Kineto !== "undefined" ? Kineto.zoneFamily(t?.zones) : "default";
    const decision = this.decide(c.finalScores);
    const exercises = this.maintenanceExercises(family);

    main.innerHTML = `
      <div class="card">
        <h1>Plan home-care</h1>
        <p class="lead">${decision.message}</p>
        <div class="summary-block">
          <h3>Outcome pachet</h3>
          <p>NRS: ${c.finalScores?.entryNrs ?? "—"} → ${c.finalScores?.nrs ?? "—"}
             (Δ ${c.finalScores?.deltaNrs ?? "—"})</p>
          <p>Impact: ${c.finalScores?.entryImpact ?? "—"} → ${c.finalScores?.impact ?? "—"}</p>
          <p>PGIC: ${c.finalScores?.pgic ?? "—"}</p>
        </div>
        ${
          decision.action === "maintenance"
            ? `
          <div class="summary-block">
            <h3>Exerciții de întreținere (${family})</h3>
            <ul>
              ${exercises.map((e) => `<li><strong>${e.name}</strong> — ${e.sets}</li>`).join("")}
            </ul>
            <p class="hint">Reminder-e: 1 lună / 3 luni / 6 luni (WhatsApp – ulterior).</p>
            <p class="hint">Video-uri animate: Agent Storyboard + Video (de definit ulterior).</p>
          </div>`
            : decision.action === "escalate_doctor"
              ? `<p><span class="badge badge-urgent">Control medic</span></p>`
              : `<p><span class="badge badge-warn">Prelungire sau control</span></p>`
        }
        <div class="btn-row">
          <button type="button" class="btn btn-secondary" onclick="App.go('homecare')">Înapoi</button>
          <button type="button" class="btn btn-primary" id="hc-save">Salvează planul</button>
        </div>
      </div>`;

    document.getElementById("hc-save")?.addEventListener("click", () => {
      c.homeCare = {
        decision,
        family,
        exercises: decision.action === "maintenance" ? exercises : [],
        at: new Date().toISOString()
      };
      Storage.saveConsult(c);
      alert("Plan home-care salvat în dosar.");
      App.go("homecare");
    });
  }
};
