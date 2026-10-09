import type { ReactNode } from 'react';
import type { PlanItem } from './matchplan';
import type { Bil } from './stats';
import { pct } from './stats';

export const go = (path: string) => { location.hash = path; };
const ICONS = {
  home: 'M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  plus: 'M12 5v14M5 12h14',
  users: 'M16 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1',
  chart: 'M3 3v18h18M7 15l4-5 3 3 5-7',
  menu: 'M4 6h16M4 12h16M4 18h16',
  timer: 'M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 9v4l2.5 2M9 2h6',
  heart: 'M12 21s-7-4.6-9.3-9A5.2 5.2 0 0 1 12 6a5.2 5.2 0 0 1 9.3 6c-2.3 4.4-9.3 9-9.3 9z',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  check: 'M5 13l4 4L19 7',
  plan: 'M9 4h6v3H9zM7 5.5H5V21h14V5.5h-2M9 12h6M9 16h4',
  save: 'M12 3v12M7 10l5 5 5-5M5 21h14',
  back: 'M15 5l-7 7 7 7',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  x: 'M6 6l12 12M18 6L6 18',
  warn: 'M12 4l9 16H3zM12 10v4M12 17.5v.1',
  duel: 'M5 19L19 5M9 5H5v4M15 19h4v-4',
  note: 'M5 4h14v16H5zM8 9h8M8 13h8M8 17h5',
  type: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  material: 'M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM8 12h8',
  serve: 'M4 18c4-1 6-5 8-9l3 3c-4 2-8 4-9 8zM18 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  error: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9 9l6 6M15 9l-6 6',
  ttr: 'M4 17l5-5 4 4 7-8M15 8h5v5',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  week: 'M4 5h16v15H4zM4 10h16M9 10v10M15 10v10',
  cycle: 'M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5',
  cloud: 'M7 18a4 4 0 0 1-.6-8A6 6 0 0 1 18 9.5a4.2 4.2 0 0 1-.5 8.5zM12 11v6M9.5 14.5L12 17l2.5-2.5',
  upload: 'M12 16V4M7 9l5-5 5 5M5 20h14'
} as const;
export type IconName = keyof typeof ICONS;
export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICONS[name]} /></svg>;
}
export function Card({ title, aside, children }: { title?: string; aside?: ReactNode; children: ReactNode }) {
  return <section className="card">{title && <h2>{title}{aside && <span className="aside">{aside}</span>}</h2>}{children}</section>;
}
/** Einklappbarer Abschnitt, hält Formulare und Seiten übersichtlich */
export function Fold({ title, hint, open, children }: { title: string; hint?: string; open?: boolean; children: ReactNode }) {
  return <details className="card fold" open={open}><summary><span>{title}</span>{hint && <small>{hint}</small>}</summary><div className="fold-body">{children}</div></details>;
}
export function Tiles({ items }: { items: { label: string; value: ReactNode; tone?: 'good' | 'bad' }[] }) {
  return <div className="tiles">{items.map(t => <div key={t.label} className="tile"><b className={t.tone}>{t.value}</b><span>{t.label}</span></div>)}</div>;
}
export function Segmented<T extends string | number>({ value, options, onChange }: { value: T; options: readonly (readonly [T, string])[]; onChange: (v: T) => void }) {
  return <div className="seg">{options.map(([v, l]) => <button key={String(v)} className={v === value ? 'on' : ''} onClick={() => onChange(v)}>{l}</button>)}</div>;
}
export function PlanList({ items }: { items: PlanItem[] }) {
  return <ul className="plan">{items.map(i => <li key={i.title} className={i.warn ? 'warn-item' : ''}>
    <Icon name={i.icon} size={20} /><div><b>{i.title}</b>{i.text && <p>{i.text}</p>}</div></li>)}</ul>;
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
