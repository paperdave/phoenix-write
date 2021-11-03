import { writable } from 'svelte/store';
import { getMapList } from './map-registry';
import type { LoadedMap, MapMeta } from './types';

export const currentMapId = writable<null | string>(null);

export function setNextMap(map: LoadedMap | MapMeta) {
	getMapList().then((list) => {
		if (map.key === '00-intro-cutscene') {
			resetRewoundTime();
		}
		const i = list.findIndex(({ key }) => key === map.key);
		const next = list[i + 1];
		currentMapId.set(next.key);
	});
}

export const totalRewound = writable(Number(localStorage.phoenixwrite_rewind ?? 0));
export const totalFails = writable(0);
export const startTime = writable(0);
export const totalOffset = writable(0);
export const totalKeyPresses = writable(0);

totalRewound.subscribe((rewound) => {
	localStorage.phoenixwrite_rewind = rewound;
});

export function addToRewoundTime(n: number) {
	totalRewound.update((t) => t + n);
}

export function resetRewoundTime() {
	totalRewound.set(0);
}
