import type { ErrCat } from './db';

export type Stufe = 'einfuehren' | 'festigen' | 'variation' | 'test';
export const STUFEN: Record<Stufe, { label: string; text: string }> = {
  einfuehren: { label: 'Einführen', text: 'Technik langsam und sauber, hohe Wiederholungszahl, Tempo bewusst niedrig.' },
  festigen: { label: 'Festigen', text: 'Serien zählen, Platzierung vor Tempo, Konstanz aufbauen.' },
  variation: { label: 'Variation & Druck', text: 'Unregelmäßige Zuspiele, Beinarbeit, Tempo und Spielformen.' },
  test: { label: 'Entlastung & Test', text: 'Weniger Umfang, frisch in den Test gehen und das Ergebnis eintragen.' }
};

export type Block = {
  key: string; title: string; year: 1 | 2 | 3; weeks: number;
  area: 'RH-Topspin' | 'Rückschlag/Aufschlag' | 'Beinarbeit/Athletik' | 'Spiel & Taktik' | 'Wettkampf' | 'Aufbau';
  goal: string; test: { label: string; target: string };
  /** Passende Fehlerkategorien der Statistik: stimmt der häufigste Fehler damit überein, passt der Block. */
  errors: ErrCat[];
  /** Hauptthema im Vereinstraining A (Mittwoch, 45 min), nach Stufe */
  drills: Record<'einfuehren' | 'festigen' | 'variation', string[]>;
  /** Aufgaben für das spielnahe Vereinstraining B (Freitag) */
  spielnah: string[];
  /** Heimeinheit ohne Partner (Donnerstag) */
  home: string[];
  flex?: boolean;
};

const tpl = (b: Omit<Block, 'errors'> & { errors?: ErrCat[] }): Block => ({ errors: [], ...b });

/** Turnier-, Sommer-, Vorbereitungs- und Lückenblöcke gibt es in jedem Jahr. */
const turnier = (year: 1 | 2 | 3, goal: string): Block => tpl({
  key: `y${year}-turnier`, year, weeks: 5, area: 'Wettkampf', title: 'Turnierphase: Anwenden', goal,
  test: { label: 'Turnierbilanz und Q-TTR', target: 'Bilanz gegen Gegner ±75 TTR mindestens 50 %' },
  drills: { einfuehren: ['Keine neuen Inhalte: das Block-Thema der letzten Wochen als Warm-up (15 min)'], festigen: ['Matchpläne aus den Gegnerprofilen durchsprechen und je Gegner eine Taktik üben'], variation: ['Spielform „Start bei 8:8“: Entscheidungssatz-Situationen und Aufschlagroutine'] },
  spielnah: ['Matchspiel mit Aufgabe: ein Taktikpunkt pro Satz, danach kurz auswerten'], home: ['Aufschlag-Serien A/B/C, je 20× mit Zielzonen', 'Mobilität und Regeneration, auf das Knie achten']
});
const sommer = (year: 1 | 2 | 3, focus: string): Block => tpl({
  key: `y${year}-sommer`, year, weeks: 8, area: 'Beinarbeit/Athletik', title: 'Sommer: Technik-Umbau & Athletik', goal: `Ruhige Zeit für ${focus}, dazu Kraft und Knie aufbauen.`,
  test: { label: 'Kraft und Knie', target: 'VISA-P gestiegen, Decline-Squat-Schmerz ≤ 3/10, Gewicht auf Phasenkurs' },
  errors: ['Stellung/Laufen'],
  drills: { einfuehren: [`Mehrball mit Partner oder Korb: ${focus}, 5×10 langsame Bälle`], festigen: [`${focus}: Serien zählen, 3×15 in Folge`], variation: [`${focus} mit Beinarbeit und unregelmäßigen Zuspielen`] },
  spielnah: ['Freies Spiel ohne Ergebnisdruck, neue Technik bewusst einsetzen'], home: ['Heim-Krafteinheit mit Bändern, Knie-Stufe beachten', 'Schattentraining 3×20 Bewegungen mit Spiegel oder Video'], flex: true
});
const vorbereitung = (year: 1 | 2 | 3, goal: string): Block => tpl({
  key: `y${year}-vorbereitung`, year, weeks: 6, area: 'Aufbau', title: 'Saisonvorbereitung', goal,
  test: { label: 'Vorbereitungsturnier / Probespiele', target: 'Neue Technik im Spiel abrufbar: mindestens 5 gelungene Eröffnungen pro Spiel' },
  drills: { einfuehren: ['Neues Thema aus dem Sommer in Spielformen übertragen: Partner spielt vor, du eröffnest'], festigen: ['Spielform: Eröffnung gegen Schupf/Block, Punktspiel bis 11'], variation: ['Matchtraining mit Gegnertypen aus der Liga (Material, Abwehr, Block)'] },
  spielnah: ['Matchspiel gegen verschiedene Spielertypen, Aufgabe: neue Technik in jedem Satz mindestens fünfmal einsetzen'], home: ['Aufschlag-Serien und Rückschlag-Ideen vor dem Spiegel', 'Beinarbeit 3×60 s, 30 s Pause']
});
const lueck = (year: 1 | 2 | 3): Block => tpl({
  key: `y${year}-lueck`, year, weeks: 5, area: 'Spiel & Taktik', title: 'Retest & Lückenblock', flex: true,
  goal: 'Die Tests der letzten Blöcke wiederholen und das schwächste Thema gezielt nacharbeiten. Das Thema wählst du anhand der Statistik.',
  test: { label: 'Wiederholungstest des schwächsten Blocks', target: 'Zielwert des gewählten Blocks erreichen' },
  drills: { einfuehren: ['Retest: die Blocktests der letzten Monate durchgehen und notieren, welche wackeln'], festigen: ['Schwächstes Thema (laut Statistik und Retest) als Hauptthema, Übungen aus dem passenden Block'], variation: ['Dasselbe Thema unregelmäßig und in Spielformen'] },
  spielnah: ['Matchspiel mit Aufgabe aus dem gewählten Lückenthema'], home: ['Schattentraining zum Lückenthema, 3×20 Bewegungen']
});

export const BLOCKS: Block[] = [
  /* ---------- Jahr 1: RH-Topspin im Ballwechsel (Ziel TTR ~1612) ---------- */
  tpl({ key: 'y1-rh-unterschnitt', year: 1, weeks: 4, area: 'RH-Topspin', title: 'RH-Topspin gegen Unterschnitt festigen', errors: ['RH'],
    goal: 'Dein RH-Topspin gegen Unterschnitt wird reproduzierbar: sauberer Treffpunkt, Platzierung, Tempowechsel. Das ist die Basis für alles Weitere.',
    test: { label: 'RH-Topspin gegen Schupf diagonal', target: '20 in Folge, danach 10 von 12 in die RH-Hälfte' },
    drills: {
      einfuehren: ['Mehrball oder Korb: 5×10 langsame Unterschnittbälle auf die RH, Fokus Ellbogen vor dem Körper und Treffpunkt leicht aufsteigend', 'Schupf-Topspin diagonal, 5×10 Wiederholungen mit bewusst niedrigem Tempo'],
      festigen: ['Schupf-Topspin diagonal: 3×15 in Folge, Serien aufschreiben', 'RH-Topspin abwechselnd auf RH-Ecke und Mitte: Platzierung vor Tempo'],
      variation: ['Schupf mit wechselnder Länge (kurz/lang): erst Fuß bewegen, dann schlagen', 'Unregelmäßige Zuspiele auf RH, Mitte und VH: RH-Topspin nur auf die RH-Seite, den Rest mit VH']
    },
    spielnah: ['Partner schupft, du eröffnest mit RH-Topspin; Punktspiel bis 11 ab 6:6', 'Rückschlag-Eröffnung: Partner serviert lange Unterschnitt auf die RH, du eröffnest nur mit RH-Topspin'],
    home: ['Schattentraining RH-Topspin mit Spiegel oder Handyvideo, 3×20 Bewegungen, Fokus Treffpunkt und Unterarm', 'Widerstandsband am Handgelenk: Unterarmrotation 3×15'] }),
  tpl({ key: 'y1-rh-block-passiv', year: 1, weeks: 4, area: 'RH-Topspin', title: 'RH-Topspin gegen passiven Block', errors: ['RH'],
    goal: 'Der erste Schritt zum RH-Topspin im Ballwechsel: Topspin auf Oberschnitt-Blockbälle, ruhig und kontrolliert.',
    test: { label: 'RH-Topspin gegen passiven Block diagonal', target: '15 in Folge, 10 von 12 in die RH-Ecke' },
    drills: {
      einfuehren: ['Mehrball: Zuspiel Oberschnitt langsam auf die RH, 5×10; Schläger etwas geschlossener, Kontakt vor dem Körper', 'Topspin-Block diagonal, Partner blockt passiv, 4×10'],
      festigen: ['Topspin-Block-Topspin diagonal: 3×15 in Folge', 'Erste Wiederholung weich, zweite etwas schneller: Tempo kontrolliert steigern'],
      variation: ['Partner blockt mal RH, mal Mitte: du spielst RH-Topspin auf die Mitte', 'Mit Schritt: Zuspiel in die Mitte, du läufst und spielst RH-Topspin']
    },
    spielnah: ['Partner schupft, du eröffnest, Partner blockt, du spielst den zweiten Topspin; Punkt ausspielen', 'Matchspiel: jede Eröffnung gegen Unterschnitt mit RH-Topspin'],
    home: ['Schattentraining im Rhythmus Topspin-Block-Topspin, 3×30 s', 'Beinarbeit Mitte↔RH, 4×30 s Side-Shuffle (Knie beachten)'] }),
  tpl({ key: 'y1-winter-beinarbeit', year: 1, weeks: 5, area: 'Beinarbeit/Athletik', title: 'Winter: Beinarbeit & Athletik', errors: ['Stellung/Laufen'], flex: true,
    goal: 'Zur Winterpause Stellung und Beinarbeit verbessern, damit der RH-Topspin aus guter Position kommt. Die RH-Technik bleibt im Erhalt.',
    test: { label: 'Beinarbeit-Serie mit RH-Topspin', target: 'Topspin-Block-Topspin mit Schritt, 15 in Folge; Side-Shuffle 3×30 s sauber' },
    drills: {
      einfuehren: ['Mehrball: Zuspiel wechselnd RH/Mitte/VH, nur Beinarbeit und Stand, 3×2 min', 'Kurze Aufwärm-Serie RH-Topspin vor der Beinarbeit (10 min)'],
      festigen: ['Beinarbeit-Serie: Zuspiel Mitte↔RH, RH-Topspin mit Schritt, 3×1 min', 'Kontrollierte Ausfallschritte vor dem Schlag, Gewicht auf dem Standbein'],
      variation: ['Unregelmäßiges Wechselspiel RH/Mitte/VH, 3×2 min', 'Zwei Schläge pro Position, dann Positionswechsel (zählen)']
    },
    spielnah: ['Spielform Positionsspiel: Partner spielt unregelmäßig, du konterst und eröffnest, Fokus Fußarbeit', 'Matchspiel mit Aufgabe: nach jedem Schlag zurück in die Grundstellung'],
    home: ['Schatten-Beinarbeit 6×60 s, 30 s Pause', 'Heim-Kraft mit Bändern, Knie-Stufe beachten'] }),
  tpl({ key: 'y1-rh-block-aktiv', year: 1, weeks: 5, area: 'RH-Topspin', title: 'RH-Topspin gegen aktiven Block & Konter', errors: ['RH'],
    goal: 'Der Gegner blockt aktiv oder kontert: dein RH-Topspin muss Platzierung und Tempo halten und im Ballwechsel funktionieren.',
    test: { label: 'RH-Topspin im Ballwechsel gegen aktiven Block', target: '15 in Folge diagonal, 10 von 12 platziert (RH-Ecke oder Mitte)' },
    drills: {
      einfuehren: ['Partner blockt mit mittlerem Tempo diagonal, du spielst RH-Topspin, 4×10', 'Treffpunkt vor dem Körper halten, nicht zu weit nach hinten rutschen'],
      festigen: ['Topspin-Block-Topspin diagonal: 3×15 mit mittlerem Tempo, Platzierung abwechselnd RH-Ecke und Mitte', 'Zweiter und dritter Topspin im Ballwechsel (Rhythmus 1-2-3)'],
      variation: ['Partner variiert Tempo und Platzierung des Blocks, du bleibst bei RH-Topspin', 'Dein Wechsel: nach zwei RH-Topspins ein VH-Topspin in die VH-Ecke']
    },
    spielnah: ['Spielform: Partner eröffnet mit Unterschnitt, du eröffnest RH-Topspin, Ballwechsel bis zum Punkt', 'Matchspiel: Eröffnung nur mit RH-Topspin gegen Gegner, die blocken'],
    home: ['Schattentraining mit Rhythmuswechsel (langsam – schnell), 3×30 s', 'Gummiband-Zugübung: Schulterblatt-Stabilität, 3×12'] }),
  tpl({ key: 'y1-rh-eroeffnung', year: 1, weeks: 5, area: 'Rückschlag/Aufschlag', title: '3. Ball: Aufschlag, langer Rückschlag, RH-Topspin', errors: ['Aufschlag', 'Rückschlag'],
    goal: 'RH-Topspin als Eröffnung im Spiel: Aufschlagmuster A–C mit 3. Ball und RH-Eröffnung nach langem Rückschlag.',
    test: { label: 'Aufschlag + 3. Ball Serie', target: 'Von 20 Aufschlägen mit 3. Ball mindestens 12 Punkte; Eröffnungen mit RH-Topspin ≥ 8/10 in der Zielzone' },
    drills: {
      einfuehren: ['Aufschlag A mit 3. Ball: kurzer Seit-Unterschnitt, Partner schupft lang, du eröffnest RH oder VH, 5×10', 'Partner serviert langen Unterschnitt auf die RH, du eröffnest, 5×10'],
      festigen: ['Aufschlag B (Leerball) und C (langer Seitschnitt auf RH-Ellbogen) mit 3. Ball, je 3×10', 'Rückschlag lang auf die RH des Partners, danach RH-Topspin auf den Block'],
      variation: ['Aufschlag und Rückschlag unregelmäßig im Wechsel, Partner entscheidet kurz/lang', 'Punktspiel: zwei Aufschläge pro Spieler, ab 8:8 feste Routine']
    },
    spielnah: ['Aufschlag-Spielform: nur Punkte nach eigenem Aufschlag zählen, 3. Ball mit RH oder VH', 'Matchspiel mit Aufgabe: Aufschlagmuster nach Plan, dokumentieren und später im Spielformular erfassen'],
    home: ['Aufschlag-Serien A/B/C, je 20× mit Zielzonen (Handtuch als Ziel)', 'Videoanalyse: ein eigenes Spiel ansehen, 3. Bälle notieren'] }),
  tpl({ key: 'y1-rh-vh-positionsspiel', year: 1, weeks: 5, area: 'RH-Topspin', title: 'Übergang RH ↔ VH (Positionsspiel)', errors: ['RH', 'VH', 'Stellung/Laufen'],
    goal: 'RH-Topspin und VH-Topspin kombinieren: Wechsel aus der RH-Ecke und über die Mitte, mit sauberer Beinarbeit.',
    test: { label: 'RH-VH-Wechsel im Ballwechsel', target: 'Zuspiel RH, dann VH: 8 von 10 Wechseln kontrolliert; Serie 12 in Folge' },
    drills: {
      einfuehren: ['Mehrball: zwei RH-Topspins, dann VH-Topspin in die VH-Ecke, 5×6', 'Langsamer Wechsel mit Fokus auf Fußstellung'],
      festigen: ['Wechselspiel RH/VH: Zuspiel Block regelmäßig, 3×10 Wechsel', 'Mitte bewusst nutzen: RH-Topspin auf Mitte, dann VH-Topspin diagonal'],
      variation: ['Partner blockt unregelmäßig, du entscheidest RH oder VH nach Ball', 'Spielform: Eröffnung RH, Abschluss VH, Punkt ausspielen']
    },
    spielnah: ['Spielform Positionsspiel: Partner spielt auf alle drei Zonen, du eröffnest RH, schließt VH ab', 'Matchspiel mit Aufgabe: mindestens acht RH-VH-Kombinationen pro Satz'],
    home: ['Schatten-Beinarbeit RH↔VH, 6×45 s', 'Heim-Kraft mit Bändern (Rumpfrotation, Pallof-Press)'] }),
  turnier(1, 'In den Turnieren zeigt sich, ob der RH-Topspin im Spiel ankommt. Keine neuen Inhalte, sondern Anwenden und Auswerten.'),
  sommer(1, 'RH-Topspin Variationen (Spin und Tempo), VH-Topspin-Qualität'),
  vorbereitung(1, 'Den RH-Topspin im Spiel gegen verschiedene Spielertypen einsetzen: Saisonstart mit klarem Plan.'),
  lueck(1),

  /* ---------- Jahr 2: Gegentopspin und Rückschlag (Ziel TTR ~1670) ---------- */
  tpl({ key: 'y2-gegentopspin', year: 2, weeks: 4, area: 'RH-Topspin', title: 'Gegentopspin aus der Halbdistanz (RH)', errors: ['RH'],
    goal: 'RH-Topspin gegen den Topspin des Gegners: aus der Halbdistanz mit Rückschwung kontrollieren.',
    test: { label: 'RH-Topspin gegen Topspin', target: '10 in Folge, danach 8 von 10 platziert' },
    drills: { einfuehren: ['Mehrball: Topspinzuspiel langsam auf die RH, du spielst Gegentopspin, 5×8'], festigen: ['Topspin-Topspin diagonal, Partner mit mittlerem Tempo, 3×10'], variation: ['Partner variiert Länge und Tempo, du bleibst mit Gegentopspin im Ballwechsel'] },
    spielnah: ['Spielform: Partner eröffnet mit Topspin, du antwortest mit Gegentopspin'], home: ['Schattentraining Gegentopspin mit Rückschwung, 3×20'] }),
  tpl({ key: 'y2-rueckschlag-flip', year: 2, weeks: 4, area: 'Rückschlag/Aufschlag', title: 'Rückschlag offensiv: RH-Flip & Banane', errors: ['Rückschlag'],
    goal: 'Gegen kurze Aufschläge nicht nur schupfen, sondern mit RH-Flip oder Banane angreifen.',
    test: { label: 'RH-Flip gegen kurzen Unterschnitt', target: '7 von 10 sicher und platziert' },
    drills: { einfuehren: ['Kurze Unterschnittaufschläge von Partner/Korb: RH-Flip langsam, 5×10'], festigen: ['Flip mit Platzierung (RH-Ecke/Mitte), 3×10, dazu Banane auf längere Bälle'], variation: ['Partner variiert Aufschläge (kurz/halblang, Unter-/Seitschnitt), du entscheidest Flip oder Schupf'] },
    spielnah: ['Rückschlagspiel: nur Punkte nach eigenem Rückschlag zählen'], home: ['Schattentraining Flip-Bewegung 3×20 mit Spiegel'] }),
  tpl({ key: 'y2-winter-athletik', year: 2, weeks: 5, area: 'Beinarbeit/Athletik', title: 'Winter: Athletik & Beinarbeit (Stufe 2)', errors: ['Stellung/Laufen'], flex: true,
    goal: 'Schnelligkeit und Stabilität verbessern, abgestimmt auf die Knie-Stufe.',
    test: { label: 'Beinarbeit-Test', target: 'Side-Shuffle 3×45 s, RH-VH-Wechsel mit Schritt 15 in Folge' },
    drills: { einfuehren: ['Beinarbeit Mehrball wechselnd, 3×2 min'], festigen: ['Positionsspiel RH-Mitte-VH, 3×2 min'], variation: ['Unregelmäßiges Spiel mit Laufwegen, 3×2 min'] },
    spielnah: ['Positionsspiel mit Aufgabe: nach jedem Schlag zurück in die Mitte'], home: ['Schatten-Beinarbeit 6×60 s', 'Heim-Kraft mit Bändern'] }),
  tpl({ key: 'y2-aufschlag-3ball', year: 2, weeks: 5, area: 'Rückschlag/Aufschlag', title: '2. Aufschlagsystem & 3. Ball', errors: ['Aufschlag'],
    goal: 'Ein zweites Aufschlagsystem lernen (z. B. Rückhandaufschlag) und mit dem 3. Ball verbinden.',
    test: { label: 'Zweites Aufschlagsystem', target: 'Von 20 Aufschlägen 12 Punkte, 3. Ball in der Zielzone' },
    drills: { einfuehren: ['Neuer Aufschlag: 5×10 ohne Gegner, Zielzonen markieren'], festigen: ['Neuer Aufschlag mit 3. Ball gegen Partner, 3×10'], variation: ['Aufschlagmuster wechseln, Partner schupft unregelmäßig'] },
    spielnah: ['Spielform: pro Satz zwei Aufschlagsysteme, Statistik auswerten'], home: ['Aufschlag-Serien, je 20× mit Zielzonen'] }),
  tpl({ key: 'y2-tempo-spin', year: 2, weeks: 5, area: 'RH-Topspin', title: 'RH-Topspin: Tempo- und Spinwechsel', errors: ['RH'],
    goal: 'Variationen im Ballwechsel: langsame Spinbälle und schnelle Tempobälle gezielt einsetzen.',
    test: { label: 'Tempo-/Spinwechsel im Ballwechsel', target: '8 von 10 Wechseln kontrolliert' },
    drills: { einfuehren: ['Mehrball: abwechselnd Spin- und Tempo-Topspin, 5×8'], festigen: ['Ballwechsel diagonal: jeder dritte Ball mit Tempo'], variation: ['Gegner variiert, du wählst Tempo oder Spin nach Zuspiel'] },
    spielnah: ['Matchspiel: Tempowechsel nach Aufgabe'], home: ['Schattentraining mit Rhythmuswechsel 3×30 s'] }),
  tpl({ key: 'y2-gegner-lesen', year: 2, weeks: 5, area: 'Spiel & Taktik', title: 'Gegner lesen & Matchpläne',
    goal: 'Vor dem Spiel einen Plan haben: Gegnerprofil, Schwächen, eigene Muster. Im Spiel Anpassungen vornehmen.',
    test: { label: 'Matchplan-Umsetzung', target: 'In 3 Spielen den Matchplan dokumentieren und mindestens 2 Punkte daraus umsetzen' },
    drills: { einfuehren: ['Gegnerprofile im Verein ansehen, Hauptmuster notieren'], festigen: ['Spielform: Partner spielt ein bestimmtes Muster, du suchst die Antwort'], variation: ['Matchspiel mit Taktikwechsel nach jedem Satz'] },
    spielnah: ['Matchspiel mit Matchplan, danach auswerten'], home: ['Matchplan für den nächsten Gegner aufschreiben'] }),
  turnier(2, 'Anwenden und auswerten: Gegentopspin, Flip und neues Aufschlagsystem unter Wettkampfbedingungen.'),
  sommer(2, 'Gegentopspin und Flip verfeinern'),
  vorbereitung(2, 'Gegentopspin, Flip und neues Aufschlagsystem im Spiel einsetzen, Saisonstart in der Bezirksliga.'),
  lueck(2),

  /* ---------- Jahr 3: Taktik und Kombinationen (Ziel TTR ~1737) ---------- */
  tpl({ key: 'y3-gegentopspin', year: 3, weeks: 4, area: 'RH-Topspin', title: 'Gegentopspin stabilisieren (Mitteldistanz)', errors: ['RH'],
    goal: 'Der Gegentopspin hält auch gegen Tempo und aus der Mitteldistanz.',
    test: { label: 'Gegentopspin-Serie', target: '15 in Folge gegen Tempo' },
    drills: { einfuehren: ['Zuspiel Topspin mit Tempo, du antwortest sicher, 5×8'], festigen: ['Topspin-Topspin aus der Mitteldistanz, 3×15'], variation: ['Gegner wechselt Platzierung, du bleibst im Ballwechsel'] },
    spielnah: ['Spielform: ab Eröffnung Topspin-Duell bis zum Punkt'], home: ['Schattentraining Mitteldistanz 3×20'] }),
  tpl({ key: 'y3-rueckschlag-variation', year: 3, weeks: 4, area: 'Rückschlag/Aufschlag', title: 'Rückschlag-Variation', errors: ['Rückschlag'],
    goal: 'Viele Rückschläge im Repertoire: kurz, lang, Flip, Schupf, Banane.',
    test: { label: 'Rückschlagquote', target: '8 von 10 Rückschlägen gegen unterschiedliche Aufschläge ohne Fehler' },
    drills: { einfuehren: ['Rückschlag-Varianten gegen einen Aufschlagtyp'], festigen: ['Rückschlag gegen drei Aufschlagtypen im Wechsel'], variation: ['Partner variiert, du wählst die Variante'] },
    spielnah: ['Rückschlagspiel mit Aufgabe'], home: ['Schattentraining der Rückschlagbewegungen 3×20'] }),
  tpl({ key: 'y3-winter-positionsspiel', year: 3, weeks: 5, area: 'Beinarbeit/Athletik', title: 'Winter: Positionsspiel VH-RH', errors: ['Stellung/Laufen'], flex: true,
    goal: 'Komplexere Laufwege und Kombinationen im Positionsspiel.',
    test: { label: 'Positionsspiel-Test', target: 'Wechselspiel 20 in Folge, Side-Shuffle 3×60 s' },
    drills: { einfuehren: ['Positionsspiel in festem Muster'], festigen: ['Positionsspiel mit unregelmäßigem Wechsel'], variation: ['Zufälliges Zuspiel, du entscheidest Technik und Weg'] },
    spielnah: ['Positionsspiel-Spielform'], home: ['Schatten-Beinarbeit 6×60 s', 'Heim-Kraft'] }),
  tpl({ key: 'y3-aufschlag-systeme', year: 3, weeks: 5, area: 'Rückschlag/Aufschlag', title: 'Aufschlagsysteme 3 und 4', errors: ['Aufschlag'],
    goal: 'Mindestens vier Aufschlagsysteme sicher abrufbar, jeweils mit 3. Ball.',
    test: { label: 'Vier Aufschlagsysteme', target: 'Je Aufschlag 12 von 20 Punkte' },
    drills: { einfuehren: ['Aufschlag 3 und 4 üben, 5×10'], festigen: ['Alle Aufschläge mit 3. Ball, 3×10 je Aufschlag'], variation: ['Aufschläge im Wechsel, Partner rät den Spin'] },
    spielnah: ['Spielform mit Aufschlagwechsel'], home: ['Aufschlag-Serien 20× je System'] }),
  tpl({ key: 'y3-plan-b', year: 3, weeks: 5, area: 'Spiel & Taktik', title: 'Plan B & Taktikwechsel',
    goal: 'Im Spiel zwischen zwei Taktiken wechseln können, wenn Plan A nicht greift.',
    test: { label: 'Taktikwechsel', target: 'In 3 Spielen mindestens einen Taktikwechsel dokumentieren, davon zwei erfolgreich' },
    drills: { einfuehren: ['Taktik A und B definieren'], festigen: ['Spielform: nach 5 Punkten Wechsel auf Plan B'], variation: ['Partner reagiert, du reagierst wieder'] },
    spielnah: ['Matchspiel mit Plan B'], home: ['Plan B für Standardgegner aufschreiben'] }),
  tpl({ key: 'y3-kombinationen', year: 3, weeks: 5, area: 'RH-Topspin', title: 'RH-VH-Kombinationen mit Tempo', errors: ['RH', 'VH'],
    goal: 'Schnelle Kombinationen mit hoher Qualität und wenigen Fehlern.',
    test: { label: 'Kombinationsserie', target: '10 Kombinationen in Folge mit Tempo' },
    drills: { einfuehren: ['Kombination RH-RH-VH langsam'], festigen: ['Kombination mit Tempo, 3×10'], variation: ['Gegner variiert, du entscheidest die Kombination'] },
    spielnah: ['Spielform Kombinationen'], home: ['Schattentraining Kombinationen 3×20'] }),
  turnier(3, 'Anwenden und auswerten: Taktik, Plan B und Kombinationen in Wettkämpfen.'),
  sommer(3, 'Feinschliff an Technik und Athletik'),
  vorbereitung(3, 'Mit klarem Matchplan und stabiler Technik in die Saison.'),
  lueck(3)
];

export const blockByKey = (key: string) => BLOCKS.find(b => b.key === key);
