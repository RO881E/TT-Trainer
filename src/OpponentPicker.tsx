import { useState } from 'react';
import type { Opponent } from './db';
import { Icon } from './ui';

type Props = {
  opps: Opponent[]; recent: number[];
  selected?: Opponent; newName: string;
  onSelect: (o: Opponent) => void; onNew: (name: string) => void; onClear: () => void;
};

/** Tippsuche statt langer Dropdown-Liste: zuletzt gespielte Gegner als Chips, Treffer beim Tippen, neuer Gegner mit einem Tipp. */
export default function OpponentPicker({ opps, recent, selected, newName, onSelect, onNew, onClear }: Props) {
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();
  if (selected || newName) {
    return <div className="picked">
      <div><b>{selected?.name ?? newName}</b><small>{selected ? [selected.club, selected.ttr && `TTR ${selected.ttr}`].filter(Boolean).join(' · ') : 'Neuer Gegner'}</small></div>
      <button onClick={() => { onClear(); setQ(''); }} aria-label="Gegner ändern"><Icon name="x" size={18} /></button>
    </div>;
  }
  const hits = term ? opps.filter(o => `${o.name} ${o.club ?? ''}`.toLowerCase().includes(term)).slice(0, 6) : [];
  const exact = opps.some(o => o.name.toLowerCase() === term);
  const chips = recent.map(id => opps.find(o => o.id === id)).filter((o): o is Opponent => !!o).slice(0, 5);
  return <div className="picker">
    <div className="search"><Icon name="search" size={18} /><input placeholder="Gegner suchen oder neu eintippen" value={q} onChange={e => setQ(e.target.value)} /></div>
    {!term && chips.length > 0 && <div className="chips"><small>Zuletzt:</small>{chips.map(o => <button key={o.id} onClick={() => onSelect(o)}>{o.name}</button>)}</div>}
    {(hits.length > 0 || (term && !exact)) && <ul className="hits">
      {hits.map(o => <li key={o.id}><button onClick={() => onSelect(o)}><b>{o.name}</b><small>{[o.club, o.ttr && `TTR ${o.ttr}`].filter(Boolean).join(' · ')}</small></button></li>)}
      {term && !exact && <li><button className="new" onClick={() => onNew(q.trim())}><Icon name="plus" size={16} /> „{q.trim()}“ als neuen Gegner anlegen</button></li>}
    </ul>}
  </div>;
}
