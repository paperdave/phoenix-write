<script lang="ts">
	import {
		playAudio,
		startMusic,
		startMusicInstant,
		stopMusic,
		stopMusicInstant
	} from '$lib/audio';
	import { isFocused } from '$lib/isFocused';

	const PRESS_MARGIN_END = 0.2;
	const PRESS_MARGIN_START = 0.2;

	import { currentMapId, setNextMap } from '$lib/stores';

	import type { LoadedCutscene } from '$lib/types';
	import { parseTimmyTimestamp } from '$lib/types';
	import { onDestroy } from 'svelte';
	import { fade, fly } from 'svelte/transition';

	export let cutscene: LoadedCutscene;

	let lost = false;

	function dependOn(...args: unknown[]) {}
	function unassociate<T>(arg: T) {
		return arg;
	}

	let videoElem: HTMLVideoElement;

	let currentSectionI = 0;
	$: currentSection = cutscene.subsection[currentSectionI];
	$: pauseTime = cutscene.subsection[currentSectionI]
		? cutscene.subsection[currentSectionI].end
			? parseTimmyTimestamp(cutscene.subsection[currentSectionI].end)
			: currentSectionI === cutscene.subsection.length - 1
			? videoElem.duration
			: parseTimmyTimestamp(cutscene.subsection[currentSectionI + 1].begin) + 1 / 120
		: 0;

	$: {
		if (videoElem && currentSection) {
			videoElem.pause();
			videoElem.currentTime =
				parseTimmyTimestamp(currentSection.begin) + 1 / 120 + 1 / cutscene.fps;
			videoElem.play();

			if (currentSectionI === 0) {
				if (cutscene.subsection[0].startMusic) {
					startMusicInstant(cutscene.subsection[0].startMusic);
				} else if (cutscene.subsection[0].startMusicFade) {
					startMusic(cutscene.subsection[0].startMusicFade);
				} else if (cutscene.bgm) {
					startMusic(cutscene.bgm);
				}
			}
		}
		if (!currentSection) {
			setNextMap(cutscene);
		}
	}

	$: done = (dependOn(videoElem, currentSectionI), false);
	$: hasPressedSpace = (dependOn(videoElem, currentSectionI), false);
	$: keyIndex = (dependOn(videoElem, currentSectionI), 0);

	function play() {
		let running = true;
		function stopHandler() {
			running = false;
			videoElem.removeEventListener('pause', stopHandler);
		}

		videoElem.addEventListener('pause', stopHandler);
		videoElem.play();

		let hasFadedOutMusic = false;

		requestAnimationFrame(function loop() {
			if (lost) return;
			if (!running) return;
			requestAnimationFrame(loop);

			if (
				currentSection.keys &&
				currentSection.keys.length &&
				keyIndex < currentSection.keys.length
			) {
				console.log(
					videoElem.currentTime,
					parseTimmyTimestamp(currentSection.keys[keyIndex].time) + PRESS_MARGIN_END
				);
				if (
					videoElem.currentTime >=
					parseTimmyTimestamp(currentSection.keys[keyIndex].time) + PRESS_MARGIN_END
				) {
					lose();
				}
			}

			if (
				currentSectionI === cutscene.subsection.length - 1 &&
				videoElem.currentTime >= pauseTime - 1 &&
				!hasFadedOutMusic
			) {
				stopMusic();
				hasFadedOutMusic = true;
			}

			if (videoElem.currentTime >= pauseTime - 1 / cutscene.fps) {
				running = false;
				done = true;
				videoElem.pause();
				unassociate(videoElem).currentTime = pauseTime;
				if (currentSection.autoplay) {
					currentSectionI++;
				}
			}
		});
	}

	const video = URL.createObjectURL(cutscene.video);

	onDestroy(() => {
		URL.revokeObjectURL(video);
	});

	function onKeyDown(event: KeyboardEvent) {
		if (lost) return;

		if (event.key === ' ' && !hasPressedSpace) {
			if (done) {
				hasPressedSpace = true;
				playAudio(currentSection.overrideSFX ?? 'dialogue_advance_default');

				if (!currentSection.flagNextSectionDoesntClear) {
					unassociate(videoElem).currentTime = videoElem.currentTime + 1 / cutscene.fps;
				}

				let nextSection = cutscene.subsection[currentSectionI + 1];
				if (nextSection) {
					let startMusicFade = nextSection.startMusicFade;
					if (startMusicFade) {
						startMusic(startMusicFade);
					} else if (nextSection.startMusic) {
						startMusicInstant(nextSection.startMusic);
					} else if (nextSection.endMusicFade) {
						stopMusic();
					} else if (nextSection.endMusic) {
						stopMusicInstant();
					}
				}

				setTimeout(() => {
					currentSectionI++;
				}, 170);
			} else if (!currentSection.unskippable) {
				videoElem.pause();
				unassociate(videoElem).currentTime = pauseTime;
				done = true;
			}
		}

		if (
			currentSection.keys &&
			currentSection.keys.length &&
			keyIndex < currentSection.keys.length
		) {
			if (event.key === currentSection.keys[keyIndex].key) {
				// check timing information
				let startAllowed =
					parseTimmyTimestamp(currentSection.keys[keyIndex].time) - PRESS_MARGIN_START;
				let endAllowed =
					parseTimmyTimestamp(currentSection.keys[keyIndex].time) + PRESS_MARGIN_START;

				let currentTime = videoElem.currentTime;

				if (currentTime >= startAllowed && currentTime <= endAllowed) {
					keyIndex++;
					playAudio('correctpluck');
				} else {
					lose();
				}
			} else {
				lose();
			}
		}
	}

	$: {
		if (!$isFocused) {
			videoElem.pause();
			function handleUnpause() {
				if (document.visibilityState === 'visible') {
					videoElem.play();
					document.removeEventListener('visibilitychange', handleUnpause);
				}
			}

			document.addEventListener('visibilitychange', handleUnpause);
		}
	}

	let isFadeToWhite = false;

	export function lose() {
		lost = true;
		stopMusicInstant();
		videoElem.pause();
		unassociate(videoElem).currentTime = parseTimmyTimestamp(currentSection.keys[keyIndex].time);

		if (currentSection.isBussinB) {
			playAudio('doomedfarewell');
			setTimeout(() => {
				isFadeToWhite = true;
			}, 500);
			setTimeout(() => {
				currentMapId.set('01-reddit-recap');
			}, 1500);
		}
	}
</script>

<svelte:window on:keydown={onKeyDown} />

<video src={video} bind:this={videoElem} on:play={play} />
{#if done && !hasPressedSpace && !currentSection.autoplay}
	<div class="bottom" in:fly={{ duration: 200, opacity: 0, y: 2 }} out:fade={{ duration: 100 }}>
		{@html currentSection.continueText ?? '(Press space to continue)'}
	</div>
{/if}

{#if isFadeToWhite}
	<div class="fade-to-white" in:fade={{ duration: 500 }} />
{/if}

<style>
	video {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		cursor: none;
	}
	.bottom {
		position: absolute;
		bottom: calc(var(--unit) * 1);
		left: 0;
		width: 100%;
		text-align: center;
		font-size: calc(var(--unit) * 2);
		color: white;
		opacity: 0.8;
		cursor: none;
	}
	.fade-to-white {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: white;
	}
</style>
