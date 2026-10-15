import {TextView, TextStyle, TextColor} from '@wearables-ui-toolkit/mrbd';
import type {PaletteColor} from './palette';
export function SelectionFeedback({current, selected}: {current: PaletteColor; selected?: PaletteColor}) {
  return <div className="color-info" aria-live="polite" aria-atomic="true">
    <TextView as="h1" textStyle={TextStyle.BODY2_EMPHASIZED}>{current.name}</TextView>
    <TextView as="p" textStyle={TextStyle.META2} textColor={TextColor.SECONDARY}>{current.hex}</TextView>
    <TextView as="p" textStyle={TextStyle.META2}>{selected ? `선택됨: ${selected.name}` : '선택한 색상 없음'}</TextView>
  </div>;
}
