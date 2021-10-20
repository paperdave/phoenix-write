import type { Gentle } from './gentle';

export interface MapMeta {
	name: string;
}

export interface LoadedMap {
	key: string;
	meta: MapMeta;
	alignment: Gentle;
	transcript: string;
	video: Blob;
}
