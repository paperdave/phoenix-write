<!-- 

	Duets are a completly different game engine. started as a fork of the main level, but has evolved to this. the main difference is a duet has two lines and a lot of magic shit and i didnt want to break the old levels  with shit

 -->
<script lang="ts">
	import { playAudio, stopFallingAudio } from '$lib/audio';

	import { DuetLevelLogic } from '$lib/duet_fork';
	import { isFocused } from '$lib/isFocused';
	import { setScreenshake, setScreenshakeVariable } from '$lib/screenshake';

	import { setNextMap, totalKeyPresses, totalOffset, totalRewound } from '$lib/stores';

	import { LoadedDuet, parseTimmyTimestamp } from '$lib/types';
	import { delay } from '$lib/utils';
	import { onDestroy } from 'svelte';
	import TopcornerStuff from './_TopcornerStuff.svelte';

	export let level: LoadedDuet;
	console.log(level);

	let isIntroduction = true;
	let running = false;
	let currentWordQTI = 0;
	let currentWordLudI = 0;
	let videoHasLoaded = false;
	let shift = 0;
	let batman = false;
	let lastssword = 0;

	let mangoing = false;

	const logic = new DuetLevelLogic(level);

	let keyResultsQT: (null | boolean | number | string)[][] = [];
	let keyResultsLud: (null | boolean | number | string)[][] = [];

	function resetKeyResults() {
		keyResultsLud = level.wordsLud.map((x) =>
			x.missingLetters.map((i) => {
				let index = logic.mapKeyPressesLud.findIndex(
					(y) => y.underlyingWord === x && y.key === x.text[i]
				);
				return index < logic.rewoundWordLud ? true : null;
			})
		);

		keyResultsQT = level.wordsQt.map((x) =>
			x.missingLetters.map((i) => {
				let index = logic.mapKeyPressesQt.findIndex(
					(y) => y.underlyingWord === x && y.key === x.text[i]
				);
				return index < logic.rewoundWordQt ? true : null;
			})
		);
	}

	resetKeyResults();

	const videoUrl = URL.createObjectURL(level.video);
	onDestroy(() => {
		URL.revokeObjectURL(videoUrl);
		logic.destroy();
	});

	let videoElem: HTMLVideoElement;
	let textRootQT: HTMLDivElement;
	let textRootLud: HTMLDivElement;

	let win = false;

	logic.on('start', () => {
		// videoElem.currentTime = logic.mapKeyPresses[logic.currentWord - 1].underlyingWord.start;
		videoElem.play();
		resetKeyResults();
		running = true;
		if (logic.whoStarts === 'qt') {
			keyResultsQT[logic.currentWordQt][0] = true;
		} else {
			keyResultsLud[logic.currentWordLud + 1][0] = true;
		}
	});

	logic.on('lud', ({ key, wordIndex, letterIndex, offset }) => {
		if (offset) {
			const maxoffset = 0.3;
			// green = 0 offset, orange = maxoffset
			let hue = Math.min(Math.abs(offset / maxoffset), 1) * -90 + 120;
			keyResultsLud[wordIndex][letterIndex] = hue;

			$totalKeyPresses = $totalKeyPresses + 1;
			$totalOffset = $totalOffset + offset;
		} else {
			keyResultsLud[wordIndex][letterIndex] = true;
		}
	});
	logic.on('qt', ({ key, wordIndex, letterIndex, offset }) => {
		if (offset !== undefined) {
			const maxoffset = 0.3;
			// green = 0 offset, orange = maxoffset
			let hue = Math.min(Math.abs(offset / maxoffset), 1) * -90 + 120;
			keyResultsQT[wordIndex][letterIndex] = hue;

			$totalKeyPresses = $totalKeyPresses + 1;
			$totalOffset = $totalOffset + offset;
		} else {
			keyResultsQT[wordIndex][letterIndex] = true;
		}
	});

	let showTooEarly = false;
	let showTooLate = false;

	logic.on('lose', async ({ tooLate, tooEarly, wordIndex, letterIndex, mistype, who }) => {
		if (!tooLate && !tooEarly) {
			if (who === 'lud') {
				keyResultsLud[wordIndex][letterIndex] = mistype;
			} else {
				keyResultsQT[wordIndex][letterIndex] = mistype;
			}
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

		let rewindPosition =
			logic.whoStarts === 'qt'
				? logic.mapKeyPressesQt[logic.rewoundWordQt].underlyingWord.start
				: logic.mapKeyPressesLud[logic.rewoundWordLud].underlyingWord.start;
		let lastTime = performance.now();
		let speed = 0.5;

		requestAnimationFrame(function loop(now) {
			let dt = (now - lastTime) / 1000;
			speed = Math.min(2, speed + dt * 0.1);
			let oldTime = videoElem.currentTime;
			videoElem.currentTime = Math.max(videoElem.currentTime - dt * speed, rewindPosition);
			$totalRewound += oldTime - videoElem.currentTime;
			if (Math.abs(videoElem.currentTime - rewindPosition) < 0.05) {
				videoElem.currentTime = rewindPosition;
				logic.canPlay = true;
				resetKeyResults();
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

	const MANGOSTART = 73.2;
	const MANGOEND = 83.5;

	function updateFrame1() {
		let videoTime = videoElem.currentTime;

		batman = videoTime > 74.38588166666666 && videoTime < 81.83;

		if (videoTime < MANGOSTART) {
			mangoing = false;
			shift = 0;
		} else if (videoTime < MANGOSTART + 0.15) {
			mangoing = true;
			shift = ((videoTime - MANGOSTART) / 0.15) * 2.5;
		} else {
			mangoing = true;
			shift = 2.5;
		}

		if (videoTime > MANGOEND + 0.5) {
			shift = 0;
		} else if (videoTime > MANGOEND) {
			shift = 2.5 - ((videoTime - MANGOEND) / 0.5) * 2.5;
		}

		const currentWordQT = level.wordsQt.filter((word) => word.start <= videoTime).pop();

		currentWordQTI = level.wordsQt.indexOf(currentWordQT);

		if (!currentWordQT) {
			let offsetLeft = -100;
			const wordDom = textRootQT.querySelector(`[data-qt="0"]`) as HTMLElement;
			let offsetRight = wordDom.offsetLeft;

			const percent = videoTime / level.wordsQt[0].start;

			textRootQT.style.setProperty(
				'transform',
				`translateY(calc(var(--unit) * -2.5)) translateY(calc(var(--unit) * ${shift})) translateX(calc(var(--unit) * 25)) translateX(${-(
					offsetLeft +
					(offsetRight - offsetLeft) * percent
				)}px)`
			);
			return;
		}

		if (currentWordQT.flags.shake && lastssword !== currentWordQTI) {
			lastssword = currentWordQTI;
			setScreenshakeVariable(currentWordQT.flags.shake);
		}

		const currentWordIndexQT = level.wordsQt.indexOf(currentWordQT);
		const nextWordQT = level.wordsQt[currentWordIndexQT + 1];
		const wordDomQT = textRootQT.querySelector(`[data-qt="${currentWordIndexQT}"]`) as HTMLElement;
		const nextDomQT = textRootQT.querySelector(
			`[data-qt="${currentWordIndexQT + 1}"]`
		) as HTMLElement;

		let offsetLeftQT = wordDomQT.offsetLeft;
		let offsetRightQT = nextDomQT?.offsetLeft ?? wordDomQT.offsetLeft + wordDomQT.offsetWidth;

		const percentQT =
			(videoTime - currentWordQT.start) /
			(parseTimmyTimestamp(nextWordQT?.start || currentWordQT.flags.endTime || videoElem.duration) -
				currentWordQT.start);

		textRootQT.style.setProperty(
			'transform',
			`translateY(calc(var(--unit) * -2.5)) translateY(calc(var(--unit) * ${shift})) translateX(calc(var(--unit) * 25)) translateX(-${
				offsetLeftQT + (offsetRightQT - offsetLeftQT) * percentQT
			}px)`
		);
	}
	function updateFrame2() {
		let videoTime = videoElem.currentTime;
		// ludwog

		const currentWordLud = level.wordsLud.filter((word) => word.start <= videoTime).pop();

		currentWordLudI = level.wordsLud.indexOf(currentWordLud);

		if (!currentWordLud) {
			let offsetLeft = -200;
			const wordDom = textRootLud.querySelector(`[data-lud="0"]`) as HTMLElement;
			let offsetRight = wordDom.offsetLeft;

			const percent = videoTime / level.wordsLud[1].start;

			textRootLud.style.setProperty(
				'transform',
				`translateY(calc(var(--unit) * 2.5)) translateY(calc(var(--unit) * ${shift})) translateX(calc(var(--unit) * 25)) translateX(${-(
					offsetLeft +
					(offsetRight - offsetLeft) * percent
				)}px)`
			);
			return;
		}

		const currentWordIndexLud = level.wordsLud.indexOf(currentWordLud);
		const nextWordLud = level.wordsLud[currentWordIndexLud + 1];
		const wordDomLud = textRootLud.querySelector(
			`[data-lud="${currentWordIndexLud}"]`
		) as HTMLElement;
		const nextDomLud = textRootLud.querySelector(
			`[data-lud="${currentWordIndexLud + 1}"]`
		) as HTMLElement;

		let offsetLeftLud = wordDomLud.offsetLeft;
		let offsetRightLud = nextDomLud?.offsetLeft ?? wordDomLud.offsetLeft + wordDomLud.offsetWidth;

		const percentLud =
			(videoTime - currentWordLud.start) /
			(parseTimmyTimestamp(
				nextWordLud?.start || currentWordLud.flags.endTime || videoElem.duration
			) -
				currentWordLud.start);

		textRootLud.style.setProperty(
			'transform',
			`translateY(calc(var(--unit) * 2.5)) translateY(calc(var(--unit) * ${shift})) translateX(calc(var(--unit) * 25)) translateX(-${
				offsetLeftLud + (offsetRightLud - offsetLeftLud) * percentLud
			}px)`
		);
	}

	function updateFrame() {
		updateFrame1();
		updateFrame2();
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
				if (videoElem.currentTime >= level.wordsQt[0].start - 0.05) {
					isIntroduction = false;
					if (logic.currentWordQt === 0) {
						videoElem.pause();
					}
				}
			}
			let videoTime = videoElem.currentTime;
			logic.update(videoTime);
			logic.tick();
		});
	}

	$: if (!$isFocused) {
		videoElem.pause();
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
</script>

<svelte:window bind:innerWidth={innerW} bind:innerHeight={innerH} />

<main class:running class:mangoing>
	<video
		src={videoUrl}
		bind:this={videoElem}
		on:play={start}
		autoplay
		disablePictureInPicture
		class:batman
	/>

	<div class:fadeout={win} class:fadein={videoHasLoaded} class="opacity0 bottom-fill" />
	<div class:fadeout={win} class:fadein={videoHasLoaded} class="opacity0 marker" />
	<div class:fadeout={win} class:fadein={videoHasLoaded} class="opacity0 marker-gradient" />

	<div class:fadeout={win} class:fadein={videoHasLoaded} class="opacity0 text-container">
		<div class="text qt" bind:this={textRootQT}>
			{#each level.wordsQt as word, i}
				<span
					class="word"
					class:gangster={word.isRapperStyle}
					class:section-start={word.isSectionStart && i !== 0}
					data-qt={i}
				>
					{#if i !== 0 && !word.isWordJoiner}
						<span class="space">&nbsp;</span>
					{/if}
					{#each word.text as letter, j}
						{#if word.missingLetters.includes(j)}
							<span
								class="underline"
								style="--huevalue:{keyResultsQT[i][j]}"
								class:success={keyResultsQT[i][j] === true ||
									typeof keyResultsQT[i][j] === 'number'}
								class:failed={typeof keyResultsQT[i][j] === 'string'}
								>{typeof keyResultsQT[i][j] === 'string' ? keyResultsQT[i][j] : letter}</span
							>
						{:else}
							<span>{letter}</span>
						{/if}
					{/each}
				</span>
			{/each}
		</div>
	</div>

	<div class:fadeout={win} class:fadein={videoHasLoaded} class="opacity0 text-container">
		<div class="text lud" bind:this={textRootLud}>
			{#each level.wordsLud as word, i}
				<span class="word" class:section-start={word.isSectionStart && i !== 0} data-lud={i}>
					{#if i !== 0 && !word.isWordJoiner}
						<span class="space">&nbsp;</span>
					{/if}
					{#each word.text as letter, j}
						{#if word.missingLetters.includes(j)}
							<span
								class="underline"
								style="--huevalue:{keyResultsLud[i][j]}"
								class:success={keyResultsLud[i][j] === true ||
									typeof keyResultsLud[i][j] === 'number'}
								class:failed={typeof keyResultsLud[i][j] === 'string'}
								>{typeof keyResultsLud[i][j] === 'string' ? keyResultsLud[i][j] : letter}</span
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
	div {
		pointer-events: none;
	}
	.text {
		display: flex;
		align-items: center;
		position: absolute;
		transition: transform 0.0333s linear, font-size 0.25s linear;
		bottom: 0;
		height: 100%;
		font-size: calc(var(--unit) * 4);
		white-space: nowrap;
	}
	.qt {
		transform: translateY(calc(var(--unit) * -2.5)) translateX(calc(var(--unit) * 25));
	}
	.lud {
		transform: translateY(calc(var(--unit) * 2.5)) translateX(calc(var(--unit) * 25));
	}
	.word {
		display: inline-flex;
		align-items: center;
		white-space: pre;
		position: relative;
	}
	.qt .word:not(.gangster) {
		color: rgb(255, 192, 203);
	}
	.underline {
		position: relative;
		color: rgba(255, 255, 255, 0.25);
	}
	.qt .word:not(.gangster) .underline {
		color: rgba(255, 192, 203, 0.25);
	}
	.lud {
		color: rgba(192, 251, 255);
	}
	.lud .underline {
		color: rgba(192, 251, 255, 0.25);
	}
	.underline::after {
		content: '';
		position: absolute;
		bottom: -5px;
		left: 0;
		width: 100%;
		height: calc(var(--unit) * 0.3);
		background-color: #f22;
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
	.qt .word:not(.gangster) .success {
		color: rgb(255, 192, 203);
	}
	.lud .word:not(.gangster) .success {
		color: rgba(192, 251, 255);
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
		color: #f00 !important;
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

	.gangster {
		font-family: Rapper;
		letter-spacing: 0;
		font-weight: 100;
		-webkit-text-stroke: calc(var(--unit) * 0.3) rgba(0, 0, 0, 1);
		transition: font-size 0.15s ease-out;
	}

	.mangoing .text .gangster {
		font-size: calc(var(--unit) * 5.5);
	}

	.batman {
		filter: saturate(4) brightness(0.8) contrast(2) hue-rotate(329deg);
	}
</style>
