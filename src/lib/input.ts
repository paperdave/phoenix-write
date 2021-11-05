import { browser } from '$app/env';
import EventEmitter from 'eventemitter3';
import type { LoadedLevel, MapWord } from './types';
import { parseTimmyTimestamp } from './types';

export const WORD_PENALTY = 4;
export const WORD_PENALTY_2 = 3;
export const WORD_PENALTY_3 = 1.5;

export const PRESS_MARGIN_START = 0.3;
export const PRESS_MARGIN_END = 0.65;
export const LETTER_EXTRA_TIME = 0.1;

export interface KeyPress {
	key: string;
	time: number;
}

export interface MapKeyPress {
	// This keypress is the [index]th key to press in the current word.
	index: number;
	// The key to press.
	key: string;
	// Time before which you pressed this key too early.
	start: number;
	// Time after which you pressed this key too late.
	end: number;
	// This keypress is part of the [wordIndex]th word in the whole map.
	wordIndex: number;
	// The index within the underlyingWord at which this keypress appears.
	letterIndex: number;
	// The word this keypress is a part of.
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

	wp2 = WORD_PENALTY_2;
	marker = 0;

	popKeyPresses(): KeyPress[] {
		const keypresses: KeyPress[] = [];
		this.keypressList.forEach((keypress) => {
			keypresses.push(keypress);
		});
		this.keypressList.clear();
		return keypresses;
	}

	handleKeyPress = (event: KeyboardEvent) => {
		if (event.key === ' ') return;
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
			let wordsToRewind = WORD_PENALTY;
			this.rewoundWord = this.currentWord;
			//console.log(this.currentWord, this.marker);
			if (this.currentWord < this.marker) {
				wordsToRewind += this.wp2;
				this.wp2 += WORD_PENALTY_3;
			} else {
				this.wp2 = WORD_PENALTY_2;
			}

			// Clamps penalty to a certain value at certain sections, to avoid having to sit through long gaps of silence.
			if(this.mapKeyPresses[this.currentWord].underlyingWord.flags.clampPenalty != null)
			{
				if(wordsToRewind > this.mapKeyPresses[this.currentWord].underlyingWord.flags.clampPenalty)
				{
					console.log("TOO HIGH PENALTY: " + wordsToRewind);
					wordsToRewind = this.mapKeyPresses[this.currentWord].underlyingWord.flags.clampPenalty;
					console.log("   BETTER LOW PENALTY: " + wordsToRewind);
				}
			}


			while (wordsToRewind > 0) {
				this.rewoundWord--;
				if (this.rewoundWord === 0) break;
				if (
					this.mapKeyPresses[this.rewoundWord].letterIndex === 0 &&
					!this.mapKeyPresses[this.rewoundWord].underlyingWord.isWordJoiner
				) {
					wordsToRewind--;
				}
			}

			this.marker =
				this.rewoundWord === 0 ? 0 : (this.rewoundWord + 2 * this.currentWord) / 3 + 3.5;
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

			// Check if the forgivenessString has been initialized yet
			if (typeof mapKey.underlyingWord.flags.forgivenessString === typeof undefined) {
				// Populate the forgivenessString. First, make sure this isn't the first word.
				if (this.currentWord) {
					// Substring every character BEFORE this keypress.
					let nonPressesBeforeCurrentKeypress = '';
					if (mapKey.letterIndex > 0) {
						nonPressesBeforeCurrentKeypress = mapKey.underlyingWord.text.substring(
							0,
							mapKey.letterIndex - 1
						);
					}
					// Add that bit to the in between flag we loaded in map-parser.ts's parseSection.
					let nonPressWords = '';
					if (
						typeof mapKey.underlyingWord.flags.wordsRightBeforeThisOneWithoutMissingLetters !=
						'undefined'
					)
						nonPressWords =
							mapKey.underlyingWord.flags.wordsRightBeforeThisOneWithoutMissingLetters;
					mapKey.underlyingWord.flags.forgivenessString =
						nonPressWords + nonPressesBeforeCurrentKeypress;
					//console.log(
					//	mapKey.underlyingWord.flags.forgivenessString + ' is the current forgiveness.'
					//);
				}
			}
			// Now just add the first letter of forgivenessString to the whitelist.
			if (mapKey.underlyingWord.flags.forgivenessString.length) {
				mapKey.underlyingWord.flags.allowedCharacters = [
					mapKey.underlyingWord.flags.forgivenessString[0]
				];
			}

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

					let offset =
						mapKey.letterIndex !== 0
							? keyTime < mapKey.end - PRESS_MARGIN_END
								? 0
								: Math.abs(mapKey.end - PRESS_MARGIN_END - keyTime)
							: Math.abs(mapKey.start + PRESS_MARGIN_START - keyTime);

					this.currentWord++;
					this.emit('key', {
						key: key.key,
						wordIndex: mapKey.wordIndex,
						letterIndex: mapKey.letterIndex,
						offset: offset
					});
				} else {
					// Destroy the forgiveness string so it repopulates.
					for (let x = 0; x < this.mapKeyPresses.length; x++)
						this.mapKeyPresses[x].underlyingWord.flags.forgivenessString = undefined;

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
					// Destroy the forgiveness strings so they repopulate.
					for (let x = 0; x < this.mapKeyPresses.length; x++)
						this.mapKeyPresses[x].underlyingWord.flags.forgivenessString = undefined;

					this.emit('lose', {
						mistype: key.key,
						wordIndex: mapKey.wordIndex,
						letterIndex: mapKey.letterIndex
					});
				} else {
					// Remove the first letter from the forgivenessString if there are any left
					if (mapKey.underlyingWord.flags.forgivenessString.length) {
						mapKey.underlyingWord.flags.forgivenessString =
							mapKey.underlyingWord.flags.forgivenessString.substring(1);
						// console.log("The forgiveness string is now " + mapKey.underlyingWord.flags.forgivenessString);
					}
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
