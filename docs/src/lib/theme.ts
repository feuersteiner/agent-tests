import type { Palette } from 'bref-ui/types';

/** Police blue identity mapped to Bref-ui's semantic roles. */
export const palette = {
	light: {
		primary: '#102D50',
		secondary: '#2D5278',
		background: '#F3F6F9',
		foreground: '#102D50',
		muted: '#53677F',
		info: '#245C91',
		success: '#147A3C',
		warning: '#8A5A00',
		error: '#B42336'
	},
	dark: {
		primary: '#4080BF',
		secondary: '#557FA9',
		background: '#080C12',
		foreground: '#F3F6F9',
		muted: '#A9B8C8',
		info: '#8FC8ED',
		success: '#5CFF8A',
		warning: '#FFD166',
		error: '#FF6B7A'
	}
} as const satisfies Record<'light' | 'dark', Required<Palette>>;
