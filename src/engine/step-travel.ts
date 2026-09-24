const tau = 2 * Math.PI;

/** Travel driven by each support: load, move through the step, then coast.
 * Positive velocity retains momentum; integer step positions do not change.
 * Strength and drive phase are illustrative, not measured force or footwork.
 */
export function stepFlow(count: number, period = 1, strength = 0.45): number {
  const phase = count / period;
  return count + strength * period / tau * (Math.sin(tau * (phase - 0.3)) + Math.sin(tau * 0.3));
}

/** A counted passage with step-driven speed and soft starts/reversals.
 * Only the passage endpoints stop; interior foot contacts keep moving.
 */
export function stepTravel(count: number, length: number, period = 1, strength = 0.45): number {
  const bounded = Math.max(0, Math.min(length, count));
  const t = stepFlow(bounded, period, strength);
  const ramp = Math.min(0.35, length / 2);
  const start = (u: number) => u / 2 - ramp * Math.sin(Math.PI * u / ramp) / (2 * Math.PI);
  const distance = t < ramp ? start(t) : t > length - ramp ? length - ramp - start(length - t) : t - ramp / 2;
  return distance / (length - ramp);
}
