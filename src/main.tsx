import {useEffect, useRef, useState, useSyncExternalStore, type ComponentRef} from 'react';
import {createRoot} from 'react-dom/client';
import {App, Page, ScrollView, Carousel, TextView, TextStyle, TextColor} from '@wearables-ui-toolkit/mrbd';
import {palette} from './palette';
import {CarouselState} from './carousel-state';
import {attachKeyboard} from './input';
import {requestExit} from './exit';
import {ColorCard} from './ColorCard';
import {SelectionFeedback} from './SelectionFeedback';
import {wrapIndex} from './circular';
import {cardWidth} from './layout';
import './style.css';

function PaletteApp() {
  const [state] = useState(() => new CarouselState(palette.length));
  const snapshot = useSyncExternalStore(state.subscribe, state.getSnapshot);
  const carousel = useRef<ComponentRef<typeof Carousel>>(null);
  const [geometry, setGeometry] = useState({width: 0, gap: 0});
  useEffect(() => {
    const root = document.getElementById('root')!;
    const observer = new ResizeObserver(() => {
      const css = getComputedStyle(root);
      const gap = parseFloat(css.getPropertyValue('--uit-spacing-small')) || 0;
      setGeometry({width: cardWidth(root.clientWidth, gap), gap});
    });
    observer.observe(root);
    return () => {observer.disconnect(); state.dispose();};
  }, [state]);
  useEffect(() => {
    if (snapshot.exited) return;
    const detach = attachKeyboard(window, {
      move: state.move,
      select: () => state.select(palette[state.getSnapshot().currentIndex].id),
      exit: () => requestExit(state),
    });
    const visibility = () => {if (document.hidden) state.cancel();};
    document.addEventListener('visibilitychange', visibility);
    return () => {detach(); document.removeEventListener('visibilitychange', visibility);};
  }, [state, snapshot.exited]);
  useEffect(() => {
    if (!snapshot.exited && geometry.width > 0) carousel.current?.scrollToPosition(snapshot.currentIndex + 3);
  }, [snapshot.currentIndex, snapshot.exited, geometry.width]);
  const current = palette[snapshot.currentIndex];
  const selected = palette.find(color => color.id === snapshot.selectedId);
  return <App><Page showHeader={false} enableSystemBarInset={false}>
    {snapshot.exited ? <ScrollView ariaLabel="종료 상태" tabIndex={0}>
      <div className="exit-state" role="status"><TextView as="p" textStyle={TextStyle.BODY2}>팔레트를 종료했어요</TextView></div>
    </ScrollView> : <ScrollView ariaLabel="21색 팔레트">
      <Carousel style={{paddingBlock: 'var(--uit-spacing-large)'}} ref={carousel} initialIndex={3} showPagination={false} itemGap={geometry.gap} ariaLabel="색상 캐러셀">
        {Array.from({length: palette.length + 6}, (_, slot) => {const color = palette[wrapIndex(slot - 3, palette.length)]; return <ColorCard key={slot} color={color} selected={color.id === snapshot.selectedId}
          active={slot === snapshot.currentIndex + 3} width={geometry.width} onSelect={() => {state.center(palette.indexOf(color)); state.select(color.id);}}/>;})}
      </Carousel>
      <div style={{paddingInline: 'var(--uit-spacing-large)'}} ><SelectionFeedback current={current} selected={selected}/>
      <div className="interaction-hints"><TextView as="p" textStyle={TextStyle.META3} textColor={TextColor.SECONDARY}>좌우 탐색 · Enter 선택</TextView></div></div>
    </ScrollView>}
  </Page></App>;
}
createRoot(document.getElementById('root')!).render(<PaletteApp/>);
