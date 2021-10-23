import { writable } from 'svelte/store';
import { getMapList } from './map-registry';
import type { LoadedMap, MapMeta } from './types';

export const currentMapId = writable<null | string>(null);

export function setNextMap(map: LoadedMap | MapMeta) {
	getMapList().then((list) => {
		const i = list.findIndex(({ key }) => key === map.key);
		const next = list[i + 1];
		console.log(next);
		currentMapId.set(next.key);
	});
}
