import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { db } from '../db';
import { ensurePersist, exportJson, importJson, storageInfo } from '../backup';
import { Card } from '../ui';

export default function Backup() {
  const last = useLiveQuery(() => db.settings.get('lastBackup'), []);
  const [info, setInfo] = useState<{ persisted: boolean | null; usage: number; quota: number }>();
  const [msg, setMsg] = useState('');
  const refresh = () => storageInfo().then(setInfo);
  useEffect(() => { refresh(); }, []);
  return <>
    <Card title="Speicherstatus">
      <p>Dauerhafter Speicher: <b>{info?.persisted === null ? 'nicht unterstützt' : info?.persisted ? 'ja ✓' : 'nein'}</b></p>
      <p className="muted">Belegt {((info?.usage ?? 0) / 1e6).toFixed(1)} MB von ca. {((info?.quota ?? 0) / 1e9).toFixed(1)} GB</p>
      <button onClick={async () => { const r = await ensurePersist(); setMsg(r ? 'Persistenz gewährt.' : 'Abgelehnt – App installieren, öfter nutzen, später erneut versuchen.'); refresh(); }}>Dauerhaften Speicher anfragen</button>
      <p className="muted">Wichtig: Auch mit Persistenz löscht „Chrome → Websitedaten löschen“ bzw. Deinstallation alles. Nur ein Export schützt davor.</p>
    </Card>
    <Card title="Sicherung">
      <p>Letzte Sicherung: <b>{last?.value ? new Date(String(last.value)).toLocaleString('de-DE') : 'noch nie'}</b></p>
      <button className="primary" onClick={async () => setMsg((await exportJson()) ? 'Export erstellt.' : 'Export abgebrochen.')}>Export (JSON teilen/speichern)</button>
      <label>Import (ersetzt alle Daten!)<input type="file" accept="application/json,.json" onChange={async e => {
        const f = e.target.files?.[0]; if (!f || !confirm('Alle aktuellen Daten durch die Sicherung ersetzen?')) return;
        try { await importJson(f); setMsg('Import erfolgreich.'); } catch (err) { setMsg(`Fehler: ${(err as Error).message}`); }
      }} /></label>
      {msg && <p className="msg">{msg}</p>}
    </Card>
  </>;
}
