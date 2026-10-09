import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { db, type Check } from '../db';
import { band, bilanz, currentTtr, daysAgo, errorDist, pct, serveStats, todayIso, topError, weight7 } from '../stats';
import { fmt, nextStichtag, prevStichtag } from '../ttr';
import { Card, Num, Txt } from '../ui';

export default function Checks() {
  const d = useLiveQuery(async () => ({ matches: await db.matches.toArray(), ttr: await db.ttr.toArray(), knee: await db.knee.orderBy('date').toArray(), weight: await db.weight.toArray(), checks: await db.checks.orderBy('date').reverse().toArray() }), []);
  const [kind, setKind] = useState<Check['kind']>('Monat');
  const [m, setM] = useState<Record<string, string | number | undefined>>({});
  if (!d) return null;
  const t = todayIso();
  const since = kind === 'Monat' ? daysAgo(30) : prevStichtag(daysAgo(1));
  const ms = d.matches.filter(x => x.date >= since);
  const k = d.knee[d.knee.length - 1];
  const sv = serveStats(ms), svAll = { w: sv.A.w + sv.B.w + sv.C.w, n: sv.A.n + sv.B.n + sv.C.n };
  const eq = bilanz(ms, band)['Augenhöhe (±75)'];
  const auto = {
    'TTR': currentTtr(d.ttr), 'Einzel im Zeitraum': ms.length, 'Bilanz': `${ms.filter(x => x.won).length}:${ms.filter(x => !x.won).length}`,
    'Häufigster Fehler': topError(errorDist(ms)) ?? '–', 'Bilanz ±75': eq ? `${pct(eq)} % (n=${eq.n})` : '–',
    'Aufschlagmuster gesamt': `${pct(svAll)} %`, 'Gewicht 7-T-Mittel': weight7(d.weight) ?? '–', 'Decline-Squat': k?.slds ?? '–', 'VISA-P (letzter)': [...d.knee].reverse().find(x => x.visaP !== undefined)?.visaP ?? '–'
  };
  const manual = kind === 'Monat'
    ? ['Liimba: Punktgewinn nach eigenem Aufschlag %', 'Liimba: RH-Fehler gegen Topspin pro Satz', 'RH-Stufe (1–4)', 'Nächstes Hauptthema']
    : ['Q-TTR', 'Liimba: Punktgewinn nach eigenem Aufschlag %', 'Technik-Test RH-Block in Folge', 'Side-Shuffle (s)', '5-10-5 (s)', 'VISA-P', 'Bauchumfang (cm)', 'Nächstes Hauptthema'];
  async function save() {
    await db.checks.add({ date: t, kind, data: { ...auto, ...m } });
    const q = Number(m['Q-TTR']);
    if (kind === 'Quartal' && q) await db.ttr.add({ date: prevStichtag(t), value: q, isQ: true });
    setM({});
  }
  return <>
    <div className="row">{(['Monat', 'Quartal'] as const).map(x => <button key={x} className={kind === x ? 'on' : ''} onClick={() => setKind(x)}>{x}scheck</button>)}</div>
    <Card title={`${kind}scheck – Zeitraum ab ${fmt(since)}`}>
      {kind === 'Quartal' && <p className="muted">Letzter Stichtag {fmt(prevStichtag(t))}, nächster {fmt(nextStichtag(t))}. Ziel: 20–30 Einzel/Quartal, ±75 ≥ 50 %.</p>}
      <table><tbody>{Object.entries(auto).map(([a, b]) => <tr key={a}><td>{a}</td><td><b>{String(b)}</b></td></tr>)}</tbody></table>
      {manual.map(f => f === 'Nächstes Hauptthema'
        ? <Txt key={f} label={f} value={String(m[f] ?? auto['Häufigster Fehler'])} onChange={v => setM({ ...m, [f]: v })} />
        : <Num key={f} label={f} step={0.1} value={m[f] as number | undefined} onChange={v => setM({ ...m, [f]: v })} />)}
      <p className="muted">Monatlich ein Spiel in Liimba auswerten; Gewicht & Decline-Squat vorher eintragen.</p>
      <button className="primary" onClick={save}>Check speichern</button>
    </Card>
    <Card title="Bisherige Checks">{d.checks.map(c => <details key={c.id}><summary>{fmt(c.date)} · {c.kind}</summary>
      <table><tbody>{Object.entries(c.data).map(([a, b]) => <tr key={a}><td>{a}</td><td>{String(b ?? '')}</td></tr>)}</tbody></table></details>)}</Card>
  </>;
}
