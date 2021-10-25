import { browser } from '$app/env';

function compatCheck() {
	if (!browser) return false;
	const video = document.createElement('video');
	const canPlayVP9 = video.canPlayType('video/webm; codecs="vp9, vorbis"') === 'probably';
	video.remove();
	return canPlayVP9;
}

export const canPlayVP9 = compatCheck();
