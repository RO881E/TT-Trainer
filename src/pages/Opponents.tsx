import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { db, MATERIALS, STYLES, type Opponent } from '../db';
import { materialOf, todayIso } from '../stats';
import { fmt } from '../ttr';
import { Card, Num, Sel, Txt, go } from '../ui';

export function OpponentList() {
  const [q, setQ] = useState('');
  const opps = useLiveQuery(() => db.opponents.orderBy('name').toArray(), []) ?? [];
  const ms = useLiveQuery(() => db.matches.toArray(), []) ?? [];
  const list = opps.filter(o => `${o.name} ${o.club ?? ''}`.toLowerCase().includes(q.toLowerCase()));
  async function create() {
    const name = prompt('Name des Gegners?');
    if (name) go(`/gegner/${await db.opponents.add({ name, updatedAt: todayIso() })}`);
  }
  return <Card title={`Gegner (${opps.length})`}>
    <input placeholder="Suche Name/Verein" value={q} onChange={e => setQ(e.target.value)} />
    <button onClick={create}>+ Neuer Gegner</button>
    <ul className="list">{list.map(o => {
      const h = ms.filter(m => m.opponentId === o.id), w = h.filter(m => m.won).length;
      return <li key={o.id} onClick={() => go(`/gegner/${o.id}`)}>
        <b>{o.name}</b> {o.ttr ?? '?'} · {o.club ?? ''} · {o.style ?? ''}
        {materialOf(o) !== 'Noppen innen' && <span className="badge">{materialOf(o)}</span>}
        <span className="right">{w}:{h.length - w}</span></li>;
    })}</ul>
  </Card>;
}

export function OpponentDetail({ id }: { id: number }) {
  const o = useLiveQuery(() => db.opponents.get(id), [id]);
  const ms = useLiveQuery(() => db.matches.where('opponentId').equals(id).reverse().sortBy('date'), [id]) ?? [];
  const [f, setF] = useState<Opponent>();
  useEffect(() => { if (o) setF(o); }, [o]);
  if (!f) return <p>Lade …</p>;
  const set = (p: Partial<Opponent>) => setF({ ...f, ...p });
  const w = ms.filter(m => m.won).length;
  return <>
    <Card title={`${f.name} – Bilanz ${w}:${ms.length - w}`}>
      <Txt label="Name" value={f.name} onChange={v => set({ name: v })} />
      <div className="row"><Txt label="Verein" value={f.club} onChange={v => set({ club: v })} /><Num label="TTR" value={f.ttr} onChange={v => set({ ttr: v })} /></div>
      <div className="row"><Sel label="Spielertyp" value={f.style} options={STYLES} onChange={v => set({ style: v })} />
        <Sel label="Händigkeit" value={f.hand} options={['rechts', 'links'] as const} onChange={v => set({ hand: v })} /></div>
      <div className="row"><Sel label="Belag VH" value={f.fhRubber} options={MATERIALS} onChange={v => set({ fhRubber: v })} />
        <Sel label="Belag RH" value={f.bhRubber} options={MATERIALS} onChange={v => set({ bhRubber: v })} /></div>
      <Txt label="Material (Holz/Beläge)" value={f.equipment} onChange={v => set({ equipment: v })} />
      <Txt label="Aufschläge" area value={f.serves} onChange={v => set({ serves: v })} />
      <Txt label="Stärken" area value={f.strengths} onChange={v => set({ strengths: v })} />
      <Txt label="Schwächen" area value={f.weaknesses} onChange={v => set({ weaknesses: v })} />
      <Txt label="Taktik / Matchplan" area value={f.tactics} onChange={v => set({ tactics: v })} />
      <button className="primary" onClick={() => db.opponents.put({ ...f, updatedAt: todayIso() })}>Profil speichern</button>
    </Card>
    <Card title="Duelle">
      <ul className="list">{ms.map(m => <li key={m.id}>
        <b className={m.won ? 'good' : 'bad'}>{m.won ? 'S' : 'N'}</b> {fmt(m.date)} · {m.sets.map(([a, b]) => `${a}:${b}`).join(' ')}
        {m.mainError && ` · Fehler: ${m.mainError}`}{m.notes && <p className="muted">{m.notes}</p>}
        <button className="small" onClick={() => confirm('Spiel löschen?') && db.matches.delete(m.id!)}>löschen</button></li>)}</ul>
    </Card>
    <button className="danger" onClick={async () => { if (ms.length) return alert('Erst die Duelle löschen.'); if (confirm('Gegner löschen?')) { await db.opponents.delete(id); go('/gegner'); } }}>Gegner löschen</button>
  </>;
}
