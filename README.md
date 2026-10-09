# TT-Trainer (PWA)

Persönliche Trainings-, Spiel- und Scouting-App für Tischtennis. Läuft offline, Daten bleiben lokal (IndexedDB).

## Voraussetzungen
- Node.js ≥ 20.19 (empfohlen: aktuelle LTS), Git, GitHub-Konto

## Lokal starten
    npm install
    npm run icons      # erzeugt PNG-Icons aus public/icon.svg
    npm run dev        # http://localhost:5173/tt-trainer/
    npm run build && npm run preview   # Produktionsbuild inkl. Service Worker testen

## Deployment auf GitHub Pages (einmalig)
1. Auf GitHub ein neues Repository anlegen, z. B. `tt-trainer` (öffentlich – Pages ist für private Repos nur in bezahlten Plänen verfügbar).
2. Lokal: `git init && git add . && git commit -m "Initial" && git branch -M main`
   `git remote add origin https://github.com/<USER>/tt-trainer.git && git push -u origin main`
3. Repository → Settings → Pages → Build and deployment → Source: **GitHub Actions**.
4. Der Workflow `.github/workflows/deploy.yml` läuft bei jedem Push auf `main` (Tab „Actions“). Der Base-Pfad wird automatisch auf `/<repo-name>/` gesetzt.
5. App öffnen: `https://<USER>.github.io/tt-trainer/`
6. Optional: `package-lock.json` committen und im Workflow `npm install` durch `npm ci` ersetzen (reproduzierbare Builds).

## Auf dem Android-Handy installieren
1. URL in **Chrome** öffnen → Menü ⋮ → „App installieren“ / „Zum Startbildschirm hinzufügen“.
2. App öffnen → Mehr → Backup → „Dauerhaften Speicher anfragen“.
3. Chrome-Einstellungen: Diese Seite nicht in „Websitedaten löschen“ einbeziehen; keine Speicher-„Cleaner“-Apps auf Chrome loslassen.

## Datensicherung (Pflicht!)
- Wöchentlich: Mehr → Backup → Export → „Teilen“ → Google Drive / E-Mail an dich selbst.
- Wiederherstellen: Backup → Import (ersetzt alle Daten).
- Persistenter Speicher schützt nur vor automatischer Löschung, nicht vor manuellem Löschen der Websitedaten oder Deinstallation.

## Updates
Code ändern → push → nach ca. 1–2 Minuten ist die neue Version online; die App aktualisiert sich beim nächsten Start automatisch (Service Worker `autoUpdate`).

## Schema ändern
Neue Felder ohne Index: einfach verwenden. Neue Indizes/Tabellen: `db.version(2).stores({...})` in `src/db.ts` ergänzen – Version 1 nie ändern.
