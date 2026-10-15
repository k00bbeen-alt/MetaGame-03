// Toolkit owns straight horizontal layout, focus growth, and motion.
// Domain ratio and visible target count are independent of viewport dimensions.
export const CARD_RATIO = 6 / 4;
export const VISIBLE_TARGET = 7;
export function cardWidth(availableWidth: number, gap: number): number {
  return Math.max(0, (availableWidth - 2 * gap - (VISIBLE_TARGET - 1) * gap) / VISIBLE_TARGET);
}
