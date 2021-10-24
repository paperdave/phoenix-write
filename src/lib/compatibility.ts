const video = document.createElement('video');
export const canPlayVP9 = video.canPlayType('video/webm; codecs="vp9, vorbis"');
video.remove();
