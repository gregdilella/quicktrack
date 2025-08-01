<!-- Reusable Tab System Component -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte'
	
	export let activeTab: string = 'where'
	export let tabs: Array<{id: string, label: string}> = [
		{id: 'who', label: 'Who'},
		{id: 'what', label: 'What'},
		{id: 'where', label: 'Where'},
		{id: 'how', label: 'How'},
		{id: 'when', label: 'When'}
	]
	
	const dispatch = createEventDispatcher()
	
	function switchTab(tabId: string) {
		activeTab = tabId
		dispatch('tabChange', { activeTab: tabId })
	}
</script>

<div class="tabs-container">
	<!-- Tab Content Area - Fixed Height -->
	<div class="tab-content">
		<slot {activeTab} />
	</div>

	<!-- Tab Navigation - Vertical Column Right -->
	<div class="tab-nav-vertical">
		{#each tabs as tab}
			<button 
				class="tab-button-vertical" 
				class:active={activeTab === tab.id} 
				on:click={() => switchTab(tab.id)}
			>
				{tab.label}
			</button>
		{/each}
	</div>
</div>

<style>
	.tabs-container {
		margin: 30px 0;
		border: 2px solid #ff8800;
		background-color: #fff8f0;
		position: relative;
		min-height: 450px; /* Reduced height */
		z-index: 10; /* Ensure tab system sits above other content */
		isolation: isolate; /* Create new stacking context */
		overflow: hidden; /* Prevent content from spilling out */
		contain: layout style; /* Contain layout and styling effects */
		clear: both; /* Clear any floating elements */
	}

	.tab-content {
		padding: 20px;
		height: 100%;
		min-height: 410px; /* Reduced content height */
		box-sizing: border-box;
		overflow-y: auto; /* Allow scrolling if content is too tall */
		background-color: #fff8f0; /* Ensure full background coverage */
		position: relative;
		z-index: 1; /* Layer above container background */
	}

	.tab-nav-vertical {
		position: absolute;
		bottom: 5px;
		right: 10px;
		display: flex;
		flex-direction: column;
		gap: 1px;
		z-index: 20; /* Ensure tab buttons are above all other content */
	}

	.tab-button-vertical {
		padding: 4px 8px;
		font-family: 'Courier New', monospace;
		font-size: 10px;
		background-color: #00aa00;
		color: black;
		border: 1px solid #008800;
		cursor: pointer;
		font-weight: bold;
		text-align: center;
		min-width: 50px;
		transition: background-color 0.2s ease;
	}

	.tab-button-vertical:hover {
		background-color: #00cc00;
	}

	.tab-button-vertical.active {
		background-color: #888888;
		color: white;
		border-color: #666666;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.tabs-container {
			min-height: 380px;
		}
		
		.tab-content {
			min-height: 340px;
		}
		
		.tab-button-vertical {
			font-size: 8px;
			padding: 4px 8px;
		}
		
		.tab-nav-vertical {
			bottom: 2px;
			right: 5px;
		}
	}
</style> 