export interface ParsedMap {
	sections: MapSection[];
}
export interface MapSection {
	words: MapWord[];
}
export interface MapWord {
	text: string;
	missingLetters: number[];
}

export function parseMap(map: string): ParsedMap {
	return {
		sections: map.split(/\s*\n\n\s*/).map(parseSection)
	};
}

function parseSection(section: string): MapSection {
	return {
		words: section.split(/\s+/).map(parseWord)
	};
}

function parseWord(word: string): MapWord {
	const missingLetters = [];
	let isMissing = false;
	let offset = 0;
	for (let i = 0; i < word.length; i++) {
		const char = word[i];
		if (char === '[' || char === ']') {
			isMissing = !isMissing;
			offset++;
		} else if (isMissing) {
			missingLetters.push(i - offset);
		}
	}
	return {
		text: word.replace(/[\[\]]/g, ''),
		missingLetters
	};
}
