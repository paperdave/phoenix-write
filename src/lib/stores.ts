import { writable } from 'svelte/store';

export const currentLevelId = writable<null | string>(null);
