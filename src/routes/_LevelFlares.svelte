<script lang="ts">
	import type { LevelLogic } from '$lib/input';
	import type { LoadedLevel } from '$lib/types';

	export let level: LoadedLevel;
	export let logic: LevelLogic;
	export let keyResults: (string | true | null)[][];
	export let win: boolean;
	export let currentWordI: number;
</script>

<main />

<style>
	main {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}
</style>
