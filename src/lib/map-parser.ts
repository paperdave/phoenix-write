import type { MapWord, ParsedMap } from './types';

export function parseMap(map: string): ParsedMap {
	return {
		words: map
			.replace(/\r/g, '')
			// remove lines that start with #
			.split('\n')
			.filter((line) => !line.trim().startsWith('#'))
			.join('\n')
			.trim()
			.split(/\s*\n\n\s*/)
			.map(parseSection)
			.flat()
	};
}

function parseSection(section: string): MapWord[] {
	const words = section.split('\n').map(parseWord);
	words[0].isSectionStart = true;
	return words;
}

function parseWord(word: string): MapWord {
	let [text, rest] = word.split(':', 2);
	let [, startTimeText, rest2] = rest.trim().match(/^(\d+\.?\d*)(\s+{.*})?\s*$/);
	const startTime = parseFloat(startTimeText);
	const flags = rest2 ? parseFlags(rest2) : {};
	const missingLetters = [];
	const isWordJoiner = text.startsWith('-');
	if (isWordJoiner) {
		text = text.slice(1);
	}
	let actualIndex = 0;
	let isMissing = false;
	for (let i = 0; i < text.length; i++) {
		if (text[i] === '[' || text[i] === ']') {
			isMissing = !isMissing;
			continue;
		} else if (isMissing) {
			missingLetters.push(actualIndex);
		}
		actualIndex++;
	}
	return {
		text: text.replace(/\[|\]/g, ''),
		missingLetters,
		start: startTime,
		isSectionStart: false,
		isWordJoiner,
		flags
	};
}

function parseFlags(flags: string) {
	const result = {};
	const parts = flags.trim().slice(1, -1).split(',');
	for (const part of parts) {
		const [key, value] = part.split(':', 2);
		result[key.trim()] = value ? JSON.parse(value.trim()) : true;
	}
	return result;
}
