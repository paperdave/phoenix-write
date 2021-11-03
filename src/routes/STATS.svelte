<script lang="ts">
	import { startTime, totalFails, totalKeyPresses, totalOffset, totalRewound } from '$lib/stores';
	import { onMount } from 'svelte';

	import { fade } from 'svelte/transition';
	let init = false;
	onMount(() => {
		init = true;
	});
	function formatTime(seconds: number) {
		const minutes = Math.floor(seconds / 60);
		const secondsLeft = (seconds % 60).toFixed(1).padStart(4, '0');

		if (minutes < 10) {
			return `0${minutes}:${secondsLeft}`;
		}

		if (minutes < 60) {
			return `${minutes}:${secondsLeft}`;
		}

		const hours = Math.floor(minutes / 60);
		const minutesLeft = String(minutes % 60).padStart(2, '0');

		return `${hours}:${minutesLeft}:${secondsLeft}`;
	}
	const BETTER_SCORE = 8 * 60;
	const BEST_SCORE = 90;

	const now = Date.now();

	const playtime = now - ($startTime || now);
</script>

<main>
	{#if init}
		<img src="./scoreboard/statsbg.png" alt="A" in:fade={{ duration: 1000, easing: (x) => x }} />
		<img
			src="./scoreboard/statseval.png"
			alt="B"
			in:fade={{ duration: 500, delay: 1500, easing: (x) => x }}
		/>
		{#if $totalRewound < BEST_SCORE}
			<img
				src="./scoreboard/best.png"
				alt="c"
				in:fade={{ duration: 1000, delay: 4000, easing: (x) => x }}
			/>
		{:else if $totalRewound < BETTER_SCORE}
			<img
				src="./scoreboard/better.png"
				alt="c"
				in:fade={{ duration: 1000, delay: 4000, easing: (x) => x }}
			/>
		{:else}
			<img
				src="./scoreboard/bad.png"
				alt="c"
				in:fade={{ duration: 1000, delay: 4000, easing: (x) => x }}
			/>
		{/if}
	{/if}

	<section in:fade={{ duration: 1000, delay: 2500, easing: (x) => x }}>
		<p style="text-align: center; font-size: 1.5em">Thank you for playing!</p>
		<br />
		<br />
		<p style="text-align: center">Total Time Rewound:</p>
		<p style="text-align: center;font-size:2em">
			{formatTime($totalRewound)}
		</p>
	</section>

	<div class="heart" in:fade={{ duration: 1000, delay: 6000, easing: (x) => x }}>
		made with lots of love
	</div>
	<img
		class="sdafdsfa"
		in:fade={{ duration: 1000, delay: 6000, easing: (x) => x }}
		src="./signedyourstruly.png"
		alt="made with love"
	/>
</main>

<style>
	main {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: black;
	}
	img {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}
	section {
		position: absolute;
		top: calc(var(--unit) * 2.5);
		left: calc(var(--unit) * 45);
		font-size: calc(var(--unit) * 3);
		width: calc(var(--unit) * 54);
		height: 100%;
	}
	p {
		margin: 0;
	}
	.details {
		display: flex;
		font-size: 0.75em;
		margin-top: 0.25em;
		margin-bottom: 0.5em;
	}
	.details p {
		flex: 1;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	.heart {
		position: absolute;
		bottom: calc(var(--unit) * 10);
		right: calc(var(--unit) * 30);
		font-size: calc(var(--unit) * 1.5);
		color: #fff;
		opacity: 0.9;
	}
	.sdafdsfa {
		position: absolute;
		top: calc(var(--unit) * 45);
		left: calc(var(--unit) * 70);
		width: calc(var(--unit) * 25);
		height: calc(var(--unit) * 25 * (183 / 481));
	}
</style>
