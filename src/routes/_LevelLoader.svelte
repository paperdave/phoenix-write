<!-- 
	this component handles level loading, and also displays a screen while the level is loading.
	it displays <Level/> once the level is loaded.
-->
<script lang="ts">
	import type { LoadedMap, MapMeta } from '$lib/types';
	import Level from './_Level.svelte';

	export let key: string;
	export let meta: MapMeta;

	const loadingPromise: Promise<LoadedMap> = (async () => {
		const results = await Promise.all([
			fetch(`/maps/${key}/alignment.json`).then((x) => x.json()),
			fetch(`/maps/${key}/map.txt`).then((x) => x.text()),
			fetch(`/maps/${key}/video.mp4`).then((x) => x.blob())
		]);
		return {
			key,
			meta,
			alignment: results[0],
			transcript: results[1],
			video: results[2]
		};
	})();
</script>

{#await loadingPromise}
	<main>
		<h1>loading map...</h1>
	</main>
{:then loadedMap}
	<Level map={loadedMap} />
{/await}
