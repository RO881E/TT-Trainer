import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { db } from '../db';
import { KNEE_MONITOR, KNEE_STAGES } from '../plan';
import { currentPhase, currentTtr, todayIso, weight7, weightSeries } from '../stats';
import { fmt } from '../ttr';
import { Card, LineChart, Num, Txt } from '../ui';

export default function Body() {
  const knee = useLiveQuery(() => db.knee.orderBy('date').toArray(), []) ?? [];
  const weight = useLiveQuery(() => db.weight.orderBy('date').toArray(), []) ?? [];
  const ttr = useLiveQuery(() => db.ttr.toArray(), []) ?? [];
  const lastK = knee[knee.length - 1];
  const [k, setK] = useState({ date: todayIso(), slds: 3, stage: lastK?.stage ?? 1, visaP: undefined as number | undefined, morningWorse: false });
  const [w, setW] = useState({ date: todayIso(), kg: undefined as number | undefined, waist: undefined as number | undefined });
  const stage = KNEE_STAGES[(k.stage || 1) - 1];
  const target = currentPhase(currentTtr(ttr)).weight;
  return <>
    <Card title="Knie (Patellaspitzensyndrom)">
      <p className="muted">{KNEE_MONITOR}</p>
      <p><b>Stufe {stage.n}: {stage.name}</b> – {stage.how}<br />{stage.next}</p>
      <div className="row"><Txt label="Datum" type="date" value={k.date} onChange={v => setK({ ...k, date: v })} />
        <Num label="Decline-Squat-Schmerz 0–10" value={k.slds} onChange={v => setK({ ...k, slds: v ?? 0 })} /></div>
      <div className="row"><Num label="Stufe 1–4" value={k.stage} onChange={v => setK({ ...k, stage: Math.min(4, Math.max(1, v ?? 1)) })} />
        <Num label="VISA-P (optional)" value={k.visaP} onChange={v => setK({ ...k, visaP: v })} /></div>
      <label className="check"><input type="checkbox" checked={k.morningWorse} onChange={e => setK({ ...k, morningWorse: e.target.checked })} /> Am nächsten Morgen schlechter</label>
      <button className="primary" onClick={() => db.knee.add(k)}>Speichern</button>
      <LineChart points={knee.map(x => ({ x: x.date, y: x.slds }))} goal={3} />
      <ul className="list">{knee.slice(-5).reverse().map(x => <li key={x.id}>{fmt(x.date)} · SLDS {x.slds}/10 · Stufe {x.stage}{x.visaP !== undefined && ` · VISA-P ${x.visaP}`}{x.morningWorse && ' · morgens schlechter'}</li>)}</ul>
    </Card>
    <Card title={`Gewicht – 7-Tage-Mittel ${weight7(weight) ?? '–'} kg (Ziel ${target} kg)`}>
      <div className="row"><Txt label="Datum" type="date" value={w.date} onChange={v => setW({ ...w, date: v })} />
        <Num label="kg" step={0.1} value={w.kg} onChange={v => setW({ ...w, kg: v })} />
        <Num label="Bauch cm" step={0.5} value={w.waist} onChange={v => setW({ ...w, waist: v })} /></div>
      <button className="primary" onClick={() => w.kg && db.weight.add({ date: w.date, kg: w.kg, waist: w.waist })}>Speichern</button>
      <LineChart points={weightSeries(weight)} goal={target} />
    </Card>
  </>;
}
