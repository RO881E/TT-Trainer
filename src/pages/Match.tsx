import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useState } from 'react';
import { db, emptyServe, ERR_CATS, type ErrCat, type Match, type MatchKind, type Opponent } from '../db';
import { matchPlan } from '../matchplan';
import OpponentPicker from '../OpponentPicker';
import { currentTtr, materialOf, todayIso } from '../stats';
import { Card, Fold, Num, PlanList, Segmented, Stepper, Txt, go } from '../ui';

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

const KINDS = [['Punktspiel', 'Punktspiel'], ['Turnier', 'Turnier'], ['Pokal', 'Pokal']] as const;
const setsToText = (sets: [number, number][]) => sets.map(([a, b]) => `${a}:${b}`).join(' ');

export default function MatchForm({ editId, presetOpp }: { editId?: number; presetOpp?: number }) {
  const opps = useLiveQuery(() => db.opponents.orderBy('name').toArray(), []) ?? [];
  const ttrLogs = useLiveQuery(() => db.ttr.toArray(), []) ?? [];
  const all = useLiveQuery(() => db.matches.toArray(), []) ?? [];
  const editing = useLiveQuery(() => (editId ? db.matches.get(editId) : undefined), [editId]);
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
  const [loaded, setLoaded] = useState(!editId);

  useEffect(() => {
    if (!editing || loaded) return;
    setOppId(editing.opponentId); setDate(editing.date); setKind(editing.kind); setMyTtr(editing.myTtr); setOppTtr(editing.oppTtr);
    setSetsTxt(setsToText(editing.sets)); setErrors(editing.errors); setServe(editing.serve); setNotes(editing.notes ?? ''); setLoaded(true);
  }, [editing, loaded]);

  const opp = opps.find(o => o.id === oppId);
  useEffect(() => {
    const o = presetOpp ? opps.find(x => x.id === presetOpp) : undefined;
    if (o && oppId === '' && !newName) { setOppId(o.id!); setOppTtr(o.ttr); }
  }, [presetOpp, opps]); // eslint-disable-line react-hooks/exhaustive-deps
  const others = all.filter(m => m.id !== editId);
  const recent = useMemo(() => [...new Set([...all].sort((a, b) => b.date.localeCompare(a.date)).map(m => m.opponentId))], [all]);
  const h2h = others.filter(m => m.opponentId === oppId);
  const sets = parseSets(setsTxt);
  const mine = sets.filter(([a, b]) => a > b).length, theirs = sets.length - mine;
  const ownTtr = myTtr ?? currentTtr(ttrLogs);
  const plan = useMemo(() => (opp ? matchPlan({ ...opp, ttr: oppTtr ?? opp.ttr }, others, opps, ownTtr) : []), [opp, oppTtr, others, opps, ownTtr]);

  function pick(o: Opponent) { setOppId(o.id!); setOppTtr(o.ttr); setNewName(''); }

  async function save() {
    if (!sets.length || mine === theirs) return setMsg('Bitte Sätze eingeben (z. B. „8 -9 7 9“).');
    let id: number | undefined = oppId || undefined;
    if (!id) {
      if (!newName.trim()) return setMsg('Bitte zuerst einen Gegner wählen.');
      id = await db.opponents.add({ name: newName.trim(), ttr: oppTtr, updatedAt: todayIso() });
    }
    const oT = oppTtr ?? opp?.ttr;
    if (!oT) return setMsg('Gegner-TTR fehlt.');
    const ev = await db.events.where('date').equals(date).filter(e => e.kind === kind).first();
    const eventId = ev?.id ?? await db.events.add({ date, kind });
    const mainError = (Object.entries(errors).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0]?.[0] as ErrCat) || undefined;
    const m: Match = { date, opponentId: id as number, eventId, kind, myTtr: ownTtr, oppTtr: oT, sets, won: mine > theirs, errors, mainError, serve, notes };
    if (editId) {
      await db.matches.put({ ...m, id: editId });
      const old = editing?.eventId;
      if (old && old !== eventId && !(await db.matches.where('eventId').equals(old).count())) await db.events.delete(old);
    } else await db.matches.add(m);
    await db.opponents.update(id, { ttr: oT, updatedAt: todayIso() });
    if (editId) return go(`/gegner/${id}`);
    setMsg(`Gespeichert: ${mine}:${theirs} ${mine > theirs ? 'Sieg' : 'Niederlage'}.`);
    setOppId(''); setNewName(''); setSetsTxt(''); setErrors({}); setServe(emptyServe()); setNotes(''); setOppTtr(undefined);
  }

  if (!loaded) return <p className="muted">Lade …</p>;
  return <>
    <Card title="Gegner">
      <OpponentPicker opps={opps} recent={recent} selected={opp} newName={newName} onSelect={pick} onNew={n => { setNewName(n); setOppId(''); }}
        onClear={() => { setOppId(''); setNewName(''); setOppTtr(undefined); }} />
      {opp && <div className="scout">
        <b>{[opp.style, opp.hand].filter(Boolean).join(' · ') || 'Profil unvollständig'}</b>
        {materialOf(opp) !== 'Noppen innen' && <span className="badge">⚠ {materialOf(opp)}</span>}
        <p>Bilanz: {h2h.filter(m => m.won).length}:{h2h.filter(m => !m.won).length} · <a href={`#/gegner/${opp.id}`}>Profil öffnen</a></p>
      </div>}
    </Card>
    {opp && !editId && <Fold title="Matchplan" hint={`${plan.length} Hinweise`} open><PlanList items={plan} /></Fold>}
    <Card title="Ergebnis">
      <Segmented value={kind} options={KINDS} onChange={setKind} />
      <div className="row"><Txt label="Datum" type="date" value={date} onChange={setDate} />
        <Num label="Mein TTR" value={ownTtr} onChange={setMyTtr} /><Num label="Gegner-TTR" value={oppTtr} onChange={setOppTtr} /></div>
      <Txt label="Sätze, z. B. 8 -9 7 9 oder 11:8 9:11 …" value={setsTxt} onChange={setSetsTxt} />
      {sets.length > 0 && <p className={`result ${mine > theirs ? 'good' : 'bad'}`}><b>{mine}:{theirs}</b> · {sets.map(([a, b]) => `${a}:${b}`).join(', ')}</p>}
    </Card>
    <Fold title="Fehler & Aufschläge" hint="optional, aber wertvoll für die Statistik">
      <h3>Fehler</h3>
      {ERR_CATS.map(c => <Stepper key={c} label={c} value={errors[c] ?? 0} onChange={v => setErrors({ ...errors, [c]: v })} />)}
      <h3>Aufschlagmuster (gespielt / Punkt gewonnen)</h3>
      {(['A', 'B', 'C'] as const).map(p => <div key={p} className="row">
        <Stepper label={`${p} gespielt`} value={serve[p].used} onChange={v => setServe({ ...serve, [p]: { ...serve[p], used: v } })} />
        <Stepper label="gewonnen" value={serve[p].won} onChange={v => setServe({ ...serve, [p]: { ...serve[p], won: Math.min(v, serve[p].used) } })} />
      </div>)}
    </Fold>
    <Card>
      <Txt label="Notizen (Taktik, was ging / ging nicht)" area value={notes} onChange={setNotes} />
      <button className="primary" onClick={save}>{editId ? 'Änderungen speichern' : 'Spiel speichern'}</button>
      {msg && <p className="msg">{msg}{!editId && <> <a href="#/gegner">Gegner ansehen</a></>}</p>}
    </Card>
  </>;
}
