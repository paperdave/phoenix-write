<script lang="ts">
	import { fade } from 'svelte/transition';

	export let color = 'white';
	export let imageId: string | undefined;

	export let isDone = false;
</script>

<main style="background:{color}" out:fade={{ delay: 200, duration: 100 }}>
	{#if imageId}
		<img src="./loadingframes/load{imageId}.png" alt="stuff" />
	{/if}
	{#if !isDone}
		<p in:fade={{ delay: 200, duration: 100 }}>LOADING</p>
	{/if}
</main>

<style>
	main {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	img {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}

	p {
		display: inline-block;
		font-size: calc(var(--unit) * 5);
		color: #fff;
		background-color: rgba(0, 0, 0, 0.25);
		padding: calc(var(--unit) * 2);
		border-radius: calc(var(--unit) * 1.5);
	}
</style>
