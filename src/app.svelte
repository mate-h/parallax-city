<script>
	import Layer from './components/layer.svelte';
	const layers = [2, 1, 0];
	let y = 0;
	let h = 1;
</script>

<style>
	.foreground {
		width: 100%;
		transform: translate(0, -12px);
		height: calc(100% - 150px);
		background-color: #212121;
		color: white;
		padding: 100vh 0 0 0;
	}
	.foreground::after {
		display: block;
		background-color: #212121;
		height: 12px;
		content: "";
		transform: translate(0, 12px);
	}
	.main {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		z-index: -1000;
	}
</style>

<svelte:window bind:scrollY={y}/>

<div class="main">
	<div bind:clientHeight={h}>
		<svg  id="background" viewBox="0 0 4409.92 2479.24">
			{#each layers as layer}
				<Layer t={y / h} depth={layer} style="transform: translate(0,{(y / h) * layer * 500}px); opacity: "/>
			{/each}
		</svg>
	</div>
	
	<div class="foreground"/>
</div>


