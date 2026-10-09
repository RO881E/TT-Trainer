import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { db } from '../db';
import { parseIcs } from '../ics';
import { PLAYER } from '../plan';
import { todayIso } from '../stats';
import { fmt } from '../ttr';
import { Card, Fold, Icon, go } from '../ui';

const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const DAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const dow = (iso: string) => DAYS[new Date(`${iso}T12:00:00`).getDay()];

export function FixtureRow({ f, action }: { f: import('../db').Fixture; action?: boolean }) {
  return <li className="fixture">
    <div className="date"><b>{f.date.slice(8, 10)}</b><small>{dow(f.date)}</small></div>
    <div className="grow"><b>{f.title}</b>
      <small>{[f.time && `${f.time} Uhr`, f.location].filter(Boolean).join(' · ')}</small></div>
    {f.home !== undefined && <span className={`badge ${f.home ? 'home' : ''}`}>{f.home ? 'Heim' : 'Auswärts'}</span>}
    {action && <button className="icon-btn" aria-label="Spiel erfassen" onClick={() => go(`/spiel/termin/${f.id}`)}><Icon name="plus" size={20} /></button>}
  </li>;
}

export default function Termine() {
  const all = useLiveQuery(() => db.fixtures.orderBy('date').toArray(), []) ?? [];
  const [msg, setMsg] = useState('');
  const t = todayIso();
  const next = all.filter(f => f.date >= t), past = all.filter(f => f.date < t).reverse();

  async function load(file: File) {
    try {
      const fx = parseIcs(await file.text(), PLAYER.club);
      if (!fx.length) return setMsg('Keine Termine in der Datei gefunden. Ist es eine .ics-Datei?');
      if (all.length && !confirm(`Die vorhandene Terminliste (${all.length}) durch ${fx.length} Termine aus der Datei ersetzen?`)) return;
      await db.transaction('rw', db.fixtures, async () => { await db.fixtures.clear(); await db.fixtures.bulkAdd(fx); });
      setMsg(`${fx.length} Termine importiert.`);
    } catch (e) { setMsg(`Fehler: ${(e as Error).message}`); }
  }

  const byMonth = next.reduce<Record<string, typeof next>>((r, f) => { (r[`${MONTHS[+f.date.slice(5, 7) - 1]} ${f.date.slice(0, 4)}`] ??= []).push(f); return r; }, {});
  return <>
    <Card title="Termine importieren">
      <p className="muted">In myTischtennis die Saisontermine als Kalenderdatei (.ics) herunterladen und hier auswählen. Ein neuer Import ersetzt die Liste.</p>
      <label className="file"><Icon name="upload" size={20} /> Kalenderdatei wählen
        <input type="file" accept=".ics,text/calendar" onChange={e => { const f = e.target.files?.[0]; if (f) void load(f); e.target.value = ''; }} /></label>
      {msg && <p className="msg">{msg}</p>}
    </Card>
    {!all.length && <p className="empty">Noch keine Termine importiert.</p>}
    {Object.entries(byMonth).map(([m, fx]) => <Card key={m} title={m}><ul className="list">{fx.map(f => <FixtureRow key={f.id} f={f} action />)}</ul></Card>)}
    {all.length > 0 && !next.length && <p className="empty">Keine kommenden Termine. Neue Saison? Dann die aktuelle Datei importieren.</p>}
    {past.length > 0 && <Fold title="Vergangene Termine" hint={`${past.length} Spiele`}><ul className="list">{past.map(f => <FixtureRow key={f.id} f={f} action />)}</ul>
      <button className="danger" onClick={() => confirm('Alle Termine löschen?') && db.fixtures.clear()}>Terminliste leeren</button></Fold>}
    {all.length > 0 && <p className="muted" style={{ textAlign: 'center' }}>Zuletzt geplant bis {fmt(all[all.length - 1].date)}</p>}
  </>;
}
