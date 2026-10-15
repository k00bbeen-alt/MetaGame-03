import type {Phase} from './carousel-state';
export type PaletteCommands = {
  phase: () => Phase; move: (direction: -1 | 1) => void;
  activate: () => void; lighten: () => void; exit: () => void;
};
// Standard DOM keyboard adapter. No guessed Meta SDK or proprietary events.
// TODO(glasses): validate actual host D-pad/Select delivery on hardware.
export function attachKeyboard(target: Window, commands: PaletteCommands): () => void {
  const held = new Set<string>();
  const keydown = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Enter', ' ', 'ArrowDown', 'Escape'].includes(event.key)) return;
    // Let native semantic buttons emit their one activation click. Repeated or
    // held keys are cancelled even if the first click mounted another screen.
    if (event.repeat || held.has(event.key)) {event.preventDefault(); return;}
    held.add(event.key);
    const phase = commands.phase();
    const nativeButton = typeof HTMLButtonElement !== 'undefined' && event.target instanceof HTMLButtonElement;
    const nativeActivation = nativeButton && (event.key === 'Enter' || (event.key === ' ' && phase === 'start'));
    if (nativeActivation) return;
    event.preventDefault();
    if (phase === 'start' && (event.key === 'Enter' || event.key === ' ')) commands.activate();
    if (phase === 'ending' && event.key === 'Enter') commands.activate();
    if (phase !== 'carousel') return;
    if (event.key === 'ArrowLeft') commands.move(-1);
    if (event.key === 'ArrowRight') commands.move(1);
    if (event.key === 'Enter') commands.activate();
    if (event.key === 'ArrowUp') commands.lighten();
    if (event.key === 'ArrowDown' || event.key === 'Escape') commands.exit();
  };
  const keyup = (event: KeyboardEvent) => {held.delete(event.key);};
  const blur = () => held.clear();
  target.addEventListener('keydown', keydown);
  target.addEventListener('keyup', keyup);
  target.addEventListener('blur', blur);
  return () => {
    target.removeEventListener('keydown', keydown);
    target.removeEventListener('keyup', keyup);
    target.removeEventListener('blur', blur); held.clear();
  };
}
