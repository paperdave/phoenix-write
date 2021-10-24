import { Howl } from 'howler';
import { delay } from './utils';

const audioMap = new Map<string, Howl>();

const MUSIC_VOLUME = 0.2;

export function registerAudio(audio: string) {
	if (audioMap.has(audio)) {
		return;
	}

	audioMap.set(
		audio,
		new Howl({
			src: [`sfx/${audio}.mp3`, `sfx/${audio}.webm`],
			preload: true,
			volume: 0,
			loop: false,
			autoplay: true
		})
	);

	audioMap.set(`${audio}.mp3`, audioMap.get(audio));
}

export function playAudio(audio: string) {
	const howl = audioMap.get(audio);
	if (howl) {
		let soundid = howl.play();
		howl.volume(1, soundid);
	} else {
		console.warn(`Audio ${audio} not found`);
	}
}

let currentMusic: string | undefined;
let currentMusicId: number | undefined;

export async function startMusicInstant(audio: string) {
	const music = audioMap.get(audio);

	if (!music) {
		console.warn(`Music ${audio} not found`);
		return;
	}

	const current = audioMap.get(currentMusic);
	if (current) {
		current.stop();
		await delay(150);
	}

	currentMusic = audio;
	currentMusicId = music.play();
	music.volume(MUSIC_VOLUME, currentMusicId);
	music.loop(true, currentMusicId);
}

export async function stopMusicInstant() {
	const current = audioMap.get(currentMusic);
	if (current) {
		current.stop();
		await delay(150);
		currentMusic = undefined;
	}
}

export async function stopMusic() {
	const current = audioMap.get(currentMusic);
	if (current) {
		currentMusic = undefined;
		currentMusicId = undefined;

		current.fade(MUSIC_VOLUME, 0, 1000, currentMusicId);
		await delay(1000);
		current.stop();
	}
}

export async function startMusic(audio: string) {
	if (currentMusic === audio) {
		return;
	}

	await stopMusic();

	const music = audioMap.get(audio);
	if (!music) {
		console.warn(`Music ${audio} not found`);
		return;
	}

	currentMusic = audio;
	currentMusicId = music.play();
	music.volume(0, currentMusicId);
	music.loop(true, currentMusicId);
	music.fade(0, MUSIC_VOLUME, 1000, currentMusicId);
}

export function loadRequiredAudio() {
	// 'dialogue_advance_default',
	// 'bgm1'
	registerAudio('dialogue_advance_default');
	registerAudio('bgm1');
}

export function loadRestAudio() {
	const audioList = [
		'b0',
		'b1',
		'b2',
		'b3',
		'b4',
		'b5',
		'b6',
		'b7',
		'b8',
		'doomedfarewell',
		'lose',
		'boyscorrect'
	];

	for (const audio of audioList) {
		registerAudio(audio);
	}
}
