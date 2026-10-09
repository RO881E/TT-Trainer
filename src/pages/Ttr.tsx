import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { db } from '../db';
import { MILESTONES, PLAYER } from '../plan';
import { currentTtr, milestoneStatus, todayIso } from '../stats';
import { fmt, kFactor, stichtage, ttrEvent, winProb } from '../ttr';
import { Card, LineChart, Num, Txt } from '../ui';

export default function Ttr() {
  const logs = useLiveQuery(() => db.ttr.orderBy('date').toArray(), []) ?? [];
  const cur = currentTtr(logs);
  const [e, setE] = useState({ date: todayIso(), value: undefined as number | undefined, isQ: false });
  const [me, setMe] = useState<number>();
  const [k, setK] = useState({ lt30: false, pause: false, u21: false, u16: false });
  const [games, setGames] = useState([{ opp: 1550, won: true }]);
  const base = me ?? cur, K = kFactor(k), res = ttrEvent(base, games, K);
  return <>
    <Card title={`Aktuell ${cur} · Ziel ${PLAYER.goalTtr}`}>
      <LineChart points={logs.map(l => ({ x: l.date, y: l.value }))} goal={PLAYER.goalTtr} />
      <div className="row"><Txt label="Datum" type="date" value={e.date} onChange={v => setE({ ...e, date: v, isQ: stichtage(+v.slice(0, 4)).includes(v) })} />
        <Num label="TTR" value={e.value} onChange={v => setE({ ...e, value: v })} /></div>
      <label className="check"><input type="checkbox" checked={e.isQ} onChange={x => setE({ ...e, isQ: x.target.checked })} /> Q-TTR (Stichtag)</label>
      <button className="primary" onClick={() => e.value && db.ttr.add({ date: e.date, value: e.value, isQ: e.isQ })}>Speichern</button>
    </Card>
    <Card title="Meilensteine (stabil = 2 Q-TTR-Stichtage in Folge)">
      <table><tbody>{MILESTONES.map(m => { const s = milestoneStatus(cur, logs, m.ttr); return <tr key={m.ttr}>
        <td><b>{m.ttr}</b></td><td>{[m.label, m.pct].filter(Boolean).join(' · ')}</td><td className={s === 'offen' ? 'muted' : 'good'}>{s}{s === 'offen' && ` (−${m.ttr - cur})`}</td></tr>; })}</tbody></table>
    </Card>
    <Card title="TTR-Rechner (eine Veranstaltung)">
      <Num label="Mein TTR vor der Veranstaltung" value={base} onChange={setMe} />
      {(['lt30', 'pause', 'u21', 'u16'] as const).map(x => <label key={x} className="check"><input type="checkbox" checked={k[x]} onChange={ev => setK({ ...k, [x]: ev.target.checked })} />
        {{ lt30: '< 30 Einzel gesamt', pause: '> 365 Tage ohne Veranstaltung (15 Einzel lang)', u21: 'unter 21', u16: 'unter 16' }[x]} (+4)</label>)}
      {games.map((g, i) => <div key={i} className="row">
        <Num label={`Gegner ${i + 1}`} value={g.opp} onChange={v => setGames(games.map((x, j) => j === i ? { ...x, opp: v ?? 0 } : x))} />
        <label className="check"><input type="checkbox" checked={g.won} onChange={ev => setGames(games.map((x, j) => j === i ? { ...x, won: ev.target.checked } : x))} /> gewonnen</label>
        <span className="muted">P = {Math.round(winProb(base, g.opp) * 100)} %</span></div>)}
      <button onClick={() => setGames([...games, { opp: base, won: false }])}>+ Gegner</button>
      <button onClick={() => setGames(games.slice(0, -1))}>− Gegner</button>
      <p className="result">K = {K} · Siege {res.wins} − erwartet {res.expected.toFixed(2)} → <b>{res.delta >= 0 ? '+' : ''}{res.delta}</b> → neuer TTR <b>{res.neu}</b></p>
      <p className="muted">Formel: TTRneu = TTRalt + Runden[(Siege − ΣP) × K], P = 1/(1+10^((Gegner−ich)/150)). Prüfwert: 1580 gegen 1590 (S) und 1550 (N) → 1579.</p>
    </Card>
    <Card title="Einträge"><ul className="list">{[...logs].reverse().slice(0, 12).map(l => <li key={l.id}>{fmt(l.date)} · {l.value}{l.isQ && ' (Q)'} <button className="small" onClick={() => db.ttr.delete(l.id!)}>löschen</button></li>)}</ul></Card>
  </>;
}
