//
//
// json file documentations
//
//

export type TimmyTimestamp = [seconds: number, frames: number];

export interface WordFlags {
	// adds a new line after the word for visual purposes
	newline?: boolean;
}

export interface MapMeta {
	// do not put in the json file
	key: string;
	// display name
	name: string;
	// type of map
	type: 'map' | 'cutscene';
	// background color of the FIRST frame, used on loading
	background: string;
}

export interface Cutscene {
	fps: 24;
	// fade in music
	bgm?: string;
	// cutscene section
	subsection: CutsceneSubsection[];
}

export interface CutsceneSubsection {
	// timestamp of start section
	begin: TimmyTimestamp;
	// OPTIONAL: timestamp of end section
	end?: TimmyTimestamp;
	// OPTIONAL: disable skipping
	unskippable?: boolean;
	// OPTIONAL: automatically advance at the end, implies unskippable
	autoplay?: boolean;
	// OPTIONAL: keys to be pressed during this
	keys?: CutsceneKey[];
	// OPTIONAL: is the keypressing "lenient"?
	lenient?: boolean;
	// OPTIONAL: override continue text, include () in your string
	continueText?: string;
	// OPTIONAL: override the advance sound effect. this is after you advance THIS section
	overrideSFX?: string;
	// OPTIONAL: modifies how the video is displayed, apply to anything where the next section
	// does not clear the dialog box
	flagNextSectionDoesntClear?: boolean;
	// OPTIONAL: MUSIC CONTROL: Start with fade
	startMusicFade?: string;
	// OPTIONAL: MUSIC CONTROL: Start without fade
	startMusic?: string;
	// OPTIONAL: MUSIC CONTROL: End with fade
	endMusic?: boolean;
	// OPTIONAL: MUSIC CONTROL: End without fade
	endMusicFade?: number;
	// OPTIONAL: special flag for the boys
	theBoys?: boolean;
}

export interface CutsceneKey {
	// the key to press.
	key: string;
	// when to press it relative to entire video
	time: TimmyTimestamp;
	// OPTIONAL: is this lenient
	lenient?: boolean;
}

//
//
// game implementation stuff
//
//

export interface ParsedMap {
	words: MapWord[];
}

export interface MapWord {
	text: string;
	missingLetters: number[];
	start: number;
	isSectionStart: boolean;
	isWordJoiner: boolean;
	flags: WordFlags;
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
