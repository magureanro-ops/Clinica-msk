# Publicare rapidă – Clinica MSK

## Opțiunea A – Local în clinică (cel mai rapid)
1. Copiază folderul `msk-app` pe un laptop/tabletă din clinică.
2. Deschide `index.html` în Chrome.
3. Sau rulează în folder:
   ```
   python3 -m http.server 8080
   ```
   Apoi pe telefon (aceeași Wi‑Fi): `http://IP-LAPTOP:8080`

## Opțiunea B – Link online (Netlify Drop / similar)
1. Arhivează conținutul folderului `msk-app` (nu folderul părinte).
2. Netlify Drop / Cloudflare Pages / orice static host: încarcă fișierele.
3. Primești un URL (ex. `https://msk-clinica.netlify.app`).
4. Trimite URL-ul pe WhatsApp pacienților pentru triaj / follow-up.

## Opțiunea C – Subdomeniu clinică
- `https://app.clinica-ta.ro` → pointează spre host static.
- HTTPS obligatoriu pentru PWA + microfon (voce, ulterior).

## Checklist înainte de pacienți reali
- [ ] Test Pacient demo end-to-end
- [ ] Test triaj real pe telefon
- [ ] Test consult pe tabletă medic
- [ ] Test fișă kineto + scor final
- [ ] Consimțământ GDPR text actualizat (Admin ulterior)
- [ ] Backup: export localStorage (DevTools) până există server
- [ ] NU folosi ca unic dosar medical legal fără server + backup + contract

## Limitări actuale (onest)
- Fără server: datele sunt pe dispozitiv (localStorage).
- Fără WhatsApp API real (doar simulare link).
- Fără conector Medsoft/Atlas încă.
- Potrivit pentru **pilot intern** și validare flux; pentru producție multi-centru → backend.

## Următorul pas tehnic (când ești gata)
1. Backend (auth + bază de date)
2. Link-uri unice triaj / follow-up
3. WhatsApp Business API
4. Conectori HIS
