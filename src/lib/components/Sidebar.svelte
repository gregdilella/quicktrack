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
			{ label: 'Customer Dashboard', href: '/dashboard/customer' }
		],
		management: [
			{ label: 'Add New Customer', href: '/dashboard/management/add-new-customer' },
			{ label: 'Customer P&L', href: '/dashboard/management/customer-pl' },
			{ label: 'Users', href: '/dashboard/management/users' },
			{ label: 'Tableau Graphs', href: '/dashboard/management/graphs' }
		],
		operations: [
			{ label: 'Add New Job', href: '/dashboard/operations/add-new-job' },
			{ label: 'Job Search', href: '/dashboard/operations/job-search' },
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

	// Get role-specific colors
	function getRoleColor(role: string): string {
		switch (role) {
			case 'Admin': return '#ff6b6b';
			case 'Management': return '#9c88ff';
			case 'Operations': return '#ffa726';
			case 'LSP': return '#66bb6a';
			case 'Customer': return '#42a5f5';
			default: return '#ffffff';
		}
	}

	// Get status text based on role
	function getStatusText(role: string): string {
		switch (role) {
			case 'Admin': return 'ADMINISTRATOR ACCESS';
			case 'Management': return 'MANAGEMENT ACCESS';
			case 'Operations': return 'OPERATIONS ACCESS';
			case 'LSP': return 'LSP ACCESS';
			case 'Customer': return 'CUSTOMER ACCESS';
			default: return 'USER ACCESS';
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

	// Get navigation items based on current route
	$: currentSection = getCurrentSection($page.url.pathname);
	$: navigationItems = currentSection ? routeNavigation[currentSection] || [] : [];
	$: dashboardRoute = currentSection ? `/dashboard/${currentSection}` : '/dashboard';
	$: sectionRole = getSectionRole(currentSection);
	$: sectionRoleColor = getRoleColor(sectionRole);
</script>

<aside class="sidebar">
	<!-- ASCII Header -->
	<div class="ascii-header">
		<pre class="red-text">QQQQQQ                               
QQ    QQ          ii        k      k       
QQ    QQ uu   uu iii   cccc kk   kk
QQ    QQ uu   uu  ii  cc    kk kk
QQ QQ QQ uu   uu  ii  cc    kkk
QQQQ  QQ uu   uu  ii  cc    kk kk
  QQQQQQ   uuuu  iiii  cccc kk   kk
QQ</pre>
		<div class="company-info">
			<h2>INTERNATIONAL COURIER - CONTROL PANEL</h2>
		</div>
	</div>

	<!-- User Status -->
	{#if loading}
		<div class="user-status">
			<div class="status-line">Status: LOADING...</div>
		</div>
	{:else if userProfile}
		<div class="user-status">
			<div class="status-line">Status: {getStatusText(currentSection ? sectionRole : userProfile.role || 'User')}</div>
			<div class="status-line">Email: {userProfile.email.toUpperCase()}</div>
			<div class="status-line" style="color: {currentSection ? sectionRoleColor : getRoleColor(userProfile.role || 'User')}">
				{#if currentSection}
					Section: {sectionRole} | Role: {userProfile.role || 'Not Assigned'}
				{:else}
					Role: {userProfile.role || 'Not Assigned'}
				{/if}
			</div>
		</div>
	{/if}

	<!-- Navigation Menu -->
	<nav class="navigation">
		{#if navigationItems.length > 0}
			<div class="nav-section">
				<h3>{sectionRole.toUpperCase()} FUNCTIONS</h3>
				<ul>
					<li>
						<a href={dashboardRoute} class:active={currentPage === dashboardRoute}>
							Dashboard
						</a>
					</li>
					{#each navigationItems as item}
						<li>
							<a href={item.href} class:active={currentPage === item.href}>
								{item.label}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		<!-- System Actions -->
		<div class="nav-section system-actions">
			<h3>SYSTEM</h3>
			<ul>
				{#if userProfile?.role === 'Admin'}
					<li>
						<a href="/dashboard/admin" class="admin-btn">
							Admin Panel
						</a>
					</li>
				{/if}
				<li>
					<button type="button" on:click={handleLogout} class="logout-btn">
						Logout
					</button>
				</li>
			</ul>
		</div>
	</nav>
</aside>

<style>
	.sidebar {
		width: 300px;
		height: 100vh;
		background-color: #ffffff; /* White background to match pages */
		color: #006600; /* Darker green text for better readability */
		font-family: 'Courier New', monospace;
		font-size: 12px;
		padding: 16px;
		border-right: 3px solid #00aa00; /* Slightly darker green border */
		box-shadow: 2px 0 5px rgba(0, 170, 0, 0.2); /* Matching green glow */
		overflow-y: auto;
		position: fixed;
		left: 0;
		top: 0;
		z-index: 1000;
	}

	.ascii-header {
		margin-bottom: 20px;
		text-align: left;
	}

	.ascii-logo {
		color: #00ff00;
		font-size: 10px;
		line-height: 1;
		margin: 0;
		white-space: pre;
	}

	.red-text {
		color: #ff6b6b;
		font-size: 10px;
		line-height: 1;
		margin: 0;
		white-space: pre;
		text-align: left;
	}

	.company-info h2 {
		color: #ff6b6b;
		font-size: 12px;
		margin: 8px 0 4px 0;
		font-weight: bold;
		text-align: left;
	}

	.company-info h3 {
		font-size: 11px;
		margin: 0;
		font-weight: bold;
	}

	.user-status {
		border: 1px solid #00aa00;
		padding: 12px;
		margin-bottom: 20px;
		background-color: transparent;
	}

	.status-line {
		margin-bottom: 4px;
		font-size: 11px;
	}

	.status-line:last-child {
		margin-bottom: 0;
	}

	.navigation {
		flex: 1;
	}

	.nav-section {
		margin-bottom: 20px;
	}

	.nav-section h3 {
		color: #004400;
		font-size: 11px;
		margin-bottom: 8px;
		padding-bottom: 4px;
		border-bottom: 1px solid #cccccc;
	}

	.nav-section ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.nav-section li {
		margin-bottom: 4px;
	}

	.nav-section a {
		color: #006600;
		text-decoration: none;
		display: block;
		padding: 4px 8px;
		transition: all 0.2s;
		border-left: 2px solid transparent;
		font-size: 11px;
	}

	.nav-section a:hover {
		background-color: #f0f8f0;
		border-left-color: #00aa00;
		padding-left: 12px;
	}

	.nav-section a.active {
		background-color: #e8f4e8;
		border-left-color: #00aa00;
		color: #004400;
		font-weight: bold;
	}

	.system-actions {
		margin-top: auto;
		border-top: 1px solid #cccccc;
		padding-top: 16px;
	}

	.logout-btn {
		background: none;
		border: 1px solid #ff6b6b;
		color: #ff6b6b;
		font-family: 'Courier New', monospace;
		font-size: 11px;
		padding: 6px 12px;
		cursor: pointer;
		width: 100%;
		text-align: left;
		transition: all 0.2s;
		margin: 0;
		box-sizing: border-box;
	}

	.logout-btn:hover {
		background-color: #ff6b6b;
		color: #000;
	}

	/* Scrollbar styling for dark theme */
	.sidebar::-webkit-scrollbar {
		width: 8px;
	}

	.sidebar::-webkit-scrollbar-track {
		background: #ffffff;
	}

	.sidebar::-webkit-scrollbar-thumb {
		background: #00aa00;
		border-radius: 4px;
	}

	.sidebar::-webkit-scrollbar-thumb:hover {
		background: #006600;
	}

	/* Admin Button Styles - exactly matching logout button */
	.admin-btn {
		background: none;
		border: 1px solid #ff6b6b;
		color: #ff6b6b;
		font-family: 'Courier New', monospace;
		font-size: 11px;
		padding: 6px 12px;
		cursor: pointer;
		width: 100%;
		text-align: left;
		transition: all 0.2s;
		text-decoration: none;
		display: block;
		margin: 0;
		box-sizing: border-box;
	}

	.admin-btn:hover {
		background-color: #ff6b6b;
		color: #000;
	}


</style> 