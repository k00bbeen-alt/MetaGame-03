import {palette} from './palette';
import {CarouselState, type Phase} from './carousel-state';
import {visibleIndices} from './circular';
import {attachKeyboard} from './input';
import {attachLifecycle} from './lifecycle';
import {requestExit} from './exit';
import {createColorCard, updateColorCard} from './ColorCard';
import {renderSelection} from './SelectionFeedback';
import './style.css';

export function mountPalette(root: HTMLElement): () => void {
  const state = new CarouselState(palette.length);
  const cards = new Map<string, HTMLButtonElement>();
  let phase: Phase | undefined;
  let lastIndex = -1;
  let frame: HTMLElement | null = null;
  const observer = new ResizeObserver(() => {if (frame) layoutCards();});
  const activate = () => state.activate(palette[state.getSnapshot().currentIndex].id);
  function layoutCards() {
    if (!frame) return;
    root.style.setProperty('--text-scale', String(parseFloat(getComputedStyle(document.documentElement).fontSize) / 16));
    const snapshot = state.getSnapshot();
    const bounds = frame.getBoundingClientRect();
    visibleIndices(snapshot.currentIndex, palette.length).forEach((index, slot) => {
      const color = palette[index]; const card = cards.get(color.id);
      if (card) updateColorCard(card, color, slot - 3, color.id === snapshot.selectedId, bounds.width, bounds.height);
    });
  }
  function render() {
    const snapshot = state.getSnapshot();
    root.dataset.phase = snapshot.phase;
    root.dataset.animating = String(snapshot.animating);
    if (phase !== snapshot.phase) {
      observer.disconnect(); frame = null; cards.clear(); lastIndex = -1;
      phase = snapshot.phase;
      if (phase === 'start') {
        root.innerHTML = `<button type="button" class="scene scene-start" aria-label="21 color card, 시작" data-activate="start">
          <span class="wordmark"><span class="wordmark-number">21</span><span class="wordmark-label">color card</span></span>
          <span class="screen-cue">터치 또는 Enter / Space</span></button>`;
      } else if (phase === 'ending') {
        root.innerHTML = `<button type="button" class="scene scene-ending" aria-label="시작 화면으로 돌아가기" data-activate="ending">
          <span class="ending-content"><span class="ending-brand">21 <span>color card</span></span>
          <span class="ending-swatch" aria-hidden="true"></span><span class="ending-title">색을 담아두었어요</span>
          <span class="ending-color"></span></span><span class="screen-cue">터치 또는 Enter로 처음으로</span></button>`;
        const selected = palette.find(color => color.id === snapshot.selectedId);
        const swatch = root.querySelector<HTMLElement>('.ending-swatch')!;
        if (selected) {
          swatch.style.backgroundColor = selected.hex;
          root.querySelector('.ending-color')!.textContent = `${selected.name} · ${selected.hex}`;
        } else {
          swatch.hidden = true;
          root.querySelector('.ending-title')!.textContent = '잠시 쉬어가요';
          root.querySelector('.ending-color')!.textContent = '21 color card';
        }
      } else {
        root.innerHTML = `<section class="scene scene-carousel" aria-label="21색 팔레트">
          <header class="eyebrow"><span aria-hidden="true">•</span> COLOR PALETTE</header>
          <div class="arch" role="group" aria-label="색상 캐러셀"></div>
          <div class="color-info" aria-live="polite" aria-atomic="true"><h1></h1><p class="hex"></p><p class="selection-label"></p></div>
          <footer class="interaction-hints"><span><span aria-hidden="true">← →</span> 탐색</span><span><span aria-hidden="true">↵</span> 선택</span></footer></section>`;
        frame = root.querySelector<HTMLElement>('.arch')!;
        observer.observe(frame);
      }
      if (phase !== 'carousel') root.querySelector<HTMLElement>('.scene')!.focus({preventScroll: true});
    }
    if (snapshot.phase !== 'carousel') return;
    const visible = visibleIndices(snapshot.currentIndex, palette.length).map(index => palette[index]);
    const ids = new Set(visible.map(color => color.id));
    for (const [id, card] of cards) {if (!ids.has(id)) {card.remove(); cards.delete(id);}}
    for (const color of visible) {
      if (!cards.has(color.id)) {
        const card = createColorCard(color);
        const slot = visible.indexOf(color) - 3;
        const initialSlot = lastIndex >= 0 && Math.abs(slot) === 3 ? Math.sign(slot) * 4 : slot;
        const bounds = frame!.getBoundingClientRect();
        updateColorCard(card, color, initialSlot, color.id === snapshot.selectedId, bounds.width, bounds.height);
        cards.set(color.id, card); frame!.append(card);
        // Establish one incoming card's safe initial geometry before its CSS transition.
        if (lastIndex >= 0) card.getBoundingClientRect();
      }
    }
    renderSelection(root.querySelector('.color-info')!, palette[snapshot.currentIndex], palette.find(color => color.id === snapshot.selectedId));
    layoutCards();
    if (lastIndex !== snapshot.currentIndex) {
      cards.get(palette[snapshot.currentIndex].id)!.focus({preventScroll: true});
      lastIndex = snapshot.currentIndex;
    }
  }
  const click = (event: MouseEvent) => {
    if (!(event.target instanceof Element)) return;
    const snapshot = state.getSnapshot();
    if (snapshot.phase !== 'carousel') activate();
    else if (snapshot.phase === 'carousel' && event.target.closest('.color-card[data-slot="0"]')) activate();
  };
  document.addEventListener('click', click);
  const detachKeyboard = attachKeyboard(window, {phase: () => state.getSnapshot().phase, move: state.move, activate, exit: () => requestExit(state)});
  const detachLifecycle = attachLifecycle(document, window, state.cancel);
  const unsubscribe = state.subscribe(render);
  render();
  return () => {
    unsubscribe(); detachKeyboard(); detachLifecycle(); observer.disconnect();
    document.removeEventListener('click', click); frame = null; state.dispose(); cards.clear(); root.replaceChildren();
  };
}
const dispose = mountPalette(document.getElementById('root')!);
if (import.meta.hot) import.meta.hot.dispose(dispose);
