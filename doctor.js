const Doctor = {
  list() {
    const main = document.getElementById("main");
    const items = Storage.listTriages().filter((t) => t.completed);
    if (!items.length) {
      main.innerHTML = `
        <div class="card">
          <h1>Sumare triaj</h1>
          <p class="lead">Nu există încă triaje finalizate. Cere pacientului să completeze triajul.</p>
          <button type="button" class="btn btn-primary" onclick="App.go('home')">Acasă</button>
        </div>`;
      return;
    }
    const rows = items.map((t) => {
      const sc = t.scores || Scores.fromTriage(t);
      const pr = Scores.labelPriority(sc.prioritate_triaj);
      const zones = (t.zones || []).map((id) => {
        const z = MSK_CONFIG.zones.find((x) => x.id === id);
        return z ? z.label : id;
      }).join(", ");
      const when = t.savedAt ? new Date(t.savedAt).toLocaleString("ro-RO") : "";
      return `
        <button type="button" class="home-card" data-id="${t.id}">
          <strong>${zones || "Fără zonă"}</strong>
          <span>Durere ${sc.scor_durere_intrare ?? "—"}/10 · Impact ${Scores.labelImpact(sc.scor_impact_intrare)}</span><br/>
          <span class="badge ${pr.cls}">${pr.text}</span>
          <span style="float:right;font-size:0.75rem;opacity:0.7">${when}</span>
        </button>`;
    }).join("");
    main.innerHTML = `
      <div class="card">
        <h1>Coadă triaj</h1>
        <p class="lead">Selectează un pacient pentru sumar.</p>
        <div class="home-grid">${rows}</div>
        <button type="button" class="btn btn-secondary" style="margin-top:1rem" onclick="App.go('home')">Acasă</button>
      </div>`;
    main.querySelectorAll("[data-id]").forEach((btn) => {
      btn.addEventListener("click", () => App.go("summary", { id: btn.dataset.id }));
    });
  },

  summary(id) {
    const t = Storage.getTriage(id);
    const main = document.getElementById("main");
    if (!t) {
      main.innerHTML = `<div class="card"><p>Triaj negăsit.</p><button class="btn btn-primary" onclick="App.go('doctor')">Înapoi</button></div>`;
      return;
    }
    const sc = t.scores || Scores.fromTriage(t);
    const pr = Scores.labelPriority(sc.prioritate_triaj);
    const zoneLabels = (t.zones || []).map((id) => {
      const z = MSK_CONFIG.zones.find((x) => x.id === id);
      return z ? z.label : id;
    });
    const flags = MSK_CONFIG.redFlags
      .filter((f) => t.redFlags && t.redFlags[f.id] === true)
      .map((f) => f.text);
    const dur = MSK_CONFIG.durationOptions.find((d) => d.id === t.duration);

    main.innerHTML = `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem">
          <h1 style="margin:0">Sumar medic</h1>
          <span class="badge ${pr.cls}">${pr.text}</span>
        </div>
        <div class="summary-block">
          <h3>Localizare & simptom</h3>
          <p><strong>Zone:</strong> ${zoneLabels.join(", ") || "—"}</p>
          <p><strong>Durere NRS:</strong> ${sc.scor_durere_intrare ?? "—"}/10</p>
          <p><strong>Impact funcțional:</strong> ${Scores.labelImpact(sc.scor_impact_intrare)}</p>
          <p><strong>Durată:</strong> ${dur ? dur.label : "—"}</p>
          <p><strong>Tip:</strong> ${(t.painTypes || []).join(", ") || "—"}</p>
        </div>
        <div class="summary-block">
          <h3>Red flags</h3>
          ${flags.length ? `<ul>${flags.map((x) => `<li>${x}</li>`).join("")}</ul>` : "<p>Niciun red flag semnalat</p>"}
        </div>
        <div class="summary-block">
          <h3>Stare emoțională / aderență</h3>
          <p>Îngrijorare: ${t.mood?.worry != null ? ["Deloc","Puțin","Moderată","Mult","Foarte mult"][t.mood.worry] : "—"}</p>
          <p>Aderență anticipată: ${t.mood?.adherence != null ? ["Da, sigur","Probabil da","Nu sunt sigur","Probabil nu"][t.mood.adherence] : "—"}</p>
        </div>
        <div class="summary-block">
          <h3>Boli & medicație</h3>
          <p>${(t.diseases || []).join(", ") || "—"}</p>
          <p>${(t.meds || []).join(", ") || "—"}</p>
          <p>${(t.kidneyNotes || []).join(", ") || ""}</p>
        </div>
        <div class="summary-block">
          <h3>Scoruri de intrare (din chestionar)</h3>
          <p>Durere: <strong>${sc.scor_durere_intrare ?? "—"}</strong> · Impact: <strong>${sc.scor_impact_intrare ?? "—"}</strong></p>
          <p class="hint">Vor fi folosite la final de pachet pentru Δ evoluție.</p>
        </div>
        <div class="btn-row">
          <button type="button" class="btn btn-secondary" onclick="App.go('doctor')">Înapoi</button>
          <button type="button" class="btn btn-primary" id="open-consult">Deschide consult</button>
        </div>
      </div>`;
    document.getElementById("open-consult")?.addEventListener("click", () => {
      App.go("consult", { triageId: id });
    });
  }
};
