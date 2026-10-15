import type {PaletteColor} from './palette';

// Raise HSL lightness by five percentage points per press, keeping hue/saturation.
// Always derive from the original palette, avoiding cumulative RGB rounding drift.
export function lightenHex(hex: string, steps: number): string {
  if (steps === 0) return hex;
  const rgb = [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const min = Math.min(...rgb), max = Math.max(...rgb);
  const lightness = (min + max) / 2;
  const next = Math.min(1, lightness + steps * .05);
  const denominator = 1 - Math.abs(2 * lightness - 1);
  const saturation = denominator === 0 ? 0 : (max - min) / denominator;
  const chroma = (1 - Math.abs(2 * next - 1)) * saturation;
  const nextMin = next - chroma / 2;
  return `#${rgb.map(channel => {
    const relative = max === min ? 0 : (channel - min) / (max - min);
    return Math.round((nextMin + relative * chroma) * 255).toString(16).padStart(2, '0');
  }).join('')}`.toUpperCase();
}
export function displayColor(color: PaletteColor, selectedId: string | null, steps: number): PaletteColor {
  return color.id === selectedId ? {...color, hex: lightenHex(color.hex, steps)} : color;
}
