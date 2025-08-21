<!-- Management Dashboard -->
<script lang="ts">
	import { onMount } from 'svelte'
	import { getCurrentUser } from '$lib/auth'
	import { getCurrentUserProfile } from '$lib/userService'
	import type { User } from '@supabase/supabase-js'
	import type { UserProfile } from '$lib/types'

	
	let user: User | null = null
	let userProfile: UserProfile | null = null

	onMount(async () => {
		user = await getCurrentUser()
		if (user) {
			try {
				userProfile = await getCurrentUserProfile()
			} catch (error) {
				console.error('Error loading user profile:', error)
			}
		}
	})
</script>

<div class="management-container">
	<div class="main-content">
		<!-- Page Title -->
		<div class="page-header">
			<h1 class="page-title">MANAGEMENT DASHBOARD - OVERVIEW</h1>
		</div>

		<!-- System Title -->
		<div class="system-title">
			<span class="red-text">INTERNATIONAL COURIER - MANAGEMENT PORTAL</span>
		</div>

		<!-- User Information -->
		{#if user && userProfile}
			<div class="user-info">
				<p class="blue-text">Status: <span class="purple-text">MANAGEMENT ACCESS</span></p>
				<p class="blue-text">Email: {user.email?.toUpperCase()}</p>
				<p class="blue-text">Role: {userProfile.role}</p>
				{#if userProfile.role === 'Admin'}
					<div class="admin-nav">
						<a href="/dashboard/admin" class="admin-link">⬅ RETURN TO ADMIN PANEL</a>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Management Navigation Menu -->
		<div class="dashboard-section">
			<h3 class="blue-text">--- MANAGEMENT MENU ---</h3>
			<div class="dashboard-menu">
				<a href="/dashboard/management/search" class="menu-item mgmt-item">► SEARCH</a>
				<a href="/dashboard/management/add-new" class="menu-item mgmt-item">► ADD NEW</a>
				<a href="/dashboard/management/customer-pl" class="menu-item mgmt-item">► CUSTOMER P&L</a>
				<a href="/dashboard/management/users" class="menu-item mgmt-item">► USERS</a>
				<a href="/dashboard/management/graphs" class="menu-item mgmt-item">► TABLEAU STYLE GRAPHS</a>
			</div>
		</div>





		<!-- Command Prompt -->
		<div class="command-prompt">
			<span class="red-text">([MGMT] Executive Terminal - Strategic Data Access)</span>
		</div>
	</div>
</div>

<style>
	.management-container {
		min-height: 100vh;
		background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		padding: 2rem;
	}

    .main-content {
        max-width: 1200px;
        margin: 0 auto;
    }

	/* Page Header */
	.page-header {
		margin-bottom: 2rem;
		text-align: center;
	}

	.page-title {
		font-size: 2.5rem;
		font-weight: 700;
		color: #1f2937;
		margin: 0 0 1rem 0;
		background: linear-gradient(45deg, #34547a, #2c4766);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.system-title {
		margin: 2rem 0;
		text-align: center;
	}

	.system-title span {
		font-size: 1.2rem;
		color: #34547a;
		font-weight: 600;
	}

	.blue-text {
		color: #34547a;
		font-weight: 600;
	}

	.purple-text {
		color: #34547a;
		font-weight: 600;
	}

	.user-info {
		margin: 2rem 0;
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(15px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		padding: 1.5rem;
		border-radius: 16px;
		box-shadow: 0 8px 32px rgba(52, 84, 122, 0.15);
	}

	.user-info p {
		margin: 0.5rem 0;
		font-size: 1rem;
	}

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
		display: block;
		padding: 1rem 1.5rem;
		background: rgba(255, 255, 255, 0.08);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 12px;
		cursor: pointer;
		color: #1f2937;
		font-weight: 500;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		text-decoration: none;
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

	.mgmt-item {
		border-left: 4px solid #34547a;
	}



	.admin-nav {
		margin-top: 10px;
		text-align: center;
	}

	.admin-link {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		background: #34547a;
		color: white;
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 500;
		border: 1px solid #34547a;
		border-radius: 12px;
		transition: all 0.2s ease;
		box-shadow: 0 4px 15px rgba(52, 84, 122, 0.3);
	}

	.admin-link:hover {
		background: #2c4766;
		border-color: #2c4766;
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(52, 84, 122, 0.4);
	}



	.command-prompt {
		margin-top: 2rem;
		background: linear-gradient(135deg, #34547a, #2c4766);
		color: white;
		padding: 1rem 1.5rem;
		border-radius: 12px;
		font-weight: 600;
		text-align: center;
		box-shadow: 0 4px 15px rgba(52, 84, 122, 0.3);
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.management-container {
			padding: 1rem;
		}

		.main-content {
			max-width: 100%;
		}



		.page-title {
			font-size: 2rem;
		}
	}

	:global(body) {
		margin: 0;
		padding: 0;
		background-color: #f8fafc;
	}
</style> 