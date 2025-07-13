<script lang="ts">
	import { page } from '$app/stores';
	import Sidebar from '$lib/components/Sidebar.svelte';
	
	// Get current page path for sidebar highlighting
	$: currentPage = $page.url.pathname;
</script>

<!-- Sidebar Navigation (automatically included on all dashboard pages) -->
<Sidebar {currentPage} />

<!-- Main content area with sidebar offset -->
<main class="dashboard-layout">
	<slot />
</main>

<style>
	.dashboard-layout {
		margin-left: 300px; /* Account for sidebar width */
		min-height: 100vh;
		background-color: #ffffff; /* White background to match sidebar */
		padding-left: 20px; /* Add some spacing from sidebar */
	}

	/* Global dashboard styles - applied to all dashboard pages */
	:global(body) {
		background-color: #ffffff !important; /* Ensure white background on all pages */
	}

	:global(.dashboard-container) {
		margin-left: 0 !important; /* Reset any existing margin since layout handles it */
		background-color: #ffffff; /* White background for dashboard containers */
	}

	:global(.terminal-container) {
		margin-left: 0 !important; /* Reset any existing margin since layout handles it */
		background-color: #ffffff; /* White background for terminal containers */
	}
</style> 