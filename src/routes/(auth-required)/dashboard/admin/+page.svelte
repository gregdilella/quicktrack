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
		<!-- Mobile Logo (only visible on mobile) -->
		<div class="mobile-logo-section">
			<div class="mobile-logo-container">
				<img src="/Certus Logo.png" alt="Certus Freight" class="mobile-logo" />
			</div>
		</div>

		<!-- System Title -->
		<div class="system-title">
			<span class="blue-text">CERTUS FREIGHT - ADMIN CONTROL PANEL</span>
		</div>

		<!-- User information removed as it's redundant on admin dashboard -->



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
		background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		padding: 2rem;
	}

	/* Main Content Area */
	.main-content {
		max-width: 1200px;
		margin: 0 auto;
	}



	/* Mobile Logo Section */
	.mobile-logo-section {
		display: none;
		text-align: center;
		margin-bottom: 1.5rem;
	}

	.mobile-logo-container {
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(15px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 16px;
		padding: 1rem;
		margin: 0 auto;
		max-width: fit-content;
		box-shadow: 0 8px 32px rgba(52, 84, 122, 0.15);
	}

	.mobile-logo {
		max-width: 200px;
		width: 100%;
		height: auto;
		margin: 0;
		display: block;
	}

	/* Color Classes */
	.blue-text {
		color: #34547a;
		font-weight: bold;
	}

	.green-text {
		color: #16a34a;
		font-weight: bold;
	}

	/* System Title */
	.system-title {
		margin: 2rem 0;
		text-align: center;
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(15px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 16px;
		padding: 1.5rem;
		box-shadow: 0 8px 32px rgba(52, 84, 122, 0.15);
	}

	/* User Information */
	.user-info {
		margin: 2rem 0;
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(15px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 16px;
		padding: 1.5rem;
		box-shadow: 0 8px 32px rgba(52, 84, 122, 0.15);
	}

	.user-info p {
		margin: 0.5rem 0;
		font-size: 0.95rem;
	}

	/* Dashboard Section */
	.dashboard-section {
		margin: 2rem 0;
		padding: 2rem;
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(15px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 20px;
		box-shadow: 0 8px 32px rgba(52, 84, 122, 0.15);
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
		background: rgba(255, 255, 255, 0.08);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 12px;
		cursor: pointer;
		color: #1f2937;
		font-weight: 500;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		transition: all 0.3s ease;
		box-shadow: 0 4px 15px rgba(52, 84, 122, 0.1);
	}

	.menu-item:hover {
		background: rgba(255, 255, 255, 0.15);
		color: #34547a;
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(52, 84, 122, 0.2);
		border-color: rgba(255, 255, 255, 0.3);
	}

	.admin-item {
		border-left: 4px solid #34547a;
	}

	/* Dashboard Access Section */
	.dashboard-access-section {
		margin: 2rem 0;
		padding: 2rem;
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(15px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 20px;
		box-shadow: 0 8px 32px rgba(52, 84, 122, 0.15);
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
		background: rgba(255, 255, 255, 0.08);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 15px;
		text-decoration: none;
		color: #1f2937;
		font-weight: 500;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		transition: all 0.3s ease;
		box-shadow: 0 4px 15px rgba(52, 84, 122, 0.1);
	}

	.dashboard-link:hover {
		background: rgba(255, 255, 255, 0.15);
		border-color: rgba(255, 255, 255, 0.3);
		color: #34547a;
		transform: translateY(-3px);
		box-shadow: 0 8px 25px rgba(52, 84, 122, 0.2);
	}

	.link-icon {
		font-size: 16px;
	}

	.link-text {
		font-size: 12px;
	}

	.ops-link:hover {
		border-color: rgba(234, 88, 12, 0.5);
		color: #ea580c;
	}

	.mgmt-link:hover {
		border-color: rgba(124, 58, 237, 0.5);
		color: #7c3aed;
	}

	.lsp-link:hover {
		border-color: rgba(22, 163, 74, 0.5);
		color: #16a34a;
	}

	.customer-link:hover {
		border-color: rgba(37, 99, 235, 0.5);
		color: #2563eb;
	}

	.testing-link:hover {
		border-color: rgba(16, 185, 129, 0.5);
		color: #10b981;
	}

	/* User Management Section */
	.user-management-section {
		margin: 2rem 0;
		padding: 2rem;
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(15px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 20px;
		box-shadow: 0 8px 32px rgba(52, 84, 122, 0.15);
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
		background: #34547a;
		color: white;
		font-weight: 600;
		border-radius: 12px 12px 0 0;
	}

	.table-row {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr 1fr;
		gap: 1rem;
		padding: 1rem 1.5rem;
		background: rgba(255, 255, 255, 0.08);
		backdrop-filter: blur(10px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		font-size: 0.875rem;
		transition: all 0.2s ease;
	}

	.table-row:nth-child(even) {
		background: rgba(255, 255, 255, 0.12);
	}

	.table-row:hover {
		background: rgba(255, 255, 255, 0.18);
		border-color: rgba(255, 255, 255, 0.3);
	}

	.table-row:last-child {
		border-radius: 0 0 12px 12px;
	}

	.user-role {
		font-weight: bold;
	}

	.role-admin { color: #dc2626; }
	.role-management { color: #7c3aed; }
	.role-operations { color: #ea580c; }
	.role-lsp { color: #16a34a; }
	.role-customer { color: #2563eb; }



	/* Logout Section */
	.logout-section {
		margin-top: 20px;
		text-align: center;
	}

	.logout-button {
		padding: 0.875rem 2rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-size: 1rem;
		background: #34547a;
		color: white;
		border: none;
		border-radius: 12px;
		cursor: pointer;
		font-weight: 500;
		transition: all 0.2s ease;
		box-shadow: 0 4px 15px rgba(52, 84, 122, 0.3);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.logout-button:hover:not(:disabled) {
		background: #2c4766;
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(52, 84, 122, 0.4);
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

		.mobile-logo-section {
			display: block;
		}

		.mobile-logo {
			max-width: 180px;
		}

		.dashboard-links {
			grid-template-columns: 1fr;
		}

		.table-header, .table-row {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}

		.table-header {
			text-align: center;
		}

		.table-row {
			text-align: center;
			padding: 0.75rem;
		}
	}

	/* Global Styles */
	:global(body) {
		margin: 0;
		padding: 0;
		background-color: #f8fafc;
	}
</style> 