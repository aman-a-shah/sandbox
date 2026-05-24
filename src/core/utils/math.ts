export function clamp(value: number, minValue: number, maxValue: number): number {
  return Math.min(Math.max(value, minValue), maxValue);
}

export function lerp(start: number, end: number, ratio: number): number {
  return start + (end - start) * ratio;
}

export function randomBetween(minValue: number, maxValue: number): number {
  return minValue + Math.random() * (maxValue - minValue);
}
