<!-- Customer Dashboard -->
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

	// Load user data on page load (authentication is handled server-side)
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
			// Redirect to login page after successful logout
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
			<span class="red-text">INTERNATIONAL COURIER - CUSTOMER PORTAL</span>
		</div>

		<!-- User Information -->
		{#if user}
			<div class="user-info">
				<p class="blue-text">Status: <span class="green-text">CUSTOMER ACCESS</span></p>
				<p class="blue-text">Email: {user.email?.toUpperCase()}</p>
				{#if userProfile}
					<p class="blue-text">Role: {userProfile.role}</p>
					{#if userProfile.role === 'Admin'}
						<div class="admin-nav">
							<a href="/dashboard/admin" class="admin-link">⬅ RETURN TO ADMIN PANEL</a>
						</div>
					{/if}
				{/if}
			</div>
		{/if}

		<!-- Customer Dashboard Content -->
		<div class="dashboard-section">
			<h3 class="blue-text">--- CUSTOMER SERVICES ---</h3>
			<div class="dashboard-menu">
				<div class="menu-item customer-item">► TRACK SHIPMENT</div>
				<div class="menu-item customer-item">► CREATE NEW SHIPMENT</div>
				<div class="menu-item customer-item">► SHIPMENT HISTORY</div>
				<div class="menu-item customer-item">► DELIVERY SCHEDULE</div>
				<div class="menu-item customer-item">► ACCOUNT SETTINGS</div>
				<div class="menu-item customer-item">► BILLING & INVOICES</div>
			</div>
		</div>

		<!-- Quick Actions Section -->
		<div class="quick-actions-section">
			<h3 class="blue-text">--- QUICK ACTIONS ---</h3>
			<div class="action-buttons">
				<button class="action-btn track-btn">
					<span class="btn-icon">📦</span>
					<span class="btn-text">TRACK PACKAGE</span>
				</button>
				<button class="action-btn ship-btn">
					<span class="btn-icon">🚚</span>
					<span class="btn-text">NEW SHIPMENT</span>
				</button>
				<button class="action-btn history-btn">
					<span class="btn-icon">📋</span>
					<span class="btn-text">VIEW HISTORY</span>
				</button>
			</div>
		</div>

		<!-- Recent Activity Section -->
		<div class="activity-section">
			<h3 class="blue-text">--- RECENT ACTIVITY ---</h3>
			<div class="activity-list">
				<div class="activity-item">
					<span class="activity-icon">📦</span>
					<span class="activity-text">Welcome to QuickTrack International!</span>
					<span class="activity-time">Just now</span>
				</div>
				<div class="activity-item">
					<span class="activity-icon">✅</span>
					<span class="activity-text">Account successfully created</span>
					<span class="activity-time">Just now</span>
				</div>
			</div>
		</div>

		<!-- Support Message -->
		<div class="support-message">
			<p class="blue-text">Need help? Contact Customer Service</p>
			<p class="blue-text">Phone: 1-800-QUICKTRACK | Email: support@quicktrack.com</p>
		</div>

		<!-- Command Prompt -->
		<div class="command-prompt">
			<span class="red-text">([CUSTOMER] Portal Active - Ready for Service)</span>
		</div>

		<!-- Logout Button -->
		<div class="logout-section">
			<button on:click={handleSignOut} disabled={loading} class="logout-button">
				{loading ? 'Signing out...' : 'LOGOUT'}
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
		max-width: 900px;
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
		border: 2px solid #0066cc;
		background-color: #f0f8ff;
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

	.customer-item {
		border-left: 4px solid #0066cc;
	}

	/* Quick Actions Section */
	.quick-actions-section {
		margin: 30px 0;
		padding: 15px;
		border: 2px solid #0099cc;
		background-color: #f0f9ff;
	}

	.quick-actions-section h3 {
		margin: 0 0 15px 0;
		text-align: center;
	}

	.action-buttons {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 15px;
	}

	.action-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 15px 10px;
		background-color: white;
		border: 2px solid #0066cc;
		cursor: pointer;
		font-family: 'Courier New', monospace;
		font-weight: bold;
		transition: all 0.2s ease;
	}

	.action-btn:hover {
		background-color: #e6f3ff;
		border-color: #0052a3;
		transform: translateY(-2px);
	}

	.btn-icon {
		font-size: 20px;
	}

	.btn-text {
		font-size: 10px;
		color: blue;
	}

	/* Activity Section */
	.activity-section {
		margin: 30px 0;
		padding: 15px;
		border: 2px solid #00aa00;
		background-color: #f0fff0;
	}

	.activity-section h3 {
		margin: 0 0 15px 0;
		text-align: center;
	}

	.activity-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.activity-item {
		display: grid;
		grid-template-columns: 30px 1fr auto;
		gap: 10px;
		align-items: center;
		padding: 8px 12px;
		background-color: white;
		border: 1px solid #ddd;
		font-size: 12px;
	}

	.activity-icon {
		font-size: 16px;
		text-align: center;
	}

	.activity-text {
		color: blue;
		font-weight: bold;
	}

	.activity-time {
		color: #666;
		font-size: 10px;
	}

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

	/* Global Styles */
	:global(body) {
		margin: 0;
		padding: 0;
		background-color: white;
	}
</style> 