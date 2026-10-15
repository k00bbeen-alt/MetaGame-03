// Coordinates read from Figma Make, in its 600-unit design space.
export const ARCH = Object.freeze({
  x: [0, 83, 150, 204, 252], y: [0, 7, 23, 43, 66],
  scale: [1, .87, .74, .61, .5], rotation: [0, 1.5, 3, 4.5, 6],
});
export const CARD_WIDTH = 144;
export const CARD_HEIGHT = 216;
export function archLayout(slot: number, width: number, height: number) {
  const unit = width / 600;
  // Leave room for the selected outline even with enlarged text above/below.
  const fit = Math.max(.1, Math.min(1, (height - 32) / (240 * unit)));
  const distance = Math.abs(slot);
  // The incoming seventh card uses Make's fourth depth step, inset to keep
  // its outline inside the viewport. It replaces the departing card; no eighth DOM card.
  return {width: CARD_WIDTH * unit * fit, x: Math.sign(slot) * (distance === 4 ? Math.min(ARCH.x[distance], 240) : ARCH.x[distance]) * unit * fit,
    y: ARCH.y[distance] * unit * fit, scale: ARCH.scale[distance],
    rotation: Math.sign(slot) * ARCH.rotation[distance], zIndex: 10 - distance,
    centerY: height / 2 - 12 * unit * fit, radius: 8.7 * unit * fit};
}
