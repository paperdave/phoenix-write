import type { ParsedMap } from './map-parser';

export type TimmyTimestamp = [seconds: number, frames: number];

export interface MapMeta {
	key: string;
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
	autoplay?: boolean;
	keys?: CutsceneKey[];
	lenient?: boolean;
	continueText?: string;
	overrideSFX?: string;
	flagNextSectionDoesntClear?: boolean;
	startMusicFade?: string;
	startMusic?: string;
	endMusic?: boolean;
	endMusicFade?: number;
}

export interface CutsceneKey {
	key: string;
	time: TimmyTimestamp;
	lenient?: boolean;
}

export interface LoadedLevel {
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

export type LoadedMap = LoadedLevel | LoadedCutscene;
