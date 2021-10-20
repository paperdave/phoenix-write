<script lang="ts">
	import type { LoadedMap } from '$lib/types';
	import { onDestroy } from 'svelte';

	export let map: LoadedMap;

	const videoUrl = URL.createObjectURL(map.video);

	// onDestroy(() => {
	// 	URL.revokeObjectURL(videoUrl);
	// });

	// const allMapWords = mapData.sections.flatMap((x) => x.words);

	let videoElem: HTMLVideoElement;
	let videoTime = 0;
	let xOffset = 0;

	let textRoot: HTMLDivElement;

	function updateFrame() {
		videoTime = videoElem.currentTime;

		const currentWord = map.words.filter((word) => word.start <= videoTime).pop();

		if (!currentWord) {
			xOffset = 0;
			return;
		}

		const currentWordIndex = map.words.indexOf(currentWord);
		const nextWord = map.words[currentWordIndex + 1];
		const wordDom = textRoot.querySelector(`[data-word="${currentWordIndex}"]`) as HTMLElement;
		const nextDom = textRoot.querySelector(`[data-word="${currentWordIndex + 1}"]`) as HTMLElement;

		let offsetLeft = wordDom.offsetLeft;
		let offsetRight = nextDom?.offsetLeft ?? wordDom.offsetLeft + wordDom.offsetWidth;

		const percent =
			(videoTime - currentWord.start) /
			((nextWord?.start || videoElem.duration) - currentWord.start);

		xOffset = offsetLeft + (offsetRight - offsetLeft) * percent;
	}

	function start() {
		let running = true;
		function stop() {
			running = false;
			videoElem.removeEventListener('pause', stop);
		}

		videoElem.addEventListener('pause', stop);

		requestAnimationFrame(function loop() {
			if (!running) return;
			requestAnimationFrame(loop);
			updateFrame();
		});
	}
</script>

<main>
	<div class="top">
		<div class="bit" />
		<div class="bit top" />
		<div class="text" style="--x:{-xOffset}px" bind:this={textRoot}>
			{#each map.words as word, i}
				<span class="word" class:section-start={word.isSectionStart && i !== 0} data-word={i}>
					{#if i !== 0 && !word.isWordJoiner}
						<span class="space">&nbsp;</span>
					{/if}
					{#each word.text as letter, j}
						{#if word.missingLetters.includes(j)}
							<span class="underline">{letter}</span>
						{:else}
							<span>{letter}</span>
						{/if}
					{/each}
				</span>
			{/each}
		</div>
	</div>
	<div class="video">
		<video src={videoUrl} bind:this={videoElem} on:play={start} controls />
	</div>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		width: 100vw;
		height: 100vh;
	}
	.top {
		height: 200px;
		font-family: sans-serif;
		font-size: 50px;
		display: flex;
		align-items: center;
		position: relative;
		overflow: hidden;
	}
	.video {
		flex: 1;
		position: relative;
		background-color: black;
	}
	.video video {
		grid-area: video;
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}
	.text {
		white-space: nowrap;
		transform: translateX(50vw) translateX(var(--x));
	}
	.word {
		display: inline-flex;
	}
	.underline {
		position: relative;
		color: rgba(0, 0, 0, 0.25);
	}
	.underline::after {
		content: '';
		position: absolute;
		bottom: -5px;
		left: 0;
		width: 100%;
		height: 4px;
		background-color: red;
	}
	.bit {
		width: 4px;
		background-color: black;
		position: absolute;
		bottom: 0;
		left: 50%;
		height: 40px;
	}
	.bit.top {
		top: 0;
	}
	.section-start {
		margin-left: 50px;
	}
	.space {
		margin-right: 2px;
	}
</style>
