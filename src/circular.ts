export function wrapIndex(index: number, count: number): number {
  if (!Number.isInteger(count) || count < 1) throw new RangeError('Invalid palette length');
  return ((index % count) + count) % count;
}
export const visibleIndices = (current: number, count: number) =>
  Array.from({length: 7}, (_, slot) => wrapIndex(current + slot - 3, count));
