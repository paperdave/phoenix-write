import { fabric } from 'fabric';
import { initInputBullshit, popKeyPresses } from './input';
import type { KeyPress } from './input';

class ActionVisual extends fabric.Group {
	hitTime: number | null = null;
	hitTimeOffset: number | null = null;

	objFrame = new fabric.Rect({
		fill: '#fff',
		stroke: '#000',
		strokeWidth: 5,
		width: 80,
		height: 80
	});

	objText = new fabric.Text('', {
		fontSize: 20,
		fontFamily: 'Arial',
		fill: '#000',
		textAlign: 'center',
		originX: 'center',
		originY: 'center',
		left: 40,
		top: 40
	});

	constructor(public action: GameAction) {
		super();

		this.objText.text = action.key;

		this.addWithUpdate(this.objFrame);
		this.addWithUpdate(this.objText);

		this.left = action.x;
		this.top = action.y;
	}

	update(time: number) {
		this.objFrame.set('fill', time > this.action.time ? '#f00' : '#fff');
	}
}

let currentKeypresses: KeyPress[];

let startTime = performance.now();

interface GameAction {
	x: number;
	y: number;
	key: string;
	time: number;
}

const actions: GameAction[] = [
	{ x: 100, y: 100, key: 'a', time: 4000 },
	{ x: 200, y: 100, key: 'b', time: 5000 },
	{ x: 300, y: 100, key: 'c', time: 6000 },
	{ x: 400, y: 100, key: 'd', time: 7000 }
];

const actionVisuals = actions.map((action) => new ActionVisual(action));

const keyListByKey: { [key: string]: ActionVisual[] } = {};

actionVisuals.forEach((visual) => {
	if (!keyListByKey[visual.action.key]) {
		keyListByKey[visual.action.key] = [];
	}
	keyListByKey[visual.action.key].push(visual);
});

export function init(elem: HTMLCanvasElement) {
	initInputBullshit();

	const canvas = new fabric.StaticCanvas(elem);
	canvas.setWidth(innerWidth);
	canvas.setHeight(innerHeight);
	canvas.backgroundColor = '#fff';

	canvas.add(...actionVisuals);

	const timeText = new fabric.Text('', {
		fontSize: 20,
		fontFamily: 'Arial',
		fill: '#000'
	});

	canvas.add(timeText);

	function frame() {
		const time = performance.now() - startTime;

		timeText.text = `${time}ms`;

		currentKeypresses = popKeyPresses();

		if (currentKeypresses.length) {
			currentKeypresses.forEach((keyPress) => {
				const action = keyListByKey[keyPress.key]?.[0];
				if (action) {
					action.hitTime = time;
					action.hitTimeOffset = action.hitTime - action.action.time;
					keyListByKey[keyPress.key].shift();
				} else {
					console.log('miss');
				}
			});
		}

		actionVisuals.forEach((visual) => visual.update(time));

		canvas.renderAll();

		requestAnimationFrame(frame);
	}

	requestAnimationFrame(frame);

	canvas.renderAll();
}
