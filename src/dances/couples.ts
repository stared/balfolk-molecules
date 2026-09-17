import type { Dance } from '../model.ts';
import type { Dancer, HandReach } from '../model.ts';
import { defaultPairCount, maxPairCount } from './chapelloise.ts';
import { blend } from '../engine/rhythm.ts';
import { itemAt } from '../utils/indexed.ts';

type Kind = 'waltz' | 'scottish' | 'mazurka';
const contacts = {
  waltz: [0, 1, 2, 3, 4, 5],
  scottish: [0, 0.5, 1, 2, 2.5, 3, 4, 5, 6, 7],
  mazurka: [0, 2, 3, 4, 5, 6, 8, 9, 10, 11],
};

// Integral of a positive, periodic velocity: drive early in beat one, then coast.
// The exact velocity curve is an illustrative accent, not measured technique.
function waltzFlow(bars: number): number {
  const phase = bars % 1, tau = Math.PI * 2, peak = 0.22;
  return bars + 0.35 / tau * (Math.sin(tau * (phase-peak)) - Math.sin(-tau*peak));
}

// A continuous side step with a modest change of pace, no planted pauses.
function chasse(phase: number): number {
  const u = Math.max(0, Math.min(1, phase));
  return blend(u) + 0.025*Math.sin(4*Math.PI*u)*Math.sin(Math.PI*u)**2;
}
function mazurkaMotion(bars: number) {
  const half = Math.floor(bars/2), phase = bars-half*2;
  const shift = phase < 1
    ? 0.018 * (blend(phase/0.4)-blend((phase-2/3)/(1/3))) : 0;
  // Sinking is a body cue, not forward travel. Transfer to the other leg on 3.
  const sink = phase < 1
    ? blend(phase/0.35)*(1-blend((phase-2/3)/(1/3))) : 0;
  const walking = blend(phase-1);
  // Close-embrace interpretation: three small steps with a gentle 30° redirection.
  return {travel: half*0.07 + shift + 0.07*walking, turn: (half+walking)*Math.PI/6, sink};
}

/** Even spacing is a teaching layout; turns and travel distances are schematic. */
export function coupleFrame(kind: Kind, time: number, cycle = 0, pairs = defaultPairCount) {
  if (!Number.isInteger(pairs) || pairs < 1 || pairs > maxPairCount) throw new RangeError('Invalid pair count');
  const duration = kind === 'waltz' ? 2 : 4;
  const counts = kind === 'scottish' ? 2 : 3;
  const t = Math.max(0, Math.min(duration, time));
  const beat = t * counts;
  const sequence = contacts[kind];
  // At the endpoint use the next cycle's first contact, including its incoming support.
  const localBeat = beat === duration * counts ? 0 : beat;
  let contact = 0;
  while (contact + 1 < sequence.length && itemAt(sequence, contact + 1) <= localBeat) contact++;
  const target = contact % 2 ? 1 : -1;
  const transferTime = kind === 'mazurka' ? 0.6 : 0.22;
  const weight = -target + 2 * target * blend((localBeat - itemAt(sequence, contact)) / transferTime);
  const absolute = cycle * duration + t;
  // On an SVG floor decreasing polar angle means anticlockwise travel.
  let travel = waltzFlow(absolute) * 0.13;
  let turn = waltzFlow(absolute) * Math.PI;
  let sink = 0;
  if (kind === 'scottish') {
    // Four alternating supports carry one flowing pivot, not four separate turns.
    // At this tempo four main beats equal eight half-beat counts.
    const pivot = blend((t-2)/2);
    travel = cycle * 0.30 + (t < 1 ? 0.10 * chasse(t) : t < 2 ? 0.10 * (1-chasse(t-1)) : 0.30 * pivot);
    turn = cycle * Math.PI * 2 + Math.PI * 2 * pivot;
  } else if (kind === 'mazurka') {
    const motion = mazurkaMotion(absolute);
    travel = motion.travel;
    turn = motion.turn;
    sink = motion.sink;
  }
  // Body circles have radius 14: a 29-unit spacing leaves just a narrow gap.
  const partnerRadius = kind === 'mazurka' ? 14.5 : 19;
  const dancers: Dancer[] = [];
  const hands: HandReach[] = [];
  for (let pair = 0; pair < pairs; pair++) {
    const theta = pair * Math.PI * 2 / pairs - Math.PI / 2 - travel;
    const orientation = theta + turn;
    const center = { x: 158 * Math.cos(theta), y: 158 * Math.sin(theta) };
    for (let role = 0; role < 2; role++) {
      const side = role === 0 ? -1 : 1;
      dancers.push({
        id: String.fromCharCode(65 + pair * 2 + role), slot: pair * 2 + role,
        x: center.x + side * partnerRadius * Math.cos(orientation),
        y: center.y + side * partnerRadius * Math.sin(orientation),
        angle: orientation * 180 / Math.PI + (role === 0 ? 90 : 270),
        role: role === 0 ? 'leader' : 'follower', weight: role === 0 ? weight : -weight, sink,
      });
    }
    hands.push({ dancers: [pair*2, pair*2+1], reach: 1, shoulderHold: 0 });
  }
  return { dancers, hands, weight, section: kind === 'waltz' ? 0 : kind === 'scottish' ? (t < 2 ? 0 : 1) : Math.min(3, Math.floor(t)) };
}

const shared = {
  roles: true, progression: 0, category: 'couple',
  guides: '<circle class="guide" r="158"/>',
} as const;
const schematic = ' Partners stay together. Speed changes make the step accents visible; their strength, spacing and turn amounts are illustrative; the link suggests a closed hold. Foot dots show support, not foot placement or vertical lift.';
export const coupleDances: Dance[] = [
  {
    ...shared, id: 'waltz', title: 'Waltz',
    description: 'Several couples turn clockwise while travelling anticlockwise around the floor.',
    duration: 2, countsPerPhrase: 3, millisecondsPerPhrase: 1800,
    tempoNote: 'Practice tempo.',
    sections: [{ name: 'Turning waltz', start: 0, duration: 2, detail: 'Drive on ONE, glide through two–three; three steps per half-turn.' }],
    phrases: ['Left · right · left — half-turn', 'Right · left · right — half-turn'],
    note: 'ONE–two–three · Push, glide, settle · Same partner.',
    sources: '<a href="https://www.accrofolk.net/danses-folks/valse" target="_blank" rel="noreferrer">Waltz steps: AccroFolk</a> · <a href="https://www.dancesport.org.au/accreditation/candidate_info/adj_principles.pdf" target="_blank" rel="noreferrer">First-step drive: DanceSport Australia</a> (Viennese waltz technique; used here as a movement cue).' + schematic,
    frame: (time, cycle, pairs) => coupleFrame('waltz', time, cycle, pairs),
  },
  {
    ...shared, id: 'scottish', title: 'Schottische',
    description: 'Several couples step sideways and back, then turn together around the floor.',
    duration: 4, countsPerPhrase: 2, millisecondsPerPhrase: 1250,
    phraseContacts: [[0, 0.5, 1], [0, 0.5, 1], [0, 1], [0, 1]],
    sections: [{ name: 'Side + return', start: 0, duration: 2, detail: 'Left–right–left, then right–left–right: 1 & 2, 3 & 4.' }, { name: 'Turn', start: 2, duration: 2, detail: 'Four steps across four main beats (eight half-beat counts). A continuous pivot is shown; this section also admits improvised figures.' }],
    phrases: ['LEFT–close–LEFT · 1 & 2', 'RIGHT–close–RIGHT · 3 & 4', 'Flow through the turn · 5 6', 'Continue the turn · 7 8'],
    note: 'Left, left · right, right · Flow through four steps · Same partner.',
    sources: '<a href="https://www.accrofolk.net/danses-folks/scottish" target="_blank" rel="noreferrer">Scottish steps: AccroFolk</a> · Eight main beats per cycle, equivalent to sixteen half-beat counts. Four steps fill the second half. A smooth pivot is one example; improvised figures can fill the same time.' + schematic,
    frame: (time, cycle, pairs) => coupleFrame('scottish', time, cycle, pairs),
  },
  {
    ...shared, id: 'mazurka', title: 'Mazurka',
    description: 'Several couples soften into a small weight shift, transfer on three, then take three small steps in close embrace.',
    duration: 4, countsPerPhrase: 3, millisecondsPerPhrase: 2000,
    tempoNote: 'Practice tempo.',
    sections: [
      { name: 'Sink + shift', start: 0, duration: 1, detail: 'Small weight shift onto the left; soften through ONE–TWO, transfer to the right on three.' },
      { name: 'Small steps', start: 1, duration: 1, detail: 'Left, right, left, gently changing direction in close embrace.' },
      { name: 'Sink + shift', start: 2, duration: 1, detail: 'Small weight shift onto the right; soften through ONE–TWO, transfer to the left on three.' },
      { name: 'Small steps', start: 3, duration: 1, detail: 'Right, left, right, gently changing direction in close embrace.' },
    ],
    phrases: ['Sink ONE–TWO · transfer on three', 'Left · right · left — travel', 'Sink ONE–TWO · transfer on three', 'Right · left · right — travel'],
    note: 'Sink ONE–TWO, shift on three · Then three small steps in close embrace.',
    sources: '<a href="https://www.youtube.com/watch?v=DB6mAbrUuxw" target="_blank" rel="noreferrer">Suggested video reference</a> · This interpretation follows the requested ONE–TWO sink, transfer on three, then three travelling steps. A slight contraction of the body circle indicates sinking; it is a top-view cue, not body size. Close embrace with small steps and a gentle change of direction; the turn amount is illustrative.' + schematic,
    frame: (time, cycle, pairs) => coupleFrame('mazurka', time, cycle, pairs),
  },
];
