<script lang="ts">
	import { playAudio, stopFallingAudio } from '$lib/audio';

	import { LevelLogic } from '$lib/input';
	import { isFocused } from '$lib/isFocused';
	import { setScreenshake } from '$lib/screenshake';
	import { setNextMap, startTime, totalKeyPresses, totalOffset, totalRewound } from '$lib/stores';

	import { LoadedLevel, parseTimmyTimestamp } from '$lib/types';
	import { delay } from '$lib/utils';
	import { onDestroy } from 'svelte';
	import TopcornerStuff from './_TopcornerStuff.svelte';

	export let level: LoadedLevel;

	let batman = false;

	let isIntroduction = true;
	let running = false;
	let currentWordI = 0;
	let videoHasLoaded = false;

	const logic = new LevelLogic(level);

	function genKeyResults() {
		return level.words.map((x) =>
			x.missingLetters.map((i) => {
				let index = logic.mapKeyPresses.findIndex(
					(y) => y.underlyingWord === x && y.key === x.text[i]
				);
				return index < logic.rewoundWord ? true : null;
			})
		);
	}
	let keyResults: (null | boolean | number | string)[][] = genKeyResults();

	const videoUrl = URL.createObjectURL(level.video);
	onDestroy(() => {
		URL.revokeObjectURL(videoUrl);
		logic.destroy();
	});

	let videoElem: HTMLVideoElement;
	let textRoot: HTMLDivElement;

	let win = false;

	logic.on('start', () => {
		videoElem.currentTime = logic.mapKeyPresses[logic.currentWord - 1].underlyingWord.start;
		videoElem.play();
		logic.rewoundWord++;
		keyResults = genKeyResults();
		running = true;
	});

	logic.on('key', ({ key, wordIndex, letterIndex, offset }) => {
		const maxoffset = 0.3;
		// green = 0 offset, orange = maxoffset
		let hue = Math.min(Math.abs(offset / maxoffset), 1) * -90 + 120;
		keyResults[wordIndex][letterIndex] = hue;

		$totalKeyPresses = $totalKeyPresses + 1;
		$totalOffset = $totalOffset + offset;
	});

	let showTooEarly = false;
	let showTooLate = false;

	logic.on('lose', async ({ tooLate, tooEarly, wordIndex, letterIndex, mistype }) => {
		if (!tooLate && !tooEarly) {
			keyResults[wordIndex][letterIndex] = mistype;
		}

		if (tooLate) {
			showTooLate = true;
		}
		if (tooEarly) {
			showTooEarly = true;
		}
		logic.canPlay = false;

		videoElem.pause();
		running = false;

		if ($isFocused) {
			playAudio('screwup');
		}

		await delay(300);

		if ($isFocused) {
			playAudio('falling');
		}

		let rewindPosition = logic.mapKeyPresses[logic.rewoundWord].underlyingWord.start;
		let lastTime = performance.now();
		let speed = 0.5;

		requestAnimationFrame(function loop(now) {
			let dt = (now - lastTime) / 1000;
			speed = Math.min(2, speed + dt * 0.1);
			let oldTime = videoElem.currentTime;
			videoElem.currentTime = Math.max(videoElem.currentTime - dt * speed, rewindPosition);
			$totalRewound += Math.max(oldTime - videoElem.currentTime, 0);
			if (Math.abs(videoElem.currentTime - rewindPosition) < 0.05) {
				videoElem.currentTime = rewindPosition;
				logic.canPlay = true;
				keyResults = genKeyResults();
				stopFallingAudio();
				playAudio('fall');
				showTooEarly = false;
				showTooLate = false;
			} else {
				requestAnimationFrame(loop);
			}
			updateFrame();
		});
	});

	logic.on('win', () => {
		win = true;
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
			(parseTimmyTimestamp(nextWord?.start || currentWord.flags.endTime || videoElem.duration) -
				currentWord.start);

		textRoot.style.setProperty(
			'transform',
			`translateX(calc(var(--unit) * 25)) translateX(-${
				offsetLeft + (offsetRight - offsetLeft) * percent
			}px)`
		);
	}

	function start() {
		videoHasLoaded = true;
		let running = true;
		function stop() {
			running = false;
			videoElem.removeEventListener('pause', stop);
			if (videoElem.currentTime >= videoElem.duration - 0.1) {
				setNextMap(level);
			}
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

	$: if (!$isFocused && videoElem) {
		videoElem.pause();
		if (isIntroduction) {
			videoHasLoaded = true;
			videoElem.currentTime = level.words[0].start - 0.05;
			logic.update(videoElem.currentTime);
			logic.tick();
			isIntroduction = false;
			updateFrame();
		}
	}
	$: if (!$isFocused && running) {
		logic.emit('lose', { tooLate: true });
		running = false;
	}

	logic.on('lose', () => {
		if ($isFocused) {
			playAudio('screwup');
			setScreenshake();
		}
	});

	let innerW = 0;
	let innerH = 0;
	$: innerW * innerH && updateFrame();

	if ($startTime === 0) {
		$startTime = Date.now();
	}
</script>

<svelte:window bind:innerWidth={innerW} bind:innerHeight={innerH} />

<main class:running>
	<video src={videoUrl} bind:this={videoElem} on:play={start} autoplay disablePictureInPicture />

	<div class:fadeout={win} class:fadein={videoHasLoaded} class="opacity0 bottom-fill" />
	<div class:fadeout={win} class:fadein={videoHasLoaded} class="opacity0 marker" />
	<div class:fadeout={win} class:fadein={videoHasLoaded} class="opacity0 marker-gradient" />

	<div class:fadeout={win} class:fadein={videoHasLoaded} class="opacity0 text-container">
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
								class:success={keyResults[i][j] === true || typeof keyResults[i][j] === 'number'}
								class:failed={typeof keyResults[i][j] === 'string'}
								style="--huevalue:{keyResults[i][j]}"
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

	<TopcornerStuff />

	{#if showTooEarly}
		<div class="notice">Early!</div>
	{/if}
	{#if showTooLate}
		<div class="notice">Late!</div>
	{/if}
</main>

<style>
	.notice {
		position: absolute;
		bottom: calc(var(--unit) * 15);
		left: calc(var(--unit) * 25);
		font-size: calc(var(--unit) * 3);
		color: red;
		z-index: 100;
		transform: translateX(-50%);
		text-shadow: 0 0 calc(var(--unit) * 1) black;
		animation: noticemesenpai 0.5s cubic-bezier(0.37, 1.84, 0.47, 1) both;
	}
	@keyframes noticemesenpai {
		0% {
			transform: translateX(-50%) translateY(0);
		}
		50% {
			transform: translateX(-50%) translateY(calc(var(--unit) * -0.5));
		}
		100% {
			transform: translateX(-50%) translateY(0);
		}
	}
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
		bottom: 0;
		left: 0;
		width: 100%;
		height: calc(var(--unit) * 15);
		overflow: hidden;
		mask-image: linear-gradient(to right, transparent 0%, white 10%, white 50%, transparent 90%);
		-webkit-mask-image: linear-gradient(
			to right,
			transparent 0%,
			white 10%,
			white 50%,
			transparent 90%
		);
	}
	.text {
		display: flex;
		align-items: center;
		position: absolute;
		transform: translateX(calc(var(--unit) * 25));
		transition: transform 0.0333s linear;
		bottom: 0;
		height: 100%;
		font-size: calc(var(--unit) * 4);
		white-space: nowrap;
	}
	.word {
		display: inline-flex;
		align-items: center;
		white-space: pre;
		position: relative;
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
		background-color: hsl(calc(var(--huevalue) * 1deg), 100%, 50%);
		animation: fadeaway 0.2s 0.5s linear both;
	}
	@keyframes fadeaway {
		0% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
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
		background-color: rgba(200, 255, 200, 0.8);
	}
	.marker-gradient {
		width: calc(var(--unit) * 8);
		height: calc(var(--unit) * 15);
		position: absolute;
		left: calc(var(--unit) * (25 - 4));
		bottom: 0;
		background: linear-gradient(
			90deg,
			rgba(0, 255, 0, 0) 0%,
			rgba(0, 255, 0, 0.2) 50%,
			rgba(0, 255, 0, 0) 100%
		);
	}
	.marker,
	.marker-gradient {
		mask-image: linear-gradient(0deg, rgba(255, 255, 255, 1) 90%, rgba(255, 255, 255, 0) 100%);
		-webkit-mask-image: linear-gradient(
			0deg,
			rgba(255, 255, 255, 1) 90%,
			rgba(255, 255, 255, 0) 100%
		);
	}
	.bottom-fill {
		position: absolute;
		width: 100%;
		height: calc(var(--unit) * 18);
		bottom: 0;
		left: 0;
		background: linear-gradient(
			0deg,
			rgba(0, 0, 0, 0.7) 0%,
			rgba(0, 0, 0, 0.6) 70%,
			rgba(0, 0, 0, 0) 100%
		);
	}
	.fadein {
		animation: fadein 1s cubic-bezier(0.215, 0.61, 0.355, 1) both;
	}
	.fadeout {
		animation: fadeoutwin 1s cubic-bezier(0.645, 0.045, 0.355, 1) both;
	}

	@keyframes fadeoutwin {
		0% {
			opacity: 1;
			transform: translateY(0);
		}
		80% {
			opacity: 0;
		}
		100% {
			transform: translateY(calc(var(--unit) * 3));
		}
	}
	@keyframes fadein {
		0% {
			transform: translateY(calc(var(--unit) * 3));
		}
		20% {
			opacity: 0;
		}
		100% {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.opacity0 {
		opacity: 0;
	}
</style>
