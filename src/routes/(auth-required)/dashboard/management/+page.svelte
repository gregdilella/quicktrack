<!-- Management Dashboard -->
<script lang="ts">
	import { onMount } from 'svelte'
	import { getCurrentUser } from '$lib/auth'
	import { getCurrentUserProfile } from '$lib/userService'
	import type { User } from '@supabase/supabase-js'
	import type { UserProfile } from '$lib/types'
	import UserAssignment from '$lib/components/UserAssignment.svelte'

	
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
				<a href="/dashboard/management/customer-search" class="menu-item mgmt-item">► CUSTOMER SEARCH</a>
				<a href="/dashboard/management/add-new-customer" class="menu-item mgmt-item">► ADD NEW CUSTOMER</a>
				<a href="/dashboard/management/customer-pl" class="menu-item mgmt-item">► CUSTOMER P&L</a>
				<a href="/dashboard/management/users" class="menu-item mgmt-item">► USERS</a>
				<a href="/dashboard/management/graphs" class="menu-item mgmt-item">► TABLEAU STYLE GRAPHS</a>
			</div>
		</div>

		<!-- KPI Section -->
		<div class="kpi-section">
			<h3 class="blue-text">--- KEY PERFORMANCE INDICATORS ---</h3>
			<div class="kpi-grid">
				<div class="kpi-card">
					<div class="kpi-title">MONTHLY REVENUE</div>
					<div class="kpi-value">$2.4M</div>
					<div class="kpi-trend positive">▲ 12.3%</div>
				</div>
				<div class="kpi-card">
					<div class="kpi-title">CUSTOMER SATISFACTION</div>
					<div class="kpi-value">94.7%</div>
					<div class="kpi-trend positive">▲ 2.1%</div>
				</div>
				<div class="kpi-card">
					<div class="kpi-title">OPERATIONAL EFFICIENCY</div>
					<div class="kpi-value">87.3%</div>
					<div class="kpi-trend negative">▼ 1.2%</div>
				</div>
				<div class="kpi-card">
					<div class="kpi-title">MARKET SHARE</div>
					<div class="kpi-value">23.8%</div>
					<div class="kpi-trend positive">▲ 3.4%</div>
				</div>
			</div>
		</div>

		<!-- User Assignment Section -->
		<UserAssignment />

		<!-- Support Message -->
		<div class="support-message">
			<p class="blue-text">Management Portal: Strategic oversight and reporting</p>
			<p class="blue-text">Executive briefings available daily at 0800 hours</p>
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
		background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
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
		background: linear-gradient(45deg, #7c3aed, #6d28d9);
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
		color: #7c3aed;
		font-weight: 600;
	}

	.red-text {
		color: #dc2626;
		font-weight: 600;
	}

	.blue-text {
		color: #2563eb;
		font-weight: 600;
	}

	.purple-text {
		color: #7c3aed;
		font-weight: 600;
	}

	.user-info {
		margin: 2rem 0;
		background: white;
		padding: 1.5rem;
		border-radius: 15px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
	}

	.user-info p,
	.support-message p {
		margin: 0.5rem 0;
		font-size: 1rem;
	}

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
		display: block;
		padding: 1rem 1.5rem;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		cursor: pointer;
		color: #1f2937;
		font-weight: 500;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		text-decoration: none;
		transition: all 0.3s ease;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	}

	.menu-item:hover {
		background: #f9fafb;
		color: #7c3aed;
		transform: translateY(-2px);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		border-color: #7c3aed;
	}

	.mgmt-item {
		border-left: 4px solid #7c3aed;
	}

	.kpi-section {
		margin: 2rem 0;
		padding: 2rem;
		background: white;
		border-radius: 20px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
	}

	.kpi-section h3 {
		margin: 0 0 1.5rem 0;
		text-align: center;
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
	}

	.kpi-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	.kpi-card {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 15px;
		padding: 1.5rem;
		text-align: center;
		transition: all 0.3s ease;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	}

	.kpi-card:hover {
		transform: translateY(-3px);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		border-color: #7c3aed;
	}

	.kpi-title {
		font-size: 0.875rem;
		color: #6b7280;
		font-weight: 500;
		margin-bottom: 1rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.kpi-value {
		font-size: 2rem;
		font-weight: 700;
		color: #7c3aed;
		margin-bottom: 0.5rem;
	}

	.kpi-trend {
		font-size: 0.875rem;
		font-weight: 600;
	}

	.kpi-trend.positive {
		color: #10b981;
	}

	.kpi-trend.negative {
		color: #ef4444;
	}

	.admin-nav {
		margin-top: 10px;
		text-align: center;
	}

	.admin-link {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		background: #dc2626;
		color: white;
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 500;
		border: 1px solid #dc2626;
		border-radius: 12px;
		transition: all 0.2s ease;
		box-shadow: 0 2px 10px rgba(220, 38, 38, 0.3);
	}

	.admin-link:hover {
		background: #b91c1c;
		border-color: #b91c1c;
		transform: translateY(-2px);
		box-shadow: 0 4px 15px rgba(220, 38, 38, 0.4);
	}

	.support-message {
		margin: 2rem 0;
		background: white;
		padding: 1.5rem;
		border-radius: 15px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
		text-align: center;
	}

	.command-prompt {
		margin-top: 2rem;
		background: linear-gradient(45deg, #7c3aed, #6d28d9);
		color: white;
		padding: 1rem 1.5rem;
		border-radius: 12px;
		font-weight: 600;
		text-align: center;
		box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3);
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.management-container {
			padding: 1rem;
		}

		.main-content {
			max-width: 100%;
		}

		.kpi-grid {
			grid-template-columns: 1fr;
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