<script context="module" lang="ts">
	import '../global.css';
</script>

<script lang="ts">
	import LevelLoader from './_LevelLoader.svelte';
	import Container from './_Container.svelte';
	import { getMap, getMapList } from '$lib/map-registry';
	import { currentMapId } from '$lib/stores';
	import { loadRequiredAudio } from '$lib/audio';
	import { browser } from '$app/env';
	import { fade } from 'svelte/transition';

	const mapPromise = getMapList();
	let dofade = false;
	let mapListLoaded = false;
	mapPromise.then(() => {
		mapListLoaded = true;
		getMap('00-intro-cutscene').then(() => {
			console.log('map loaded');
		});
	});

	let fontLoadedPromise = new Promise<void>((resolve) => {
		setTimeout(function again() {
			if (document.fonts.check('12px Carlito')) {
				resolve();
			} else {
				setTimeout(again, 100);
			}
		});
	});

	let clicked = false;
	async function clickStart() {
		let t = setTimeout(() => {
			clicked = true;
		}, 250);
		await fontLoadedPromise;
		if (!mapListLoaded) {
			await mapPromise;
		}
		clearTimeout(t);

		dofade = true;

		setTimeout(() => {
			$currentMapId = '00-intro-cutscene';
		}, 1000);
	}

	if (browser) {
		setTimeout(() => {
			loadRequiredAudio();
		}, 100);

		// global in case some garbage collector throws the images away
		(window as any).globalImages = [0, 1, 2, 3, 4].map((n) => {
			const img = new Image();
			img.src = `./loadingframes/load${n}.png`;
			return img;
		});

		// this makes it so the videos cant be messed with media keys
		if ('mediaSession' in navigator) {
			navigator.mediaSession.playbackState = 'none';
		}
	}
</script>

<Container>
	<p style="opacity:0;position:absolute;font-family:Carlito">h</p>
	{#if $currentMapId === null}
		<main
			on:click={clickStart}
			on:contextmenu={() => {
				getMapList().then(() => {
					// $currentMapId = '01-reddit-recap';
					// $currentMapId = '04-ludwig';
					$currentMapId = '05-mango-its-cold-outside';
				});
			}}
		>
			<img class:clicked src="./openingscreen.png" alt="Pheonix, WRITE!" />
			{#if dofade}
				<div class="white" in:fade={{ duration: 1000 }} />
			{/if}
		</main>
	{:else}
		<LevelLoader key={$currentMapId} />
	{/if}
</Container>

<style>
	main {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: white;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	img {
		width: calc(var(--unit) * 21.458);
	}
	.clicked {
		opacity: 0.7;
	}
	.white {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: white;
		z-index: 100;
	}
</style>
