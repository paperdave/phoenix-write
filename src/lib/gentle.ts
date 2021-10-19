export interface Gentle {
	transcript: string;
	words: Word[];
}

export type Word = WordSuccess | WordNotFoundInTranscript;

export interface WordSuccess {
	case: 'success';
	alignedWord: string;
	phones: Phone[];
	end: number;
	endOffset: number;
	start: number;
	startOffset: number;
	word: string;
}

export interface WordNotFoundInTranscript {
	case: 'not-found-in-transcript';
	phones: Phone[];
	end: number;
	start: number;
	word: string;
}

export interface Phone {
	duration: number;
	phone: string;
}
