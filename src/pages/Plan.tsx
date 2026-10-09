import { BANDS, BH_STAGES, HOME_STRENGTH, KNEE_STAGES, MESO, MIX_LABELS, NUTRITION, PHASES, SERVES, WEEK } from '../plan';
import { Card } from '../ui';

const RH = [['Sommer Jun–Jul', [40, 40, 10, 10]], ['August', [25, 25, 20, 30]], ['Vorrunde Sep–Dez', [15, 30, 25, 30]], ['Winterpause', [35, 35, 15, 15]], ['Rückrunde Jan–Apr', [15, 30, 25, 30]], ['Mai Turniere', [10, 25, 20, 45]]] as const;
export default function Plan() {
  return <>
    <Card title="Phasen">{PHASES.map(p => <details key={p.n}><summary>{p.name}: {p.steps}</summary><p>{p.focus}</p><ul>{p.checks.map(c => <li key={c}>{c}</li>)}</ul></details>)}</Card>
    <Card title="Jahresrhythmus"><table><thead><tr><th></th>{MIX_LABELS.map(l => <th key={l}>{l}</th>)}</tr></thead>
      <tbody>{RH.map(([n, mix]) => <tr key={n}><td>{n}</td>{mix.map((v, i) => <td key={i}>{v} %</td>)}</tr>)}</tbody></table><p className="muted">{MESO}</p></Card>
    <Card title="Wochenstruktur">{WEEK.map(w => <p key={w.day}><b>{w.day}:</b> {w.title} – {w.items.join(', ')}</p>)}</Card>
    <Card title="Heim-Krafteinheit"><p className="muted">{BANDS}</p><ul>{HOME_STRENGTH.map(x => <li key={x}>{x}</li>)}</ul></Card>
    <Card title="Knie-Stufen">{KNEE_STAGES.map(s => <p key={s.n}><b>{s.n} {s.name}:</b> {s.how}. {s.next}</p>)}</Card>
    <Card title="Rückhand-Stufenplan"><ol>{BH_STAGES.map(x => <li key={x}>{x}</li>)}</ol></Card>
    <Card title="Aufschlagmuster">{SERVES.map(s => <p key={s.id}><b>{s.id}:</b> {s.text}</p>)}</Card>
    <Card title="Ernährung (Keto mit Struktur)"><ul>{NUTRITION.map(x => <li key={x}>{x}</li>)}</ul></Card>
  </>;
}
