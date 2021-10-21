import type { ParsedMap } from './map-parser';

export interface MapMeta {
	name: string;
	type: 'map' | 'cutscene';
	difficulty: number;
}

export interface LoadedMap {
	key: string;
	meta: MapMeta;
	words: ParsedMap['words'];
	video: Blob;
}

export interface LoadedCutscene {
	key: string;
	meta: MapMeta;
	video: Blob;
}
