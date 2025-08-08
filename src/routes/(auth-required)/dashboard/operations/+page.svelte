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

<div class="operations-container">
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
	.operations-container {
		min-height: 100vh;
		background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		padding: 2rem;
	}

	.main-content {
		max-width: 1200px;
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
		background: #fff7ed;
		color: #ea580c;
		transform: translateY(-2px);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		border-color: #ea580c;
	}

	.ops-item {
		border-left: 4px solid #ea580c;
	}

	.stats-section {
		margin: 2rem 0;
		padding: 2rem;
		background: white;
		border-radius: 20px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
	}

	.stats-section h3 {
		margin: 0 0 1.5rem 0;
		text-align: center;
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
	}

	.stat-box {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 15px;
		padding: 1.5rem;
		text-align: center;
		transition: all 0.3s ease;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	}

	.stat-box:hover {
		transform: translateY(-3px);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		border-color: #ea580c;
	}

	.stat-value {
		font-size: 2rem;
		font-weight: 700;
		color: #ea580c;
		margin-bottom: 0.5rem;
	}

	.stat-label {
		font-size: 0.875rem;
		color: #6b7280;
		font-weight: 500;
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
		padding: 0.875rem 2rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-size: 1rem;
		background: #ea580c;
		color: white;
		border: none;
		border-radius: 12px;
		cursor: pointer;
		font-weight: 500;
		transition: all 0.2s ease;
		box-shadow: 0 2px 10px rgba(234, 88, 12, 0.3);
	}

	.logout-button:hover:not(:disabled) {
		background: #dc2626;
		transform: translateY(-2px);
		box-shadow: 0 4px 15px rgba(234, 88, 12, 0.4);
	}

	.logout-button:disabled {
		background: #9ca3af;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.operations-container {
			padding: 1rem;
		}

		.main-content {
			max-width: 100%;
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}

		.ascii-header pre {
			font-size: 10px;
		}
	}

	:global(body) {
		margin: 0;
		padding: 0;
		background-color: #f8fafc;
	}
</style> 