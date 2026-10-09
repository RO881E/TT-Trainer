import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useState } from 'react';
import { db, MATERIALS, STYLES, type Opponent } from '../db';
import { matchPlan } from '../matchplan';
import { currentTtr, materialOf, todayIso } from '../stats';
import { fmt } from '../ttr';
import { Card, Fold, Icon, Num, PlanList, Sel, Tiles, Txt, go } from '../ui';

const initials = (n: string) => n.split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase();

export function OpponentList() {
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const opps = useLiveQuery(() => db.opponents.orderBy('name').toArray(), []) ?? [];
  const ms = useLiveQuery(() => db.matches.toArray(), []) ?? [];
  const list = opps.filter(o => `${o.name} ${o.club ?? ''}`.toLowerCase().includes(q.toLowerCase()));
  async function create() {
    if (!name.trim()) return;
    go(`/gegner/${await db.opponents.add({ name: name.trim(), updatedAt: todayIso() })}`);
  }
  return <>
    <div className="toolbar">
      <div className="search"><Icon name="search" size={18} /><input placeholder="Name oder Verein" value={q} onChange={e => setQ(e.target.value)} /></div>
      <button className="primary inline" onClick={() => setAdding(!adding)}><Icon name="plus" size={18} /> Neu</button>
    </div>
    {adding && <Card><div className="row"><Txt label="Name des Gegners" value={name} onChange={setName} /><button className="primary inline" onClick={create}>Anlegen</button></div></Card>}
    {!list.length && <p className="empty">{opps.length ? 'Keine Treffer.' : 'Noch keine Gegner. Lege den ersten an oder erfasse ein Spiel.'}</p>}
    <ul className="cards">{list.map(o => {
      const h = ms.filter(m => m.opponentId === o.id), w = h.filter(m => m.won).length;
      return <li key={o.id} onClick={() => go(`/gegner/${o.id}`)}>
        <span className="avatar">{initials(o.name)}</span>
        <div className="grow"><b>{o.name}</b>
          <small>{[o.club, o.style, o.ttr && `TTR ${o.ttr}`].filter(Boolean).join(' · ') || 'Profil leer'}</small></div>
        {materialOf(o) !== 'Noppen innen' && <span className="badge">{materialOf(o)}</span>}
        <span className={`score ${h.length ? (w * 2 >= h.length ? 'good' : 'bad') : ''}`}>{h.length ? `${w}:${h.length - w}` : '–'}</span></li>;
    })}</ul>
  </>;
}

export function OpponentDetail({ id }: { id: number }) {
  const o = useLiveQuery(() => db.opponents.get(id), [id]);
  const all = useLiveQuery(() => db.matches.toArray(), []) ?? [];
  const opps = useLiveQuery(() => db.opponents.toArray(), []) ?? [];
  const ttrLogs = useLiveQuery(() => db.ttr.toArray(), []) ?? [];
  const [f, setF] = useState<Opponent>();
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (o) setF(o); }, [o]);
  const ms = useMemo(() => all.filter(m => m.opponentId === id).sort((a, b) => b.date.localeCompare(a.date)), [all, id]);
  if (!f) return <p className="muted">Lade …</p>;
  const set = (p: Partial<Opponent>) => { setF({ ...f, ...p }); setSaved(false); };
  const w = ms.filter(m => m.won).length;
  const plan = matchPlan(f, all, opps, currentTtr(ttrLogs));
  return <>
    <Card>
      <div className="hero-opp"><span className="avatar big">{initials(f.name)}</span>
        <div><h2>{f.name}</h2><small>{[f.club, f.style, f.hand].filter(Boolean).join(' · ') || 'Profil unvollständig'}</small></div></div>
      <Tiles items={[{ label: 'Bilanz', value: `${w}:${ms.length - w}`, tone: ms.length ? (w * 2 >= ms.length ? 'good' : 'bad') : undefined }, { label: 'TTR', value: f.ttr ?? '?' }, { label: 'Material', value: materialOf(f) === 'Noppen innen' ? 'Standard' : materialOf(f) }]} />
      <button className="primary" onClick={() => go(`/spiel/gegner/${id}`)}>Spiel gegen {f.name.split(' ')[0]} erfassen</button>
    </Card>
    <Fold title="Matchplan" hint="aus Profil und Statistik" open><PlanList items={plan} /></Fold>
    <Fold title="Duelle" hint={`${ms.length} Spiele`} open={ms.length > 0}>
      {!ms.length && <p className="muted">Noch keine Duelle.</p>}
      <ul className="list">{ms.map(m => <li key={m.id} className="duel">
        <b className={`pill ${m.won ? 'good' : 'bad'}`}>{m.won ? 'S' : 'N'}</b>
        <div className="grow"><span>{fmt(m.date)} · {m.sets.map(([a, b]) => `${a}:${b}`).join(' ')}</span>
          <small>{[m.kind, m.mainError && `Fehler: ${m.mainError}`].filter(Boolean).join(' · ')}</small>
          {m.notes && <small>{m.notes}</small>}</div>
        <button className="icon-btn" aria-label="Bearbeiten" onClick={() => go(`/spiel/${m.id}`)}><Icon name="edit" size={18} /></button>
        <button className="icon-btn danger" aria-label="Löschen" onClick={() => confirm('Spiel löschen?') && db.matches.delete(m.id!)}><Icon name="x" size={18} /></button></li>)}</ul>
    </Fold>
    <Fold title="Profil bearbeiten" hint="Scouting-Daten">
      <Txt label="Name" value={f.name} onChange={v => set({ name: v })} />
      <div className="row"><Txt label="Verein" value={f.club} onChange={v => set({ club: v })} /><Num label="TTR" value={f.ttr} onChange={v => set({ ttr: v })} /></div>
      <div className="row"><Sel label="Spielertyp" value={f.style} options={STYLES} onChange={v => set({ style: v })} />
        <Sel label="Händigkeit" value={f.hand} options={['rechts', 'links'] as const} onChange={v => set({ hand: v })} /></div>
      <div className="row"><Sel label="Belag VH" value={f.fhRubber} options={MATERIALS} onChange={v => set({ fhRubber: v })} />
        <Sel label="Belag RH" value={f.bhRubber} options={MATERIALS} onChange={v => set({ bhRubber: v })} /></div>
      <Txt label="Material (Holz/Beläge)" value={f.equipment} onChange={v => set({ equipment: v })} />
      <Txt label="Seine Aufschläge" area value={f.serves} onChange={v => set({ serves: v })} />
      <Txt label="Stärken" area value={f.strengths} onChange={v => set({ strengths: v })} />
      <Txt label="Schwächen" area value={f.weaknesses} onChange={v => set({ weaknesses: v })} />
      <Txt label="Taktik / Matchplan" area value={f.tactics} onChange={v => set({ tactics: v })} />
      <button className="primary" onClick={async () => { await db.opponents.put({ ...f, updatedAt: todayIso() }); setSaved(true); }}>Profil speichern</button>
      {saved && <p className="msg">Gespeichert.</p>}
      <button className="danger" onClick={async () => { if (ms.length) return alert('Erst die Duelle löschen.'); if (confirm('Gegner löschen?')) { await db.opponents.delete(id); go('/gegner'); } }}>Gegner löschen</button>
    </Fold>
  </>;
}
