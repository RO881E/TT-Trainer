import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { db, emptyServe, ERR_CATS, type ErrCat, type Match, type MatchKind } from '../db';
import { currentTtr, materialOf, todayIso } from '../stats';
import { Card, Num, Stepper, Txt, go } from '../ui';

/** "11:8 9:11" oder Kurznotation "8 -9 +12" (positiv = gewonnen, Zahl = Punkte des Verlierers) */
export function parseSets(s: string): [number, number][] {
  return s.trim().split(/[\s,;]+/).filter(Boolean).flatMap((tok): [number, number][] => {
    const m = tok.match(/^(\d+)[:\-](\d+)$/);
    if (m) return [[+m[1], +m[2]]];
    if (/^[+-]?\d+$/.test(tok)) {
      const n = Math.abs(+tok), win = !tok.startsWith('-'), hi = Math.max(11, n + 2);
      return [win ? [hi, n] : [n, hi]];
    }
    return [];
  });
}

export default function MatchForm() {
  const opps = useLiveQuery(() => db.opponents.orderBy('name').toArray(), []) ?? [];
  const ttrLogs = useLiveQuery(() => db.ttr.toArray(), []) ?? [];
  const all = useLiveQuery(() => db.matches.toArray(), []) ?? [];
  const [oppId, setOppId] = useState<number | ''>('');
  const [newName, setNewName] = useState('');
  const [date, setDate] = useState(todayIso());
  const [kind, setKind] = useState<MatchKind>('Punktspiel');
  const [myTtr, setMyTtr] = useState<number>();
  const [oppTtr, setOppTtr] = useState<number>();
  const [setsTxt, setSetsTxt] = useState('');
  const [errors, setErrors] = useState<Partial<Record<ErrCat, number>>>({});
  const [serve, setServe] = useState(emptyServe());
  const [notes, setNotes] = useState('');
  const [msg, setMsg] = useState('');
  const opp = opps.find(o => o.id === oppId);
  const h2h = all.filter(m => m.opponentId === oppId);
  const sets = parseSets(setsTxt);
  const mine = sets.filter(([a, b]) => a > b).length, theirs = sets.length - mine;

  async function save() {
    if (!sets.length || mine === theirs) return setMsg('Bitte Sätze eingeben (z. B. „8 -9 7 9“).');
    let id = oppId || undefined;
    if (!id) {
      if (!newName.trim()) return setMsg('Gegner wählen oder Namen eingeben.');
      id = await db.opponents.add({ name: newName.trim(), ttr: oppTtr, updatedAt: todayIso() });
    }
    const oT = oppTtr ?? opp?.ttr;
    if (!oT) return setMsg('Gegner-TTR fehlt.');
    const ev = await db.events.where('date').equals(date).filter(e => e.kind === kind).first();
    const eventId = ev?.id ?? await db.events.add({ date, kind });
    const mainError = (Object.entries(errors).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0]?.[0] as ErrCat) || undefined;
    const m: Match = { date, opponentId: id as number, eventId, kind, myTtr: myTtr ?? currentTtr(ttrLogs), oppTtr: oT, sets, won: mine > theirs, errors, mainError, serve, notes };
    await db.matches.add(m);
    await db.opponents.update(id, { ttr: oT, updatedAt: todayIso() });
    setMsg(`Gespeichert: ${mine}:${theirs} ${mine > theirs ? 'Sieg' : 'Niederlage'}.`);
    setOppId(''); setNewName(''); setSetsTxt(''); setErrors({}); setServe(emptyServe()); setNotes(''); setOppTtr(undefined);
  }

  return <>
    <Card title="Spiel erfassen">
      <label>Gegner<select value={oppId} onChange={e => { const v = e.target.value ? +e.target.value : ''; setOppId(v); setOppTtr(opps.find(o => o.id === v)?.ttr); }}>
        <option value="">– neuer Gegner –</option>{opps.map(o => <option key={o.id} value={o.id}>{o.name}{o.club ? ` (${o.club})` : ''}</option>)}</select></label>
      {!oppId && <Txt label="Name neuer Gegner" value={newName} onChange={setNewName} />}
      {opp && <div className="scout">
        <b>Scouting: {opp.style ?? 'Typ ?'} · {opp.hand ?? ''}</b>
        {materialOf(opp) !== 'Noppen innen' && <span className="badge">⚠ {materialOf(opp)}</span>}
        <p>Bilanz: {h2h.filter(m => m.won).length}:{h2h.filter(m => !m.won).length}</p>
        {opp.tactics && <p><b>Taktik:</b> {opp.tactics}</p>}
        {opp.weaknesses && <p><b>Schwächen:</b> {opp.weaknesses}</p>}
        <a href={`#/gegner/${opp.id}`}>Profil öffnen</a></div>}
      <div className="row">
        <Txt label="Datum" type="date" value={date} onChange={setDate} />
        <label>Art<select value={kind} onChange={e => setKind(e.target.value as MatchKind)}>{['Punktspiel', 'Turnier', 'Pokal'].map(k => <option key={k}>{k}</option>)}</select></label>
      </div>
      <div className="row">
        <Num label="Mein TTR" value={myTtr ?? currentTtr(ttrLogs)} onChange={setMyTtr} />
        <Num label="Gegner-TTR" value={oppTtr} onChange={setOppTtr} />
      </div>
      <Txt label="Sätze (z. B. 8 -9 7 9 oder 11:8 9:11 …)" value={setsTxt} onChange={setSetsTxt} />
      <p className="muted">{sets.map(([a, b]) => `${a}:${b}`).join(', ')} {sets.length ? `→ ${mine}:${theirs}` : ''}</p>
    </Card>
    <Card title="Fehler (Anzahl)">
      {ERR_CATS.map(c => <Stepper key={c} label={c} value={errors[c] ?? 0} onChange={v => setErrors({ ...errors, [c]: v })} />)}
    </Card>
    <Card title="Aufschlagmuster (gespielt / Punkt gewonnen)">
      {(['A', 'B', 'C'] as const).map(p => <div key={p} className="row">
        <Stepper label={`${p} gespielt`} value={serve[p].used} onChange={v => setServe({ ...serve, [p]: { ...serve[p], used: v } })} />
        <Stepper label="gewonnen" value={serve[p].won} onChange={v => setServe({ ...serve, [p]: { ...serve[p], won: Math.min(v, serve[p].used) } })} />
      </div>)}
    </Card>
    <Card>
      <Txt label="Notizen (Taktik, was ging/ging nicht)" area value={notes} onChange={setNotes} />
      <button className="primary" onClick={save}>Speichern</button>
      {msg && <p className="msg">{msg} <a onClick={() => go('/gegner')}>Gegner ansehen</a></p>}
    </Card>
  </>;
}
