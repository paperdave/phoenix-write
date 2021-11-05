// test
//
// json file documentations
//
//

export type TimmyTimestamp =
	| [seconds: number, frames: number]
	| [minutes: number, seconds: number, frames: number];

export interface WordFlags {
	// Forces the penalty on getting this note wrong to be AT MOST that specific penalty. IS THIS HERE TOO??
	clampPenalty?: number;
	// specifies a checkpoint
	checkpoint?: boolean;
	// list of ignored input keys
	allowedCharacters?: string[];
	// A string containing every NON-keypress between the previous keypress and this one.
	forgivenessString?: string;
	// A string concatenating every word before this one that didn't have any missing letters.
	wordsRightBeforeThisOneWithoutMissingLetters?: string;
	// shake factor
	shake?: number;
	// specify end of this word, used for input logic
	endTime?: number | TimmyTimestamp;
	// ////// VISUAL FLARE
	// // do not show this flare
	// none?: boolean;
	// // adds a new line after the flare
	// newline?: boolean;
	// // angle which the flare enters the screen
	// angle?: number;
	// // z-order: defaults to 0
	// zOrder?: number;

	// the following only work in duet mode

	// rapper starts here
	replacingQTCinderellaTheRapperLudwigHiredOnFiverOneYearAgoStartsRappingHere?: boolean;
	// rapper ends here
	replacingTheRapperLudwigHiredOnFiverOneYearAgoQTCinderellaResumesSingingHere?: boolean;
	// only valid in qt's part in the duet. place this on the spam lines
	lenient?: boolean;
}

export interface MapMeta {
	// do not put in the json file
	key: string;
	// display name
	name: string;
	// type of map
	type: 'map' | 'cutscene' | 'duet';
	// background color of the FIRST frame, used on loading
	background: string;
	// background image number
	backgroundImage?: string;
	// game progress, used on the loading screen to preserve the top ui. omit to not include
	progress?: number;
}

export interface Cutscene {
	fps: 24;
	// fade in music
	bgm?: string;
	// cutscene section
	subsection: CutsceneSubsection[];
}

export interface CutsceneSubsection {
	// Bug fix on the eve of final day.
	motherfuckingbugfix?: boolean;
	savefile?: string,
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
	// OPTIONAL: isBussinB
	isBussinB: boolean;
	// OPTIONAL
	heartFlag: TimmyTimestamp;
	// OPTIONAL
	shake: TimmyTimestamp;
	// OPTIONAL
	playqtslap: TimmyTimestamp;
	// OPTIONAL
	'hardcoded flag Autoplay Only once. but this flag only is supported on this subsection and it wont work properly on any other sections': boolean;
}

export interface CutsceneKey {
	// the key to press.
	key: string;
	// when to press it relative to entire video
	time: TimmyTimestamp;
	// position
	pos: [number, number];
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
	// What the word is.
	text: string;
	// How many letters need to be pressed within this word.
	missingLetters: number[];
	// The time at which this word begins to be uttered.
	start: number;
	isSectionStart: boolean;
	// Does this word connect to the last word?
	isWordJoiner: boolean;
	isRapperStyle?: boolean;
	flags: WordFlags;
}

export interface LoadedLevel {
	type: 'map';
	key: string;
	meta: MapMeta;
	words: ParsedMap['words'];
	video: Blob;
}

export interface LoadedDuet {
	type: 'duet';
	key: string;
	meta: MapMeta;
	wordsLud: ParsedMap['words'];
	wordsQt: ParsedMap['words'];
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

export type LoadedMap = LoadedLevel | LoadedCutscene | LoadedDuet;

export function parseTimmyTimestamp(t: number | TimmyTimestamp): number {
	if (typeof t === 'number') {
		return t;
	}
	if (t.length === 2) {
		return t[0] + t[1] / 24;
	}
	return t[0] * 60 + t[1] + t[2] / 24;
}
