<!-- 
	this component handles level loading, and also displays a screen while the level is loading.
	it displays <Level/> once the level is loaded.
-->
<script lang="ts">
	import { parseMap } from '$lib/map-parser';

	import type { LoadedLevel, MapMeta } from '$lib/types';
	import Cutscene from './_Cutscene.svelte';
	import Map from './_Map.svelte';

	export let key: string;
	export let meta: MapMeta;

	const loadingPromise: Promise<LoadedLevel> = (async () => {
		if (meta.type === 'map') {
			const results = await Promise.all([
				fetch(`/maps/${key}/map.txt`).then((x) => x.text()),
				fetch(`/maps/${key}/video.mp4`).then((x) => x.blob())
			]);
			return {
				type: 'map',
				key,
				meta,
				words: parseMap(results[0]).words,
				video: results[1]
			} as LoadedLevel;
		} else if (meta.type === 'cutscene') {
			const results = await Promise.all([
				fetch(`/maps/${key}/cutscene.json`).then((x) => x.json()),
				fetch(`/maps/${key}/video.mp4`).then((x) => x.blob())
			]);
			return {
				type: 'cutscene',
				key,
				meta,
				...results[0],
				video: results[1]
			} as LoadedLevel;
		} else {
			throw new Error('Unknown map type');
		}
	})();
</script>

{#await loadingPromise}
	<main>
		<h1>loading map...</h1>
	</main>
{:then loadedMap}
	{#if loadedMap.type === 'map'}
		<Map map={loadedMap} />
	{:else if loadedMap.type === 'cutscene'}
		<Cutscene cutscene={loadedMap} />
	{/if}
{/await}
