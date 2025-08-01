<!-- Operations Dashboard -->
<script lang="ts">
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { getCurrentUser, signOut } from '$lib/auth'
	import { getCurrentUserProfile } from '$lib/userService'
	import type { User } from '@supabase/supabase-js'
	import type { UserProfile } from '$lib/types'
	
	let user: User | null = null
	let userProfile: UserProfile | null = null
	let loading = false

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
			<pre class="red-text">CCCCCC EEEEEEE RRRRRR TTTTTTTT UU   UU  SSSSS
CC     EE      RR   RR   TT    UU   UU SS    
CC     EE      RR   RR   TT    UU   UU SS    
CC     EEEE    RRRRRR    TT    UU   UU  SSSSS
CC     EEEE    RR RR     TT    UU   UU      SS
CC     EE      RR  RR    TT    UU   UU      SS
CCCCCC EEEEEEE RR   RR   TT     UUUUU   SSSSS
CC</pre>
		</div>

		<!-- System Title -->
		<div class="system-title">
			<span class="red-text">INTERNATIONAL COURIER - OPERATIONS CENTER</span>
		</div>

		<!-- User Information -->
		{#if user && userProfile}
			<div class="user-info">
				<p class="blue-text">Status: <span class="orange-text">OPERATIONS ACCESS</span></p>
				<p class="blue-text">Email: {user.email?.toUpperCase()}</p>
				<p class="blue-text">Role: {userProfile.role}</p>
				{#if userProfile.role === 'Admin'}
					<div class="admin-nav">
						<a href="/dashboard/admin" class="admin-link">⬅ RETURN TO ADMIN PANEL</a>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Operations Navigation Menu -->
		<div class="dashboard-section">
			<h3 class="blue-text">--- OPERATIONS MENU ---</h3>
			<div class="dashboard-menu">
							<a href="/dashboard/operations/add-new-job" class="menu-item ops-item">► ADD NEW JOB</a>
			<a href="/dashboard/operations/jobsearch" class="menu-item ops-item">► JOBSEARCH</a>
			<a href="/dashboard/operations/flight-search" class="menu-item ops-item">► FLIGHT SEARCH</a>
			</div>
		</div>

		<!-- Quick Stats -->
		<div class="stats-section">
			<h3 class="blue-text">--- REAL-TIME STATUS ---</h3>
			<div class="stats-grid">
				<div class="stat-box">
					<div class="stat-value">247</div>
					<div class="stat-label">ACTIVE SHIPMENTS</div>
				</div>
				<div class="stat-box">
					<div class="stat-value">89</div>
					<div class="stat-label">COURIERS ON DUTY</div>
				</div>
				<div class="stat-box">
					<div class="stat-value">12</div>
					<div class="stat-label">PENDING DISPATCHES</div>
				</div>
				<div class="stat-box">
					<div class="stat-value">97.2%</div>
					<div class="stat-label">ON-TIME DELIVERY</div>
				</div>
			</div>
		</div>

		<!-- Support Message -->
		<div class="support-message">
			<p class="blue-text">Operations Control: Monitor all courier activities</p>
			<p class="blue-text">Emergency contact: OPS-EMERGENCY-001</p>
		</div>

		<!-- Command Prompt -->
		<div class="command-prompt">
			<span class="red-text">([OPS] Operations Terminal - Live Tracking Active)</span>
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

	.orange-text {
		color: orange;
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
		border: 2px solid #ff8800;
		background-color: #fff8f0;
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

	.ops-item {
		border-left: 4px solid orange;
	}

	.stats-section {
		margin: 30px 0;
		padding: 15px;
		border: 2px solid #0066cc;
		background-color: #f8f9fa;
	}

	.stats-section h3 {
		margin: 0 0 15px 0;
		text-align: center;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 15px;
	}

	.stat-box {
		background-color: white;
		border: 1px solid #ddd;
		padding: 15px;
		text-align: center;
	}

	.stat-value {
		font-size: 24px;
		font-weight: bold;
		color: orange;
		margin-bottom: 5px;
	}

	.stat-label {
		font-size: 10px;
		color: blue;
		font-weight: bold;
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