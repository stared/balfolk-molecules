// Two-time bourrée: three weight transfers, 1 & 2, then sustain the third.
// The distance shares and easing below are illustrative; the contact rhythm is sourced.
const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
export const blend = smooth;
export function stepTravel(phase) {
  // The body flows through the contacts; weight support carries their rhythm.
  return smooth(phase);
}
export function rhythmAt(t) {
  const position = Math.min(4 - Number.EPSILON * 4, Math.max(0, t * 4));
  const step = Math.floor(position);
  const phase = position - step;
  const contact = phase < 0.25 ? 0 : phase < 0.5 ? 1 : 2;
  const leftFirst = step % 2 === 0;
  const left = (contact % 2 === 0) === leftFirst;
  const onset = [0, 0.25, 0.5][contact];
  const target = left ? -1 : 1;
  const weight = -target + 2 * target * smooth((phase - onset) / 0.12);
  return { step, phase, contact, left, weight, held: phase >= 0.75, travel: stepTravel(phase) };
}
// Four bourrée steps, each with its own travel distance. Short steps still carry rhythm.
export function phraseTravel(t, stops) {
  if (t >= 1) return stops[4];
  const { step, phase: u } = rhythmAt(t);
  const slope = index => {
    if (index === 0 || index === 4) return 0;
    const a = stops[index] - stops[index - 1];
    const b = stops[index + 1] - stops[index];
    return a * b <= 0 ? 0 : 2 * a * b / (a + b);
  };
  // Monotone cubic interpolation keeps velocity continuous between the large
  // and small steps, without overshooting or freezing on every foot contact.
  return (2 * u ** 3 - 3 * u ** 2 + 1) * stops[step]
    + (u ** 3 - 2 * u ** 2 + u) * slope(step)
    + (-2 * u ** 3 + 3 * u ** 2) * stops[step + 1]
    + (u ** 3 - u ** 2) * slope(step + 1);
}
