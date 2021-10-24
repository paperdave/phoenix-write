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
