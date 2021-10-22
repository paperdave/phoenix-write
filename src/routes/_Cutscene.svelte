<script lang="ts">
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
	$: pauseTime = cutscene.subsection[currentSectionI].end
		? convertTT(cutscene.subsection[currentSectionI].end)
		: currentSectionI === cutscene.subsection.length - 1
		? videoElem.duration
		: convertTT(cutscene.subsection[currentSectionI + 1].begin) + 1 / 120;

	$: {
		if (videoElem) {
			videoElem.pause();
			videoElem.currentTime = convertTT(currentSection.begin) + 1 / 120;
			videoElem.play();
		}
	}

	$: done = (dependOn(videoElem, currentSectionI), false);

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
			}
		});
	}

	const video = URL.createObjectURL(cutscene.video);

	onDestroy(() => {
		URL.revokeObjectURL(video);
	});

	function onKeyDown(event: KeyboardEvent) {
		if (event.key === ' ') {
			if (done) {
				currentSectionI++;
			} else {
				videoElem.pause();
				unassociate(videoElem).currentTime = pauseTime;
				done = true;
			}
		}
	}
</script>

<svelte:window on:keydown={onKeyDown} />

<video src={video} bind:this={videoElem} on:play={play} />
{#if done}
	<div class="bottom" in:fly={{ duration: 200, opacity: 0, y: 2 }} out:fade={{ duration: 100 }}>
		(Press space to continue)
	</div>
{/if}

<style>
	video {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
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
	}
</style>
