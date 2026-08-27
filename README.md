# Clinica MSK – Prototip (uz rapid)

## Pornire
1. Deschide `index.html` în Chrome / Edge / Safari (telefon sau desktop).
2. Sau din folder: `python3 -m http.server 8080` apoi http://localhost:8080

## Test în 2 minute
1. Ecran pacient → **Pacient demo** (încarcă lombalgie NRS 7, pachet 10×45).
2. Header: comută **Medic** → Coadă triaj / Fișe kineto / Home-care.
3. Header: comută **Kineto** → Fișele mele → notează ședința.
4. La ultima ședință: chestionar final (NRS, impact, PGIC) → Δ automat.
5. Pacient → Follow-up (simulare WhatsApp).

## Flux complet (fără demo)
Pacient: triaj 1–7 → Medic: sumar → consult (examen → diagnostic validat → plan → documente) → Kineto → Follow-up → Home-care.

## Date
Totul e local (localStorage). Șterge datele site-ului din browser ca să resetezi.

## Module
Sprint 1 Triaj · 2 Consult · 3 Kineto (algoritmi A–C) · 4 Follow-up (D) · Home-care (F)
