import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { db } from '../db';
import { ensurePersist, exportJson, importJson, shareFile, storageInfo } from '../backup';
import { matchesCsv, sessionsCsv } from '../csv';
import { forgetGist, gistConfig, gistPull, gistPush, saveToken } from '../gist';
import { Card, Fold, Icon } from '../ui';

const TOKEN_URL = 'https://github.com/settings/tokens/new?scopes=gist&description=TT-Trainer';

export default function Backup() {
  const last = useLiveQuery(() => db.settings.get('lastBackup'), []);
  const cfg = useLiveQuery(gistConfig, []);
  const [info, setInfo] = useState<{ persisted: boolean | null; usage: number; quota: number }>();
  const [token, setToken] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const refresh = () => storageInfo().then(setInfo);
  useEffect(() => { refresh(); }, []);
  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true); setMsg('');
    try { await fn(); setMsg(ok); } catch (e) { setMsg(`Fehler: ${(e as Error).message}`); } finally { setBusy(false); }
  };
  const csv = async (kind: 'matches' | 'sessions') => {
    const text = kind === 'matches' ? matchesCsv(await db.matches.toArray(), await db.opponents.toArray()) : sessionsCsv(await db.sessions.toArray());
    await shareFile(`tt-trainer-${kind === 'matches' ? 'spiele' : 'training'}-${new Date().toLocaleDateString('sv-SE')}.csv`, text, 'text/csv');
  };
  return <>
    <Card title="Sicherung" aside={<small>zuletzt {last?.value ? new Date(String(last.value)).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' }) : 'nie'}</small>}>
      <button className="primary" onClick={async () => setMsg((await exportJson()) ? 'Export erstellt.' : 'Export abgebrochen.')}>Als Datei sichern (JSON)</button>
      <label>Wiederherstellen aus Datei (ersetzt alle Daten!)<input type="file" accept="application/json,.json" onChange={async e => {
        const f = e.target.files?.[0]; if (!f || !confirm('Alle aktuellen Daten durch die Sicherung ersetzen?')) return;
        try { await importJson(f); setMsg('Import erfolgreich.'); } catch (err) { setMsg(`Fehler: ${(err as Error).message}`); }
      }} /></label>
      {msg && <p className="msg">{msg}</p>}
    </Card>
    <Fold title="Automatische Sicherung (privater Gist)" hint={cfg?.token ? (cfg.last ? `aktiv · zuletzt ${new Date(cfg.last).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}` : 'Token gespeichert') : 'empfohlen'} open>
      <p className="muted">Die App sichert beim Start höchstens einmal pro Tag in einen privaten GitHub-Gist. Das Token liegt nur auf diesem Gerät und ist nicht Teil der Sicherung.</p>
      {!cfg?.token ? <>
        <p><a href={TOKEN_URL} target="_blank" rel="noreferrer">Token mit Recht „gist“ erstellen →</a></p>
        <label>Token einfügen<input type="password" autoComplete="off" value={token} onChange={e => setToken(e.target.value)} placeholder="ghp_… oder github_pat_…" /></label>
        <button className="primary" disabled={!token.trim() || busy} onClick={() => run(async () => { await saveToken(token); setToken(''); await gistPush(); }, 'Verbunden und gesichert.')}>Verbinden und sichern</button>
      </> : <>
        <button className="primary" disabled={busy} onClick={() => run(gistPush, 'Im Gist gesichert.')}><Icon name="cloud" size={18} /> Jetzt sichern</button>
        <button disabled={busy || !cfg.id} onClick={() => confirm('Alle aktuellen Daten durch die Sicherung aus dem Gist ersetzen?') && run(gistPull, 'Aus dem Gist wiederhergestellt.')}>Aus Gist wiederherstellen</button>
        <button className="danger" onClick={() => confirm('Token von diesem Gerät entfernen? Der Gist bleibt auf GitHub bestehen.') && forgetGist()}>Verbindung trennen</button>
      </>}
    </Fold>
    <Fold title="CSV-Export" hint="für Excel und Google Tabellen">
      <button onClick={() => csv('matches')}>Spiele (CSV)</button><button onClick={() => csv('sessions')}>Trainingseinheiten (CSV)</button>
    </Fold>
    <Fold title="Speicherstatus" hint={info?.persisted ? 'dauerhaft geschützt' : 'nicht dauerhaft geschützt'}>
      <p>Dauerhafter Speicher: <b>{info?.persisted === null ? 'nicht unterstützt' : info?.persisted ? 'ja ✓' : 'nein'}</b></p>
      <p className="muted">Belegt {((info?.usage ?? 0) / 1e6).toFixed(1)} MB von ca. {((info?.quota ?? 0) / 1e9).toFixed(1)} GB</p>
      <button onClick={async () => { const r = await ensurePersist(); setMsg(r ? 'Persistenz gewährt.' : 'Abgelehnt – App installieren, öfter nutzen, später erneut versuchen.'); refresh(); }}>Dauerhaften Speicher anfragen</button>
      <p className="muted">Auch mit Persistenz löscht „Websitedaten löschen“ in Chrome (oder Deinstallation) alles. Nur eine Sicherung außerhalb der App schützt davor.</p>
    </Fold>
  </>;
}
