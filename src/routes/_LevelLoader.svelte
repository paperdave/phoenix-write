<!-- 
	this component handles level loading, and also displays a screen while the level is loading.
	it displays <Level/> once the level is loaded.
-->
<script lang="ts">
	import { getMap } from '$lib/map-registry';

	import LoadingScreen from './LoadingScreen.svelte';
	import Cutscene from './_Cutscene.svelte';
	import Level from './_Level.svelte';

	export let key: string;

	$: loadingPromise = getMap(key);
</script>

<main>
	{#await loadingPromise}
		<LoadingScreen />
	{:then loadedMap}
		{#if loadedMap.type === 'map'}
			<Level level={loadedMap} />
		{:else if loadedMap.type === 'cutscene'}
			<Cutscene cutscene={loadedMap} />
		{/if}
	{/await}
</main>
