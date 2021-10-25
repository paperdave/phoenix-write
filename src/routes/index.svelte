<script context="module" lang="ts">
	import '../global.css';
</script>

<script lang="ts">
	import LevelLoader from './_LevelLoader.svelte';
	import Container from './_Container.svelte';
	import { getMapList } from '$lib/map-registry';
	import { currentMapId } from '$lib/stores';
	import { loadRequiredAudio } from '$lib/audio';
	import { browser } from '$app/env';

	const mapPromise = getMapList();

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
			<h1>Pheonix, Write! beta</h1>
			{#await mapPromise}
				<li>loading map listing</li>
			{:then mapList}
				{#each mapList as meta}
					<li>
						<a
							href="#level"
							on:click={(e) => {
								e.preventDefault();
								$currentMapId = meta.key;
							}}>{meta.name}</a
						>
					</li>
				{/each}
			{/await}
		</main>
	{:else}
		<LevelLoader key={$currentMapId} />
	{/if}
</Container>
