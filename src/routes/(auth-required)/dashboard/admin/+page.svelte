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

<div class="admin-container">
	<div class="main-content">
		<!-- ASCII Art Header -->
		<div class="ascii-header">
			<pre class="red-text">CCCCCC EEEEEEE RRRRRR TTTTTTTT UU   UU  SSSSS
CC     EE      RR   RR   TT    UU   UU SS    
CC     EE      RR   RR   TT    UU   UU SS    
CC     EEEE    RRRRRR    TT    UU   UU  SSSSS
CC     EEEE    RR RR     TT    UU   UU      SS
CC     EE      RR  RR    TT    UU   UU      SS
CCCCCC EEEEEEE RR   RR   TT     UUUUU   SSSSS
</pre>
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
				<a href="/dashboard/testing" class="dashboard-link testing-link">
					<span class="link-icon">🧪</span>
					<span class="link-text">API TESTING</span>
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
	/* Admin Container */
	.admin-container {
		min-height: 100vh;
		background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		padding: 2rem;
	}

	/* Main Content Area */
	.main-content {
		max-width: 1200px;
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
		margin: 2rem 0;
		padding: 2rem;
		background: white;
		border-radius: 20px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
	}

	.dashboard-section h3 {
		margin: 0 0 1.5rem 0;
		text-align: center;
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
	}

	.dashboard-menu {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.menu-item {
		padding: 1rem 1.5rem;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		cursor: pointer;
		color: #1f2937;
		font-weight: 500;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		transition: all 0.3s ease;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	}

	.menu-item:hover {
		background: #fef2f2;
		color: #dc2626;
		transform: translateY(-2px);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		border-color: #dc2626;
	}

	.admin-item {
		border-left: 4px solid #dc2626;
	}

	/* Dashboard Access Section */
	.dashboard-access-section {
		margin: 2rem 0;
		padding: 2rem;
		background: white;
		border-radius: 20px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
	}

	.dashboard-access-section h3 {
		margin: 0 0 1.5rem 0;
		text-align: center;
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
	}

	.dashboard-links {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	.dashboard-link {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 15px;
		text-decoration: none;
		color: #1f2937;
		font-weight: 500;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		transition: all 0.3s ease;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	}

	.dashboard-link:hover {
		background: #fef2f2;
		border-color: #dc2626;
		color: #dc2626;
		transform: translateY(-3px);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
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

	.testing-link:hover {
		border-color: #10b981;
	}

	/* User Management Section */
	.user-management-section {
		margin: 2rem 0;
		padding: 2rem;
		background: white;
		border-radius: 20px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
	}

	.user-management-section h3 {
		margin: 0 0 1.5rem 0;
		text-align: center;
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
	}

	.user-table {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.table-header {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr 1fr;
		gap: 1rem;
		padding: 1rem 1.5rem;
		background: #dc2626;
		color: white;
		font-weight: 600;
		border-radius: 12px 12px 0 0;
	}

	.table-row {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr 1fr;
		gap: 1rem;
		padding: 1rem 1.5rem;
		background: white;
		border-bottom: 1px solid #f3f4f6;
		font-size: 0.875rem;
		transition: all 0.2s ease;
	}

	.table-row:nth-child(even) {
		background: #f9fafb;
	}

	.table-row:hover {
		background: #fef2f2;
	}

	.table-row:last-child {
		border-radius: 0 0 12px 12px;
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
		padding: 0.875rem 2rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-size: 1rem;
		background: #dc2626;
		color: white;
		border: none;
		border-radius: 12px;
		cursor: pointer;
		font-weight: 500;
		transition: all 0.2s ease;
		box-shadow: 0 2px 10px rgba(220, 38, 38, 0.3);
	}

	.logout-button:hover:not(:disabled) {
		background: #b91c1c;
		transform: translateY(-2px);
		box-shadow: 0 4px 15px rgba(220, 38, 38, 0.4);
	}

	.logout-button:disabled {
		background: #9ca3af;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.admin-container {
			padding: 1rem;
		}

		.main-content {
			max-width: 100%;
		}

		.dashboard-links {
			grid-template-columns: 1fr;
		}

		.ascii-header pre {
			font-size: 10px;
		}
	}

	/* Global Styles */
	:global(body) {
		margin: 0;
		padding: 0;
		background-color: #f8fafc;
	}
</style> 