<!-- Customer Dashboard -->
<script lang="ts">
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { getCurrentUser, signOut } from '$lib/auth'
	import { getCurrentUserProfile } from '$lib/userService'
	import { getCurrentUserCustomer, getCustomerJobStats } from '$lib/services/customerService'
	import { supabase } from '$lib/supabase'
	import type { User } from '@supabase/supabase-js'
	import type { UserProfile } from '$lib/types'
	import type { Customer } from '$lib/services/customerService'
	
	let user: User | null = null
	let userProfile: UserProfile | null = null
	let customer: Customer | null = null
	let jobStats: {
		totalJobs: number;
		activeJobs: number;
		completedJobs: number;
		recentJobs: any[];
	} = {
		totalJobs: 0,
		activeJobs: 0,
		completedJobs: 0,
		recentJobs: []
	}
	let loading = false
	let dataLoading = true
	
	// Admin customer switcher state
	let allCustomers: Customer[] = []
	let selectedCustomerId: string = ''
	let showCustomerDropdown = false
	let loadingCustomers = false

	// Load user data on page load (authentication is handled server-side)
	onMount(async () => {
		user = await getCurrentUser()
		
		if (user) {
			try {
				// Load user profile and customer data in parallel
				const [profileResult, customerResult, statsResult] = await Promise.all([
					getCurrentUserProfile(),
					getCurrentUserCustomer(),
					getCustomerJobStats()
				])
				
				userProfile = profileResult
				customer = customerResult
				jobStats = statsResult
				
				// If admin, load all customers for the switcher
				if (userProfile?.role === 'Admin') {
					await loadAllCustomers()
					selectedCustomerId = customer?.id || ''
				}
			} catch (error) {
				console.error('Error loading user data:', error)
			} finally {
				dataLoading = false
			}
		} else {
			dataLoading = false
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

	// Load all customers for admin switcher
	async function loadAllCustomers() {
		if (userProfile?.role !== 'Admin') return
		
		try {
			loadingCustomers = true
			const { data, error } = await supabase
				.from('customers')
				.select('*')
				.order('name', { ascending: true })
			
			if (error) {
				console.error('Error loading customers:', error)
				return
			}
			
			allCustomers = data || []
			console.log('Loaded customers for admin:', allCustomers.length)
		} catch (err) {
			console.error('Error in loadAllCustomers:', err)
		} finally {
			loadingCustomers = false
		}
	}

	// Switch to a different customer (admin only)
	async function switchToCustomer(customerId: string) {
		if (userProfile?.role !== 'Admin') return
		
		try {
			loading = true
			selectedCustomerId = customerId
			showCustomerDropdown = false
			
			// Load the selected customer's data
			const { data: customerData, error: customerError } = await supabase
				.from('customers')
				.select('*')
				.eq('id', customerId)
				.single()
			
			if (customerError) {
				console.error('Error loading selected customer:', customerError)
				return
			}
			
			customer = customerData
			
			// Reload job stats for the new customer
			// Note: This might need to be updated to filter by customer_id
			const statsResult = await getCustomerJobStats()
			jobStats = statsResult
			
			console.log('Switched to customer:', customer?.name)
		} catch (err) {
			console.error('Error switching customer:', err)
		} finally {
			loading = false
		}
	}

	// Get customer display name with fallback
	function getCustomerDisplayName(): string {
		if (userProfile?.role === 'Admin') {
			return customer?.name || 'Select Customer'
		}
		return customer?.name || 'Netjets' // Default to Netjets when customer name is null
	}

	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.customer-dropdown-container')) {
			showCustomerDropdown = false;
		}
	}
</script>

<div class="customer-container" onclick={handleClickOutside}>
	<!-- Header Section -->
	<div class="header-section">
		<div class="brand-header">
			{#if dataLoading}
				<h1 class="main-title">Welcome</h1>
				<p class="subtitle">Loading your dashboard...</p>
			{:else}
				<h1 class="main-title">Welcome, {getCustomerDisplayName()}!</h1>
				<p class="subtitle">Certus Freight Customer Portal</p>
			{/if}
		</div>
		
		{#if user}
			<div class="user-info-card">
				<div class="user-avatar">
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
					</svg>
				</div>
				<div class="user-details">
					<p class="user-email">{user.email}</p>
					<p class="user-role">
						{#if userProfile}
							{userProfile.role === 'Admin' ? 'Administrator' : 'Customer'}
						{:else}
							Customer
						{/if}
					</p>
					
					<!-- Admin-only customer switcher -->
					{#if userProfile?.role === 'Admin'}
						<div class="admin-customer-switcher">
							<label class="switcher-label">View as Customer:</label>
							<div class="customer-dropdown-container">
								<button 
									class="customer-select-btn"
									onclick={() => showCustomerDropdown = !showCustomerDropdown}
									disabled={loadingCustomers}
								>
									{customer?.name || 'Select Customer'} ▼
								</button>
								
								{#if showCustomerDropdown}
									<div class="customer-dropdown">
										{#if loadingCustomers}
											<div class="dropdown-item loading">Loading customers...</div>
										{:else}
											{#each allCustomers as cust}
												<button 
													class="dropdown-item"
													onclick={() => switchToCustomer(cust.id)}
													class:selected={cust.id === selectedCustomerId}
												>
													<span class="customer-name">{cust.name}</span>
													{#if cust.account_number}
														<span class="customer-account">#{cust.account_number}</span>
													{/if}
												</button>
											{/each}
										{/if}
									</div>
								{/if}
							</div>
						</div>
					{/if}
				</div>
				<button onclick={handleSignOut} disabled={loading} class="logout-btn">
					{loading ? 'Signing out...' : 'Sign Out'}
				</button>
			</div>
		{/if}
	</div>

	<!-- Job Statistics Section -->
	{#if !dataLoading}
		<div class="stats-section">
			<h2 class="section-title">Your Job Overview</h2>
			<div class="stats-grid">
				<div class="stat-card">
					<div class="stat-icon total">
						<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
						</svg>
					</div>
					<div class="stat-content">
						<h3>{jobStats.totalJobs}</h3>
						<p>Total Jobs</p>
					</div>
				</div>

				<div class="stat-card">
					<div class="stat-icon active">
						<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
						</svg>
					</div>
					<div class="stat-content">
						<h3>{jobStats.activeJobs}</h3>
						<p>Active Jobs</p>
					</div>
				</div>

				<div class="stat-card">
					<div class="stat-icon completed">
						<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
						</svg>
					</div>
					<div class="stat-content">
						<h3>{jobStats.completedJobs}</h3>
						<p>Completed Jobs</p>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Quick Actions Section -->
	<div class="quick-actions-section">
		<h2 class="section-title">Quick Actions</h2>
		<div class="action-grid">
			<div class="action-card">
				<div class="action-icon">
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
					</svg>
				</div>
				<h3>Search Jobs</h3>
				<p>Find and track your shipments</p>
				<a href="/dashboard/customer/job-search" class="action-btn">Search Now</a>
			</div>

			<div class="action-card">
				<div class="action-icon">
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
					</svg>
				</div>
				<h3>New Job</h3>
				<p>Create a new shipment order</p>
				<a href="/dashboard/customer/new-job" class="action-btn">Create Job</a>
			</div>

			<div class="action-card">
				<div class="action-icon">
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
					</svg>
				</div>
				<h3>Get Quote</h3>
				<p>Request pricing for your shipment</p>
				<a href="/dashboard/customer/new-job" class="action-btn">Get Quote</a>
			</div>
		</div>
	</div>

	<!-- Services Section -->
	<div class="services-section">
		<h2 class="section-title">Customer Services</h2>
		<div class="services-grid">
			<div class="service-item">
				<div class="service-icon">
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
					</svg>
				</div>
				<span>Package Tracking</span>
			</div>

			<div class="service-item">
				<div class="service-icon">
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4h6m-6 0a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2v-6a2 2 0 00-2-2"/>
					</svg>
				</div>
				<span>Delivery Schedule</span>
			</div>

			<div class="service-item">
				<div class="service-icon">
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
					</svg>
				</div>
				<span>Billing & Invoices</span>
			</div>

			<div class="service-item">
				<div class="service-icon">
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
					</svg>
				</div>
				<span>Account Settings</span>
			</div>
		</div>
	</div>

	<!-- Recent Activity Section -->
	<div class="activity-section">
		<h2 class="section-title">Recent Activity</h2>
		<div class="activity-card">
			<div class="activity-item">
				<div class="activity-icon success">
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
					</svg>
				</div>
				<div class="activity-content">
					<p class="activity-title">Welcome to Certus Freight!</p>
					<p class="activity-time">Just now</p>
				</div>
			</div>

			<div class="activity-item">
				<div class="activity-icon info">
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
					</svg>
				</div>
				<div class="activity-content">
					<p class="activity-title">Account successfully created</p>
					<p class="activity-time">Just now</p>
				</div>
			</div>
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
	.customer-container {
		min-height: 100vh;
		background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
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
		background: linear-gradient(45deg, #34547a, #5a7fb8);
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
		background: #34547a;
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
		margin: 0 0 0.5rem 0;
	}

	/* Admin Customer Switcher Styles */
	.admin-customer-switcher {
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid #e5e7eb;
	}

	.switcher-label {
		display: block;
		font-size: 0.75rem;
		font-weight: 500;
		color: #374151;
		margin-bottom: 0.5rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.customer-dropdown-container {
		position: relative;
	}

	.customer-select-btn {
		width: 100%;
		padding: 0.5rem 0.75rem;
		background: #f8fafc;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.875rem;
		text-align: left;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.customer-select-btn:hover:not(:disabled) {
		background: #f1f5f9;
		border-color: #34547a;
	}

	.customer-select-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.customer-dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: white;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		z-index: 50;
		max-height: 200px;
		overflow-y: auto;
		margin-top: 2px;
	}

	.dropdown-item {
		width: 100%;
		padding: 0.75rem;
		text-align: left;
		border: none;
		background: white;
		cursor: pointer;
		transition: background-color 0.2s ease;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid #f3f4f6;
	}

	.dropdown-item:last-child {
		border-bottom: none;
	}

	.dropdown-item:hover:not(.loading) {
		background: #f8fafc;
	}

	.dropdown-item.selected {
		background: #dbeafe;
		color: #1d4ed8;
	}

	.dropdown-item.loading {
		cursor: default;
		font-style: italic;
		color: #6b7280;
	}

	.customer-name {
		font-weight: 500;
		color: #374151;
	}

	.customer-account {
		font-size: 0.75rem;
		color: #6b7280;
		font-family: monospace;
	}

	.dropdown-item.selected .customer-name {
		color: #1d4ed8;
		font-weight: 600;
	}

	.logout-btn {
		background: #34547a;
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
		background: #5a7fb8;
		transform: translateY(-2px);
		box-shadow: 0 4px 15px rgba(52, 84, 122, 0.3);
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

	/* Statistics Section */
	.stats-section {
		max-width: 1200px;
		margin: 0 auto 3rem;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
	}

	.stat-card {
		background: white;
		padding: 1.5rem;
		border-radius: 16px;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
		border: 1px solid rgba(0, 0, 0, 0.05);
		display: flex;
		align-items: center;
		gap: 1rem;
		transition: all 0.3s ease;
	}

	.stat-card:hover {
		transform: translateY(-3px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
	}

	.stat-icon {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		color: white;
	}

	.stat-icon.total {
		background: linear-gradient(45deg, #3b82f6, #2563eb);
	}

	.stat-icon.active {
		background: linear-gradient(45deg, #f59e0b, #d97706);
	}

	.stat-icon.completed {
		background: linear-gradient(45deg, #10b981, #059669);
	}

	.stat-icon svg {
		width: 28px;
		height: 28px;
	}

	.stat-content h3 {
		font-size: 2rem;
		font-weight: 700;
		color: #1f2937;
		margin: 0 0 0.25rem 0;
	}

	.stat-content p {
		font-size: 0.875rem;
		color: #6b7280;
		margin: 0;
		font-weight: 500;
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
		border-color: #34547a;
	}

	.action-icon {
		width: 64px;
		height: 64px;
		background: linear-gradient(45deg, #34547a, #5a7fb8);
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
		background: #34547a;
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
		background: #5a7fb8;
		transform: translateY(-2px);
		box-shadow: 0 4px 15px rgba(52, 84, 122, 0.3);
	}

	/* Services Section */
	.services-section {
		max-width: 1200px;
		margin: 0 auto 3rem;
	}

	.services-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	.service-item {
		background: white;
		padding: 1.5rem;
		border-radius: 15px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
		display: flex;
		align-items: center;
		gap: 1rem;
		transition: all 0.3s ease;
		cursor: pointer;
	}

	.service-item:hover {
		transform: translateY(-3px);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		border-color: #34547a;
	}

	.service-icon {
		width: 48px;
		height: 48px;
		background: rgba(52, 84, 122, 0.1);
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #34547a;
		flex-shrink: 0;
	}

	.service-icon svg {
		width: 24px;
		height: 24px;
	}

	.service-item span {
		font-size: 1rem;
		font-weight: 500;
		color: #1f2937;
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

	.activity-icon.success {
		background: rgba(34, 197, 94, 0.1);
		color: #22c55e;
	}

	.activity-icon.info {
		background: rgba(59, 130, 246, 0.1);
		color: #3b82f6;
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

	.activity-time {
		font-size: 0.875rem;
		color: #6b7280;
		margin: 0;
	}



	/* Admin Section */
	.admin-section {
		max-width: 1200px;
		margin: 0 auto 3rem;
	}

	.admin-card {
		background: linear-gradient(135deg, #34547a, #5a7fb8);
		padding: 2rem;
		border-radius: 20px;
		box-shadow: 0 4px 20px rgba(52, 84, 122, 0.3);
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
		color: #34547a;
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
		.customer-container {
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

		.action-grid {
			grid-template-columns: 1fr;
		}

		.services-grid {
			grid-template-columns: 1fr;
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
		background-color: #f8fafc;
	}
</style> 