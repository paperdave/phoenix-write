import type { ParsedMap } from './map-parser';

export type TimmyTimestamp = [seconds: number, frames: number];

export interface MapMeta {
	name: string;
	type: 'map' | 'cutscene';
	difficulty: number;
}

export interface Cutscene {
	fps: 24;
	leadsto: string;
	bgm?: string;
	subsection: CutsceneSubsection[];
}

export interface CutsceneSubsection {
	begin: TimmyTimestamp;
	end: TimmyTimestamp;
	unskippable?: boolean;
	overridepause?: boolean;
	skipTo?: TimmyTimestamp;
	keys?: CutsceneKey[];
	lenient?: boolean;
}

export interface CutsceneKey {
	key: string;
	time: TimmyTimestamp;
	lenient?: boolean;
}

export interface LoadedMap {
	type: 'map';
	key: string;
	meta: MapMeta;
	words: ParsedMap['words'];
	video: Blob;
}

export interface LoadedCutscene {
	type: 'cutscene';
	key: string;
	meta: MapMeta;
	fps: 24;
	leadsto: string;
	bgm?: string;
	subsection: CutsceneSubsection[];
	video: Blob;
}

export type LoadedLevel = LoadedMap | LoadedCutscene;
