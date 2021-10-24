<script>
	import { fade } from 'svelte/transition';

	export let color = 'white';
</script>

<main style="background:{color}">
	<p in:fade={{ delay: 50, duration: 100 }}>LOADING</p>
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

	p {
		display: inline-block;
		font-size: calc(var(--unit) * 5);
		color: #fff;
		background-color: rgba(0, 0, 0, 0.25);
		padding: calc(var(--unit) * 2);
		border-radius: calc(var(--unit) * 1.5);
	}
</style>
