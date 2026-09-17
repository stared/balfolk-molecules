import type { Dance, Dancer, HandReach } from '../model.ts';
import { blend } from '../engine/rhythm.ts';

// Mme Raymond step in the contemporary double-front arrangement. Musical
// counts are zero-based here. Body travel and the slight hop compression are
// schematic; the support changes are separate from the continuous travel.
function frontAt(beat: number) {
  const cycle = Math.floor(beat / 32);
  const local = beat - cycle * 32;
  const motif = local % 8;
  const back = motif >= 4;
  const turning = local >= 16 && back;
  const phase = motif - (back ? 4 : 0);
  // Two pivots bracket the travelling step. Most return travel happens while
  // facing away, rather than sliding backwards through one continuous spin.
  // These timing windows are an illustrative interpretation, not measured data.
  const depth = 48 * (turning ? 1 - blend((phase - 1) / 2)
    : back ? 1 - blend(phase / 4) : blend(phase / 3));
  const contacts = [0.12, 0.65, 1.1, 2, 4, 6];
  const supports = [-1, 1, -1, 1, -1, 1];
  let weight = 1;
  for (const [i, onset] of contacts.entries()) {
    const target = supports[i]!;
    weight += (target - weight) * blend((motif - onset) / 0.18);
  }
  const completedTurns = local >= 24 ? 1 : 0;
  const angle = -360 * (cycle * 2 + completedTurns + (turning ? (blend(phase) + blend(phase - 3)) / 2 : 0));
  // Let go before turning; reconnect only after facing the opposite front.
  const reach = local < 16 ? 1 : motif < 4 ? 1 - blend((motif - 3.6) / 0.4)
    : blend((phase - 3.85) / 0.15);
  const hop = back ? Math.sin(Math.PI * (phase % 2) / 2) ** 4 : 0;
  return { depth, angle, weight, reach, sink: 0.12 * hop };
}

export function noirmoutierFrame(time: number, cycle = 0) {
  const beat = time * 4 + cycle * 32;
  const dancers: Dancer[] = [];
  const hands: HandReach[] = [];
  for (let front = 0; front < 2; front++) {
    const pose = frontAt(beat + front * 4);
    const direction = front === 0 ? 1 : -1;
    for (let i = 0; i < 5; i++) {
      const slot = front * 5 + i;
      dancers.push({ id: String.fromCharCode(65 + slot), slot, front: front as 0 | 1,
        x: (i - 2) * 58, y: direction * (88 - pose.depth),
        angle: front * 180 + pose.angle, weight: pose.weight, sink: pose.sink });
      if (i < 4) hands.push({ dancers: [slot, slot + 1], reach: pose.reach });
    }
  }
  return { dancers, hands, weight: dancers[0]!.weight!, section: Math.floor((beat % 32) / 8) };
}

export const noirmoutierDance: Dance = {
  id: 'branle-de-noirmoutier', title: 'Branle de Noirmoutier', category: 'set',
  aliases: ['Branle de l’Épine'],
  origin: 'Vendée, France',
  materials: [
    { name: 'Ciac Boum recording', url: 'https://soundcloud.com/pierre-bordes-910807711/suite-a-manoue-bransles-de' },
  ],
  description: 'Two facing lines advance and retreat in turn, then release hands for individual left turns.',
  duration: 8, millisecondsPerPhrase: 2500, tempoNote: 'Illustrative practice tempo.',
  sections: [
    { name: 'Straight', start: 0, duration: 2, detail: 'Four counts forward, four back.' },
    { name: 'Straight', start: 2, duration: 2, detail: 'Four counts forward, four back.' },
    { name: 'Turning', start: 4, duration: 2, detail: 'Forward, pivot, travel, face back.' },
    { name: 'Turning', start: 6, duration: 2, detail: 'Forward, pivot, travel, face back.' },
  ],
  phrases: ['Advance', 'Retreat', 'Advance', 'Retreat', 'Advance', 'Left turn', 'Advance', 'Left turn'],
  structure: {
    phrase: { kind: 'sequence', name: 'Cycle', parts: [
      { kind: 'repeat', times: 2, phrase: { kind: 'sequence', name: 'Straight', parts: [
        { kind: 'action', name: 'Forward', beats: 4 }, { kind: 'action', name: 'Back', beats: 4 },
      ] } },
      { kind: 'repeat', times: 2, phrase: { kind: 'sequence', name: 'Turning', parts: [
        { kind: 'action', name: 'Forward', beats: 4 }, { kind: 'action', name: 'Turn', beats: 4 },
      ] } },
    ] },
    note: 'Lower line shown; upper line is 4 beats ahead.',
  },
  guides: '',
  note: 'Branle de Noirmoutier · Mme Raymond variant',
  sources: '<a href="https://lannig.e-monsite.com/pages/pays-nantais/retz/branle-de-noirmoutiers.html" target="_blank" rel="noreferrer">Steps (Lannig)</a>',
  frame: noirmoutierFrame,
};
