import { clamp, duration } from './timeline.js';

/** The film's clock. While playing it advances by real elapsed time and stops at the end. */
export class Film {
	/** Film time in seconds, from 0 to `duration`. */
	time = $state(0);
	playing = $state(false);
	#frame = 0;
	#previous = 0;

	play = () => {
		if (this.playing) return;
		if (this.time >= duration) this.time = 0;
		this.playing = true;
		this.#previous = performance.now();
		this.#frame = requestAnimationFrame(this.#advance);
	};

	pause = () => {
		this.playing = false;
		cancelAnimationFrame(this.#frame);
	};

	toggle = () => (this.playing ? this.pause() : this.play());

	seek = (seconds: number) => {
		this.time = clamp(Number.isFinite(seconds) ? seconds : 0, 0, duration);
	};

	#advance = (now: number) => {
		if (!this.playing) return;
		this.time = Math.min(this.time + Math.max(now - this.#previous, 0) / 1000, duration);
		this.#previous = now;
		if (this.time >= duration) this.pause();
		else this.#frame = requestAnimationFrame(this.#advance);
	};
}

/** The one clock the player and the renderer share. */
export const film = new Film();
