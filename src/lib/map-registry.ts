import JSON5 from 'json5';
import { canPlayVP9 } from './compatibility';
import { parseMap } from './map-parser';
import type { Cutscene, CutsceneSubsection, LoadedMap, MapMeta } from './types';

const levelMetadata = new Map<string, MapMeta>();
const loadedLevels = new Map<string, LoadedMap>();

async function fetchLevelMetadata() {
	const response = await fetch('/get-map-list');
	const metadata = await response.text();
	return JSON5.parse(metadata);
}

function touchSubsection(subsection: CutsceneSubsection) {
	subsection.unskippable = subsection.autoplay || subsection.unskippable;
	return subsection;
}

async function fetchLevel(meta: MapMeta) {
	const key = meta.key;
	const video = canPlayVP9
		? fetch(`/maps/${key}/video.webm`)
				.then((x) => {
					if (x.status !== 200) {
						throw new Error(`${x.status} ${x.statusText}`);
					}
					return x;
				})
				.then((x) => x.blob())
				.catch(() => fetch(`/maps/${key}/video.mp4`).then((x) => x.blob()))
		: fetch(`/maps/${key}/video.mp4`).then((x) => x.blob());
	if (meta.type === 'map') {
		const results = await Promise.all([fetch(`/maps/${key}/map.txt`).then((x) => x.text()), video]);
		return {
			type: 'map',
			key,
			meta,
			words: parseMap(results[0]).words,
			video: results[1]
		} as LoadedMap;
	} else if (meta.type === 'cutscene') {
		const results = await Promise.all([
			fetch(`/maps/${key}/cutscene.json`)
				.then((x) => x.text())
				.then((x) => {
					return JSON5.parse(x) as Cutscene;
				}),
			video
		]);
		return {
			type: 'cutscene',
			key,
			meta,
			subsection: results[0].subsection.map(touchSubsection),
			fps: results[0].fps,
			bgm: results[0].bgm,
			video: results[1]
		} as LoadedMap;
	} else {
		throw new Error('Unknown map type');
	}
}

function getMeta(id: string): Promise<MapMeta> {
	if (levelMetadata.size > 0) {
		return Promise.resolve(levelMetadata.get(id));
	} else {
		return fetchLevelMetadata().then((x) => {
			Object.entries(x.maps).forEach(([key, value]) => {
				(value as MapMeta).key = key;
				levelMetadata.set(key, value as MapMeta);
			});
			return levelMetadata.get(id);
		});
	}
}

export async function getMap(id: string): Promise<LoadedMap> {
	if (loadedLevels.has(id)) {
		return loadedLevels.get(id);
	}

	const meta = await getMeta(id);
	const level = await fetchLevel(meta);
	loadedLevels.set(id, level);
	return level;
}

export async function getMapList(): Promise<MapMeta[]> {
	if (levelMetadata.size > 0) {
		return Promise.resolve([...levelMetadata.values()]);
	} else {
		const metadata = await fetchLevelMetadata();
		Object.entries(metadata.maps).forEach(([key, value]) => {
			(value as MapMeta).key = key;
			levelMetadata.set(key, value as MapMeta);
		});
		return [...levelMetadata.values()];
	}
}

export function getMapListNoPromise() {
	return [...levelMetadata.values()];
}
