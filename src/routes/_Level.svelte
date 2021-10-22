<script lang="ts">
	import { LevelLogic } from '$lib/input';

	import type { LoadedMap } from '$lib/types';
	import { onDestroy } from 'svelte';

	export let map: LoadedMap;

	let keyResults: (null | true | string)[][] = map.words.map((x) =>
		x.missingLetters.map(() => null)
	);

	const logic = new LevelLogic(map);

	logic.on('key', ({ key, wordIndex, letterIndex, offset }) => {
		keyResults[wordIndex][letterIndex] = true;
	});

	logic.on('lose', ({ wordIndex, letterIndex, mistype }) => {
		keyResults[wordIndex][letterIndex] = mistype;
		videoElem.pause();
	});

	const videoUrl = URL.createObjectURL(map.video);

	onDestroy(() => {
		URL.revokeObjectURL(videoUrl);
	});

	let videoElem: HTMLVideoElement;
	let textRoot: HTMLDivElement;

	logic.on('start', () => {
		videoElem.currentTime = map.words[0].start;
		videoElem.play();
	});

	function updateFrame() {
		let videoTime = videoElem.currentTime;

		const currentWord = map.words.filter((word) => word.start <= videoTime).pop();

		if (!currentWord) {
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

		textRoot.style.setProperty(
			'transform',
			`translateX(50vw) translateX(-${offsetLeft + (offsetRight - offsetLeft) * percent}px)`
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
			let videoTime = videoElem.currentTime;
			logic.update(videoTime);
			logic.tick();
		});
	}
</script>

<main>
	<div class="top">
		<div class="bit" />
		<div class="bit top" />
		<div class="text" bind:this={textRoot}>
			{#each map.words as word, i}
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
	<div class="video">
		<video src={videoUrl} bind:this={videoElem} on:play={start} />
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
		transform: translateX(50vw);
		transition: transform 0.0333s linear;
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
	.success {
		color: #000;
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
</style>
