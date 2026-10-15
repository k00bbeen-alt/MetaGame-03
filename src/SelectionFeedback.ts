import type {PaletteColor} from './palette';
export function renderSelection(element: HTMLElement, current: PaletteColor, selected?: PaletteColor) {
  element.querySelector('h1')!.textContent = current.name;
  element.querySelector('.hex')!.textContent = current.hex;
  const label = element.querySelector<HTMLElement>('.selection-label')!;
  label.textContent = selected ? `✓ ${selected.id === current.id ? '선택됨' : selected.name + ' 선택됨'}` : '\u00a0';
  label.classList.toggle('has-selection', !!selected);
}
