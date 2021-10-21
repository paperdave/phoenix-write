<!-- 
	this component handles level loading, and also displays a screen while the level is loading.
	it displays <Level/> once the level is loaded.
-->
<script lang="ts">
	import { parseMap } from '$lib/map-parser';

	import type { LoadedMap, MapMeta } from '$lib/types';
	import Level from './_Level.svelte';

	export let key: string;
	export let meta: MapMeta;

	const loadingPromise: Promise<LoadedMap> = (async () => {
		if (meta.type === 'map') {
			const results = await Promise.all([
				fetch(`/maps/${key}/map.txt`).then((x) => x.text()),
				fetch(`/maps/${key}/video.mp4`).then((x) => x.blob())
			]);
			console.log(parseMap(results[0]));
			return {
				key,
				meta,
				words: parseMap(results[0]).words,
				video: results[1]
			};
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
	<Level map={loadedMap} />
{/await}
