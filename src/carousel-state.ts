import {wrapIndex} from './circular.ts';
export const MOTION_MS = 300;
export type Snapshot = Readonly<{currentIndex: number; selectedId: string | null; animating: boolean; exited: boolean}>;
export class CarouselState {
  private snapshot: Snapshot = {currentIndex: 0, selectedId: null, animating: false, exited: false};
  private queue: (-1 | 1)[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Set<() => void>();
  private readonly count: number;
  private readonly onExit: () => void;
  constructor(count: number, onExit: () => void = () => {}) {this.count = count; this.onExit = onExit;}
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {this.listeners.add(listener); return () => {this.listeners.delete(listener);};};
  private update(patch: Partial<Snapshot>) {this.snapshot = {...this.snapshot, ...patch}; this.listeners.forEach(fn => fn());}
  move = (direction: -1 | 1) => {
    if (this.snapshot.exited) return;
    this.queue.push(direction);
    if (!this.snapshot.animating) this.advance();
  };
  private advance() {
    const direction = this.queue.shift();
    if (direction === undefined) {this.timer = null; this.update({animating: false}); return;}
    this.update({currentIndex: wrapIndex(this.snapshot.currentIndex + direction, this.count), animating: true});
    this.timer = setTimeout(() => this.advance(), MOTION_MS);
  }
  center = (index: number) => {if (!this.snapshot.exited) {this.cancel(); this.update({currentIndex: wrapIndex(index, this.count)});}};
  select = (id: string) => {if (!this.snapshot.exited) this.update({selectedId: id});};
  exit = () => {
    if (this.snapshot.exited) return;
    this.cancel(); this.update({exited: true}); this.onExit();
  };
  cancel = () => {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null; this.queue = []; this.update({animating: false});
  };
  dispose = () => {this.cancel(); this.listeners.clear();};
}
