# Pornire backend minim

```bash
cd msk-app
python3 server/app.py
```

Deschide: http://127.0.0.1:8787

## Conturi
- medic / medic123
- kineto / kineto123
- admin / admin123
- pacient / pacient123

## Ce face
- Salvează triaje, consulturi, follow-up în SQLite (`server/msk.db`)
- Servește și aplicația (un singur link)
- Login echipă + sincronizare între dispozitive (același server)
- Triajul pacientului se poate salva fără login (`/api/public/triages`)
