// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface Window {
		/** The renderer's handle on the film, set by the player. */
		__film?: {
			duration: number;
			/** The timeline's scenes in film order, which the scripts check the stage against. */
			scenes: readonly { id: string; label: string; duration: number }[];
			/** Paints the frame for `seconds`; resolves once the DOM and fonts are ready for a screenshot. */
			seek: (seconds: number) => Promise<void>;
		};
	}
}

export {};
