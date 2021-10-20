<script lang="ts">
	import { parseMap } from '$lib/map-parser';
	import type { LoadedMap } from '$lib/types';
	import { onDestroy } from 'svelte';

	export let map: LoadedMap;

	const gentleData = map.alignment;
	const mapData = parseMap(map.transcript);
	const videoUrl = URL.createObjectURL(map.video);

	onDestroy(() => {
		URL.revokeObjectURL(videoUrl);
	});

	const allMapWords = mapData.sections.flatMap((x) => x.words);

	let videoElem: HTMLVideoElement;
	let videoTime = 0;
	let xOffset = 0;

	let textRoot: HTMLDivElement;

	function filterWord(word: string) {
		return word.toLowerCase().replace(/[^a-z]/g, '');
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
			videoTime = videoElem.currentTime;

			const currentWordIndex =
				gentleData.words.findIndex((word) => {
					if (word.case !== 'success') return;
					if (word.start > videoTime) return false;
					if (word.end < videoTime) return false;
					return true;
				}) + 1;

			if (currentWordIndex === 0) return;

			const previousWords = gentleData.words
				.slice(0, currentWordIndex)
				.filter((x) => x.case === 'success')
				.map((x) => x.word);
			const currentWord = gentleData.words[currentWordIndex]?.word;

			let i = 0;

			while (previousWords.length) {
				const index = allMapWords
					.slice(i)
					.findIndex((x) => filterWord(x.text) === filterWord(previousWords[0]));
				if (index === -1) {
					throw new Error('cannot find ' + previousWords[0]);
				}
				i = i + index;
				previousWords.shift();
			}

			const section = mapData.sections.findIndex((x) => x.words.includes(allMapWords[i]));
			const sectionWord = mapData.sections[section].words.indexOf(allMapWords[i]);

			const wordDom = textRoot.children[section].children[sectionWord];

			xOffset = wordDom.offsetLeft;
		});
	}
</script>

<main>
	<div class="top">
		<div class="bit" />
		<div class="bit top" />
		<div class="text" style="--x:{-xOffset}px" bind:this={textRoot}>
			{#each mapData.sections as section}
				<span class="section">
					{#each section.words as word}
						<span>
							{#each word.text as letter, i}
								{#if word.missingLetters.includes(i)}
									<span class="underline">{letter}</span>
								{:else}
									<span>{letter}</span>
								{/if}
							{/each}
						</span>
						&nbsp;
					{/each}
				</span>
				&nbsp; &nbsp;
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
</style>
