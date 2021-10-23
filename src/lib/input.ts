import { browser } from '$app/env';
import EventEmitter from 'eventemitter3';
import type { LoadedLevel } from './types';

const PRESS_MARGIN_START = 0.3;
const PRESS_MARGIN_END = 0.65;
const LETTER_EXTRA_TIME = 0.1;

export interface KeyPress {
	key: string;
	time: number;
}

export interface MapKeyPress {
	key: string;
	start: number;
	end: number;
	wordIndex: number;
	letterIndex: number;
}

export class LevelLogic extends EventEmitter {
	keypressList = new Set<KeyPress>();
	startTime = 0;
	gameStarted = false;
	mapKeyPresses: MapKeyPress[] = [];
	currentWord = 0;
	introductionEnd = 0;
	isIntroGame = true;
	won = false;

	popKeyPresses(): KeyPress[] {
		const keypresses: KeyPress[] = [];
		this.keypressList.forEach((keypress) => {
			keypresses.push(keypress);
		});
		this.keypressList.clear();
		return keypresses;
	}

	handleKeyPress = (event: KeyboardEvent) => {
		if (event.ctrlKey || event.altKey || event.metaKey) {
			return;
		}
		event.preventDefault();
		const time = performance.now();
		if ((time - this.startTime) / 1000 < this.introductionEnd) {
			return;
		}
		if (!this.gameStarted) {
			if (event.key.toLowerCase() === this.map.words[0].text[0].toLowerCase()) {
				this.gameStarted = true;
				this.currentWord = 1;
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
			word.missingLetters.forEach((i, j) => {
				if (i === 0 && w === 0) {
					console.log('first letter', word.start - PRESS_MARGIN_START);
					this.introductionEnd = word.start - PRESS_MARGIN_START;
				}
				this.mapKeyPresses.push({
					key: word.text[i],
					start: word.start - PRESS_MARGIN_START,
					end: word.start + word.text.length * LETTER_EXTRA_TIME + PRESS_MARGIN_END,
					wordIndex: w,
					letterIndex: i
				});
			});
		});
		if (browser) {
			document.addEventListener('keydown', this.handleKeyPress);
		}

		this.on('lose', () => {
			this.gameStarted = false;
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
				this.emit('lose', {
					mistype: key.key,
					wordIndex: mapKey.wordIndex,
					letterIndex: mapKey.letterIndex
				});
			}
		}
	}
}
