const Storage = {
  key: "msk_prototype_v1",

  load() {
    try {
      const raw = localStorage.getItem(this.key);
      return raw ? JSON.parse(raw) : { triages: [], role: "patient" };
    } catch {
      return { triages: [], role: "patient" };
    }
  },

  save(data, skipPush) {
    localStorage.setItem(this.key, JSON.stringify(data));
    if (!skipPush && typeof Api !== "undefined" && Api.token()) {
      clearTimeout(this._pushTimer);
      this._pushTimer = setTimeout(() => Api.push().catch(() => {}), 400);
    }
  },

  getRole() {
    return this.load().role || "patient";
  },

  setRole(role) {
    const d = this.load();
    d.role = role;
    this.save(d);
  },

  saveTriage(triage) {
    const d = this.load();
    triage.id = triage.id || "t_" + Date.now();
    triage.savedAt = new Date().toISOString();
    const idx = d.triages.findIndex((t) => t.id === triage.id);
    if (idx >= 0) d.triages[idx] = triage;
    else d.triages.unshift(triage);
    this.save(d);
    return triage;
  },

  listTriages() {
    return this.load().triages || [];
  },

  getTriage(id) {
    return this.listTriages().find((t) => t.id === id) || null;
  },

  saveConsult(consult) {
    const d = this.load();
    if (!d.consults) d.consults = [];
    const idx = d.consults.findIndex((c) => c.id === consult.id);
    consult.savedAt = new Date().toISOString();
    if (idx >= 0) d.consults[idx] = consult;
    else d.consults.unshift(consult);
    this.save(d);
    return consult;
  },

  listConsults() {
    return this.load().consults || [];
  },

  getConsult(id) {
    return this.listConsults().find((c) => c.id === id) || null;
  },

  getConsultByTriage(triageId) {
    return this.listConsults().find((c) => c.triageId === triageId) || null;
  }
};
