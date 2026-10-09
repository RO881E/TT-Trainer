import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useRef, useState } from 'react';
import { db, type SessionType } from '../db';
import { weekdayIndex } from '../day';
import { WEEK } from '../plan';
import { daysAgo, todayIso } from '../stats';
import { weekView } from '../week';
import { fmt } from '../ttr';
import { Card, Num, Txt } from '../ui';

type Cfg = { name: string; work: number; rest: number; reps: number };
const PRESETS: Cfg[] = [
  { name: 'Wandsitz/Spanish Squat 5×45 s', work: 45, rest: 120, reps: 5 },
  { name: 'Isometrie 5×30 s', work: 30, rest: 120, reps: 5 },
  { name: 'Satzpause 90 s', work: 90, rest: 0, reps: 1 },
  { name: 'Schatten-Beinarbeit 6×60 s', work: 60, rest: 30, reps: 6 },
  { name: 'Tempo 3 s ab / 3 s auf (12 Wdh.)', work: 6, rest: 0, reps: 12 }
];
function beep() {
  try { const ctx = new AudioContext(), o = ctx.createOscillator(); o.connect(ctx.destination); o.frequency.value = 880; o.start(); o.stop(ctx.currentTime + 0.2); } catch { /* kein Audio */ }
  navigator.vibrate?.(200);
}

function Timer() {
  const [cfg, setCfg] = useState(PRESETS[0]);
  const [st, setSt] = useState({ phase: 'idle' as 'idle' | 'work' | 'rest' | 'done', rep: 0, end: 0 });
  const [now, setNow] = useState(Date.now());
  const lock = useRef<WakeLockSentinel | null>(null);
  useEffect(() => {
    if (st.phase !== 'work' && st.phase !== 'rest') return;
    const id = setInterval(() => setNow(Date.now()), 200); return () => clearInterval(id);
  }, [st.phase]);
  const run = (phase: 'work' | 'rest', rep: number) => setSt({ phase, rep, end: Date.now() + (phase === 'work' ? cfg.work : cfg.rest) * 1000 });
  useEffect(() => {
    if ((st.phase === 'work' || st.phase === 'rest') && now >= st.end) {
      beep();
      if (st.phase === 'work') {
        if (st.rep >= cfg.reps) { setSt({ ...st, phase: 'done' }); lock.current?.release(); return; }
        if (cfg.rest > 0) run('rest', st.rep); else run('work', st.rep + 1);
      } else run('work', st.rep + 1);
    }
  }, [now]);
  const start = async () => { beep(); try { lock.current = await navigator.wakeLock?.request('screen'); } catch { /* optional */ } run('work', 1); };
  const left = Math.max(0, Math.ceil((st.end - now) / 1000));
  return <Card title="Timer">
    <select value={cfg.name} onChange={e => setCfg(PRESETS.find(p => p.name === e.target.value)!)}>{PRESETS.map(p => <option key={p.name}>{p.name}</option>)}</select>
    <div className="row"><Num label="Belastung s" value={cfg.work} onChange={v => setCfg({ ...cfg, work: v ?? 0 })} />
      <Num label="Pause s" value={cfg.rest} onChange={v => setCfg({ ...cfg, rest: v ?? 0 })} />
      <Num label="Wdh." value={cfg.reps} onChange={v => setCfg({ ...cfg, reps: v ?? 1 })} /></div>
    <div className={`clock ${st.phase}`}>{st.phase === 'idle' ? 'Bereit' : st.phase === 'done' ? 'Fertig!' : `${st.phase === 'work' ? 'Halten' : 'Pause'} ${left}s`}
      <small>{st.rep ? `Durchgang ${st.rep}/${cfg.reps}` : ''}</small></div>
    {st.phase === 'work' || st.phase === 'rest'
      ? <button onClick={() => { setSt({ phase: 'idle', rep: 0, end: 0 }); lock.current?.release(); }}>Stopp</button>
      : <button className="primary" onClick={start}>Start</button>}
  </Card>;
}

const TYPES: SessionType[] = ['Verein A', 'Verein B', 'Heim-Kraft', 'Ausdauer', 'Heim 40', 'Turnier'];
export default function Training() {
  const list = useLiveQuery(() => db.sessions.orderBy('date').reverse().limit(15).toArray(), []) ?? [];
  const month = useLiveQuery(() => db.sessions.where('date').aboveOrEqual(daysAgo(28)).toArray(), []) ?? [];
  const fixtures = useLiveQuery(() => db.fixtures.toArray(), []) ?? [];
  const planned = WEEK[weekdayIndex(todayIso())];
  const [f, setF] = useState({ date: todayIso(), type: (planned.type ?? 'Verein A') as SessionType, minutes: planned.minutes || 60, rpe: 6, theme: '', notes: '' });
  const week = weekView(todayIso(), month, fixtures);
  return <>
    <Card title="Diese Woche" aside={<a href="#/woche">Details</a>}>
      <div className="week">{week.days.map(d => <div key={d.date} className={`${d.today ? 'today' : ''} ${d.past && d.soll && d.ist >= d.soll * 0.75 ? 'ok' : d.past && d.soll ? 'miss' : ''}`} title={d.title}>
        <small>{d.day}</small><b>{d.ist || '–'}</b><span>{d.soll ? `Soll ${d.soll}` : d.fixtures.length ? 'Spiel' : 'frei'}</span>{d.fixtures.length > 0 && d.soll > 0 && <i>Spiel</i>}</div>)}</div>
      <small>{week.ist} von {week.soll} min</small>
      <div className="progress"><i style={{ width: `${Math.min(100, week.soll ? (100 * week.ist) / week.soll : 0)}%` }} /></div>
    </Card>
    <Timer />
    <Card title="Einheit protokollieren">
      <div className="row"><Txt label="Datum" type="date" value={f.date} onChange={v => setF({ ...f, date: v })} />
        <label>Art<select value={f.type} onChange={e => setF({ ...f, type: e.target.value as SessionType })}>{TYPES.map(t => <option key={t}>{t}</option>)}</select></label></div>
      <div className="row"><Num label="Minuten" value={f.minutes} onChange={v => setF({ ...f, minutes: v ?? 0 })} />
        <Num label="Anstrengung (RPE 1–10)" value={f.rpe} onChange={v => setF({ ...f, rpe: v ?? 0 })} /></div>
      <Txt label="Hauptthema / Übungen" value={f.theme} onChange={v => setF({ ...f, theme: v })} />
      <Txt label="Notizen (z. B. RH-Serie: 12 in Folge)" area value={f.notes} onChange={v => setF({ ...f, notes: v })} />
      <button className="primary" onClick={() => db.sessions.add(f)}>Speichern</button>
    </Card>
    <Card title="Letzte 4 Wochen">
      <p>{TYPES.map(t => `${t}: ${month.filter(s => s.type === t).length}`).join(' · ')}</p>
      <ul className="list">{list.map(s => <li key={s.id}>{fmt(s.date)} · {s.type} · {s.minutes} min {s.theme && `· ${s.theme}`}
        <button className="small" onClick={() => db.sessions.delete(s.id!)}>löschen</button></li>)}</ul>
    </Card>
  </>;
}
