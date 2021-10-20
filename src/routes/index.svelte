<script context="module" lang="ts">
	import '../global.css';
	import type { Load } from '@sveltejs/kit';
	import type { MapMeta } from '$lib/types';

	export const load: Load = async ({ fetch }) => {
		const res = await fetch('/get-map-list');
		const maps = await res.json();
		return {
			props: {
				...maps
			}
		};
	};
</script>

<script lang="ts">
	import LevelLoader from './_LevelLoader.svelte';

	let currentLevel: string | null = null;

	export let maps: Record<string, MapMeta>;
	export let order: string[];

	function setLoadMap(ev: MouseEvent, key: string) {
		ev.preventDefault();
		currentLevel = key;
	}
</script>

{#if currentLevel === null}
	<main>
		<h1>video typer prototype</h1>

		{#each order as key}
			<li><a href="#" on:click={(ev) => setLoadMap(ev, key)}>{maps[key].name}</a></li>
		{/each}
	</main>
{:else}
	<LevelLoader key={currentLevel} meta={maps[currentLevel]} />
{/if}
