<script lang="ts">
	import { page } from '$app/stores';
	import Sidebar from '$lib/components/Sidebar.svelte';
	
	// Get current page path for sidebar highlighting
	$: currentPage = $page.url.pathname;
</script>

<!-- Sidebar Navigation (automatically included on all dashboard pages) -->
<Sidebar {currentPage} />

<!-- Main content area with responsive sidebar offset -->
<main class="dashboard-layout">
	<slot />
</main>

<style>
	.dashboard-layout {
		min-height: 100vh;
		background-color: #ffffff;
		transition: margin-left 0.3s ease;
	}

	/* Desktop: Always account for sidebar */
	@media (min-width: 769px) {
		.dashboard-layout {
			margin-left: 280px;
			padding-left: 20px;
		}
	}

	/* Mobile: No margin by default, full width when sidebar is closed */
	@media (max-width: 768px) {
		.dashboard-layout {
			margin-left: 0;
			padding-left: 1rem;
			padding-right: 1rem;
			padding-top: 4rem; /* Add top padding for hamburger menu */
		}
	}

	/* Global dashboard styles - applied to all dashboard pages */
	:global(body) {
		background-color: #ffffff !important;
	}

	:global(.dashboard-container) {
		margin-left: 0 !important;
		background-color: #ffffff;
	}

	:global(.terminal-container) {
		margin-left: 0 !important;
		background-color: #ffffff;
	}

	/* Ensure content doesn't get hidden behind mobile sidebar */
	@media (max-width: 768px) {
		.dashboard-layout {
			position: relative;
			z-index: 1;
		}
	}
</style> 