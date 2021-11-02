import type { MapWord, ParsedMap, WordFlags } from './types';
import { parseTimmyTimestamp } from './types';
import JSON5 from 'json5';

let isRapper = false;

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

	// Um, hate to say it, but I have to make this code hella ugly so that words know about joiners that came before.
	// Basically, we're packing every previous word WITHOUT MISSING LETTERS into a new flag.

	for(let x = 1; x < words.length; x++)
	{


		let finalString = "";
		let distanceSearchedBackwards = 1;
		
		// Step backwards as long as index remains above 0, and words have no missing letters.
		while( x - distanceSearchedBackwards > 0	
		&& !words[x - distanceSearchedBackwards].missingLetters.length )
		{
			// We're adding all the in-between words that don't have any missing letters.
			finalString = words[x - distanceSearchedBackwards].text.replace(/\s/g, '') + finalString;
			distanceSearchedBackwards++;
		}

		// At this point in the code, x - distanceSearchedBackwards yields the first index with missing letters
		// as long as the index itself is still greater than 0. (Condition 2 is unsatisfied above, but condition 1 IS still satisfied.)
		if( x - distanceSearchedBackwards > 0)
		{
			// In this case, we need to add every letter AFTER the last missing letter to the beginning of finalString.
			let lastIndex = words[x - distanceSearchedBackwards].missingLetters.length - 1;
			let firstWordWithMissingLetterFound = words[x - distanceSearchedBackwards].text
			let remainder = firstWordWithMissingLetterFound.substring(words[x - distanceSearchedBackwards].missingLetters[lastIndex] + 1);
			finalString = remainder + finalString;
		}
		words[x].flags.wordsRightBeforeThisOneWithoutMissingLetters = finalString;
		console.log(finalString + " is the final string for word " + words[x].text);
	}

	return words;
}

function parseWord(word: string): MapWord {
	try {
		let [text, ...rest] = word.split(':');
		let [, startTimeText, rest2] = rest
			.join(':')
			.trim()
			.match(/^([ \t,\[\]0-9\.]+)(\s+{.*})?\s*$/);
		const startTime = parseTimmyTimestamp(
			JSON5.parse(startTimeText.replace(/\b0+([0-9]+)/g, '$1'))
		);
		const flags = rest2 ? parseFlags(rest2) : {};
		const missingLetters = [];
		const isWordJoiner = text.startsWith('-');
		console.log(text, isWordJoiner);
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
		if (flags.replacingQTCinderellaTheRapperLudwigHiredOnFiverOneYearAgoStartsRappingHere) {
			isRapper = true;
		} else if (flags.replacingTheRapperLudwigHiredOnFiverOneYearAgoQTCinderellaResumesSingingHere) {
			isRapper = false;
		}
		
		return {
			text: text.replace(/\[|\]/g, ''),
			missingLetters,
			start: startTime,
			isSectionStart: false,
			isWordJoiner,
			flags,
			isRapperStyle: isRapper
		};
	} catch (error) {
		console.log('failed to parse the following:' + word);
	}
}

function parseFlags(flags: string) {
	const result: WordFlags = {};

	const flagContents = flags.trim().slice(1, -1);

	let state = 'key';
	let flagName = '';
	let flagValue = '';
	let stack = 0;

	for (const char of flagContents) {
		if (state === 'key') {
			if (char === ':') {
				state = 'value';
			} else if (char === ',') {
				result[flagName] = true;
				flagName = '';
				flagValue = '';
				state = 'key';
			} else {
				flagName += char;
			}
		} else if (state === 'value') {
			if (char === '{' || char === '[' || char === '(') {
				stack++;
			} else if (char === '}' || char === ']' || char === ')') {
				stack--;
			}

			if (stack === 0 && char === ',') {
				result[flagName.trim()] = JSON5.parse(flagValue.trim().replace(/\b0+([0-9]+)/g, '$1'));
				flagName = '';
				flagValue = '';
				state = 'key';
			} else {
				flagValue += char;
			}
		}
	}

	if (flagName) {
		result[flagName.trim()] = flagValue
			? JSON5.parse(flagValue.trim().replace(/\b0+([0-9]+)/g, '$1'))
			: true;
	}

	return result;
}
