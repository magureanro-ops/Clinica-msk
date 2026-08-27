/** Date demo pentru test rapid end-to-end */
const Demo = {
  seed() {
    const triageId = "t_demo_" + Date.now();
    const consultId = "c_demo_" + Date.now();
    const triage = {
      id: triageId,
      completed: true,
      consent: true,
      zones: ["lombar"],
      redFlags: {
        trauma: false,
        fever: false,
        weight: false,
        urine: false,
        saddle: false,
        night: false,
        cancer: false
      },
      nrs: 7,
      duration: "2to6w",
      painTypes: ["surda"],
      impact: 4,
      mood: { worry: 2, adherence: 1 },
      diseases: ["Niciuna"],
      meds: ["Antiinflamatoare (AINS)"],
      kidneyNotes: [],
      scores: {
        scor_durere_intrare: 7,
        scor_impact_intrare: 4,
        prioritate_triaj: "high",
        sursa: "triaj",
        data: new Date().toISOString()
      },
      savedAt: new Date().toISOString()
    };
    const consult = {
      id: consultId,
      triageId,
      finalized: true,
      finalizedAt: new Date().toISOString(),
      diagnosisValidated: true,
      diagnoses: [{ code: "M54.5", label: "Lombalgie" }],
      diagnosisFree: "",
      certainty: "probable",
      examCommon: { Inspecție: true, Palpare: true, "Mobilizare activă": true },
      examSpecial: { "Lasègue (SLR)": true },
      examNotes: "Demo — sensibilitate lombară paravertebrală",
      meds: "Paracetamol 1g × 3/zi, scurt",
      infiltrations: [],
      devices: ["TENS", "Laser HILT", "Tecar Indiba", "Deep Oscillation"],
      packageSessions: 10,
      sessionMinutes: 45,
      zoneDirection: "Lombar bilateral, paravertebral",
      infusions: ["Magneziu + B Neural"],
      followUp: true,
      sessionsDone: 0,
      sessionLog: [],
      documents: {
        patientText: "Demo rezultat pacient — lombalgie, pachet 10×45 min.",
        doctorText: "M54.5 · NRS 7 · Impact 4 · Kineto 10×45"
      },
      savedAt: new Date().toISOString()
    };
    Storage.saveTriage(triage);
    Storage.saveConsult(consult);
    return { triageId, consultId };
  }
};
