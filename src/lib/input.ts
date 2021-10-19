export interface KeyPress {
	key: string;
	time: number;
}

const keypressList: Set<KeyPress> = new Set();

export function initInputBullshit() {
	document.addEventListener('keydown', (event) => {
		keypressList.add({
			key: event.key,
			time: performance.now()
		});
	});
}

export function popKeyPresses(): KeyPress[] {
	const keypresses: KeyPress[] = [];
	keypressList.forEach((keypress) => {
		keypresses.push(keypress);
	});
	keypressList.clear();
	return keypresses;
}
