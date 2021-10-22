import { Howl, Howler } from 'howler';

const audioList = ['dialogue_advance_default'];

const audioMap = new Map<string, Howl>();

audioList.forEach((audio) => {
	audioMap.set(
		audio,
		new Howl({
			src: [`sfx/${audio}.mp3`, `sfx/${audio}.webm`],
			preload: true,
			html5: true
		})
	);
});

export function playAudio(audio: string) {
	audioMap.get(audio).play();
}
