import type {PaletteColor} from './palette';
import {archLayout} from './layout';
export function createColorCard(color: PaletteColor): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'color-card'; button.dataset.colorId = color.id;
  button.style.setProperty('--swatch', color.hex);
  const surface = document.createElement('span'); surface.className = 'card-surface'; surface.ariaHidden = 'true';
  const mark = document.createElement('span'); mark.className = 'selected-mark'; mark.textContent = '✓'; mark.ariaHidden = 'true';
  button.append(surface, mark); return button;
}
export function updateColorCard(button: HTMLButtonElement, color: PaletteColor, slot: number, selected: boolean, width: number, height: number) {
  const geometry = archLayout(slot, width, height);
  button.style.width = `${geometry.width}px`;
  button.style.top = `${geometry.centerY}px`;
  button.style.setProperty('--x', `${geometry.x}px`);
  button.style.setProperty('--y', `${geometry.y}px`);
  button.style.setProperty('--scale', String(geometry.scale));
  button.style.setProperty('--rotation', `${geometry.rotation}deg`);
  button.style.setProperty('--radius', `${geometry.radius}px`);
  button.style.zIndex = String(geometry.zIndex);
  button.disabled = slot !== 0; button.tabIndex = slot === 0 ? 0 : -1;
  button.dataset.slot = String(slot);
  button.classList.toggle('is-selected', selected);
  button.setAttribute('aria-pressed', String(selected));
  button.setAttribute('aria-label', `${color.name} ${color.hex}${selected ? ', 선택됨' : ', 선택'}`);
}
