<!-- Reusable Tab System Component -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte'
	
	export let activeTab: string = 'where'
	export let tabs: Array<{id: string, label: string}> = [
		{id: 'who', label: 'Who'},
		{id: 'what', label: 'What'},
		{id: 'packaging', label: 'Packaging'},
		{id: 'quote', label: 'Quote'},
		{id: 'where', label: 'Where'},
		{id: 'how', label: 'How'},
		{id: 'when', label: 'When'}
	]
	export let saving: boolean = false
	
	const dispatch = createEventDispatcher()
	
	function switchTab(tabId: string) {
		activeTab = tabId
		dispatch('tabChange', { activeTab: tabId })
	}
	
	function handleSaveAndReturn() {
		dispatch('saveAndReturn')
	}
</script>

<div class="tabs-container">
	<!-- Tab Content Area - Fixed Height -->
	<div class="tab-content">
		<slot {activeTab} />
	</div>

	<!-- Tab Navigation - Horizontal Row Bottom Right -->
	<div class="tab-nav-vertical">
		<!-- Save Button on the Left -->
		<button 
			class="save-button-tab" 
			on:click={handleSaveAndReturn}
			disabled={saving}
		>
			{saving ? '💾 Saving...' : '💾 Save & Return'}
		</button>
		
		<!-- Tab Buttons -->
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
		margin: 2rem 0;
		background: white;
		border-radius: 20px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
		position: relative;
		min-height: 500px;
		z-index: 10;
		isolation: isolate;
		overflow: hidden;
		backdrop-filter: blur(10px);
		background: linear-gradient(135deg, #ffffff 0%, #fefefe 100%);
	}

	.tab-content {
		padding: 2rem;
		height: 100%;
		min-height: 440px;
		box-sizing: border-box;
		overflow-y: auto;
		position: relative;
		z-index: 1;
		background: transparent;
	}

	.tab-nav-vertical {
		position: absolute;
		bottom: 20px;
		right: 20px;
		display: flex;
		flex-direction: row; /* Changed to horizontal */
		gap: 8px;
		z-index: 20;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(10px);
		padding: 8px;
		border-radius: 16px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.tab-button-vertical {
		padding: 10px 16px;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-size: 13px;
		font-weight: 600;
		background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
		color: #64748b;
		border: 1px solid #e2e8f0;
		border-radius: 12px;
		cursor: pointer;
		text-align: center;
		min-width: 60px;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		overflow: hidden;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.tab-button-vertical::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, #ea580c, #dc2626);
		opacity: 0;
		transition: opacity 0.3s ease;
		z-index: -1;
	}

	.tab-button-vertical:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(234, 88, 12, 0.2);
		color: #ea580c;
		border-color: #ea580c;
	}

	.tab-button-vertical.active {
		background: linear-gradient(135deg, #ea580c, #dc2626);
		color: white;
		border-color: #ea580c;
		box-shadow: 0 8px 25px rgba(234, 88, 12, 0.4);
		transform: translateY(-1px);
	}

	.tab-button-vertical.active::before {
		opacity: 1;
	}

	/* Save Button Styling */
	.save-button-tab {
		padding: 10px 20px;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-size: 13px;
		font-weight: 600;
		background: linear-gradient(135deg, #16a34a, #15803d);
		color: white;
		border: 1px solid #16a34a;
		border-radius: 12px;
		cursor: pointer;
		text-align: center;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		overflow: hidden;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-right: 12px;
		box-shadow: 0 4px 15px rgba(22, 163, 74, 0.3);
	}

	.save-button-tab:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(22, 163, 74, 0.4);
		background: linear-gradient(135deg, #15803d, #166534);
	}

	.save-button-tab:disabled {
		opacity: 0.7;
		cursor: not-allowed;
		transform: none;
		box-shadow: 0 4px 15px rgba(22, 163, 74, 0.2);
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.tabs-container {
			min-height: 420px;
			margin: 1rem 0;
			border-radius: 16px;
		}
		
		.tab-content {
			min-height: 360px;
			padding: 1.5rem;
		}
		
		.tab-button-vertical {
			font-size: 11px;
			padding: 8px 12px;
			min-width: 50px;
		}
		
		.tab-nav-vertical {
			bottom: 15px;
			right: 15px;
			padding: 6px;
			gap: 6px;
			border-radius: 12px;
		}
		
		.save-button-tab {
			font-size: 11px;
			padding: 8px 16px;
			margin-right: 8px;
		}
	}

	/* Add subtle animation for content transitions */
	.tab-content {
		animation: fadeIn 0.4s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style> 