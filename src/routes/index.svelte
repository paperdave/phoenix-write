<script lang="ts">
	import { init } from '$lib/render';
	import { onMount } from 'svelte';

	let htmlCanvas: HTMLCanvasElement;
	onMount(() => {
		init(htmlCanvas);
	});
</script>

<canvas bind:this={htmlCanvas} />

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}
	canvas {
		position: absolute;
		top: 0;
		left: 0;
	}
</style>
