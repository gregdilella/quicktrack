<!-- Dashboard Page -->
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
			<pre class="red-text">
CCCCCC EEEEEEE RRRRRR TTTTTTTT UU   UU  SSSSS
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
			<span class="red-text">INTERNATIONAL COURIER - DASHBOARD</span>
		</div>

		<!-- User Information -->
		{#if user}
			<div class="user-info">
				<p class="blue-text">Status: <span class="green-text">AUTHENTICATED</span></p>
				<p class="blue-text">Email: {user.email?.toUpperCase()}</p>
				{#if userProfile}
					<p class="blue-text">Role : {userProfile.role}</p>
					{#if userProfile.role === 'Admin'}
						<div class="admin-nav">
							<a href="/dashboard/admin" class="admin-link">⬅ RETURN TO ADMIN PANEL</a>
						</div>
					{/if}
				{/if}
			</div>
		{/if}

		<!-- Dashboard Content -->
		<div class="dashboard-section">
			<h3 class="blue-text">--- SYSTEM DASHBOARD ---</h3>
			<div class="dashboard-menu">
				<div class="menu-item">► COURIER TRACKING</div>
				<div class="menu-item">► SHIPMENT MANAGEMENT</div>
				<div class="menu-item">► REPORTING</div>
				<div class="menu-item">► USER ADMINISTRATION</div>
				<div class="menu-item">► SYSTEM SETTINGS</div>
				<a href="/dashboard/testing" class="menu-item">► FLIGHT API TESTING LAB</a>
			</div>
		</div>

		<!-- Support Message -->
		<div class="support-message">
			<p class="blue-text">Please report ALL IT</p>
			<p class="blue-text">issues via Jira and TOPdesk</p>
		</div>

		<!-- Command Prompt -->
		<div class="command-prompt">
			<span class="red-text">([RETURN] or &lt;FILE&gt;)Execute, &lt;EXIT&gt;Abort</span>
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
		max-width: 800px;
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
		background-color: #f8f9fa;
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
		text-decoration: none;
		display: block;
	}

	.menu-item:hover {
		background-color: #e0e0e0;
		color: red;
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