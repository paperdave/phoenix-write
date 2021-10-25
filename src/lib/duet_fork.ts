import { browser } from '$app/env';
import EventEmitter from 'eventemitter3';
import type { LoadedDuet, LoadedLevel, MapWord } from './types';
import { parseTimmyTimestamp } from './types';

export const WORD_PENALTY = 6;

export const PRESS_MARGIN_START = 0.3;
export const PRESS_MARGIN_END = 0.65;
export const LETTER_EXTRA_TIME = 0.1;

export interface DuetKeyPress {
	key: string;
	time: number;
}

export interface DuetMapKeyPress {
	index: number;
	key: string;
	start: number;
	end: number;
	wordIndex: number;
	letterIndex: number;
	underlyingWord: MapWord;
}

export class DuetLevelLogic extends EventEmitter {
	// rewoundWord = 0;
	// canPlay = true;
	// keypressList = new Set<DuetKeyPress>();
	// startTime = 0;
	// gameStarted = false;
	// mapKeyPresses: DuetMapKeyPress[] = [];
	currentWord = 0;
	// introductionEnd = 0;
	// isIntroGame = true;
	// won = false;
	// latestCheckpoint = 0;

	popKeyPresses(): DuetKeyPress[] {
		return [];
	}

	handleKeyPress = (event: KeyboardEvent) => {};

	constructor(readonly map: LoadedDuet) {
		super();
	}

	destroy() {}

	update(time: number) {}

	tick() {}

	unfocusLoss() {
		this.emit('lose', {
			unfocused: true
		});
	}
}
