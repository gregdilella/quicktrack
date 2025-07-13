<!-- Admin Dashboard -->
<script lang="ts">
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { getCurrentUser, signOut } from '$lib/auth'
	import { getCurrentUserProfile, getAllUserProfiles, isCurrentUserAdmin } from '$lib/userService'
	import type { User } from '@supabase/supabase-js'
	import type { UserProfile } from '$lib/types'
	
	let user: User | null = null
	let userProfile: UserProfile | null = null
	let allUsers: UserProfile[] = []
	let loading = false
	let isAdmin = false

	// Load admin data on page load
	onMount(async () => {
		user = await getCurrentUser()
		
		if (user) {
			try {
				userProfile = await getCurrentUserProfile()
				isAdmin = await isCurrentUserAdmin()
				
				// Server-side hooks already handle admin access control
				// No need for client-side redirect since we trust server-side auth
				
				// Load all users for admin management
				allUsers = await getAllUserProfiles()
			} catch (error) {
				console.error('Error loading admin data:', error)
			}
		}
	})

	async function handleSignOut() {
		loading = true
		const { error } = await signOut()
		
		if (error) {
			console.error('Sign out error:', error)
		} else {
			goto('/')
		}
		loading = false
	}
</script>

<div class="terminal-container">
	<div class="main-content">
		<!-- ASCII Art Header -->
		<div class="ascii-header">
			<pre class="red-text">QQQQQQ                               
QQ    QQ          ii        k      k       
QQ    QQ uu   uu iii   cccc kk   kk
QQ    QQ uu   uu  ii  cc    kk kk
QQ QQ QQ uu   uu  ii  cc    kkk
QQQQ  QQ uu   uu  ii  cc    kk kk
  QQQQQQ    uuuu  iiii  cccc kk   kk
QQ</pre>
		</div>

		<!-- System Title -->
		<div class="system-title">
			<span class="red-text">INTERNATIONAL COURIER - ADMIN CONTROL PANEL</span>
		</div>

		<!-- User Information -->
		{#if user && userProfile}
			<div class="user-info">
				<p class="blue-text">Status: <span class="green-text">ADMINISTRATOR ACCESS</span></p>
				<p class="blue-text">Email: {user.email?.toUpperCase()}</p>
				<p class="blue-text">Role: {userProfile.role}</p>
			</div>
		{/if}

		<!-- Admin Dashboard Content -->
		<div class="dashboard-section">
			<h3 class="blue-text">--- ADMINISTRATIVE CONTROLS ---</h3>
			<div class="dashboard-menu">
				<div class="menu-item admin-item">► USER MANAGEMENT</div>
				<div class="menu-item admin-item">► SYSTEM CONFIGURATION</div>
				<div class="menu-item admin-item">► SECURITY SETTINGS</div>
				<div class="menu-item admin-item">► AUDIT LOGS</div>
				<div class="menu-item admin-item">► DATABASE MANAGEMENT</div>
				<div class="menu-item admin-item">► BACKUP & RESTORE</div>
			</div>
		</div>

		<!-- Dashboard Access Section -->
		<div class="dashboard-access-section">
			<h3 class="blue-text">--- DASHBOARD ACCESS (ADMIN ONLY) ---</h3>
			<div class="dashboard-links">
				<a href="/dashboard/operations" class="dashboard-link ops-link">
					<span class="link-icon">🔧</span>
					<span class="link-text">OPERATIONS CENTER</span>
				</a>
				<a href="/dashboard/management" class="dashboard-link mgmt-link">
					<span class="link-icon">📊</span>
					<span class="link-text">MANAGEMENT PORTAL</span>
				</a>
				<a href="/dashboard/lsp" class="dashboard-link lsp-link">
					<span class="link-icon">🚚</span>
					<span class="link-text">LSP INTERFACE</span>
				</a>
				<a href="/dashboard/customer" class="dashboard-link customer-link">
					<span class="link-icon">👤</span>
					<span class="link-text">CUSTOMER DASHBOARD</span>
				</a>
			</div>
		</div>

		<!-- User Management Section -->
		<div class="user-management-section">
			<h3 class="blue-text">--- USER DIRECTORY ---</h3>
			<div class="user-table">
				<div class="table-header">
					<span class="blue-text">EMAIL</span>
					<span class="blue-text">ROLE</span>
					<span class="blue-text">CREATED</span>
					<span class="blue-text">STATUS</span>
				</div>
				{#each allUsers as userRecord}
					<div class="table-row">
						<span class="user-email">{userRecord.email}</span>
						<span class="user-role role-{(userRecord.role || 'Not-Assigned').toLowerCase()}">{userRecord.role || 'Not-Assigned'}</span>
						<span class="user-date">{userRecord.created_at ? new Date(userRecord.created_at).toLocaleDateString() : 'Unknown'}</span>
						<span class="user-status">ACTIVE</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Support Message -->
		<div class="support-message">
			<p class="blue-text">ADMIN NOTICE: All system changes are logged</p>
			<p class="blue-text">Contact System Architecture for critical issues</p>
		</div>

		<!-- Command Prompt -->
		<div class="command-prompt">
			<span class="red-text">([ADMIN] Administrative Terminal Active)</span>
		</div>

		<!-- Logout Button -->
		<div class="logout-section">
			<button on:click={handleSignOut} disabled={loading} class="logout-button">
				{loading ? 'SIGNING OUT...' : 'LOGOUT'}
			</button>
		</div>
	</div>
</div>

<style>
	/* Terminal Container */
	.terminal-container {
		background-color: white;
		font-family: 'Courier New', monospace;
		font-size: 14px;
		line-height: 1.2;
		padding: 20px;
		min-height: 100vh;
		box-sizing: border-box;
	}

	/* Main Content Area */
	.main-content {
		max-width: 1000px;
		margin: 0 auto;
	}

	/* ASCII Art Header */
	.ascii-header {
		margin-bottom: 20px;
	}

	.ascii-header pre {
		margin: 0;
		font-size: 12px;
		line-height: 1;
	}

	/* Color Classes */
	.red-text {
		color: red;
		font-weight: bold;
	}

	.blue-text {
		color: blue;
		font-weight: bold;
	}

	.green-text {
		color: green;
		font-weight: bold;
	}

	/* System Title */
	.system-title {
		margin: 20px 0;
		text-align: left;
	}

	/* User Information */
	.user-info {
		margin: 20px 0;
	}

	.user-info p,
	.support-message p {
		margin: 5px 0;
	}

	/* Dashboard Section */
	.dashboard-section {
		margin: 30px 0;
		padding: 15px;
		border: 2px solid #cc0000;
		background-color: #fff5f5;
	}

	.dashboard-section h3 {
		margin: 0 0 15px 0;
		text-align: center;
	}

	.dashboard-menu {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.menu-item {
		padding: 8px 12px;
		background-color: white;
		border: 1px solid #ccc;
		cursor: pointer;
		color: blue;
		font-weight: bold;
		font-family: 'Courier New', monospace;
	}

	.menu-item:hover {
		background-color: #e0e0e0;
		color: red;
	}

	.admin-item {
		border-left: 4px solid red;
	}

	/* Dashboard Access Section */
	.dashboard-access-section {
		margin: 30px 0;
		padding: 15px;
		border: 2px solid #cc6600;
		background-color: #fff8f0;
	}

	.dashboard-access-section h3 {
		margin: 0 0 15px 0;
		text-align: center;
	}

	.dashboard-links {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 15px;
	}

	.dashboard-link {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 15px;
		background-color: white;
		border: 2px solid #ddd;
		text-decoration: none;
		color: blue;
		font-weight: bold;
		font-family: 'Courier New', monospace;
		transition: all 0.2s ease;
	}

	.dashboard-link:hover {
		background-color: #f0f0f0;
		border-color: #999;
		color: red;
	}

	.link-icon {
		font-size: 16px;
	}

	.link-text {
		font-size: 12px;
	}

	.ops-link:hover {
		border-color: orange;
	}

	.mgmt-link:hover {
		border-color: purple;
	}

	.lsp-link:hover {
		border-color: green;
	}

	.customer-link:hover {
		border-color: blue;
	}

	/* User Management Section */
	.user-management-section {
		margin: 30px 0;
		padding: 15px;
		border: 2px solid #0066cc;
		background-color: #f8f9fa;
	}

	.user-management-section h3 {
		margin: 0 0 15px 0;
		text-align: center;
	}

	.user-table {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.table-header {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr 1fr;
		gap: 10px;
		padding: 8px 12px;
		background-color: #0066cc;
		color: white;
		font-weight: bold;
	}

	.table-row {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr 1fr;
		gap: 10px;
		padding: 6px 12px;
		background-color: white;
		border: 1px solid #ddd;
		font-size: 12px;
	}

	.table-row:nth-child(even) {
		background-color: #f9f9f9;
	}

	.user-role {
		font-weight: bold;
	}

	.role-admin { color: red; }
	.role-management { color: purple; }
	.role-operations { color: orange; }
	.role-lsp { color: green; }
	.role-customer { color: blue; }

	/* Support Message */
	.support-message {
		margin: 20px 0;
	}

	/* Command Prompt */
	.command-prompt {
		margin-top: 30px;
		background-color: red;
		color: white;
		padding: 5px 10px;
		font-weight: bold;
	}

	/* Logout Section */
	.logout-section {
		margin-top: 20px;
		text-align: center;
	}

	.logout-button {
		padding: 10px 20px;
		font-family: 'Courier New', monospace;
		font-size: 12px;
		background-color: #cc0000;
		color: white;
		border: none;
		cursor: pointer;
		font-weight: bold;
	}

	.logout-button:hover {
		background-color: #990000;
	}

	.logout-button:disabled {
		background-color: #cccccc;
		cursor: not-allowed;
	}

	/* Global Styles */
	:global(body) {
		margin: 0;
		padding: 0;
		background-color: white;
	}
</style> 