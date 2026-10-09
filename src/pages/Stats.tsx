import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { db, ERR_CATS } from '../db';
import { PLAYER } from '../plan';
import { band, bilanz, daysAgo, errorDist, materialOf, pct, quarterOf, range1500_1650, recommendations, serveStats, setStats } from '../stats';
import { BilTable, Card, LineChart } from '../ui';

export default function Stats() {
  const [days, setDays] = useState(0);
  const d = useLiveQuery(async () => ({ matches: await db.matches.toArray(), opps: await db.opponents.toArray(), knee: await db.knee.toArray(), weight: await db.weight.toArray(), ttr: await db.ttr.orderBy('date').toArray() }), []);
  if (!d) return null;
  const ms = days ? d.matches.filter(m => m.date >= daysAgo(days)) : d.matches;
  const om = new Map(d.opps.map(o => [o.id!, o]));
  const ss = setStats(ms), ed = errorDist(ms), sv = serveStats(ms);
  const total = ERR_CATS.reduce((s, c) => s + ed[c], 0);
  const w = ms.filter(m => m.won).length;
  return <>
    <div className="row">{[[0, 'Alles'], [365, '365 T'], [90, '90 T']].map(([v, l]) =>
      <button key={v} className={days === v ? 'on' : ''} onClick={() => setDays(+v)}>{l}</button>)}</div>
    <Card title={`Gesamt: ${w}:${ms.length - w} (${pct({ w, n: ms.length })} %)`}>
      <h3>Nach Gegner-TTR (±75)</h3><BilTable data={bilanz(ms, band)} />
      <h3>Checkpoint Phase 1</h3><BilTable data={bilanz(ms, range1500_1650)} />
      <h3>Nach Spielertyp</h3><BilTable data={bilanz(ms, m => om.get(m.opponentId)?.style)} />
      <h3>Nach Material</h3><BilTable data={bilanz(ms, m => materialOf(om.get(m.opponentId)))} />
      <h3>Entwicklung je Q-TTR-Quartal</h3><BilTable data={bilanz(ms, quarterOf)} />
    </Card>
    <Card title={`Sätze (${ss.sets})`}>
      <p>Knapp ab 8:8: {ss.c8.w}:{ss.c8.n - ss.c8.w} ({pct(ss.c8)} %) · ab 9:9: {ss.c9.w}:{ss.c9.n - ss.c9.w} ({pct(ss.c9)} %)</p>
      <p>Entscheidungssätze: {ss.decider.w}:{ss.decider.n - ss.decider.w} ({pct(ss.decider)} %)</p>
      <p className="muted">„Knapp“ = Verlierer ≥ 8 bzw. 9 Punkte (Näherung aus dem Endstand).</p>
    </Card>
    <Card title="Fehlerverteilung">
      {ERR_CATS.map(c => <div key={c} className="bar"><span>{c}</span><i style={{ width: `${total ? (100 * ed[c]) / total : 0}%` }} /><b>{ed[c]}</b></div>)}
    </Card>
    <Card title="Aufschlagmuster (Punktgewinn)">
      {Object.entries(sv).map(([p, b]) => <p key={p}>{p}: {b.w}/{b.n} = {pct(b)} %</p>)}
    </Card>
    <Card title="TTR-Verlauf"><LineChart points={d.ttr.map(t => ({ x: t.date, y: t.value }))} goal={PLAYER.goalTtr} /></Card>
    <Card title="Empfehlungen">{recommendations(d).map(r => <div key={r.title} className="rec"><b>{r.title}</b><p>{r.text}</p></div>)}</Card>
  </>;
}
