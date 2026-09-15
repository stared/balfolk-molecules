import { itemAt } from './indexed.ts';
// Choreography: https://www.folkabourk.fr/apprendre — Bourrée bancale version simple (à 6).
// Step reference: https://dansetrad.fr/fiches/fiches_pdf/Bourree_du_Berry.pdf
import { rhythmAt, phraseTravel, stepTravel, blend } from './rhythm.ts';
import type { Rhythm } from './rhythm.ts';
type Point = [number, number];
export interface Position { x: number; y: number }
export interface Dancer extends Position {
  angle: number;
  slot: number;
  id: string;
  middle: boolean;
}
export interface DanceSection { name: string; start: number; duration: number; detail: string }
export interface DanceFrame {
  section: 0 | 1;
  label: string;
  dancers: Dancer[];
  hands: [number, number][];
  rhythm: Rhythm;
}
export const slots: Point[] = [[-120, -120], [0, -120], [120, -120], [120, 120], [0, 120], [-120, 120]];
export const sections: DanceSection[] = [
  { name: 'Lines + changes', start: 0, duration: 4, detail: 'Approach → right-end dancers change lines → retreat · × 4' },
  { name: 'Four sides', start: 4, duration: 4, detail: 'Edges: approach · meet · pass · turn / Middles: forward · turn · backward' },
];
export const duration = 8;
const mod = (n: number, base = 6) => ((n % base) + base) % base;
const mix = (a: Point, b: Point, t: number): Point => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const scale = ([x, y]: Point, amount: number): Point => [x * amount, y * amount];
const rotate = ([x, y]: Point, angle: number): Point => [x * Math.cos(angle) - y * Math.sin(angle), x * Math.sin(angle) + y * Math.cos(angle)];
const facing = ([x, y]: Point) => Math.atan2(-x, y) * 180 / Math.PI;
const heading = ([x, y]: Point) => Math.atan2(x, -y) * 180 / Math.PI;
const lerpAngle = (a: number, b: number, t: number) => a + (mod(b - a + 180, 360) - 180) * t;
const rowAngle = (slot: number) => itemAt(slots, slot)[1] < 0 ? 180 : 0;
const corners = [0, 2, 3, 5];

export function frame(time: number, cycle = 0): DanceFrame {
  time = Math.max(0, Math.min(duration, time));
  const section = time < 4 ? 0 : 1;
  const step = Math.min(3, Math.floor(time - section * 4));
  const t = time - section * 4 - step;
  const rhythm = rhythmAt(t);
  // Chain exchange occurs on the second bourrée step, at the close of the approach.
  const transfer = t < 0.25 ? 0 : t < 0.5 ? stepTravel((t - 0.25) * 4) : 1;
  const label = section === 0
    ? `${['Approach', 'Change lines', 'Retreat', 'Settle'][rhythm.step]} · ${step + 1} / 4`
    : `${['Approach', 'Meet · small step', 'Pass / back away', 'Turn / settle'][rhythm.step]} · crossing ${step + 1} / 4`;
  const dancers = slots.map((_, id) => {
    if (section === 0) {
      const from = mod(id - cycle * 4 - step);
      const to = mod(from - 1);
      const depth = phraseTravel(t, [120, 55, 50, 112, 120]);
      const a: Point = [itemAt(slots, from)[0], Math.sign(itemAt(slots, from)[1]) * depth];
      const b: Point = [itemAt(slots, to)[0], Math.sign(itemAt(slots, to)[1]) * depth];
      const p = mix(a, b, transfer);
      // The end dancer pivots outside the chain while the other two make room.
      if (from === 0 || from === 3) p[0] += Math.sign(a[0]) * 24 * Math.sin(transfer * Math.PI);
      return { x: p[0], y: p[1], angle: lerpAngle(rowAngle(from), rowAngle(to), transfer), slot: transfer < 1 ? from : to, from };
    }
    const slot = mod(id - (cycle + 1) * 4);
    const home = itemAt(slots, slot);
    let p: Point, angle: number;
    if (slot === 1 || slot === 4) {
      const start = rotate(home, step * Math.PI / 2);
      const end = rotate(home, (step + 1) * Math.PI / 2);
      if (t < 0.25) p = mix(start, scale(start, 0.2), stepTravel(t * 4));
      else if (t < 0.5) p = rotate(scale(start, 0.2), stepTravel((t - 0.25) * 4) * Math.PI / 2);
      else p = scale(end, phraseTravel(t, [0.2, 0.2, 0.2, 0.93, 1]));
      angle = facing(p);
    } else {
      const index = corners.indexOf(slot);
      // Both people on each vertical side first travel toward each other.
      const direction = slot === 0 || slot === 3 ? -1 : 1;
      const start = itemAt(slots, itemAt(corners, mod(index + direction * step, 4)));
      const end = itemAt(slots, itemAt(corners, mod(index + direction * (step + 1), 4)));
      const next = itemAt(slots, itemAt(corners, mod(index + direction * (step + 2), 4)));
      const v: Point = [end[0] - start[0], end[1] - start[1]];
      const length = Math.hypot(...v);
      const distance = phraseTravel(t, [0, 0.46, 0.5, 0.96, 1]);
      p = mix(start, end, distance);
      const passing = 22 * Math.sin(Math.PI * distance);
      p[0] -= v[1] / length * passing;
      p[1] += v[0] / length * passing;
      const nextHeading = step === 3 ? rowAngle(slot) : heading([next[0] - end[0], next[1] - end[1]]);
      // At the encounter, turn toward the other dancer (tord), then unwind
      // clockwise (détord) and finish facing the next person to cross.
      const incoming = heading(v);
      if (t < 0.5) {
        angle = incoming - 90 * blend(distance / 0.46);
      } else {
        const meeting = incoming - 90;
        const unwound = incoming + 180;
        angle = t < 0.75
          ? meeting + 270 * stepTravel((t - 0.5) * 4)
          : lerpAngle(unwound, nextHeading, stepTravel((t - 0.75) * 4));
      }
    }
    return { x: p[0], y: p[1], angle, slot };
  }).map((d, i) => {
    return { ...d, id: itemAt(['A', 'B', 'C', 'F', 'E', 'D'], i), middle: d.slot === 1 || d.slot === 4 };
  });
  let hands: [number, number][] = [];
  if (section === 0) {
    const occupant = (slot: number) => dancers.findIndex(d => d.slot === slot);
    const pairs: [number, number][] = transfer > 0 && transfer < 1 ? [[1, 2], [4, 5]] : [[0, 1], [1, 2], [3, 4], [4, 5]];
    hands = pairs.map(([a, b]) => [occupant(a), occupant(b)]);
  }
  return { section, label, dancers, hands, rhythm };
}
