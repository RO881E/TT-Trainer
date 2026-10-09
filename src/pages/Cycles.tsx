import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { db } from '../db';
import { blockForError, clearResult, endBlockThisWeek, focusFor, initialCycle, locate, move, pullAfter, schedule, setResult, setWeeks, type CycleState, type Slot } from '../cycle';
import { STUFEN } from '../cyclePlan';
import { rhythmFor } from '../plan';
import { daysAgo, errorDist, todayIso, topError } from '../stats';
import { fmt } from '../ttr';
import { useCycle } from '../useCycle';
import { Card, Fold, Icon } from '../ui';

const short = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.`;

function Details({ slot }: { slot: Slot }) {
  const b = slot.block;
  return <div className="block-details">
    <p>{b.goal}</p>
    <p><b>Test:</b> {b.test.label}. Ziel: {b.test.target}</p>
    {(['einfuehren', 'festigen', 'variation'] as const).map(k => <div key={k}><h3>{STUFEN[k].label}</h3><ul>{b.drills[k].map(d => <li key={d}>{d}</li>)}</ul></div>)}
    <h3>Vereinstraining B (spielnah)</h3><ul>{b.spielnah.map(d => <li key={d}>{d}</li>)}</ul>
    <h3>Zuhause</h3><ul>{b.home.map(d => <li key={d}>{d}</li>)}</ul>
  </div>;
}

export default function Cycles() {
  const { state, save } = useCycle();
  const matches = useLiveQuery(() => db.matches.toArray(), []) ?? [];
  const [val, setVal] = useState(''); const [passed, setPassed] = useState(false);
  if (!state) return null;
  const t = todayIso();
  const pos = locate(state, t), slots = schedule(state), foc = focusFor(pos);
  const cur = 'slot' in pos ? pos.slot : undefined;
  const upd = (s: CycleState) => save(s);
  const err = topError(errorDist(matches.filter(m => m.date >= daysAgo(30))));
  const fit = cur && err ? (cur.block.errors as string[]).includes(err) : undefined;
  const alt = cur && err && !fit ? blockForError(state, err, cur.block.key) : undefined;
  const res = cur && state.results[cur.block.key];
  const years = [1, 2, 3] as const;
  return <>
    {'upcoming' in pos && <div className="warn">Der Plan startet am {fmt(pos.upcoming.start)} (in {pos.startsInDays} Tagen) mit „{pos.upcoming.block.title}“. Das Startdatum änderst du unten.</div>}
    {'done' in pos && <div className="warn">Der Plan ist durchgelaufen. Setze unten ein neues Startdatum oder starte den Plan neu.</div>}
    {cur && foc && <Card title={cur.block.title} aside={<span className="badge home">{STUFEN[foc.stufe].label}</span>}>
      <small>{cur.block.area} · Woche {foc.week} von {foc.weeks} · {short(cur.start)}–{short(cur.end)}</small>
      <div className="progress" style={{ margin: '10px 0' }}><i style={{ width: `${(100 * foc.week) / foc.weeks}%` }} /></div>
      <p>{cur.block.goal}</p>
      <p className="muted">{STUFEN[foc.stufe].text}</p>
      <h3>Block-Test</h3>
      <p><b>{cur.block.test.label}</b><br />Ziel: {cur.block.test.target}</p>
      {res ? <p className={res.passed ? 'msg' : 'bad'}>{res.passed ? '✓ Bestanden' : 'Noch nicht bestanden'} am {fmt(res.date)}: {res.value}
        <button className="small" onClick={() => upd(clearResult(state, cur.block.key))}>zurücksetzen</button></p> : <>
        <label>Ergebnis (z. B. „17 in Folge“)<input value={val} onChange={e => setVal(e.target.value)} /></label>
        <label className="check"><input type="checkbox" checked={passed} onChange={e => setPassed(e.target.checked)} /> Ziel erreicht</label>
        <button onClick={() => { upd(setResult(state, cur.block.key, { date: t, value: val || '–', passed })); setVal(''); setPassed(false); }}>Ergebnis speichern</button></>}
      <div className="row" style={{ marginTop: 8 }}>
        {res?.passed && <button className="primary inline" onClick={() => upd(endBlockThisWeek(state, cur.block.key, t))}><Icon name="check" size={18} /> Block jetzt beenden</button>}
        <button onClick={() => upd(setWeeks(state, cur.block.key, cur.weeks + 1))}>+1 Woche</button>
        {cur.weeks > 1 && <button onClick={() => upd(setWeeks(state, cur.block.key, cur.weeks - 1))}>−1 Woche</button>}
      </div>
      {err && <p className="muted" style={{ marginTop: 8 }}>Statistik (30 Tage): häufigster Fehler <b>{err}</b> – {fit ? 'passt zum aktuellen Block.' : 'passt nicht zum aktuellen Block.'}</p>}
      {alt && <button onClick={() => upd(pullAfter(state, alt.key, cur.block.key))}>„{alt.title}“ als nächsten Block vorziehen</button>}
    </Card>}
    {cur && <Fold title="Diese Woche konkret" hint="Mittwoch, Freitag, Donnerstag">
      <h3>Mittwoch: Hauptthema (45 min)</h3><ul>{foc!.drills.map(d => <li key={d}>{d}</li>)}</ul>
      <h3>Freitag: spielnah</h3><ul>{foc!.spielnah.map(d => <li key={d}>{d}</li>)}</ul>
      <h3>Donnerstag: zuhause</h3><ul>{foc!.home.map(d => <li key={d}>{d}</li>)}</ul>
    </Fold>}
    {years.map(y => <Fold key={y} title={`Jahr ${y}`} hint={y === 1 ? 'RH-Topspin im Ballwechsel' : y === 2 ? 'Gegentopspin und Rückschlag' : 'Taktik und Kombinationen'} open={cur?.block.year === y}>
      <ul className="timeline">{slots.filter(s => s.block.year === y).map(s => {
        const r = state.results[s.block.key], now = cur?.block.key === s.block.key;
        const status = now ? 'läuft' : r ? (r.passed ? 'bestanden' : 'offen') : s.end < t ? 'vorbei' : 'geplant';
        return <li key={s.block.key} className={now ? 'now' : ''}>
          <details><summary><span className="when">{short(s.start)}<small>{s.weeks} Wo.</small></span>
            <span className="grow"><b>{s.block.title}</b><small>{s.block.area} · {rhythmFor(s.start).name}</small></span>
            <span className={`badge ${status === 'bestanden' || now ? 'home' : ''}`}>{status}</span></summary>
            <Details slot={s} />
            <div className="row">
              <button onClick={() => upd(move(state, s.block.key, -1))} aria-label="nach vorn">↑ früher</button>
              <button onClick={() => upd(move(state, s.block.key, 1))} aria-label="nach hinten">↓ später</button>
              <button onClick={() => upd(setWeeks(state, s.block.key, s.weeks - 1))} disabled={s.weeks <= 1}>−1 Wo.</button>
              <button onClick={() => upd(setWeeks(state, s.block.key, s.weeks + 1))}>+1 Wo.</button>
            </div></details></li>;
      })}</ul>
    </Fold>)}
    <Fold title="Plan-Einstellungen" hint={`Start ${fmt(state.start)}`}>
      <label>Startdatum (Montag des ersten Blocks)<input type="date" value={state.start} onChange={e => e.target.value && upd({ ...state, start: e.target.value })} /></label>
      <button className="danger" onClick={() => confirm('Plan auf die Vorlage zurücksetzen? Reihenfolge, Dauer und Testergebnisse gehen verloren.') && upd(initialCycle(t))}>Plan zurücksetzen</button>
      <p className="muted">Der Plan ist ein Gerüst über rund 3 Jahre. Blöcke lassen sich verschieben und verlängern, alle folgenden Blöcke rücken nach. Ab Jahr 2 verfeinern wir die Übungen mit den Ergebnissen aus Jahr 1.</p>
    </Fold>
  </>;
}
