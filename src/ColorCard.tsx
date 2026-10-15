import {Card} from '@wearables-ui-toolkit/mrbd';
import type {PaletteColor} from './palette';
export function ColorCard({color, selected, active, width, onSelect}: {color: PaletteColor; selected: boolean; active: boolean; width: number; onSelect: () => void}) {
  return <Card width={width} style={{aspectRatio: '6 / 4', minInlineSize: 0, outline: selected ? 'var(--uit-spacing-2xs) solid var(--uit-color-border-primary)' : undefined, outlineOffset: 'var(--uit-spacing-2xs)'}}
    ariaLabel={`${color.name} ${color.hex}${selected ? ', 선택됨' : ', 선택'}`}
    aria-pressed={selected} disabled={!active} tabIndex={active ? 0 : -1} onClick={active ? onSelect : undefined}>
    <div className="swatch" style={{backgroundColor: color.hex}} />
  </Card>;
}
