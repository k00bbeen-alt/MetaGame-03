import {wrapIndex} from './circular.ts';
export const MOTION_MS = 300;
export const SCENE_MS = 180;
export type Phase = 'start' | 'carousel' | 'ending';
export type Snapshot = Readonly<{
  phase: Phase; currentIndex: number; selectedId: string | null; lightnessSteps: number;
  animating: boolean; transitioning: boolean;
}>;
export class CarouselState {
  private snapshot: Snapshot = {phase: 'start', currentIndex: 0, selectedId: null, lightnessSteps: 0, animating: false, transitioning: false};
  private queue: (-1 | 1)[] = [];
  private motionTimer: ReturnType<typeof setTimeout> | null = null;
  private sceneTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Set<() => void>();
  private disposed = false;
  private readonly count: number;
  private readonly onExit: () => void;
  constructor(count: number, onExit: () => void = () => {}) {
    if (!Number.isInteger(count) || count < 7) throw new RangeError('At least seven colors required');
    this.count = count; this.onExit = onExit;
  }
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {this.listeners.add(listener); return () => {this.listeners.delete(listener);};};
  private update(patch: Partial<Snapshot>) {
    if (this.disposed) return;
    this.snapshot = {...this.snapshot, ...patch}; this.listeners.forEach(fn => fn());
  }
  private enter(phase: Phase) {
    this.cancel();
    this.update({phase, transitioning: true});
    this.sceneTimer = setTimeout(() => {this.sceneTimer = null; this.update({transitioning: false});}, SCENE_MS);
  }
  activate = (currentId: string) => {
    if (this.disposed || this.snapshot.transitioning) return;
    if (this.snapshot.phase === 'start') this.enter('carousel');
    else if (this.snapshot.phase === 'ending') this.enter('start');
    else this.select(currentId);
  };
  move = (direction: -1 | 1) => {
    if (this.disposed || this.snapshot.phase !== 'carousel' || this.snapshot.transitioning) return;
    this.queue.push(direction);
    if (!this.snapshot.animating) this.advance();
  };
  private advance() {
    const direction = this.queue.shift();
    if (direction === undefined) {this.motionTimer = null; this.update({animating: false}); return;}
    this.update({currentIndex: wrapIndex(this.snapshot.currentIndex + direction, this.count), animating: true});
    this.motionTimer = setTimeout(() => this.advance(), MOTION_MS);
  }
  select = (id: string) => {
    if (this.snapshot.phase === 'carousel' && !this.snapshot.transitioning && !this.disposed && this.snapshot.selectedId !== id)
      this.update({selectedId: id, lightnessSteps: 0});
  };
  lighten = () => {
    if (this.disposed || this.snapshot.phase !== 'carousel' || this.snapshot.transitioning || !this.snapshot.selectedId || this.snapshot.lightnessSteps >= 10) return;
    this.update({lightnessSteps: this.snapshot.lightnessSteps + 1});
  };
  exit = () => {
    if (this.disposed || this.snapshot.phase !== 'carousel' || this.snapshot.transitioning) return;
    this.enter('ending'); this.onExit();
  };
  cancel = () => {
    if (this.motionTimer !== null) clearTimeout(this.motionTimer);
    if (this.sceneTimer !== null) clearTimeout(this.sceneTimer);
    this.motionTimer = this.sceneTimer = null; this.queue = [];
    this.update({animating: false, transitioning: false});
  };
  dispose = () => {this.cancel(); this.disposed = true; this.listeners.clear();};
}
