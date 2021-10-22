<script context="module" lang="ts">
	import '../global.css';
</script>

<script lang="ts">
	import LevelLoader from './_LevelLoader.svelte';
	import Container from './_Container.svelte';
	import { getMapList } from '$lib/map-registry';
	import { currentLevelId } from '$lib/stores';

	const mapPromise = getMapList();
</script>

<Container>
	{#if $currentLevelId === null}
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
								$currentLevelId = meta.key;
							}}>{meta.name}</a
						>
					</li>
				{/each}
			{/await}
		</main>
	{:else}
		<LevelLoader key={$currentLevelId} />
	{/if}
</Container>
