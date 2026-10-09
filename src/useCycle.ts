import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect } from 'react';
import { db } from './db';
import { CYCLE_KEY, initialCycle, withNewBlocks, type CycleState } from './cycle';
import { todayIso } from './stats';

/** Lädt den Zyklenplan und legt ihn beim ersten Aufruf an (Start: nächster Montag). */
export function useCycle() {
  const q = useLiveQuery(async () => ({ v: (await db.settings.get(CYCLE_KEY))?.value as CycleState | undefined }), []);
  useEffect(() => { if (q && !q.v) void db.settings.put({ key: CYCLE_KEY, value: initialCycle(todayIso()) }); }, [q]);
  const state = q?.v ? withNewBlocks(q.v) : undefined;
  const save = (s: CycleState) => db.settings.put({ key: CYCLE_KEY, value: s });
  return { state, save };
}
