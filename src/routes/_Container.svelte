<!-- this component displays a 16:9 frame spanning the browser window -->
<script lang="ts">
	import { browser } from '$app/env';
	import { shakeeventemitter } from '$lib/screenshake';
	import { onDestroy } from 'svelte';

	let width = browser ? window.innerWidth : 100;
	let height = browser ? window.innerHeight : 100;

	let dom: HTMLDivElement;
	function handleResize() {
		width = window.innerWidth;
		height = window.innerHeight;
	}

	$: isTall = height > (width * 9) / 16;
	$: containerWidth = isTall ? width : height * (16 / 9);
	$: containerHeight = isTall ? width * (9 / 16) : height;

	let cancelShake;

	function doShake(shakeIntensity: number, decay1: number, decay: number) {
		if (cancelShake) cancelShake();
		let shakeX = 0;
		let shakeY = 0;
		let shakeVar = 1;
		cancelShake = () => (shakeVar = 0);
		function render() {
			console.log('x', shakeVar);
			if (shakeVar >= 0.0001) {
				shakeVar *= decay1 - decay * shakeVar;

				if (shakeVar >= 0.0001) {
					shakeX = (Math.random() * 2 - 1) * shakeVar * shakeIntensity;
					shakeY = (Math.random() * 2 - 1) * shakeVar * shakeIntensity;
					if (dom)
						dom.style.transform = `translate(calc(var(--unit) * ${
							shakeX / 10
						}),calc(var(--unit) * ${shakeY / 10}))`;
				} else {
					// shakeX = 0;
					// shakeY = 0;
					// if (dom) dom.style.removeProperty('transform');
				}
				requestAnimationFrame(render);
			}
		}
		render();
	}

	function handleShake() {
		doShake(10, 0.97, 0.22);
	}
	function handleShake2() {
		doShake(65, 0.99, 0.1);
	}
	function handleShake3(v: number) {
		doShake(v * 15, 0.97, 0.22);
	}
	shakeeventemitter.on('shake', handleShake);
	shakeeventemitter.on('shake2', handleShake2);
	shakeeventemitter.on('shake3', handleShake3);

	onDestroy(() => {
		shakeeventemitter.off('shake', handleShake);
		shakeeventemitter.off('shake2', handleShake2);
		shakeeventemitter.off('shake3', handleShake3);
	});
</script>

<svelte:window on:resize={handleResize} />

<div class="outer" on:contextmenu={(e) => e.preventDefault()}>
	<div
		class="inner"
		style="width:{containerWidth}px;height:{containerHeight}px;--unit:{containerWidth / 100}px"
	>
		<div class="shakebase" bind:this={dom}>
			<slot />
		</div>
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
		position: absolute;
		overflow: hidden;
		cursor: url('./cursor.png'), auto;
	}
	.inner :global(a) {
		cursor: url('./cursor-red.png'), auto;
	}
	.shakebase {
		position: relative;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}
</style>
