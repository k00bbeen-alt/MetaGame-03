export type PaletteCommands = {move: (direction: -1 | 1) => void; select: () => void; exit: () => void};
// Browser adapter only. TODO(glasses): validate real directional/activation events
// against the official host API and device before claiming Glass support.
export function attachKeyboard(target: Window, commands: PaletteCommands): () => void {
  const keydown = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
    if (!['ArrowLeft', 'ArrowRight', 'Enter', 'ArrowDown', 'Escape'].includes(event.key)) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (event.repeat) return;
    if (event.key === 'ArrowLeft') commands.move(-1);
    if (event.key === 'ArrowRight') commands.move(1);
    if (event.key === 'Enter') commands.select();
    if (event.key === 'ArrowDown' || event.key === 'Escape') commands.exit();
  };
  target.addEventListener('keydown', keydown, {capture: true});
  return () => target.removeEventListener('keydown', keydown, {capture: true});
}
