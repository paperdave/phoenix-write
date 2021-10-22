<!-- this component displays a 16:9 frame spanning the browser window -->
<script lang="ts">
	import { browser } from '$app/env';

	let width = browser ? window.innerWidth : 100;
	let height = browser ? window.innerHeight : 100;

	function handleResize() {
		width = window.innerWidth;
		height = window.innerHeight;
	}

	$: isTall = height > (width * 9) / 16;
	$: containerWidth = isTall ? width : height * (16 / 9);
	$: containerHeight = isTall ? width * (9 / 16) : height;
</script>

<svelte:window on:resize={handleResize} />

<div class="outer" on:contextmenu={(e) => e.preventDefault()}>
	<div
		class="inner"
		style="width:{containerWidth}px;height:{containerHeight}px;--unit:{containerWidth / 100}px"
	>
		<slot />
	</div>
</div>

<style>
	.outer {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	.inner {
		position: relative;
		cursor: url('/cursor.png'), auto;
	}
	.inner :global(a) {
		cursor: url('/cursor-red.png'), auto;
	}
</style>
