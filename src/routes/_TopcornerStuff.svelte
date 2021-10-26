<script lang="ts">
	import { totalRewound } from '$lib/stores';
	import { onDestroy } from 'svelte';

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

	let changing = false;
	let reset: any;
	let first = true;
	function handleChange() {
		if (first) {
			first = false;
			return;
		}
		clearTimeout(reset);
		changing = true;
		reset = setTimeout(() => {
			changing = false;
		}, 400);
	}

	const ok = totalRewound.subscribe(handleChange);

	onDestroy(() => {
		ok();
	});
</script>

<main class:changing>
	{formatTime($totalRewound)} <br />
	<small>rewound</small>
</main>

<style>
	main {
		position: absolute;
		top: calc(var(--unit) * 1.5);
		right: calc(var(--unit) * 3.75);
		color: white;
		font-size: calc(var(--unit) * 2);
		transform-origin: top right;
		transition: transform 1s cubic-bezier(0.55, 0.055, 0.675, 0.19),
			color 1s cubic-bezier(0.55, 0.055, 0.675, 0.19);
		-webkit-text-stroke: calc(var(--unit) * 0.1) black;
	}
	small {
		font-size: calc(var(--unit) * 1);
		-webkit-text-stroke: calc(var(--unit) * 0.05) black;
		position: absolute;
		top: calc(var(--unit) * 2);
		right: calc(var(--unit) * 0.2);
		text-align: right;
	}
	.changing {
		transition: transform 0.2s cubic-bezier(0.55, 0.055, 0.675, 0.19),
			color 0.2s cubic-bezier(0.55, 0.055, 0.675, 0.19);
		transform: scale(3.5);
		color: red;
	}
</style>
