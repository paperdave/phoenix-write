import { readable } from 'svelte/store';

export const isFocused = readable(document.visibilityState === 'visible', (set) => {
	const handler = () => set(document.visibilityState === 'visible');
	handler();
	document.addEventListener('visibilitychange', handler);
	return () => document.removeEventListener('visibilitychange', handler);
});
