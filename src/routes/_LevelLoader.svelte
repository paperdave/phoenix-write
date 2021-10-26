<!-- 
	this component handles level loading, and also displays a screen while the level is loading.
	it displays <Level/> once the level is loaded.
-->
<script lang="ts">
	import { loadRestAudio } from '$lib/audio';

	import { getMap, getMapListNoPromise } from '$lib/map-registry';

	import LoadingScreen from './_LoadingScreen.svelte';
	import Cutscene from './_Cutscene.svelte';
	import Level from './_Level.svelte';
	import { delay } from '$lib/utils';
	import Duet from './_Duet.svelte';

	export let key: string;

	let mapList = getMapListNoPromise();

	$: loadingPromise = getMap(key);
	$: isDone = loadingPromise && (false as boolean);
	$: delayPromise = loadingPromise
		.then(() => delay(40))
		.then(() => {
			isDone = true;
		});
	$: {
		loadingPromise.then(async () => {
			let nextMap = mapList[mapList.findIndex((x) => x.key === key) + 1];
			getMap(nextMap.key);

			loadRestAudio();
		});
	}

	$: color = mapList.find((x) => x.key === key).background;
	$: imageId = mapList.find((x) => x.key === key).backgroundImage;
</script>

<main style="background:{color}">
	{#await loadingPromise}
		<!-- <LoadingScreen {color} {imageId} /> -->
	{:then loadedMap}
		{#if loadedMap.type === 'map'}
			<Level level={loadedMap} />
		{:else if loadedMap.type === 'cutscene'}
			<Cutscene cutscene={loadedMap} />
		{:else if loadedMap.type === 'duet'}
			<Duet level={loadedMap} />
		{/if}
	{/await}
	{#await delayPromise}
		<LoadingScreen {isDone} {color} {imageId} />
	{/await}
</main>

<style>
	main {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}
</style>
