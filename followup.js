const FollowUp = {
  /**
   * Algoritm D — interpretare răspuns follow-up
   * return: { status, action, message, escalate }
   */
  interpret(entryNrs, entryImpact, currentNrs, currentImpact, adherence, redFlag) {
    if (redFlag) {
      return {
        status: "red_flag",
        action: "escalate_doctor",
        escalate: true,
        message: "Semne de alarmă semnalate. Escaladare către medic."
      };
    }
    const dN =
      typeof entryNrs === "number" && typeof currentNrs === "number"
        ? currentNrs - entryNrs
        : null;
    const dI =
      typeof entryImpact === "number" && typeof currentImpact === "number"
        ? currentImpact - entryImpact
        : null;

    if (adherence === "nu" || adherence === "partial") {
      return {
        status: "low_adherence",
        action: "educate",
        escalate: false,
        deltaNrs: dN,
        deltaImpact: dI,
        message:
          "Aderență scăzută. Nu creștem intensitatea. Simplificăm planul de acasă și reamintim importanța exercițiilor."
      };
    }
    if (dN != null && dN >= 1) {
      return {
        status: "worse",
        action: "alert_kineto_escalate",
        escalate: true,
        deltaNrs: dN,
        deltaImpact: dI,
        message: "Durerea a crescut față de început. Kineto evaluează; posibil control medical."
      };
    }
    if (dN != null && dN <= -2 && (dI == null || dI <= -1)) {
      return {
        status: "good",
        action: "continue",
        escalate: false,
        deltaNrs: dN,
        deltaImpact: dI,
        message: "Evoluție bună. Continuăm planul conform fazei."
      };
    }
    if (dN != null && dN >= -1 && dN <= 0) {
      return {
        status: "plateau",
        action: "adjust",
        escalate: false,
        deltaNrs: dN,
        deltaImpact: dI,
        message:
          "Stagnare. Prelungim faza curentă 1–2 ședințe și revizuim exercițiile / aparatele."
      };
    }
    return {
      status: "neutral",
      action: "continue",
      escalate: false,
      deltaNrs: dN,
      deltaImpact: dI,
      message: "Răspuns înregistrat. Continuăm monitorizarea."
    };
  },

  /** Days after consult start for follow-up (config-like) */
  scheduleDays: [3, 7, 14, 30],

  listAlerts() {
    const main = document.getElementById("main");
    const data = Storage.load();
    const alerts = data.followUpAlerts || [];
    if (!alerts.length) {
      main.innerHTML = `
        <div class="card">
          <h1>Alerte follow-up</h1>
          <p class="lead">Nicio alertă. Când un pacient completează follow-up cu stagnare/agravare, apare aici.</p>
          <button type="button" class="btn btn-secondary" onclick="App.go('home')">Acasă</button>
          <button type="button" class="btn btn-primary" style="margin-top:0.5rem" onclick="App.go('followup-sim')">Simulează follow-up pacient</button>
        </div>`;
      return;
    }
    const rows = alerts
      .map((a) => {
        const badge =
          a.status === "good"
            ? "badge-ok"
            : a.status === "worse" || a.status === "red_flag"
              ? "badge-urgent"
              : "badge-warn";
        return `
          <div class="home-card" style="cursor:default">
            <strong>Ziua ${a.day}</strong>
            <span class="badge ${badge}">${a.status}</span>
            <p style="margin-top:0.35rem;font-size:0.9rem">${a.message}</p>
            <p class="hint">NRS ${a.entryNrs ?? "—"} → ${a.currentNrs ?? "—"} (Δ ${a.deltaNrs ?? "—"})</p>
            ${
              a.escalate
                ? `<button type="button" class="btn btn-primary" style="margin-top:0.5rem;min-height:40px" data-esc="${a.id}">Cere sfatul medicului</button>`
                : ""
            }
          </div>`;
      })
      .join("");
    main.innerHTML = `
      <div class="card">
        <h1>Alerte follow-up (kineto)</h1>
        <p class="lead">Medicul primește doar ce escaladezi.</p>
        <div class="home-grid">${rows}</div>
        <button type="button" class="btn btn-secondary" style="margin-top:1rem" onclick="App.go('home')">Acasă</button>
        <button type="button" class="btn btn-primary" style="margin-top:0.5rem" onclick="App.go('followup-sim')">Simulează follow-up</button>
      </div>`;
    main.querySelectorAll("[data-esc]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.esc;
        const d = Storage.load();
        const alert = (d.followUpAlerts || []).find((x) => x.id === id);
        if (!alert) return;
        if (!d.doctorEscalations) d.doctorEscalations = [];
        d.doctorEscalations.unshift({
          ...alert,
          escalatedAt: new Date().toISOString()
        });
        Storage.save(d);
        alert("Escaladat către medic. Apare în inbox-ul medicului.");
      });
    });
  },

  doctorInbox() {
    const main = document.getElementById("main");
    const items = Storage.load().doctorEscalations || [];
    if (!items.length) {
      main.innerHTML = `
        <div class="card">
          <h1>Escaladări follow-up</h1>
          <p class="lead">Nimic escaladat de la kineto.</p>
          <button type="button" class="btn btn-primary" onclick="App.go('home')">Acasă</button>
        </div>`;
      return;
    }
    const rows = items
      .map(
        (a) => `
        <div class="home-card" style="cursor:default">
          <strong>Ziua ${a.day} · ${a.status}</strong>
          <p style="font-size:0.9rem;margin-top:0.35rem">${a.message}</p>
          <p class="hint">NRS ${a.entryNrs} → ${a.currentNrs} · Impact ${a.entryImpact} → ${a.currentImpact}</p>
        </div>`
      )
      .join("");
    main.innerHTML = `
      <div class="card">
        <h1>Escaladări (medic)</h1>
        <div class="home-grid">${rows}</div>
        <button type="button" class="btn btn-primary" style="margin-top:1rem" onclick="App.go('home')">Acasă</button>
      </div>`;
  },

  /** Patient-facing short questionnaire (simulates WhatsApp link) */
  simulate() {
    const consults = Storage.listConsults().filter((c) => c.finalized && c.followUp);
    const main = document.getElementById("main");
    if (!consults.length) {
      main.innerHTML = `
        <div class="card">
          <h1>Follow-up</h1>
          <p class="lead">Nu există consult cu follow-up activat. La Plan terapeutic, bifează „Activează follow-up dinamic” și finalizează consultul.</p>
          <button type="button" class="btn btn-primary" onclick="App.go('home')">Acasă</button>
        </div>`;
      return;
    }
    const c = consults[0];
    const t = Storage.getTriage(c.triageId);
    const sc = t?.scores || {};
    main.innerHTML = `
      <div class="card">
        <h1>Follow-up (simulare link WhatsApp)</h1>
        <p class="lead">Aceleași întrebări ca la preconsult. Durează ~1 minut.</p>
        <p class="hint">Referință început: NRS ${sc.scor_durere_intrare ?? "—"} · Impact ${sc.scor_impact_intrare ?? "—"}</p>
        <label class="field">Ziua follow-up</label>
        <div class="choice-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:0.75rem">
          ${this.scheduleDays.map((d) => `<button type="button" class="choice" data-day="${d}">Ziua ${d}</button>`).join("")}
        </div>
        <label class="field">Cât de tare te doare acum? (0–10)</label>
        <div class="nrs" id="fu-nrs">
          ${Array.from({ length: 11 }, (_, i) => `<button type="button" data-nrs="${i}">${i}</button>`).join("")}
        </div>
        <label class="field" style="margin-top:0.75rem">Cât te limitează în activități?</label>
        <div class="choice-grid" id="fu-imp">
          ${MSK_CONFIG.impactOptions.map((o) => `<button type="button" class="choice" data-imp="${o.id}">${o.label}</button>`).join("")}
        </div>
        <label class="field" style="margin-top:0.75rem">Urmezi tratamentul / exercițiile?</label>
        <div class="choice-grid" id="fu-ad">
          <button type="button" class="choice" data-ad="da">Da</button>
          <button type="button" class="choice" data-ad="partial">Parțial</button>
          <button type="button" class="choice" data-ad="nu">Nu</button>
        </div>
        <label class="field" style="margin-top:0.75rem">A apărut ceva nou îngrijorător?</label>
        <div class="choice-grid" style="grid-template-columns:1fr 1fr">
          <button type="button" class="choice" data-rf="false">Nu</button>
          <button type="button" class="choice yes-danger" data-rf="true">Da</button>
        </div>
        <div class="btn-row">
          <button type="button" class="btn btn-secondary" onclick="App.go('home')">Anulează</button>
          <button type="button" class="btn btn-primary" id="fu-send">Trimite</button>
        </div>
      </div>`;

    let day = 7,
      nrs = null,
      impact = null,
      adherence = "da",
      redFlag = false;

    document.querySelectorAll("[data-day]").forEach((btn) => {
      btn.addEventListener("click", () => {
        day = Number(btn.dataset.day);
        document.querySelectorAll("[data-day]").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
      });
    });
    document.querySelector('[data-day="7"]')?.classList.add("selected");

    document.querySelectorAll("#fu-nrs [data-nrs]").forEach((btn) => {
      btn.addEventListener("click", () => {
        nrs = Number(btn.dataset.nrs);
        document.querySelectorAll("#fu-nrs [data-nrs]").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
      });
    });
    document.querySelectorAll("#fu-imp [data-imp]").forEach((btn) => {
      btn.addEventListener("click", () => {
        impact = Number(btn.dataset.imp);
        document.querySelectorAll("#fu-imp [data-imp]").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
      });
    });
    document.querySelectorAll("#fu-ad [data-ad]").forEach((btn) => {
      btn.addEventListener("click", () => {
        adherence = btn.dataset.ad;
        document.querySelectorAll("#fu-ad [data-ad]").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
      });
    });
    document.querySelectorAll("[data-rf]").forEach((btn) => {
      btn.addEventListener("click", () => {
        redFlag = btn.dataset.rf === "true";
        document.querySelectorAll("[data-rf]").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
      });
    });

    document.getElementById("fu-send")?.addEventListener("click", () => {
      if (nrs == null || impact == null) {
        alert("Completează durerea și impactul.");
        return;
      }
      const result = this.interpret(
        sc.scor_durere_intrare,
        sc.scor_impact_intrare,
        nrs,
        impact,
        adherence,
        redFlag
      );
      const alertObj = {
        id: "fu_" + Date.now(),
        consultId: c.id,
        triageId: c.triageId,
        day,
        entryNrs: sc.scor_durere_intrare,
        entryImpact: sc.scor_impact_intrare,
        currentNrs: nrs,
        currentImpact: impact,
        adherence,
        redFlag,
        ...result,
        at: new Date().toISOString()
      };
      const d = Storage.load();
      if (!d.followUps) d.followUps = [];
      d.followUps.unshift(alertObj);
      if (!d.followUpAlerts) d.followUpAlerts = [];
      // Kineto sees non-good or all for review; store actionable ones
      if (result.status !== "good" || result.escalate) {
        d.followUpAlerts.unshift(alertObj);
      } else {
        d.followUpAlerts.unshift(alertObj); // still visible for transparency
      }
      Storage.save(d);

      main.innerHTML = `
        <div class="card">
          <h1>Răspuns înregistrat</h1>
          <p class="lead">${result.message}</p>
          <p>Δ durere: <strong>${result.deltaNrs ?? "—"}</strong> · Status: <strong>${result.status}</strong></p>
          <p class="hint">${
            result.escalate
              ? "Kinetoterapeutul va vedea alerta și poate escalada la medic."
              : "Kinetoterapeutul poate vedea evoluția în alerte."
          }</p>
          <button type="button" class="btn btn-primary" onclick="Storage.setRole('kineto');App.go('followup-alerts')">Vezi ca kineto</button>
          <button type="button" class="btn btn-secondary" style="margin-top:0.5rem" onclick="App.go('home')">Acasă</button>
        </div>`;
    });
  }
};
