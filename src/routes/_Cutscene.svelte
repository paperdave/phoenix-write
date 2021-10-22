<script lang="ts">
	import { playAudio } from '$lib/audio';

	import { getMapList } from '$lib/map-registry';

	import { currentLevelId } from '$lib/stores';

	import type { LoadedCutscene, TimmyTimestamp } from '$lib/types';
	import { onDestroy } from 'svelte';
	import { fade, fly } from 'svelte/transition';

	export let cutscene: LoadedCutscene;

	function dependOn(...args: unknown[]) {}
	function unassociate<T>(arg: T) {
		return arg;
	}

	function convertTT(time: TimmyTimestamp) {
		return time[0] + time[1] / cutscene.fps;
	}

	let videoElem: HTMLVideoElement;

	let currentSectionI = 0;
	$: currentSection = cutscene.subsection[currentSectionI];
	$: pauseTime = cutscene.subsection[currentSectionI]
		? cutscene.subsection[currentSectionI].end
			? convertTT(cutscene.subsection[currentSectionI].end)
			: currentSectionI === cutscene.subsection.length - 1
			? videoElem.duration
			: convertTT(cutscene.subsection[currentSectionI + 1].begin) + 1 / 120
		: 0;

	$: {
		if (videoElem && currentSection) {
			videoElem.pause();
			videoElem.currentTime = convertTT(currentSection.begin) + 1 / 120 + 1 / cutscene.fps;
			videoElem.play();
		}
		if (!currentSection) {
			getMapList().then((list) => {
				const i = list.findIndex(({ key }) => key === cutscene.key);
				const next = list[i + 1];
				console.log(next);
				$currentLevelId = next.key;
			});
		}
	}

	$: done = (dependOn(videoElem, currentSectionI), false);
	$: hasPressedSpace = (dependOn(videoElem, currentSectionI), false);

	function play() {
		let running = true;
		function stopHandler() {
			running = false;
			videoElem.removeEventListener('pause', stopHandler);
		}

		videoElem.addEventListener('pause', stopHandler);
		videoElem.play();

		requestAnimationFrame(function loop() {
			if (!running) return;
			requestAnimationFrame(loop);

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
		if (event.key === ' ' && !hasPressedSpace) {
			if (done) {
				hasPressedSpace = true;
				playAudio(currentSection.overrideSFX ?? 'dialogue_advance_default');

				if (!currentSection.flagNextSectionDoesntClear) {
					unassociate(videoElem).currentTime = videoElem.currentTime + 1 / cutscene.fps;
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
	}
</script>

<svelte:window on:keydown={onKeyDown} />

<video src={video} bind:this={videoElem} on:play={play} />
{#if done && !hasPressedSpace && !currentSection.autoplay}
	<div class="bottom" in:fly={{ duration: 200, opacity: 0, y: 2 }} out:fade={{ duration: 100 }}>
		{currentSection.continueText ?? '(Press space to continue)'}
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
</style>
