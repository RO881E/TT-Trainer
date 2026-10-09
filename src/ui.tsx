import type { ReactNode } from 'react';
import type { Bil } from './stats';
import { pct } from './stats';

export const go = (path: string) => { location.hash = path; };
export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return <section className="card">{title && <h2>{title}</h2>}{children}</section>;
}
export function Num({ label, value, onChange, step = 1 }: { label: string; value?: number; onChange: (v?: number) => void; step?: number }) {
  return <label>{label}<input type="number" inputMode="decimal" step={step} value={value ?? ''}
    onChange={e => onChange(e.target.value === '' ? undefined : Number(e.target.value))} /></label>;
}
export function Txt({ label, value, onChange, area, type = 'text' }: { label: string; value?: string; onChange: (v: string) => void; area?: boolean; type?: string }) {
  return <label>{label}{area
    ? <textarea rows={3} value={value ?? ''} onChange={e => onChange(e.target.value)} />
    : <input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)} />}</label>;
}
export function Sel<T extends string>({ label, value, options, onChange }: { label: string; value?: T; options: readonly T[]; onChange: (v: T | undefined) => void }) {
  return <label>{label}<select value={value ?? ''} onChange={e => onChange((e.target.value || undefined) as T | undefined)}>
    <option value="">–</option>{options.map(o => <option key={o} value={o}>{o}</option>)}</select></label>;
}
export function Stepper({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return <div className="stepper"><span>{label}</span>
    <button onClick={() => onChange(Math.max(0, value - 1))}>−</button><b>{value}</b>
    <button onClick={() => onChange(value + 1)}>+</button></div>;
}
export function BilTable({ data }: { data: Record<string, Bil> }) {
  const rows = Object.entries(data);
  if (!rows.length) return <p className="muted">Noch keine Daten.</p>;
  return <table><tbody>{rows.map(([k, b]) =>
    <tr key={k}><td>{k}</td><td>{b.w}:{b.n - b.w}</td><td className={pct(b) >= 50 ? 'good' : 'bad'}>{pct(b)} %</td></tr>)}</tbody></table>;
}
export function LineChart({ points, goal, height = 140 }: { points: { x: string; y: number }[]; goal?: number; height?: number }) {
  if (points.length < 2) return <p className="muted">Zu wenig Daten für ein Diagramm.</p>;
  const ys = points.map(p => p.y).concat(goal !== undefined ? [goal] : []);
  const min = Math.min(...ys), max = Math.max(...ys), w = 320, pad = 10;
  const sx = (i: number) => pad + (i * (w - 2 * pad)) / (points.length - 1);
  const sy = (y: number) => height - pad - (max === min ? 0.5 : (y - min) / (max - min)) * (height - 2 * pad);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${sx(i).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ');
  return <svg viewBox={`0 0 ${w} ${height}`} className="chart">
    {goal !== undefined && <line x1={0} x2={w} y1={sy(goal)} y2={sy(goal)} className="goal" />}
    <path d={d} /><text x={pad} y={12}>{max}</text><text x={pad} y={height - 2}>{min}</text>
    <text x={w - pad} y={height - 2} textAnchor="end">{points[points.length - 1].x}</text></svg>;
}
