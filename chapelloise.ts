import { blend } from './rhythm.ts';
import type { Dancer, HandReach } from './movement.ts';

// Olivier Pécheux, Chapelloise (2012): 32 counts, partner changes toward
// the couple behind. Floor paths are schematic; an arch denotes raised hands.
export const coupleCount = 4;
const tau = Math.PI * 2;
const spacing = tau / coupleCount;
const inner = 108;
const outer = 162;
const mod = (n: number) => ((n % coupleCount) + coupleCount) % coupleCount;
const polar = (radius: number, angle: number) => ({ x: radius * Math.cos(angle), y: radius * Math.sin(angle) });

export function chapelloiseFrame(time: number, cycle = 0) {
  const t = Math.max(0, Math.min(8, time));
  const dancers: Dancer[] = [];
  const hands: HandReach[] = [];
  // Progress anticlockwise for eight counts, then return clockwise for eight.
  const promenade = t < 2 ? -0.8 * blend(t / 2) : t < 4 ? -0.8 * (1 - blend((t - 2) / 2)) : 0;
  const halfTurn = blend((t - 0.75) / 0.25) - blend((t - 2.75) / 0.25);
  const phrase = Math.min(7, Math.floor(t));
  const local = t - phrase;
  const close = (phrase === 4 || phrase === 6) ? 10 * Math.sin(Math.PI * local) ** 2 : 0;
  const exchange = t < 5 ? 0 : t < 6 ? blend(t - 5) : 1;
  const change = blend(t - 7);
  for (let identity = 0; identity < coupleCount * 2; identity++) {
    const traveler = identity % 2 === 1;
    const pair = traveler ? mod(Math.floor(identity / 2) + cycle) : Math.floor(identity / 2);
    let angle = pair * spacing + promenade;
    let radius = traveler ? outer : inner;
    let facing = angle * 180 / Math.PI + (traveler ? -180 : 180) * halfTurn;
    if (t >= 4) {
      radius = traveler ? outer - (outer - inner) * exchange : inner + (outer - inner) * exchange;
      radius += (traveler ? -1 : 1) * (phrase === 6 ? -close : close);
      if (phrase === 5) {
        // The initially outer dancer passes in front; the other gives space.
        angle += (traveler ? -0.22 : 0.12) * Math.sin(Math.PI * exchange);
        facing = angle * 180 / Math.PI + (traveler ? -360 * exchange : 0);
      } else if (t >= 7) {
        radius = traveler ? inner + (outer - inner) * change : outer - (outer - inner) * change;
        if (traveler) angle += spacing * change;
        facing = angle * 180 / Math.PI + (traveler ? 360 * change : 0);
      } else {
        // Briefly look toward one another on the approach, then resume promenade.
        facing = angle * 180 / Math.PI + (traveler ? -1 : 1) * (phrase === 6 ? -1 : 1) * 55 * Math.sin(Math.PI * local) ** 2;
      }
    }
    // Start on the foot outside the couple. Approach/apart uses three small
    // transfers in each two-count half; walking uses one transfer per count.
    const contacts = phrase === 4 || phrase === 6 ? local * 6 : t * 4;
    const weight = Math.cos(Math.PI * contacts) * (traveler ? 1 : -1);
    dancers.push({ ...polar(radius, angle), angle: facing, slot: pair, id: String.fromCharCode(65 + identity), weight });
  }
  for (let traveler = 0; traveler < coupleCount; traveler++) {
    const current = mod(traveler + cycle);
    const next = mod(current + 1);
    const travelId = traveler * 2 + 1;
    const release = t < 7 ? 1 : 1 - blend((t - 7 - 0.3) / 0.2);
    hands.push({ dancers: [current * 2, travelId], reach: release, arch: t >= 7 ? 28 * Math.sin(Math.PI * Math.min(1, (t - 7) / 0.5)) : 0 });
    if (t >= 7) hands.push({ dancers: [next * 2, travelId], reach: blend((t - 7 - 0.65) / 0.35) });
  }
  return { dancers, hands, weight: 0, section: t < 4 ? 0 : 1 };
}
