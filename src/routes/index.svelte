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

	async function clickStart() {
		if (!mapListLoaded) {
			await mapPromise;
		}

		dofade = true;

		setTimeout(() => {
			$currentMapId = '00-intro-cutscene';
		}, 1000);
	}

	if (browser) {
		loadRequiredAudio();

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
	{#if $currentMapId === null}
		<main>
			<img
				src="./openingscreen.png"
				alt="Pheonix, WRITE!"
				on:click={clickStart}
				on:contextmenu={() => {
					$currentMapId = '06-mango-its-cold-outside';
				}}
			/>
		</main>
		{#if dofade}
			<div class="white" in:fade={{ duration: 1000 }} />
		{/if}
	{:else}
		<LevelLoader key={$currentMapId} />
	{/if}
</Container>

<style>
	img {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}
	.white {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: white;
	}
</style>
