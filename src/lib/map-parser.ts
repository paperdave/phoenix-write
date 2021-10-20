export interface ParsedMap {
	words: MapWord[];
}
export interface MapWord {
	text: string;
	missingLetters: number[];
	start: number;
	isSectionStart: boolean;
	isWordJoiner: boolean;
}

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
	let [text, start] = word.split(':');
	const startTime = parseFloat(start);
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
		isWordJoiner
	};
}
