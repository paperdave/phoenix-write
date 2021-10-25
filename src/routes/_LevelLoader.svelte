<!-- 
	this component handles level loading, and also displays a screen while the level is loading.
	it displays <Level/> once the level is loaded.
-->
<script lang="ts">
	import { loadRestAudio } from '$lib/audio';

	import { getMap, getMapList, getMapListNoPromise } from '$lib/map-registry';

	import LoadingScreen from './_LoadingScreen.svelte';
	import Cutscene from './_Cutscene.svelte';
	import Level from './_Level.svelte';
	import { delay } from '$lib/utils';

	export let key: string;

	let mapList = getMapListNoPromise();

	$: loadingPromise = getMap(key).then(async (x) => {
		await delay(10);
		return x;
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
		<LoadingScreen {color} {imageId} />
	{:then loadedMap}
		{#if loadedMap.type === 'map'}
			<Level level={loadedMap} />
		{:else if loadedMap.type === 'cutscene'}
			<Cutscene cutscene={loadedMap} />
		{/if}
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
