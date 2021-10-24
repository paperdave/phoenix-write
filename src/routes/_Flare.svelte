<script lang="ts">
	export let color = '#ffffff';
	export let stroke = '#000000';
</script>

<svg viewBox="0 0 1000 100">
	<text x="500" y="50" fill={color} style="--stroke:{stroke}"><slot /></text>
</svg>

<style>
	svg {
		pointer-events: none;
		user-select: none;
	}
	text {
		font-size: 50px;
		paint-order: stroke;
		stroke: var(--stroke);
		stroke-width: 9px;
		stroke-linecap: round;
		stroke-linejoin: round;
		font-weight: 800;
		filter: drop-shadow(1px 1px 0 var(--stroke)) drop-shadow(1px 1px 0 var(--stroke));
		dominant-baseline: middle;
		text-anchor: middle;
	}
</style>
