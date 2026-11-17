import { clamp, smooth } from './timeline.js';

/** 0 before `from`, 1 after `to`, linear in between. */
export const progress = (time: number, from: number, to: number) =>
	to > from ? clamp((time - from) / (to - from)) : time >= from ? 1 : 0;

/** `progress` eased with `smooth`, for fades and moves that settle softly. */
export const fade = (time: number, from: number, to: number) => smooth(progress(time, from, to));
