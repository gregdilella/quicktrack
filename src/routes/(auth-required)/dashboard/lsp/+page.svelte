<!-- LSP Dashboard -->
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

<div class="lsp-container">
	<!-- Header Section -->
	<div class="header-section">
		<div class="brand-header">
			<h1 class="main-title">LSP Portal</h1>
			<p class="subtitle">Logistics Service Provider Dashboard</p>
		</div>
		
		{#if user}
			<div class="user-info-card">
				<div class="user-avatar">
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
					</svg>
				</div>
				<div class="user-details">
					<p class="user-email">{user.email}</p>
					<p class="user-role">
						{#if userProfile}
							{userProfile.role === 'Admin' ? 'Administrator' : 'LSP Provider'}
						{:else}
							LSP Provider
						{/if}
					</p>
				</div>
				<button on:click={handleSignOut} disabled={loading} class="logout-btn">
					{loading ? 'Signing out...' : 'Sign Out'}
				</button>
			</div>
		{/if}
	</div>

	<!-- KPI Overview Section -->
	<div class="kpi-section">
		<h2 class="section-title">Service Overview</h2>
		<div class="kpi-grid">
			<div class="kpi-card">
				<div class="kpi-icon">
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
					</svg>
				</div>
				<div class="kpi-content">
					<h3>Active Contracts</h3>
					<p class="kpi-value">34</p>
					<p class="kpi-status operational">Operational</p>
				</div>
			</div>

			<div class="kpi-card">
				<div class="kpi-icon">
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
					</svg>
				</div>
				<div class="kpi-content">
					<h3>Pending Requests</h3>
					<p class="kpi-value">7</p>
					<p class="kpi-status pending">Review Required</p>
				</div>
			</div>

			<div class="kpi-card">
				<div class="kpi-icon">
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
					</svg>
				</div>
				<div class="kpi-content">
					<h3>Fleet Utilization</h3>
					<p class="kpi-value">78%</p>
					<p class="kpi-status positive">Optimal</p>
				</div>
			</div>

			<div class="kpi-card">
				<div class="kpi-icon">
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
					</svg>
				</div>
				<div class="kpi-content">
					<h3>SLA Compliance</h3>
					<p class="kpi-value">96.2%</p>
					<p class="kpi-status excellent">Exceeds Target</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Quick Actions Section -->
	<div class="quick-actions-section">
		<h2 class="section-title">Quick Actions</h2>
		<div class="action-grid">
			<div class="action-card">
				<div class="action-icon">
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
					</svg>
				</div>
				<h3>Incoming Requests</h3>
				<p>Review and respond to new service requests</p>
				<button class="action-btn">View Requests</button>
			</div>

			<div class="action-card">
				<div class="action-icon">
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
					</svg>
				</div>
				<h3>Confirm Times</h3>
				<p>Confirm delivery and pickup schedules</p>
				<button class="action-btn">Confirm</button>
			</div>

			<div class="action-card">
				<div class="action-icon">
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
					</svg>
				</div>
				<h3>Accrual Management</h3>
				<p>Process accruals and adjustments</p>
				<button class="action-btn">Manage</button>
			</div>
		</div>
	</div>

	<!-- Recent Activity Section -->
	<div class="activity-section">
		<h2 class="section-title">Recent Activity</h2>
		<div class="activity-card">
			<div class="activity-item">
				<div class="activity-icon urgent">
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"/>
					</svg>
				</div>
				<div class="activity-content">
					<p class="activity-title">New service request from ACME Corp</p>
					<p class="activity-meta">14:32 • Priority: URGENT</p>
				</div>
				<div class="activity-status new">NEW</div>
			</div>

			<div class="activity-item">
				<div class="activity-icon success">
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
					</svg>
				</div>
				<div class="activity-content">
					<p class="activity-title">Time confirmation received</p>
					<p class="activity-meta">13:45 • Job #QT-2024-0157</p>
				</div>
				<div class="activity-status confirmed">CONFIRMED</div>
			</div>

			<div class="activity-item">
				<div class="activity-icon info">
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
					</svg>
				</div>
				<div class="activity-content">
					<p class="activity-title">Dispute resolution completed</p>
					<p class="activity-meta">12:18 • Job #QT-2024-0143</p>
				</div>
				<div class="activity-status resolved">RESOLVED</div>
			</div>

			<div class="activity-item">
				<div class="activity-icon warning">
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
					</svg>
				</div>
				<div class="activity-content">
					<p class="activity-title">Accrual adjustment approved</p>
					<p class="activity-meta">11:30 • Amount: $2,450.00</p>
				</div>
				<div class="activity-status approved">APPROVED</div>
			</div>
		</div>
	</div>

	<!-- Support Section -->
	<div class="support-section">
		<h2 class="section-title">LSP Support</h2>
		<div class="support-card">
			<div class="support-content">
				<div class="support-icon">
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5zm0 19.5a9.75 9.75 0 100-19.5 9.75 9.75 0 000 19.5z"/>
					</svg>
				</div>
				<div class="support-text">
					<h3>Partner Support</h3>
					<p>LSP HOTLINE: 1-800-LSP-SUPPORT</p>
					<p>Email: partners@certrack.com</p>
					<p>24/7 logistics coordination support</p>
				</div>
			</div>
			<button class="support-btn">Contact Support</button>
		</div>
	</div>

	{#if userProfile?.role === 'Admin'}
		<div class="admin-section">
			<div class="admin-card">
				<div class="admin-content">
					<h3>Administrator Access</h3>
					<p>You have admin privileges. Return to the admin panel to manage the system.</p>
				</div>
				<a href="/dashboard/admin" class="admin-btn">Admin Panel</a>
			</div>
		</div>
	{/if}
</div>

<style>
	.lsp-container {
		min-height: 100vh;
		background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		padding: 2rem;
	}

	/* Header Section */
	.header-section {
		max-width: 1200px;
		margin: 0 auto 3rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 2rem;
	}

	.brand-header {
		flex: 1;
	}

	.main-title {
		font-size: 3rem;
		font-weight: 700;
		margin: 0 0 0.5rem 0;
		color: #1f2937;
		background: linear-gradient(45deg, #2563eb, #1d4ed8);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.subtitle {
		font-size: 1.2rem;
		color: #6b7280;
		margin: 0;
		font-weight: 300;
	}

	.user-info-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		background: white;
		padding: 1.5rem;
		border-radius: 20px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
	}

	.user-avatar {
		width: 48px;
		height: 48px;
		background: #2563eb;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
	}

	.user-avatar svg {
		width: 24px;
		height: 24px;
	}

	.user-details {
		flex: 1;
	}

	.user-email {
		font-size: 1rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 0.25rem 0;
	}

	.user-role {
		font-size: 0.875rem;
		color: #6b7280;
		margin: 0;
	}

	.logout-btn {
		background: #2563eb;
		color: white;
		border: none;
		border-radius: 12px;
		padding: 0.75rem 1.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.logout-btn:hover:not(:disabled) {
		background: #1d4ed8;
		transform: translateY(-2px);
		box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);
	}

	.logout-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	/* Section Titles */
	.section-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 1.5rem 0;
		text-align: center;
	}

	/* KPI Section */
	.kpi-section {
		max-width: 1200px;
		margin: 0 auto 3rem;
	}

	.kpi-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 2rem;
	}

	.kpi-card {
		background: white;
		padding: 2rem;
		border-radius: 20px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
		display: flex;
		align-items: center;
		gap: 1.5rem;
		transition: all 0.3s ease;
	}

	.kpi-card:hover {
		transform: translateY(-5px);
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
		border-color: #2563eb;
	}

	.kpi-icon {
		width: 56px;
		height: 56px;
		background: linear-gradient(45deg, #2563eb, #1d4ed8);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		flex-shrink: 0;
	}

	.kpi-icon svg {
		width: 28px;
		height: 28px;
	}

	.kpi-content {
		flex: 1;
	}

	.kpi-content h3 {
		font-size: 1rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 0.5rem 0;
	}

	.kpi-value {
		font-size: 2rem;
		font-weight: 700;
		color: #1f2937;
		margin: 0 0 0.5rem 0;
	}

	.kpi-status {
		font-size: 0.875rem;
		font-weight: 500;
		margin: 0;
	}

	.kpi-status.operational {
		color: #059669;
	}

	.kpi-status.pending {
		color: #d97706;
	}

	.kpi-status.positive {
		color: #059669;
	}

	.kpi-status.excellent {
		color: #059669;
	}

	/* Quick Actions Section */
	.quick-actions-section {
		max-width: 1200px;
		margin: 0 auto 3rem;
	}

	.action-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
	}

	.action-card {
		background: white;
		padding: 2rem;
		border-radius: 20px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
		text-align: center;
		transition: all 0.3s ease;
	}

	.action-card:hover {
		transform: translateY(-5px);
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
		border-color: #2563eb;
	}

	.action-icon {
		width: 64px;
		height: 64px;
		background: linear-gradient(45deg, #2563eb, #1d4ed8);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 1.5rem;
		color: white;
	}

	.action-icon svg {
		width: 32px;
		height: 32px;
	}

	.action-card h3 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 0.5rem 0;
	}

	.action-card p {
		color: #6b7280;
		margin: 0 0 1.5rem 0;
		line-height: 1.6;
	}

	.action-btn {
		background: #2563eb;
		color: white;
		border: none;
		border-radius: 12px;
		padding: 0.875rem 2rem;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		width: 100%;
	}

	.action-btn:hover {
		background: #1d4ed8;
		transform: translateY(-2px);
		box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);
	}

	/* Activity Section */
	.activity-section {
		max-width: 1200px;
		margin: 0 auto 3rem;
	}

	.activity-card {
		background: white;
		padding: 2rem;
		border-radius: 20px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
	}

	.activity-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 0;
		border-bottom: 1px solid #f3f4f6;
	}

	.activity-item:last-child {
		border-bottom: none;
	}

	.activity-icon {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.activity-icon.urgent {
		background: rgba(239, 68, 68, 0.1);
		color: #ef4444;
	}

	.activity-icon.success {
		background: rgba(34, 197, 94, 0.1);
		color: #22c55e;
	}

	.activity-icon.info {
		background: rgba(59, 130, 246, 0.1);
		color: #3b82f6;
	}

	.activity-icon.warning {
		background: rgba(245, 158, 11, 0.1);
		color: #f59e0b;
	}

	.activity-icon svg {
		width: 20px;
		height: 20px;
	}

	.activity-content {
		flex: 1;
	}

	.activity-title {
		font-size: 1rem;
		font-weight: 500;
		color: #1f2937;
		margin: 0 0 0.25rem 0;
	}

	.activity-meta {
		font-size: 0.875rem;
		color: #6b7280;
		margin: 0;
	}

	.activity-status {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.5rem 0.75rem;
		border-radius: 12px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		flex-shrink: 0;
	}

	.activity-status.new {
		background: rgba(239, 68, 68, 0.1);
		color: #ef4444;
	}

	.activity-status.confirmed {
		background: rgba(34, 197, 94, 0.1);
		color: #22c55e;
	}

	.activity-status.resolved {
		background: rgba(59, 130, 246, 0.1);
		color: #3b82f6;
	}

	.activity-status.approved {
		background: rgba(245, 158, 11, 0.1);
		color: #f59e0b;
	}

	/* Support Section */
	.support-section {
		max-width: 1200px;
		margin: 0 auto 3rem;
	}

	.support-card {
		background: white;
		padding: 2rem;
		border-radius: 20px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
		display: flex;
		align-items: center;
		gap: 2rem;
	}

	.support-content {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		flex: 1;
	}

	.support-icon {
		width: 56px;
		height: 56px;
		background: rgba(37, 99, 235, 0.1);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #2563eb;
		flex-shrink: 0;
	}

	.support-icon svg {
		width: 28px;
		height: 28px;
	}

	.support-text h3 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 0.5rem 0;
	}

	.support-text p {
		font-size: 0.875rem;
		color: #6b7280;
		margin: 0.25rem 0;
	}

	.support-btn {
		background: #2563eb;
		color: white;
		border: none;
		border-radius: 12px;
		padding: 0.875rem 2rem;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.support-btn:hover {
		background: #1d4ed8;
		transform: translateY(-2px);
		box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);
	}

	/* Admin Section */
	.admin-section {
		max-width: 1200px;
		margin: 0 auto 3rem;
	}

	.admin-card {
		background: linear-gradient(135deg, #2563eb, #1d4ed8);
		padding: 2rem;
		border-radius: 20px;
		box-shadow: 0 4px 20px rgba(37, 99, 235, 0.3);
		color: white;
		display: flex;
		align-items: center;
		gap: 2rem;
	}

	.admin-content {
		flex: 1;
	}

	.admin-content h3 {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
	}

	.admin-content p {
		margin: 0;
		opacity: 0.9;
	}

	.admin-btn {
		background: white;
		color: #2563eb;
		border: none;
		border-radius: 12px;
		padding: 0.875rem 2rem;
		font-size: 1rem;
		font-weight: 500;
		text-decoration: none;
		display: inline-block;
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.admin-btn:hover {
		background: #f9fafb;
		transform: translateY(-2px);
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.lsp-container {
			padding: 1rem;
		}

		.header-section {
			flex-direction: column;
			align-items: flex-start;
			gap: 1.5rem;
		}

		.main-title {
			font-size: 2rem;
		}

		.user-info-card {
			width: 100%;
			flex-direction: column;
			text-align: center;
		}

		.kpi-grid {
			grid-template-columns: 1fr;
		}

		.action-grid {
			grid-template-columns: 1fr;
		}

		.support-card {
			flex-direction: column;
			text-align: center;
		}

		.admin-card {
			flex-direction: column;
			text-align: center;
		}
	}

	/* Global Styles */
	:global(body) {
		margin: 0;
		padding: 0;
		background-color: #eff6ff;
	}
</style> 