import { browser } from '$app/env';
import { readable } from 'svelte/store';

export const isFocused = readable(
	browser ? document.visibilityState === 'visible' : false,
	(set) => {
		if (browser) {
			const handler = () => set(document.visibilityState === 'visible');
			handler();
			document.addEventListener('visibilitychange', handler);
			return () => document.removeEventListener('visibilitychange', handler);
		}
	}
);
