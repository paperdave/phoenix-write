import { browser } from '$app/env';
import EventEmitter from 'eventemitter3';
import type { LoadedLevel, MapWord } from './types';
import { parseTimmyTimestamp } from './types';

const PRESS_MARGIN_START = 0.3;
const PRESS_MARGIN_END = 0.65;
const LETTER_EXTRA_TIME = 0.1;

export interface KeyPress {
	key: string;
	time: number;
}

export interface MapKeyPress {
	index: number;
	key: string;
	start: number;
	end: number;
	wordIndex: number;
	letterIndex: number;
	underlyingWord: MapWord;
}

export class LevelLogic extends EventEmitter {
	rewoundWord = 0;
	canPlay = true;
	keypressList = new Set<KeyPress>();
	startTime = 0;
	gameStarted = false;
	mapKeyPresses: MapKeyPress[] = [];
	currentWord = 0;
	introductionEnd = 0;
	isIntroGame = true;
	won = false;
	latestCheckpoint = 0;

	popKeyPresses(): KeyPress[] {
		const keypresses: KeyPress[] = [];
		this.keypressList.forEach((keypress) => {
			keypresses.push(keypress);
		});
		this.keypressList.clear();
		return keypresses;
	}

	handleKeyPress = (event: KeyboardEvent) => {
		if (!this.canPlay) return;
		if (event.ctrlKey || event.altKey || event.metaKey || event.key.length > 1) {
			return;
		}
		event.preventDefault();
		const time = performance.now();
		if ((time - this.startTime) / 1000 < this.introductionEnd) {
			return;
		}
		if (!this.gameStarted) {
			if (event.key.toLowerCase() === this.mapKeyPresses[this.rewoundWord].key.toLowerCase()) {
				this.gameStarted = true;
				this.currentWord = this.rewoundWord + 1;
				this.popKeyPresses();
				this.emit('start');
				this.emit('key', {
					key: event.key,
					wordIndex: 0,
					letterIndex: 0
				});
			}
		} else {
			this.keypressList.add({
				key: event.key,
				time
			});
		}
	};

	constructor(readonly map: LoadedLevel) {
		super();
		map.words.forEach((word, w) => {
			let index = 0;
			word.missingLetters.forEach((i, j) => {
				if (i === 0 && w === 0) {
					this.introductionEnd = word.start - PRESS_MARGIN_START;
				}
				this.mapKeyPresses.push({
					index: index++,
					key: word.text[i],
					start: word.start - PRESS_MARGIN_START,
					end:
						parseTimmyTimestamp(
							word.flags.endTime ?? word.start + word.text.length * LETTER_EXTRA_TIME
						) + PRESS_MARGIN_END,
					wordIndex: w,
					letterIndex: i,
					underlyingWord: word
				});
			});
		});
		if (browser) {
			document.addEventListener('keydown', this.handleKeyPress);
		}

		this.on('lose', () => {
			this.gameStarted = false;
			this.rewoundWord = this.latestCheckpoint;
		});
	}

	destroy() {
		if (browser) {
			document.removeEventListener('keydown', this.handleKeyPress);
		}
	}

	update(time: number) {
		this.startTime = performance.now() - time * 1000;
	}

	tick() {
		const keypresses = this.popKeyPresses();
		if (this.currentWord >= this.mapKeyPresses.length && !this.won) {
			this.emit('win');
			this.won = true;
		}
		if (this.won) return;
		if (keypresses.length === 0) {
			const currentTime = (performance.now() - this.startTime) / 1000;
			const mapKey = this.mapKeyPresses[this.currentWord];
			if (currentTime > mapKey.end) {
				this.emit('lose', {
					tooLate: true
				});
			}
		}
		while (keypresses.length > 0) {
			const key = keypresses.shift();
			const mapKey = this.mapKeyPresses[this.currentWord];
			if (key.key.toLowerCase() === mapKey.key.toLowerCase()) {
				const keyTime = (key.time - this.startTime) / 1000;
				if (keyTime > mapKey.start && keyTime < mapKey.end) {
					if (
						mapKey.underlyingWord.text[mapKey.underlyingWord.missingLetters[0]].toLowerCase() ===
						key.key.toLowerCase()
					) {
						if (mapKey.underlyingWord.flags.checkpoint) {
							this.latestCheckpoint = this.currentWord;
						}
					}

					this.currentWord++;
					this.emit('key', {
						key: key.key,
						wordIndex: mapKey.wordIndex,
						letterIndex: mapKey.letterIndex,
						offset: keyTime - mapKey.start
					});
				} else {
					this.emit('lose', {
						mistype: key.key,
						wordIndex: mapKey.wordIndex,
						letterIndex: mapKey.letterIndex
					});
				}
			} else {
				if (
					!(mapKey.underlyingWord.flags.allowedCharacters || [])
						.map((x) => x.toLowerCase())
						.includes(key.key.toLowerCase())
				) {
					this.emit('lose', {
						mistype: key.key,
						wordIndex: mapKey.wordIndex,
						letterIndex: mapKey.letterIndex
					});
				}
			}
		}
	}

	unfocusLoss() {
		this.emit('lose', {
			unfocused: true
		});
	}
}
