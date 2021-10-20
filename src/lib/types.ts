import type { Gentle } from './gentle';

export interface MapMeta {
	name: string;
	type: 'map' | 'cutscene';
	difficulty: number;
}

export interface LoadedMap {
	key: string;
	meta: MapMeta;
	alignment: Gentle;
	transcript: string;
	video: Blob;
}

export interface LoadedCutscene {
	key: string;
	meta: MapMeta;
	video: Blob;
}
