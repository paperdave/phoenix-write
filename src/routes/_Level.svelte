<script lang="ts">
	import { LevelLogic } from '$lib/input';
	import { setNextMap } from '$lib/stores';

	import type { LoadedLevel } from '$lib/types';
	import { onDestroy } from 'svelte';
	import LevelVisualizations from './_LevelVisualizations.svelte';

	export let level: LoadedLevel;

	let isIntroduction = true;
	let running = false;
	let currentWordI = 0;

	function genKeyResults() {
		return level.words.map((x) => x.missingLetters.map(() => null));
	}
	let keyResults: (null | true | string)[][] = genKeyResults();

	const logic = new LevelLogic(level);

	const videoUrl = URL.createObjectURL(level.video);
	onDestroy(() => {
		URL.revokeObjectURL(videoUrl);
	});

	let videoElem: HTMLVideoElement;
	let textRoot: HTMLDivElement;

	let win = false;

	logic.on('start', () => {
		videoElem.currentTime = level.words[0].start;
		videoElem.play();
		keyResults = genKeyResults();
		running = true;
	});

	logic.on('key', ({ key, wordIndex, letterIndex, offset }) => {
		keyResults[wordIndex][letterIndex] = true;
	});

	logic.on('lose', ({ tooLate, wordIndex, letterIndex, mistype }) => {
		if (!tooLate) {
			keyResults[wordIndex][letterIndex] = mistype;
		}
		videoElem.pause();
		running = false;
	});

	logic.on('win', () => {
		win = true;
		setTimeout(() => {
			setNextMap(level);
		}, 1000);
	});

	function updateFrame() {
		let videoTime = videoElem.currentTime;

		const currentWord = level.words.filter((word) => word.start <= videoTime).pop();

		currentWordI = level.words.indexOf(currentWord);

		if (!currentWord) {
			let offsetLeft = -100;
			const wordDom = textRoot.querySelector(`[data-word="0"]`) as HTMLElement;
			let offsetRight = wordDom.offsetLeft;

			const percent = videoTime / level.words[0].start;

			textRoot.style.setProperty(
				'transform',
				`translateX(calc(var(--unit) * 25)) translateX(${-(
					offsetLeft +
					(offsetRight - offsetLeft) * percent
				)}px)`
			);
			return;
		}

		const currentWordIndex = level.words.indexOf(currentWord);
		const nextWord = level.words[currentWordIndex + 1];
		const wordDom = textRoot.querySelector(`[data-word="${currentWordIndex}"]`) as HTMLElement;
		const nextDom = textRoot.querySelector(`[data-word="${currentWordIndex + 1}"]`) as HTMLElement;

		let offsetLeft = wordDom.offsetLeft;
		let offsetRight = nextDom?.offsetLeft ?? wordDom.offsetLeft + wordDom.offsetWidth;

		const percent =
			(videoTime - currentWord.start) /
			((nextWord?.start || videoElem.duration) - currentWord.start);

		textRoot.style.setProperty(
			'transform',
			`translateX(calc(var(--unit) * 25)) translateX(-${
				offsetLeft + (offsetRight - offsetLeft) * percent
			}px)`
		);
	}

	function start() {
		let running = true;
		function stop() {
			running = false;
			videoElem.removeEventListener('pause', stop);
		}

		videoElem.addEventListener('pause', stop);

		requestAnimationFrame(function loop(t) {
			if (!running) return;
			requestAnimationFrame(loop);
			updateFrame();
			if (isIntroduction) {
				if (videoElem.currentTime >= level.words[0].start - 0.05) {
					isIntroduction = false;
					if (logic.currentWord === 0) {
						videoElem.pause();
					}
				}
			}
			let videoTime = videoElem.currentTime;
			logic.update(videoTime);
			logic.tick();
		});
	}
</script>

<main class:running>
	<video src={videoUrl} bind:this={videoElem} on:play={start} autoplay />

	<div class="marker" />

	<div class="text-container">
		<div class="text" bind:this={textRoot}>
			{#each level.words as word, i}
				<span class="word" class:section-start={word.isSectionStart && i !== 0} data-word={i}>
					{#if i !== 0 && !word.isWordJoiner}
						<span class="space">&nbsp;</span>
					{/if}
					{#each word.text as letter, j}
						{#if word.missingLetters.includes(j)}
							<span
								class="underline"
								class:success={keyResults[i][j] === true}
								class:failed={typeof keyResults[i][j] === 'string'}
								>{typeof keyResults[i][j] === 'string' ? keyResults[i][j] : letter}</span
							>
						{:else}
							<span>{letter}</span>
						{/if}
					{/each}
				</span>
			{/each}
		</div>
	</div>

	<LevelVisualizations {level} {logic} {currentWordI} {keyResults} {win} />
</main>

<style>
	.running {
		cursor: none;
	}
	.running * {
		cursor: none !important;
	}
	video {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}
	.text-container {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}
	.text {
		position: absolute;
		transform: translateX(calc(var(--unit) * 25));
		bottom: calc(var(--unit) * 5);
		font-size: calc(var(--unit) * 4);
		white-space: nowrap;
	}
	.word {
		display: inline-flex;
	}
	.underline {
		position: relative;
		color: rgba(255, 255, 255, 0.25);
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
	.section-start {
		margin-left: 50px;
	}
	.space {
		margin-right: 2px;
	}
	.success {
		color: #fff;
		animation: pop 0.2s ease-out;
	}
	.success::after {
		background-color: #0f0;
	}
	@keyframes pop {
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
	.failed {
		color: #f00;
		animation: pop 0.2s ease-out;
	}
	.marker {
		width: calc(var(--unit) * 0.25);
		height: calc(var(--unit) * 15);
		position: absolute;
		left: calc(var(--unit) * 25);
		bottom: 0;
		background-color: rgba(0, 255, 0, 0.8);
	}
</style>
