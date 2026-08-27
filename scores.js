const Scores = {
  /** Extract entry scores from triage answers (patient questionnaire only) */
  fromTriage(t) {
    const nrs = typeof t.nrs === "number" ? t.nrs : null;
    const impact = t.impact != null ? Number(t.impact) : null;
    const priority = this.priority(t);
    return {
      scor_durere_intrare: nrs,
      scor_impact_intrare: impact,
      prioritate_triaj: priority,
      sursa: "triaj",
      data: new Date().toISOString()
    };
  },

  priority(t) {
    const flags = t.redFlags || {};
    const critical = ["urine", "saddle", "fever", "cancer", "trauma"].some((k) => flags[k] === true);
    const impactHigh = Number(t.impact) >= 4;
    const nrsHigh = typeof t.nrs === "number" && t.nrs >= 8;
    if (critical) return "urgent";
    if (impactHigh || nrsHigh || Object.values(flags).some(Boolean)) return "high";
    return "standard";
  },

  labelPriority(p) {
    if (p === "urgent") return { text: "Urgentă", cls: "badge-urgent" };
    if (p === "high") return { text: "Ridicată", cls: "badge-warn" };
    return { text: "Standard", cls: "badge-ok" };
  },

  labelImpact(v) {
    const map = { 1: "Deloc", 2: "Puțin", 3: "Moderată", 4: "Mult", 5: "Foarte mult" };
    return map[v] || "—";
  },

  delta(entry, final) {
    if (entry == null || final == null) return null;
    return final - entry;
  }
};
