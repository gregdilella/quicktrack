<script lang="ts">
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { getCurrentUserProfile, updateUserProfile } from '$lib/userService'
	import { signOut, getUserDashboardRoute } from '$lib/auth'
	import type { UserProfile } from '$lib/types'

	let userProfile: UserProfile | null = null
	let showProfileEdit = false
	let loading = false
	
	onMount(() => {
		loadProfile()
		// Check status every 10 seconds
		const interval = setInterval(() => {
			loadProfile()
		}, 10000)
		
		return () => clearInterval(interval)
	})

	async function loadProfile() {
		try {
			userProfile = await getCurrentUserProfile()
			if (userProfile) {
				// If they got assigned a role, redirect them to the correct dashboard
				if (userProfile.role !== 'Not-Assigned') {
					const dashboardRoute = await getUserDashboardRoute()
					goto(dashboardRoute)
				}
			}
		} catch (error) {
			console.error('Error loading profile:', error)
		}
	}

	async function handleLogout() {
		loading = true
		try {
			await signOut()
			goto('/')
		} catch (error) {
			console.error('Error signing out:', error)
		} finally {
			loading = false
		}
	}

	function toggleProfileEdit() {
		showProfileEdit = !showProfileEdit
	}
</script>

<div class="waiting-layout">
	<!-- Sidebar -->
	<aside class="sidebar">
		<div class="sidebar-content">
			<!-- Top Content -->
			<div class="sidebar-top">
				<!-- Logo -->
				<div class="sidebar-logo">
					<h2>CERTrack</h2>
				</div>
				
				<!-- User Info -->
				{#if userProfile}
					<div class="user-section">
						<div class="user-avatar">
							<span>{userProfile.email.charAt(0).toUpperCase()}</span>
						</div>
						<div class="user-info">
							<p class="user-name">{userProfile.email}</p>
							<p class="user-status">Waiting for Assignment</p>
						</div>
					</div>
				{/if}
				
				<!-- Menu Items -->
				<nav class="sidebar-menu">
					<button class="menu-item" on:click={toggleProfileEdit}>
						<svg class="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
						</svg>
						<span>User Profile</span>
					</button>
				</nav>
			</div>
			
			<!-- Bottom Content (Logout) -->
			<div class="sidebar-bottom">
				<button class="menu-item logout" on:click={handleLogout} disabled={loading}>
					<svg class="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
					</svg>
					<span>{loading ? 'Signing out...' : 'Logout'}</span>
				</button>
			</div>
		</div>
	</aside>

	<!-- Main Content -->
	<main class="main-content">
		{#if showProfileEdit}
			<!-- Profile View Section (No Editing) -->
			<div class="profile-view-section">
				<div class="view-header">
					<h3>User Profile</h3>
					<button class="close-btn" on:click={() => showProfileEdit = false}>
						<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
						</svg>
					</button>
				</div>
				
				<div class="profile-display">
					{#if userProfile}
						<div class="profile-field">
							<label>Email Address</label>
							<div class="field-value">{userProfile.email}</div>
							<p class="field-note">Email address cannot be changed</p>
						</div>
						
						<div class="profile-field">
							<label>Account Status</label>
							<div class="field-value status-value">
								<svg class="status-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"/>
								</svg>
								Waiting for Role Assignment
							</div>
						</div>
						
						<div class="profile-field">
							<label>Account Created</label>
							<div class="field-value">{userProfile.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'Unknown'}</div>
						</div>
					{/if}
				</div>
			</div>
		{:else}
			<!-- Waiting Section -->
			<div class="waiting-section">
				<div class="waiting-card">
					<div class="waiting-icon">
						<svg class="icon-clock" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
						</svg>
					</div>
					
					<h1 class="waiting-title">Welcome to CERTrack!</h1>
					<p class="waiting-subtitle">Your account has been created successfully</p>
					
					{#if userProfile}
						<div class="user-email-display">
							<span class="email-label">Account Email:</span>
							<span class="email-value">{userProfile.email}</span>
						</div>
					{/if}
					
					<div class="status-card">
						<div class="status-icon">
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"/>
							</svg>
						</div>
						<div class="status-content">
							<h3>Awaiting Role Assignment</h3>
							<p>Please wait while an administrator assigns your system role</p>
						</div>
					</div>
					
					<div class="steps-section">
						<h4>What happens next?</h4>
						<ul class="steps-list">
							<li class="step">
								<span class="step-number">1</span>
								<span class="step-text">Administrator reviews your account</span>
							</li>
							<li class="step">
								<span class="step-number">2</span>
								<span class="step-text">Role assigned based on your position</span>
							</li>
							<li class="step">
								<span class="step-number">3</span>
								<span class="step-text">Automatic access to your dashboard</span>
							</li>
						</ul>
					</div>
					
					<button class="refresh-btn" on:click={loadProfile}>
						<svg class="refresh-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
						</svg>
						Check Status
					</button>
				</div>
			</div>
		{/if}
	</main>
</div>

<style>
	.waiting-layout {
		display: flex;
		min-height: 100vh;
		background-color: #f8fafc;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	/* Sidebar Styles */
	.sidebar {
		width: 280px;
		background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
		color: white;
		box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
		position: fixed;
		height: 100vh;
		top: 0;
		left: 0;
		overflow-y: auto;
		z-index: 10;
	}

	.sidebar-content {
		padding: 2rem 1.5rem 1rem;
		height: 100vh;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		overflow-y: auto;
		box-sizing: border-box;
	}

	.sidebar-logo {
		margin-bottom: 2rem;
	}

	.sidebar-logo h2 {
		font-size: 1.75rem;
		font-weight: 700;
		margin: 0;
		color: white;
	}

	.user-section {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		padding: 1.5rem;
		margin-bottom: 2rem;
		backdrop-filter: blur(10px);
	}

	.user-avatar {
		width: 50px;
		height: 50px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 1rem;
	}

	.user-info .user-name {
		font-weight: 600;
		margin: 0 0 0.25rem 0;
		word-break: break-all;
	}

	.user-info .user-status {
		font-size: 0.875rem;
		opacity: 0.8;
		margin: 0;
	}

	.sidebar-top {
		display: flex;
		flex-direction: column;
	}

	.sidebar-bottom {
		display: flex;
		flex-direction: column;
	}

	.sidebar-menu {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.menu-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem 1rem;
		background: none;
		border: none;
		color: white;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 0.95rem;
		text-align: left;
		width: 100%;
	}

	.menu-item:hover {
		background: rgba(255, 255, 255, 0.1);
		transform: translateX(4px);
	}

	.menu-item.logout {
		background: rgba(248, 113, 113, 0.2);
		border: 1px solid rgba(248, 113, 113, 0.3);
	}

	.menu-item.logout:hover {
		background: rgba(248, 113, 113, 0.3);
	}

	.menu-item:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.menu-icon {
		width: 20px;
		height: 20px;
		flex-shrink: 0;
	}

	/* Main Content Styles */
	.main-content {
		margin-left: 280px;
		flex: 1;
		padding: 2rem;
		min-height: 100vh;
	}

	/* Profile View Section */
	.profile-view-section {
		max-width: 600px;
		margin: 0 auto;
		background: white;
		border-radius: 16px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 20px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.view-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 2rem 2rem 1rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.view-header h3 {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0;
		color: #1f2937;
	}

	.close-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 8px;
		color: #6b7280;
		transition: all 0.2s ease;
	}

	.close-btn:hover {
		background: #f3f4f6;
		color: #374151;
	}

	.close-btn svg {
		width: 20px;
		height: 20px;
	}

	.profile-display {
		padding: 2rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.profile-field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.profile-field label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
	}

	.field-value {
		padding: 0.75rem 1rem;
		background-color: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		font-size: 1rem;
		color: #1f2937;
	}

	.status-value {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #dc2626;
		background-color: #fef2f2;
		border-color: #fecaca;
	}

	.status-icon {
		width: 18px;
		height: 18px;
		flex-shrink: 0;
	}

	.field-note {
		font-size: 0.75rem;
		color: #6b7280;
		margin: 0;
		font-style: italic;
	}

	/* Waiting Section */
	.waiting-section {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: calc(100vh - 4rem);
	}

	.waiting-card {
		max-width: 500px;
		width: 100%;
		background: white;
		border-radius: 20px;
		padding: 3rem 2.5rem;
		text-align: center;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 20px rgba(0, 0, 0, 0.1);
	}

	.waiting-icon {
		width: 80px;
		height: 80px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 2rem;
	}

	.icon-clock {
		width: 40px;
		height: 40px;
		color: white;
	}

	.waiting-title {
		font-size: 2rem;
		font-weight: 700;
		color: #1f2937;
		margin: 0 0 0.5rem 0;
	}

	.waiting-subtitle {
		color: #6b7280;
		font-size: 1.125rem;
		margin: 0 0 2rem 0;
	}

	.user-email-display {
		background: #f8fafc;
		border-radius: 12px;
		padding: 1rem 1.5rem;
		margin-bottom: 2rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.email-label {
		font-size: 0.875rem;
		color: #6b7280;
		font-weight: 500;
	}

	.email-value {
		font-weight: 600;
		color: #1f2937;
		word-break: break-all;
	}

	.status-card {
		background: #fffbeb;
		border: 1px solid #fbbf24;
		border-radius: 12px;
		padding: 1.5rem;
		margin-bottom: 2rem;
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		text-align: left;
	}

	.status-icon {
		width: 24px;
		height: 24px;
		color: #d97706;
		flex-shrink: 0;
		margin-top: 2px;
	}

	.status-content h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: #92400e;
		margin: 0 0 0.5rem 0;
	}

	.status-content p {
		color: #a16207;
		margin: 0;
		font-size: 0.95rem;
	}

	.steps-section {
		text-align: left;
		margin-bottom: 2rem;
	}

	.steps-section h4 {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 1rem 0;
		text-align: center;
	}

	.steps-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.step {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.step-number {
		width: 28px;
		height: 28px;
		background: #dc2626;
		color: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.875rem;
		font-weight: 600;
		flex-shrink: 0;
	}

	.step-text {
		color: #4b5563;
		font-size: 0.95rem;
	}

	.refresh-btn {
		background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
		color: white;
		border: none;
		border-radius: 12px;
		padding: 1rem 2rem;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0 auto;
	}

	.refresh-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(220, 38, 38, 0.3);
	}

	.refresh-icon {
		width: 18px;
		height: 18px;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.sidebar {
			width: 240px;
		}

		.main-content {
			margin-left: 240px;
			padding: 1rem;
		}

		.waiting-card {
			padding: 2rem 1.5rem;
		}

		.waiting-title {
			font-size: 1.75rem;
		}
	}

	@media (max-width: 640px) {
		.sidebar {
			transform: translateX(-100%);
			z-index: 100;
		}

		.main-content {
			margin-left: 0;
		}

		.status-card {
			flex-direction: column;
			text-align: center;
		}

		.status-content {
			text-align: center;
		}
	}
</style> 