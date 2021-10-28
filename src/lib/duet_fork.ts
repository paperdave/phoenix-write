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
	whoStarts = 'qt';
	rewoundWordQt = 0;
	rewoundWordLud = 0;
	canPlay = true;
	keypressList = new Set<DuetKeyPress>();
	startTime = 0;
	gameStarted = false;
	mapKeyPressesLud: DuetMapKeyPress[] = [];
	mapKeyPressesQt: DuetMapKeyPress[] = [];
	currentWordLud = 0;
	currentWordQt = 0;
	introductionEnd = 0;
	isIntroGame = true;
	won = false;
	latestCheckpoint = 0;

	popKeyPresses(): DuetKeyPress[] {
		const keypresses: DuetKeyPress[] = [];
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
			if (this.whoStarts === 'qt') {
				if (
					event.key.toLowerCase() === this.mapKeyPressesQt[this.rewoundWordQt].key.toLowerCase()
				) {
					this.gameStarted = true;
					this.currentWordQt = this.rewoundWordQt + 1;
					this.currentWordLud = this.rewoundWordLud;
					this.popKeyPresses();
					this.emit('start');
					this.emit('qt', {
						key: event.key,
						wordIndex: this.rewoundWordQt,
						letterIndex: 0
					});
				}
			} else {
				if (
					event.key.toLowerCase() === this.mapKeyPressesLud[this.rewoundWordLud].key.toLowerCase()
				) {
					this.gameStarted = true;
					this.currentWordLud = this.rewoundWordLud + 1;
					this.currentWordQt = this.rewoundWordQt;
					this.popKeyPresses();
					this.emit('start');
					this.emit('lud', {
						key: event.key,
						wordIndex: this.rewoundWordLud,
						letterIndex: 0
					});
				}
			}
		} else {
			this.keypressList.add({
				key: event.key,
				time
			});
		}
	};

	constructor(readonly map: LoadedDuet) {
		super();
		map.wordsLud.forEach((word, w) => {
			let index = 0;
			word.missingLetters.forEach((i, j) => {
				if (i === 0 && w === 0) {
					this.introductionEnd = word.start - PRESS_MARGIN_START;
				}
				this.mapKeyPressesLud.push({
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
		map.wordsQt.forEach((word, w) => {
			let index = 0;
			word.missingLetters.forEach((i, j) => {
				if (i === 0 && w === 0) {
					this.introductionEnd = word.start - PRESS_MARGIN_START;
				}
				this.mapKeyPressesQt.push({
					index: index++,
					key: word.text[i],
					start: word.start - PRESS_MARGIN_START,
					end:
						parseTimmyTimestamp(
							word.flags.lenient
								? map.wordsQt[w + 1].start
								: word.flags.endTime ?? word.start + word.text.length * LETTER_EXTRA_TIME
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
			let wordsRewound = 0;

			this.rewoundWordLud = this.currentWordLud;
			this.rewoundWordQt = this.currentWordQt;

			let whoIsLatest = 'qt';

			while (wordsRewound < WORD_PENALTY) {
				if (this.rewoundWordQt === 0) {
					this.whoStarts = 'qt';
					break;
				}

				// get latest word
				const latestLudWord = this.rewoundWordLud > 0 && this.mapKeyPressesLud[this.rewoundWordLud];
				const latestQtWord = this.rewoundWordQt > 0 && this.mapKeyPressesQt[this.rewoundWordQt];

				whoIsLatest = latestLudWord
					? latestQtWord
						? latestLudWord.start > latestQtWord.start
							? 'lud'
							: 'qt'
						: 'lud'
					: latestQtWord
					? 'qt'
					: 'WHO';

				if (whoIsLatest === 'lud') {
					if (
						this.mapKeyPressesLud[this.rewoundWordLud].letterIndex === 0 &&
						!this.mapKeyPressesLud[this.rewoundWordLud].underlyingWord.isWordJoiner
					) {
						wordsRewound++;
						if (wordsRewound >= WORD_PENALTY) {
							this.whoStarts = 'lud';
							this.rewoundWordQt++;
							break;
						}
					}
					this.rewoundWordLud--;
				} else if (whoIsLatest === 'qt') {
					if (
						this.mapKeyPressesQt[this.rewoundWordQt].letterIndex === 0 &&
						!this.mapKeyPressesQt[this.rewoundWordQt].underlyingWord.isWordJoiner
					) {
						wordsRewound++;
						if (wordsRewound >= WORD_PENALTY) {
							this.whoStarts = 'qt';
							this.rewoundWordLud++;
							break;
						}
					}
					this.rewoundWordQt--;
				} else {
					break;
				}
			}
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
		if (this.currentWordLud >= this.mapKeyPressesLud.length && !this.won) {
			this.emit('win');
			this.won = true;
		}
		if (this.won) return;
		if (keypresses.length === 0) {
			const currentTime = (performance.now() - this.startTime) / 1000;
			const mapKey = this.mapKeyPressesLud[this.currentWordLud];
			if (currentTime > mapKey.end) {
				this.emit('lose', {
					tooLate: true
				});
			}
			const mapKey2 = this.mapKeyPressesQt[this.currentWordQt];
			if (currentTime > mapKey2.end) {
				this.emit('lose', {
					tooLate: true
				});
			}
		}
		while (keypresses.length > 0) {
			const key = keypresses.shift();
			const keyTime = (key.time - this.startTime) / 1000;

			let lud = this.ludTickKey(key);
			let qt = this.qtTickKey(key);

			if (qt === 'lenientignore') {
				return;
			}

			if ((lud === 'failure' || lud === 'early') && (qt === 'failure' || qt === 'early')) {
				// fight over which ones sooner
				const ludWord = this.mapKeyPressesLud[this.currentWordLud];
				const qtWord = this.mapKeyPressesQt[this.currentWordQt];
				if (ludWord.start < qtWord.start) {
					qt = null;
				} else {
					lud = null;
				}
			}
			if ((lud === 'failure' || lud === 'early') && qt === null) {
				const mapKey = this.mapKeyPressesLud[this.currentWordLud];
				if (lud === 'early') {
					this.emit('lose', {
						tooEarly: true
					});
				} else {
					this.emit('lose', {
						tooLate: false,
						wordIndex: mapKey.wordIndex,
						letterIndex: mapKey.letterIndex,
						mistype: key.key,
						who: 'lud'
					});
				}
			}
			if (lud === null && (qt === 'failure' || qt === 'early')) {
				const mapKey = this.mapKeyPressesQt[this.currentWordQt];
				if (qt === 'early') {
					this.emit('lose', {
						tooEarly: true
					});
				} else {
					this.emit('lose', {
						tooLate: false,
						wordIndex: mapKey.wordIndex,
						letterIndex: mapKey.letterIndex,
						mistype: key.key,
						who: 'qt'
					});
				}
			}

			if (lud === 'success' && qt === 'success') {
				// fight over which ones sooner
				const ludWord = this.mapKeyPressesLud[this.currentWordLud];
				const qtWord = this.mapKeyPressesQt[this.currentWordQt];
				if (ludWord.start < qtWord.start) {
					qt = null;
				} else {
					lud = null;
				}
				// now it falls thoogh
			}

			if (
				(lud === 'success' && (qt === 'failure' || qt === 'early')) || //
				(lud === 'success' && qt === null)
			) {
				const mapKey = this.mapKeyPressesLud[this.currentWordLud];
				let offset =
					mapKey.letterIndex !== 0
						? keyTime < mapKey.end - PRESS_MARGIN_END
							? 0
							: Math.abs(mapKey.end - PRESS_MARGIN_END - keyTime)
						: Math.abs(mapKey.start + PRESS_MARGIN_START - keyTime);
				this.emit('lud', {
					key: key.key,
					wordIndex: mapKey.wordIndex,
					letterIndex: mapKey.letterIndex,
					offset
				});
				this.currentWordLud++;
			}

			if (
				((lud === 'failure' || lud === 'early') && qt === 'success') || //
				(lud === null && qt === 'success')
			) {
				const mapKey = this.mapKeyPressesQt[this.currentWordQt];
				let offset =
					mapKey.letterIndex !== 0
						? keyTime < mapKey.end - PRESS_MARGIN_END
							? 0
							: Math.abs(mapKey.end - PRESS_MARGIN_END - keyTime)
						: Math.abs(mapKey.start + PRESS_MARGIN_START - keyTime);
				this.emit('qt', {
					key: key.key,
					wordIndex: mapKey.wordIndex,
					letterIndex: mapKey.letterIndex,
					offset
				});
				this.currentWordQt++;
			}
		}
	}

	ludTickKey(key: DuetKeyPress) {
		const keyTime = (key.time - this.startTime) / 1000;
		const mapKey = this.mapKeyPressesLud[this.currentWordLud];
		if (key.key.toLowerCase() === mapKey.key.toLowerCase()) {
			if (keyTime > mapKey.start && keyTime < mapKey.end) {
				if (
					mapKey.underlyingWord.text[mapKey.underlyingWord.missingLetters[0]].toLowerCase() ===
					key.key.toLowerCase()
				) {
					if (mapKey.underlyingWord.flags.checkpoint) {
						this.latestCheckpoint = this.currentWordLud;
					}
				}

				return 'success';
			} else {
				return 'failure';
			}
		} else {
			if (
				!(mapKey.underlyingWord.flags.allowedCharacters || [])
					.map((x) => x.toLowerCase())
					.includes(key.key.toLowerCase())
			) {
				if (keyTime > mapKey.start && keyTime < mapKey.end) {
					if (
						mapKey.underlyingWord.text[mapKey.underlyingWord.missingLetters[0]].toLowerCase() ===
						key.key.toLowerCase()
					) {
						if (mapKey.underlyingWord.flags.checkpoint) {
							this.latestCheckpoint = this.currentWordLud;
						}
					}

					return 'early';
				} else {
					return 'failure';
				}
			}
		}
		return null;
	}

	qtTickKey(key: DuetKeyPress) {
		const mapKey = this.mapKeyPressesQt[this.currentWordQt];
		if (!mapKey) return null;
		const keyTime = (key.time - this.startTime) / 1000;
		if (key.key.toLowerCase() === mapKey.key.toLowerCase()) {
			if (keyTime > mapKey.start && keyTime < mapKey.end) {
				if (
					mapKey.underlyingWord.text[mapKey.underlyingWord.missingLetters[0]].toLowerCase() ===
					key.key.toLowerCase()
				) {
					if (mapKey.underlyingWord.flags.checkpoint) {
						this.latestCheckpoint = this.currentWordQt;
					}
				}

				return 'success';
			} else {
				return 'failure';
			}
		} else {
			if (
				this.mapKeyPressesQt[this.currentWordQt - 1].underlyingWord.flags.lenient &&
				this.mapKeyPressesQt[this.currentWordQt - 1].key === key.key
			) {
				return 'lenientignore';
			}
			if (
				!(mapKey.underlyingWord.flags.allowedCharacters || [])
					.map((x) => x.toLowerCase())
					.includes(key.key.toLowerCase())
			) {
				if (keyTime > mapKey.start && keyTime < mapKey.end) {
					if (
						mapKey.underlyingWord.text[mapKey.underlyingWord.missingLetters[0]].toLowerCase() ===
						key.key.toLowerCase()
					) {
						if (mapKey.underlyingWord.flags.checkpoint) {
							this.latestCheckpoint = this.currentWordQt;
						}
					}

					return 'failure';
				} else {
					return 'early';
				}
			}
		}
		return null;
	}

	unfocusLoss() {
		this.emit('lose', {
			unfocused: true
		});
	}
}
