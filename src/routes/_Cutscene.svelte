<script lang="ts">
	import {
		playAudio,
		startMusic,
		startMusicInstant,
		stopMusic,
		stopMusicInstant
	} from '$lib/audio';
	import { isFocused } from '$lib/isFocused';
	import { setScreenshake, setScreenshake2 } from '$lib/screenshake';

	const PRESS_MARGIN_END = 0.15;
	const PRESS_MARGIN_START = 0.15;

	import { currentMapId, setNextMap } from '$lib/stores';

	import type { LoadedCutscene } from '$lib/types';
	import { parseTimmyTimestamp } from '$lib/types';
	import { onDestroy } from 'svelte';
	import { fade, fly } from 'svelte/transition';

	export let cutscene: LoadedCutscene;

	let lost = false;

	let didAutoPlayOnce = false;

	const boysString = 'bbbbbbooooooyyyyyysssssss';
	const sounds = [
		'b0',
		'b0',
		'b0',
		'b1',
		'b1',
		'b1',
		'b1',
		'b1',
		'b2',
		'b2',
		'b2',
		'b2',
		'b3',
		'b3',
		'b3',
		'b3',
		'b4',
		'b4',
		'b5',
		'b5',
		'b6',
		'b6',
		'b7',
		'b7',
		'b8',
		'boyscorrect'
	];

	let boysIndex = 0;
	let boysWon = false;

	let slap = false;

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
			? videoElem?.duration
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
				currentSection.shake &&
				!didshake &&
				videoElem.currentTime > parseTimmyTimestamp(currentSection.shake)
			) {
				didshake = true;
				setScreenshake2();
			}
			if (
				currentSection.playqtslap &&
				!slap &&
				videoElem.currentTime > parseTimmyTimestamp(currentSection.playqtslap)
			) {
				slap = true;
				setScreenshake();
				playAudio('seriousBusinessSlapNoise');
			}

			if (
				currentSection.keys &&
				currentSection.keys.length &&
				keyIndex < currentSection.keys.length
			) {
				if (
					videoElem.currentTime >=
					parseTimmyTimestamp(currentSection.keys[keyIndex].time) + PRESS_MARGIN_END
				) {
					lose(parseTimmyTimestamp(currentSection.keys[keyIndex].time));
				}
			}

			if (
				currentSection.heartFlag &&
				!heartWon &&
				videoElem.currentTime > parseTimmyTimestamp(currentSection.heartFlag)
			) {
				lose(parseTimmyTimestamp(currentSection.heartFlag));
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
					if (
						currentSection[
							'hardcoded flag Autoplay Only once. but this flag only is supported on this subsection and it wont work properly on any other sections'
						]
					) {
						if (didAutoPlayOnce) {
							return;
						}
						didAutoPlayOnce = true;
					}
					currentSectionI++;
				}
			}
		});
	}

	const video = URL.createObjectURL(cutscene.video);

	onDestroy(() => {
		URL.revokeObjectURL(video);
	});

	let heartBuffer = '';
	let heartWon = false;
	let didshake = false;

	const validHeartPhrases = [
		'heart',
		'sparkling_heart',
		'sparklingheart',
		'<3',
		',3',
		'<#',
		',#',
		'💖',
		'❤️',
		'💗',
		'💓',
		'💝',
		'💞',
		'wtf',
		'killyourself',
		'love',
		'wuv'
	];

	function onKeyDown(event: KeyboardEvent) {
		if (event.ctrlKey || event.altKey || event.metaKey) return;
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
		if (event.key === ' ') return;

		if (currentSection.heartFlag && event.key.length === 1) {
			heartBuffer += event.key.toLowerCase().trim();

			const found = validHeartPhrases.find((phrase) => heartBuffer.includes(phrase));
			if (found) {
				heartWon = true;
			}
		}

		if (
			currentSection.keys &&
			currentSection.keys.length &&
			keyIndex < currentSection.keys.length &&
			event.key.length === 1
		) {
			if (
				currentSection.keys[keyIndex].key === '%'
					? // hardcoded
					  ['%', '5'].includes(event.key)
					: // regular
					  event.key === currentSection.keys[keyIndex].key
			) {
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

		if (currentSection.theBoys && !boysWon) {
			let requiredKey = boysString.charAt(boysIndex);
			if (event.key === requiredKey) {
				boysIndex++;
				playAudio(sounds[boysIndex]);
				if (boysIndex === boysString.length) {
					boysWon = true;
				}
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

	export function lose(time?: number) {
		lost = true;
		videoElem.pause();

		unassociate(videoElem).currentTime =
			time ?? parseTimmyTimestamp(currentSection.keys[keyIndex].time) ?? videoElem.currentTime;

		if (currentSection.isBussinB) {
			playAudio('doomedfarewell');
			stopMusicInstant();
			setTimeout(() => {
				isFadeToWhite = true;
			}, 500);
			setTimeout(() => {
				currentMapId.set('01-reddit-recap');
			}, 1500);
		} else {
			playAudio('screwup');
			setTimeout(() => {
				isFadeToWhite = true;
			}, 500);
			setTimeout(() => {
				isFadeToWhite = false;
				slap = false;
				boysIndex = 0;
				boysWon = false;
				heartBuffer = '';
				heartWon = false;
				keyIndex = 0;
				lost = false;
				done = false;
				currentSectionI = Math.max(0, currentSectionI - 1);
				currentSection = cutscene.subsection[currentSectionI];
			}, 1500);
		}
	}
</script>

<svelte:window on:keydown={onKeyDown} />

<video src={video} bind:this={videoElem} on:play={play} disablePictureInPicture />
{#if done && !hasPressedSpace}
	<div class="bottom" in:fly={{ duration: 200, opacity: 0, y: 2 }} out:fade={{ duration: 100 }}>
		{@html currentSection.continueText ?? '(Press space to continue)'}
	</div>
{/if}

{#if isFadeToWhite}
	<div class="fade-to-white" transition:fade={{ duration: 500 }} />
{/if}

{#if currentSection && currentSection.theBoys}
	<div class="THEBOYS">
		{#each boysString as char, i}
			<span class:hit={boysIndex > i}>{char.toUpperCase()}</span>
		{/each}
	</div>
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
	.THEBOYS {
		position: absolute;
		top: calc(var(--unit) * 43);
		left: calc(var(--unit) * 10.75);
		font-size: calc(var(--unit) * 3.5);
		letter-spacing: calc(var(--unit) * 0.25);
		color: rgba(255, 255, 255, 0.5);
		animation: appearboys 1s linear both;
	}
	.THEBOYS span {
		display: inline-block;
	}
	.hit {
		color: white;
		animation: BOUNCER 0.3s ease-out both;
	}

	@keyframes appearboys {
		0% {
			opacity: 0;
		}
		100% {
			opacity: 1;
		}
	}

	@keyframes BOUNCER {
		0% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-10px);
		}
		100% {
			transform: translateY(0);
		}
	}
</style>
