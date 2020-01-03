<script>
	import { onMount } from 'svelte';
	import Layer from './components/layer.svelte';
	const layers = [2, 1, 0];
	let offsetTop = 0;
	let y = 0;
	let h = 1;
	let wh = 1;
	let container;
	$: {
		if (container) {
			offsetTop = container.offsetTop;
			if (offsetTop === 1) offsetTop = container.offsetParent.offsetTop;
		}
	}

	onMount(() => {
		offsetTop = container.offsetTop;
		if (offsetTop === 1) offsetTop = container.offsetParent.offsetTop;
	});
</script>

<style>
	#background {
		overflow: visible;
	}
</style>

<svelte:window bind:scrollY={y} bind:innerHeight={wh}/>

<div bind:clientHeight={h} bind:this={container}>
	<svg id="background" viewBox="0 0 4409.92 2479.24">
		{#each layers as layer}
			<Layer t={(y - offsetTop + wh - h) / wh} depth={layer} style="transform: translate(0,{((y - offsetTop + wh - h) / wh) * layer * 500}px);"/>
		{/each}
	</svg>
</div>
