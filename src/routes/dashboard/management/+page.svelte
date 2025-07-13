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

<div class="terminal-container">
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
	.terminal-container {
		background-color: white;
		font-family: 'Courier New', monospace;
		font-size: 14px;
		line-height: 1.2;
		padding: 20px;
		min-height: 100vh;
		box-sizing: border-box;
	}

	.main-content {
		max-width: 1000px;
		margin: 0 auto;
	}

	.ascii-header {
		margin-bottom: 20px;
	}

	.ascii-header pre {
		margin: 0;
		font-size: 12px;
		line-height: 1;
	}

	.red-text {
		color: red;
		font-weight: bold;
	}

	.blue-text {
		color: blue;
		font-weight: bold;
	}

	.purple-text {
		color: purple;
		font-weight: bold;
	}

	.system-title {
		margin: 20px 0;
		text-align: left;
	}

	.user-info {
		margin: 20px 0;
	}

	.user-info p,
	.support-message p {
		margin: 5px 0;
	}

	.dashboard-section {
		margin: 30px 0;
		padding: 15px;
		border: 2px solid #8800cc;
		background-color: #f8f0ff;
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
		display: block;
		padding: 8px 12px;
		background-color: white;
		border: 1px solid #ccc;
		cursor: pointer;
		color: blue;
		font-weight: bold;
		font-family: 'Courier New', monospace;
		text-decoration: none;
	}

	.menu-item:hover {
		background-color: #e0e0e0;
		color: red;
	}

	.mgmt-item {
		border-left: 4px solid purple;
	}

	.kpi-section {
		margin: 30px 0;
		padding: 15px;
		border: 2px solid #0066cc;
		background-color: #f8f9fa;
	}

	.kpi-section h3 {
		margin: 0 0 15px 0;
		text-align: center;
	}

	.kpi-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 15px;
	}

	.kpi-card {
		background-color: white;
		border: 1px solid #ddd;
		padding: 15px;
		text-align: center;
	}

	.kpi-title {
		font-size: 10px;
		color: blue;
		font-weight: bold;
		margin-bottom: 8px;
	}

	.kpi-value {
		font-size: 20px;
		font-weight: bold;
		color: purple;
		margin-bottom: 5px;
	}

	.kpi-trend {
		font-size: 12px;
		font-weight: bold;
	}

	.kpi-trend.positive {
		color: green;
	}

	.kpi-trend.negative {
		color: red;
	}

	.admin-nav {
		margin-top: 10px;
		text-align: center;
	}

	.admin-link {
		display: inline-block;
		padding: 6px 12px;
		background-color: #cc0000;
		color: white;
		text-decoration: none;
		font-size: 10px;
		font-weight: bold;
		border: 1px solid #990000;
	}

	.admin-link:hover {
		background-color: #990000;
	}

	.support-message {
		margin: 20px 0;
	}

	.command-prompt {
		margin-top: 30px;
		background-color: red;
		color: white;
		padding: 5px 10px;
		font-weight: bold;
	}

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

	:global(body) {
		margin: 0;
		padding: 0;
		background-color: white;
	}
</style> 