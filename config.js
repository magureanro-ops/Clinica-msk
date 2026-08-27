const MSK_CONFIG = {
  clinicName: "Clinica MSK",
  triageMaxMinutes: 5,
  zones: [
    { id: "cervical", label: "Gât / cervical" },
    { id: "toracal", label: "Toracal / spate mijloc" },
    { id: "lombar", label: "Lombar / belciug" },
    { id: "umar_s", label: "Umăr stâng" },
    { id: "umar_d", label: "Umăr drept" },
    { id: "genunchi_s", label: "Genunchi stâng" },
    { id: "genunchi_d", label: "Genunchi drept" },
    { id: "sold_s", label: "Șold stâng" },
    { id: "sold_d", label: "Șold drept" },
    { id: "glezna_s", label: "Gleznă / picior stâng" },
    { id: "glezna_d", label: "Gleznă / picior drept" },
    { id: "alta", label: "Altă zonă" }
  ],
  redFlags: [
    { id: "trauma", text: "Ai avut un traumatism important recent (cădere, accident)?" },
    { id: "fever", text: "Ai febră sau te simți rău general în legătură cu durerea?" },
    { id: "weight", text: "Ai pierdut greutate fără să vrei în ultima vreme?" },
    {
      id: "urine",
      text: "Ai probleme noi cu urinarea (nu poți urina, sau pierzi urină în legătură cu durerea de spate, sau nu mai simți când trebuie să urinezi)?"
    },
    { id: "saddle", text: "Ai zone de amorțeală în șa (între picioare) sau slăbiciune importantă la picioare?" },
    { id: "night", text: "Durerea te trezește noaptea și nu trece la schimbarea poziției?" },
    { id: "cancer", text: "Ai avut cancer în antecedente?" }
  ],
  durationOptions: [
    { id: "lt2w", label: "Sub 2 săptămâni" },
    { id: "2to6w", label: "2–6 săptămâni" },
    { id: "6to12w", label: "6–12 săptămâni" },
    { id: "gt3m", label: "Peste 3 luni" }
  ],
  painTypes: [
    { id: "surda", label: "Surdă / apăsătoare" },
    { id: "ascutita", label: "Ascuțită / înjunghiere" },
    { id: "arsura", label: "Arsură" },
    { id: "pulsatila", label: "Pulsatilă" },
    { id: "alta", label: "Alt tip" }
  ],
  impactOptions: [
    { id: 1, label: "Deloc" },
    { id: 2, label: "Puțin" },
    { id: 3, label: "Moderată" },
    { id: 4, label: "Mult" },
    { id: 5, label: "Foarte mult" }
  ],
  diseases: [
    "Hipertensiune", "Diabet", "Boli de inimă", "Boli de rinichi",
    "Boli reumatice", "Osteoporoză", "Boli neurologice", "Niciuna"
  ],
  meds: [
    "Antiinflamatoare (AINS)", "Anticoagulante", "Corticosteroizi",
    "Antidiabetice", "Medicație pentru inimă", "Niciuna / nu știu"
  ]
};
