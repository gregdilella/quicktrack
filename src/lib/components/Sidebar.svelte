<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { signOut } from '$lib/auth';
	import { getCurrentUserProfile } from '$lib/userService';
	import type { UserProfile } from '$lib/types';

	// Component properties
	export let currentPage: string = ''; // To highlight current page

	// State
	let userProfile: UserProfile | null = null;
	let loading = true;

	// Route-based navigation configuration
	const routeNavigation: Record<string, Array<{label: string, href: string}>> = {
		admin: [
			{ label: 'Management Dashboard', href: '/dashboard/management' },
			{ label: 'Operations Dashboard', href: '/dashboard/operations' },
			{ label: 'LSP Dashboard', href: '/dashboard/lsp' },
			{ label: 'Customer Dashboard', href: '/dashboard/customer' },
			{ label: 'Testing', href: '/dashboard/testing' }
		],
		management: [
			{ label: 'Customer Search', href: '/dashboard/management/customer-search' },
			{ label: 'Add New Customer', href: '/dashboard/management/add-new-customer' },
			{ label: 'Customer P&L', href: '/dashboard/management/customer-pl' },
			{ label: 'Users', href: '/dashboard/management/users' },
			{ label: 'Tableau Graphs', href: '/dashboard/management/graphs' }
		],
		operations: [
			{ label: 'Add New Job', href: '/dashboard/operations/add-new-job' },
			{ label: 'Job Search', href: '/dashboard/operations/jobsearch' },
			{ label: 'Flight Search', href: '/dashboard/operations/flight-search' }
		],
		lsp: [
			{ label: 'Incoming Requests', href: '/dashboard/lsp/incoming-requests' },
			{ label: 'Confirm Times', href: '/dashboard/lsp/confirm-times' },
			{ label: 'Accrual', href: '/dashboard/lsp/accrual' },
			{ label: 'Dispute', href: '/dashboard/lsp/dispute' }
		],
		customer: [
			{ label: 'New Job', href: '/dashboard/customer/new-job' },
			{ label: 'Job Search', href: '/dashboard/customer/job-search' },
			{ label: 'Quote', href: '/dashboard/customer/quote' },
			{ label: 'Invoice', href: '/dashboard/customer/invoice' }
		]
	};

	// Function to determine current dashboard section from route
	function getCurrentSection(pathname: string): string {
		const match = pathname.match(/^\/dashboard\/([^\/]+)/);
		return match ? match[1] : '';
	}

	// Function to get appropriate role text for current section
	function getSectionRole(section: string): string {
		switch (section) {
			case 'admin': return 'Admin';
			case 'management': return 'Management';
			case 'operations': return 'Operations';
			case 'lsp': return 'LSP';
			case 'customer': return 'Customer';
			default: return userProfile?.role || 'User';
		}
	}

	// Get theme colors based on current section
	function getThemeColors(section: string) {
		switch (section) {
			case 'customer':
				return {
					primary: '#dc2626',
					secondary: '#b91c1c',
					background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
					accent: 'rgba(220, 38, 38, 0.1)',
					text: '#dc2626'
				};
			case 'lsp':
				return {
					primary: '#2563eb',
					secondary: '#1d4ed8',
					background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
					accent: 'rgba(37, 99, 235, 0.1)',
					text: '#2563eb'
				};
			case 'management':
				return {
					primary: '#7c3aed',
					secondary: '#6d28d9',
					background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
					accent: 'rgba(124, 58, 237, 0.1)',
					text: '#7c3aed'
				};
			case 'operations':
				return {
					primary: '#ea580c',
					secondary: '#dc2626',
					background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
					accent: 'rgba(234, 88, 12, 0.1)',
					text: '#ea580c'
				};
			case 'admin':
				return {
					primary: '#ef4444',
					secondary: '#dc2626',
					background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
					accent: 'rgba(239, 68, 68, 0.1)',
					text: '#ef4444'
				};
			default:
				return {
					primary: '#6b7280',
					secondary: '#4b5563',
					background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
					accent: 'rgba(107, 114, 128, 0.1)',
					text: '#6b7280'
				};
		}
	}

	// Get status text based on role
	function getStatusText(role: string): string {
		switch (role) {
			case 'Admin': return 'Administrator Access';
			case 'Management': return 'Management Access';
			case 'Operations': return 'Operations Access';
			case 'LSP': return 'LSP Access';
			case 'Customer': return 'Customer Access';
			default: return 'User Access';
		}
	}

	// Handle logout
	async function handleLogout() {
		try {
			await signOut();
			window.location.href = '/';
		} catch (error) {
			console.error('Error signing out:', error);
		}
	}

	// Close sidebar when navigation link is clicked (mobile only)
	function handleNavClick() {
		if (isMobile) {
			sidebarOpen = false;
		}
	}

	// Load user profile on mount
	onMount(async () => {
		try {
			userProfile = await getCurrentUserProfile();
		} catch (error) {
			console.error('Error loading user profile:', error);
		} finally {
			loading = false;
		}
	});

	// Add mobile sidebar state and responsive toggle
	let isMobile = false;
	let sidebarOpen = true;

	function updateViewport() {
		isMobile = window.innerWidth <= 768;
		if (isMobile) {
			sidebarOpen = false;
		} else {
			sidebarOpen = true;
		}
	}

	onMount(() => {
		updateViewport();
		window.addEventListener('resize', updateViewport);
		return () => window.removeEventListener('resize', updateViewport);
	});

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}

	// Get navigation items based on current route
	$: currentSection = getCurrentSection($page.url.pathname);
	$: navigationItems = currentSection ? routeNavigation[currentSection] || [] : [];
	$: dashboardRoute = currentSection ? `/dashboard/${currentSection}` : '/dashboard';
	$: sectionRole = getSectionRole(currentSection);
	$: themeColors = getThemeColors(currentSection);
</script>

<!-- Hamburger Toggle -->
<button 
	class="hamburger" 
	class:show={!sidebarOpen && isMobile}
	on:click={toggleSidebar} 
	aria-label="Toggle Sidebar"
>
	<span></span><span></span><span></span>
</button>

<!-- Overlay for mobile -->
{#if isMobile && sidebarOpen}
	<div 
		class="overlay" 
		on:click={toggleSidebar}
		on:keydown={(e) => e.key === 'Escape' && toggleSidebar()}
		role="button"
		tabindex="0"
		aria-label="Close sidebar"
	></div>
{/if}

<aside class="sidebar" class:open={sidebarOpen} class:mobile={isMobile} style="background: {themeColors.background};">
	<!-- Header Section -->
	<div class="sidebar-header">
		<div class="brand-section">
			<h1 class="brand-title" style="color: {themeColors.primary};">CERTrack</h1>
			<p class="brand-subtitle">Control Panel</p>
		</div>
	</div>

	<!-- User Status Card -->
	{#if loading}
		<div class="status-card">
			<div class="loading-indicator">
				<div class="spinner" style="border-top-color: {themeColors.primary};"></div>
				<p>Loading...</p>
			</div>
		</div>
	{:else if userProfile}
		<div class="status-card">
			<div class="user-avatar" style="background: {themeColors.primary};">
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
				</svg>
			</div>
			<div class="user-info">
				<p class="user-status" style="color: {themeColors.text};">
					{getStatusText(currentSection ? sectionRole : userProfile.role || 'User')}
				</p>
				<p class="user-email">{userProfile.email}</p>
				{#if currentSection}
					<p class="user-section" style="color: {themeColors.text};">
						{sectionRole} Panel
					</p>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Navigation Menu -->
	<nav class="navigation">
		{#if navigationItems.length > 0}
			<div class="nav-section">
				<h3 class="nav-title" style="color: {themeColors.text};">
					{sectionRole} Functions
				</h3>
				<ul class="nav-list">
					<li>
						<a 
							href={dashboardRoute} 
							class="nav-link" 
							class:active={currentPage === dashboardRoute}
							style="--theme-color: {themeColors.primary}; --theme-accent: {themeColors.accent};"
							on:click={handleNavClick}
						>
							<svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h2a2 2 0 012 2v2H8V5z"/>
							</svg>
							Dashboard
						</a>
					</li>
					{#each navigationItems as item}
						<li>
							<a 
								href={item.href} 
								class="nav-link"
								class:active={currentPage === item.href}
								style="--theme-color: {themeColors.primary}; --theme-accent: {themeColors.accent};"
								on:click={handleNavClick}
							>
								<svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
								</svg>
								{item.label}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</nav>

	<!-- System Actions -->
	<div class="system-actions">
		<div class="actions-card">
			{#if userProfile?.role === 'Admin'}
				<a 
					href="/dashboard/admin" 
					class="action-btn admin-btn"
					style="background: {themeColors.primary}; border-color: {themeColors.primary};"
					on:click={handleNavClick}
				>
					<svg class="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
					</svg>
					Admin Panel
				</a>
			{/if}
			<button 
				type="button" 
				on:click={handleLogout} 
				class="action-btn logout-btn"
				style="background: {themeColors.primary}; border-color: {themeColors.primary};"
			>
				<svg class="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
				</svg>
				Sign Out
			</button>
		</div>
	</div>
</aside>

<style>
	/* Overlay for mobile */
	.overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		z-index: 999;
		display: block;
	}

	.sidebar {
		width: 280px;
		height: 100vh;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		padding: 1.5rem;
		box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
		overflow-y: auto;
		position: fixed;
		left: 0;
		top: 0;
		z-index: 1000;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		transition: transform 0.3s ease;
		transform: translateX(0);
		padding-bottom: 2rem;
	}

	/* Desktop: sidebar always visible */
	@media (min-width: 769px) {
		.sidebar {
			transform: translateX(0);
		}
	}

	/* Mobile: sidebar hidden by default */
	@media (max-width: 768px) {
		.sidebar {
			width: 100%;
			transform: translateX(-100%);
			padding: 1rem;
		}
		
		.sidebar.open {
			transform: translateX(0);
		}
		
		.sidebar.mobile {
			width: 100%;
			max-width: 100%;
		}
	}

	/* Hamburger Menu */
	.hamburger {
		position: fixed;
		top: 1rem;
		left: 1rem;
		width: 40px;
		height: 40px;
		background: white;
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 8px;
		display: none;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 4px;
		z-index: 1100;
		cursor: pointer;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease;
	}

	.hamburger:hover {
		background: #f3f4f6;
		transform: scale(1.05);
	}

	.hamburger span {
		display: block;
		height: 2px;
		width: 20px;
		background: #374151;
		border-radius: 1px;
		transition: all 0.2s ease;
	}

	.hamburger.show {
		display: flex;
	}

	/* Header Section */
	.sidebar-header {
		padding-bottom: 1rem;
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
	}

	.brand-section {
		text-align: center;
	}

	.brand-title {
		font-size: 1.75rem;
		font-weight: 700;
		margin: 0 0 0.25rem 0;
		background: linear-gradient(45deg, currentColor, rgba(0, 0, 0, 0.8));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.brand-subtitle {
		font-size: 0.875rem;
		color: #6b7280;
		margin: 0;
		font-weight: 400;
	}

	/* Status Card */
	.status-card {
		background: white;
		padding: 1.5rem;
		border-radius: 16px;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
		border: 1px solid rgba(0, 0, 0, 0.05);
	}

	.loading-indicator {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid rgba(0, 0, 0, 0.1);
		border-radius: 50%;
		border-top-color: currentColor;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.loading-indicator p {
		font-size: 0.875rem;
		color: #6b7280;
		margin: 0;
	}

	.user-avatar {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 1rem;
		color: white;
	}

	.user-avatar svg {
		width: 24px;
		height: 24px;
	}

	.user-info {
		text-align: center;
	}

	.user-status {
		font-size: 0.875rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
	}

	.user-email {
		font-size: 0.875rem;
		color: #6b7280;
		margin: 0 0 0.5rem 0;
	}

	.user-section {
		font-size: 0.75rem;
		font-weight: 500;
		margin: 0;
	}

	/* Navigation */
	.navigation {
		flex: 1;
	}

	.nav-section {
		margin-bottom: 1.5rem;
	}

	.nav-title {
		font-size: 0.875rem;
		font-weight: 600;
		margin: 0 0 1rem 0;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
	}

	.nav-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.nav-link {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem 1rem;
		background: white;
		border: 1px solid rgba(0, 0, 0, 0.05);
		border-radius: 12px;
		color: #4b5563;
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.2s ease;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	}

	.nav-link:hover {
		background: var(--theme-accent);
		border-color: var(--theme-color);
		color: var(--theme-color);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.nav-link.active {
		background: var(--theme-accent);
		border-color: var(--theme-color);
		color: var(--theme-color);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.nav-icon {
		width: 18px;
		height: 18px;
		flex-shrink: 0;
	}

	/* System Actions */
	.system-actions {
		border-top: 1px solid rgba(0, 0, 0, 0.1);
		padding-top: 1.5rem;
		padding-bottom: 1.5rem;
	}

	.actions-card {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.action-btn {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem 1rem;
		border: 1px solid;
		border-radius: 12px;
		color: white;
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		justify-content: center;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.action-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
	}

	.action-icon {
		width: 18px;
		height: 18px;
	}

	.logout-btn {
		background: transparent;
		border: none;
		font-family: inherit;
		margin-bottom: 1.5rem;
	}

	/* Scrollbar Styling */
	.sidebar::-webkit-scrollbar {
		width: 8px;
	}

	.sidebar::-webkit-scrollbar-track {
		background: rgba(0, 0, 0, 0.05);
		border-radius: 4px;
	}

	.sidebar::-webkit-scrollbar-thumb {
		background: rgba(0, 0, 0, 0.2);
		border-radius: 4px;
	}

	.sidebar::-webkit-scrollbar-thumb:hover {
		background: rgba(0, 0, 0, 0.3);
	}

	/* Mobile specific styles */
	@media (max-width: 768px) {
		.brand-title {
			font-size: 1.5rem;
		}
	}
</style> 