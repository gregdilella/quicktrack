<!-- Individual Salesman Details - Management -->
<script lang="ts">
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { getCurrentUser, signOut } from '$lib/auth'
	import { getCurrentUserProfile } from '$lib/userService'
	import { supabase } from '$lib/supabase'
	import * as Table from "$lib/components/ui/table"
	import type { User } from '@supabase/supabase-js'
	import type { UserProfile } from '$lib/types'

	let user: User | null = null
	let userProfile: UserProfile | null = null
	let loading = false
	let dataLoading = true
	let salesman: any = null
	let customerAccounts: any[] = []
	let jobMetrics: any[] = []

	// Get salesman ID from URL params
	$: salesmanId = $page.params.id

	// Check if current user has access to view this salesman's page
	function hasAccessToSalesman(salesmanData: any): boolean {
		// Admins can see all salesman pages
		if (userProfile?.role === 'Admin') {
			return true
		}

		// Check if the current user is this salesman (by matching email)
		if (userProfile?.email && salesmanData?.email) {
			return userProfile.email.toLowerCase() === salesmanData.email.toLowerCase()
		}

		// No access for other roles
		return false
	}

	onMount(async () => {
		user = await getCurrentUser()
		if (user) {
			try {
				userProfile = await getCurrentUserProfile()
				if (salesmanId) {
					await loadSalesmanData()
				}
			} catch (error) {
				console.error('Error loading user profile:', error)
			}
		}
	})

	async function loadSalesmanData() {
		try {
			dataLoading = true
			
			// Load salesman information
			const { data: salesmanData, error: salesmanError } = await supabase
				.from('salesman')
				.select('*')
				.eq('id', salesmanId)
				.single()

			if (salesmanError) {
				console.error('Error loading salesman:', salesmanError)
				return
			}

			salesman = salesmanData

			// Check access permissions
			if (!hasAccessToSalesman(salesmanData)) {
				console.log('Access denied to salesman page')
				goto('/dashboard/management/salesman-search')
				return
			}
			
			// Load customers assigned to this salesman
			const { data: customers, error: customersError } = await supabase
				.from('customers')
				.select('*')
				.eq('salesman_id', salesmanId)
				.order('name', { ascending: true })

			if (customersError) {
				console.error('Error loading customers:', customersError)
				return
			}

			customerAccounts = customers || []

			// Load job metrics for each customer
			await loadJobMetrics()

		} catch (err) {
			console.error('Error loading salesman data:', err)
		} finally {
			dataLoading = false
		}
	}

	async function loadJobMetrics() {
		if (customerAccounts.length === 0) {
			console.log('No customer accounts found for this salesman');
			return;
		}

		try {
			const customerIds = customerAccounts.map(c => c.id)
			console.log('Loading job metrics for customer IDs:', customerIds);
			
			// First, let's see if there are any jobs for these customers
			const { data: allJobs, error: allJobsError } = await supabase
				.from('jobsfile')
				.select('jobnumber, jobno, customer_id, created_at')
				.in('customer_id', customerIds)
				.order('created_at', { ascending: false })

			console.log('All jobs for customers:', { allJobs, allJobsError });

			if (allJobsError) {
				console.error('Error loading jobs:', allJobsError)
				return
			}

			if (!allJobs || allJobs.length === 0) {
				console.log('No jobs found for these customers');
				jobMetrics = [];
				return;
			}

			// Now get billing data for these jobs
			// Try both jobnumber and jobno since there might be inconsistencies
			const jobNumbers = allJobs.map(job => job.jobnumber).filter(Boolean);
			const jobNos = allJobs.map(job => job.jobno).filter(Boolean);
			console.log('Looking for billing data with:', { jobNumbers, jobNos });

			// Try querying with jobnumber first
			let { data: billingData, error: billingError } = await supabase
				.from('billing')
				.select('jobnumber, chargecode, charge')
				.in('jobnumber', jobNumbers)

			console.log('Billing data with jobnumber:', { billingData, billingError });

			// If no billing data found with jobnumber, try with jobno
			if ((!billingData || billingData.length === 0) && jobNos.length > 0) {
				console.log('No billing data found with jobnumber, trying with jobno...');
				const { data: billingDataJobno, error: billingErrorJobno } = await supabase
					.from('billing')
					.select('jobnumber, chargecode, charge')
					.in('jobnumber', jobNos)

				console.log('Billing data with jobno:', { billingDataJobno, billingErrorJobno });
				
				if (!billingErrorJobno) {
					billingData = billingDataJobno;
					billingError = null;
				}
			}

			console.log('Billing data result:', { billingData, billingError });

			if (billingError) {
				console.error('Error loading billing data:', billingError)
				// Still show jobs even if no billing data
				jobMetrics = allJobs.map(job => ({
					jobnumber: job.jobnumber || job.jobno,
					customer_id: job.customer_id,
					customer_name: customerAccounts.find(c => c.id === job.customer_id)?.name || 'Unknown',
					created_at: job.created_at,
					revenue: 0,
					costs: 0,
					gross_profit: 0,
					gross_profit_percentage: 0
				}));
				return;
			}

			// Process job data to calculate metrics
			jobMetrics = processJobMetrics(allJobs, billingData || [])

		} catch (err) {
			console.error('Error loading job metrics:', err)
		}
	}

	function processJobMetrics(jobs: any[], billingData: any[]) {
		console.log('Processing job metrics with:', { jobsCount: jobs.length, billingCount: billingData.length });
		
		const jobMap = new Map()

		// First, create entries for all jobs
		jobs.forEach(job => {
			const jobKey = job.jobnumber || job.jobno
			jobMap.set(jobKey, {
				jobnumber: jobKey,
				customer_id: job.customer_id,
				customer_name: customerAccounts.find(c => c.id === job.customer_id)?.name || 'Unknown',
				created_at: job.created_at,
				revenue: 0,
				costs: 0,
				gross_profit: 0,
				gross_profit_percentage: 0
			})
		})

		// Then, add billing data to jobs (if any exists)
		if (billingData && billingData.length > 0) {
			billingData.forEach(billing => {
				const jobKey = billing.jobnumber
				if (jobMap.has(jobKey)) {
					const jobData = jobMap.get(jobKey)
					const charge = parseFloat(billing.charge) || 0

					console.log('Processing billing entry:', { jobKey, chargecode: billing.chargecode, charge });

					// Categorize charges (this logic may need adjustment based on your charge codes)
					if (billing.chargecode === 'TOTAL' || billing.chargecode?.includes('REVENUE') || billing.chargecode?.includes('SALE')) {
						jobData.revenue += charge
					} else {
						jobData.costs += charge
					}
				}
			})
		} else {
			console.log('No billing data to process');
		}

		// Calculate gross profit and percentage for each job
		const metrics = Array.from(jobMap.values()).map(job => {
			job.gross_profit = job.revenue - job.costs
			job.gross_profit_percentage = job.revenue > 0 ? (job.gross_profit / job.revenue) * 100 : 0
			return job
		})

		console.log('Processed job metrics:', metrics);
		return metrics.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
	}

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

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount)
	}

	function formatPercentage(percentage: number): string {
		return `${percentage.toFixed(1)}%`
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString()
	}
</script>

<div class="salesman-container">
	<div class="main-content">
		<!-- Header Section -->
		<div class="header-section">
			<div class="header-content">
				{#if dataLoading}
					<h1 class="page-title">Loading...</h1>
					<p class="page-subtitle">Loading salesman details</p>
				{:else if salesman}
					<h1 class="page-title">{salesman.name}</h1>
					<p class="page-subtitle">Salesman Performance Dashboard</p>
				{:else}
					<h1 class="page-title">Salesman Not Found</h1>
					<p class="page-subtitle">The requested salesman could not be found</p>
				{/if}
			</div>
		</div>

		<!-- Navigation -->
		<div class="nav-section">
			<a href="/dashboard/management/salesman-search" class="nav-link">⬅ Back to Salesman Search</a>
			<a href="/dashboard/management" class="nav-link">Management Dashboard</a>
		</div>

		{#if user && userProfile}
			<div class="user-info">
				<p class="status-text">Status: <span class="highlight">Management Access</span></p>
				<p class="function-text">Function: Salesman Performance Review</p>
			</div>
		{/if}

		{#if dataLoading}
			<div class="loading-state">
				<div class="loading-spinner"></div>
				<p>Loading salesman performance data...</p>
			</div>
		{:else if !salesman}
			<div class="empty-state">
				<div class="empty-icon">❌</div>
				<h3>Salesman Not Found</h3>
				<p>The requested salesman could not be found or you don't have permission to view this page</p>
				<a href="/dashboard/management/salesman-search" class="empty-action">Return to Search</a>
			</div>
		{:else}
			<!-- Salesman Info Card -->
			<div class="info-section">
				<div class="salesman-info-card">
					<h3>Salesman Information</h3>
					<div class="info-grid">
						<div class="info-item">
							<span class="info-label">Name:</span>
							<span class="info-value">{salesman.name}</span>
						</div>
						{#if salesman.email}
							<div class="info-item">
								<span class="info-label">Email:</span>
								<span class="info-value">{salesman.email}</span>
							</div>
						{/if}
						{#if salesman.fin_cono}
							<div class="info-item">
								<span class="info-label">FIN CONO:</span>
								<span class="info-value">{salesman.fin_cono}</span>
							</div>
						{/if}
						<div class="info-item">
							<span class="info-label">Customer Accounts:</span>
							<span class="info-value">{customerAccounts.length}</span>
						</div>
						<div class="info-item">
							<span class="info-label">Total Jobs:</span>
							<span class="info-value">{jobMetrics.length}</span>
						</div>
					</div>
					
					<div class="read-only-notice">
						<p>📊 This is a read-only performance dashboard. To edit salesman details, contact an administrator.</p>
					</div>
				</div>
			</div>

			<!-- Customer Accounts Summary -->
			<div class="accounts-section">
				<h3>Customer Accounts ({customerAccounts.length})</h3>
				{#if customerAccounts.length === 0}
					<div class="empty-state">
						<div class="empty-icon">👥</div>
						<h4>No Customer Accounts</h4>
						<p>This salesman has no assigned customer accounts</p>
					</div>
				{:else}
					<div class="accounts-grid">
						{#each customerAccounts as customer}
							<div class="account-card">
								<h4>{customer.name}</h4>
								{#if customer.account_number}
									<p class="account-number">Account: {customer.account_number}</p>
								{/if}
								{#if customer.contact_email}
									<p class="contact-email">{customer.contact_email}</p>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Job Performance Table -->
			<div class="performance-section">
				<h3>Job Performance</h3>
				{#if jobMetrics.length === 0}
					<div class="empty-state">
						<div class="empty-icon">📊</div>
						<h4>No Job Data</h4>
						<p>No jobs found for this salesman's customers</p>
					</div>
				{:else}
					<div class="table-container">
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head>Job Number</Table.Head>
									<Table.Head>Customer</Table.Head>
									<Table.Head>Date</Table.Head>
									<Table.Head class="text-right">Revenue</Table.Head>
									<Table.Head class="text-right">Costs</Table.Head>
									<Table.Head class="text-right">Gross Profit</Table.Head>
									<Table.Head class="text-right">GP %</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each jobMetrics as job}
									<Table.Row>
										<Table.Cell class="font-medium">{job.jobnumber}</Table.Cell>
										<Table.Cell>{job.customer_name}</Table.Cell>
										<Table.Cell>{formatDate(job.created_at)}</Table.Cell>
										<Table.Cell class="text-right">{formatCurrency(job.revenue)}</Table.Cell>
										<Table.Cell class="text-right">{formatCurrency(job.costs)}</Table.Cell>
										<Table.Cell class="text-right {job.gross_profit > 0 ? 'positive' : job.gross_profit < 0 ? 'negative' : ''}">
											{formatCurrency(job.gross_profit)}
										</Table.Cell>
										<Table.Cell class="text-right {job.gross_profit_percentage > 0 ? 'positive' : job.gross_profit_percentage < 0 ? 'negative' : ''}">
											{formatPercentage(job.gross_profit_percentage)}
										</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</div>

					<!-- Summary Stats -->
					<div class="summary-stats">
						<div class="stat-card">
							<h4>Total Revenue</h4>
							<p class="stat-value">{formatCurrency(jobMetrics.reduce((sum, job) => sum + job.revenue, 0))}</p>
						</div>
						<div class="stat-card">
							<h4>Total Costs</h4>
							<p class="stat-value">{formatCurrency(jobMetrics.reduce((sum, job) => sum + job.costs, 0))}</p>
						</div>
						<div class="stat-card">
							<h4>Total Gross Profit</h4>
							<p class="stat-value profit">{formatCurrency(jobMetrics.reduce((sum, job) => sum + job.gross_profit, 0))}</p>
						</div>
						<div class="stat-card">
							<h4>Average GP %</h4>
							<p class="stat-value">{formatPercentage(jobMetrics.reduce((sum, job) => sum + job.gross_profit_percentage, 0) / jobMetrics.length)}</p>
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Logout Section -->
		<div class="logout-section">
			<button onclick={handleSignOut} disabled={loading} class="logout-button">
				{loading ? 'Signing Out...' : 'Logout'}
			</button>
		</div>
	</div>
</div>

<style>
	.salesman-container {
		background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		min-height: 100vh;
		padding: 2rem;
	}

	.main-content {
		max-width: 1200px;
		margin: 0 auto;
	}

	/* Header Section */
	.header-section {
		background: white;
		padding: 2rem;
		border-radius: 16px;
		box-shadow: 0 4px 20px rgba(0,0,0,0.1);
		border: 1px solid #e5e7eb;
		margin-bottom: 2rem;
	}

	.header-content {
		text-align: center;
	}

	.page-title {
		font-size: 2.5rem;
		font-weight: 700;
		color: #1f2937;
		margin: 0 0 0.5rem 0;
		background: linear-gradient(135deg, #2563eb, #1d4ed8);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.page-subtitle {
		font-size: 1.1rem;
		color: #6b7280;
		margin: 0;
	}

	/* Navigation */
	.nav-section {
		display: flex;
		gap: 1rem;
		margin-bottom: 2rem;
		justify-content: space-between;
		align-items: center;
	}

	.nav-link {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #7c3aed, #6d28d9);
		color: white;
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 600;
		border-radius: 12px;
		transition: all 0.3s ease;
		box-shadow: 0 4px 15px rgba(124,58,237,0.3);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.nav-link:hover {
		background: linear-gradient(135deg, #6d28d9, #5b21b6);
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(124,58,237,0.4);
	}

	/* User Info */
	.user-info {
		background: white;
		padding: 1.5rem;
		border-radius: 16px;
		box-shadow: 0 4px 20px rgba(0,0,0,0.1);
		border: 1px solid #e5e7eb;
		margin-bottom: 2rem;
	}

	.status-text, .function-text {
		margin: 0.25rem 0;
		font-size: 0.95rem;
		color: #374151;
	}

	.highlight {
		color: #7c3aed;
		font-weight: 600;
	}

	/* Loading and Empty States */
	.loading-state, .empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
		background: white;
		border-radius: 16px;
		box-shadow: 0 4px 20px rgba(0,0,0,0.1);
		border: 1px solid #e5e7eb;
		margin-bottom: 2rem;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #e5e7eb;
		border-top: 4px solid #2563eb;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.empty-action {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		background: #2563eb;
		color: white;
		text-decoration: none;
		border-radius: 8px;
		margin-top: 1rem;
		transition: background-color 0.2s ease;
	}

	.empty-action:hover {
		background: #1d4ed8;
	}

	/* Info Section */
	.info-section {
		margin-bottom: 2rem;
	}

	.salesman-info-card {
		background: white;
		padding: 2rem;
		border-radius: 16px;
		box-shadow: 0 4px 20px rgba(0,0,0,0.1);
		border: 1px solid #e5e7eb;
	}

	.salesman-info-card h3 {
		margin: 0 0 1.5rem 0;
		font-size: 1.5rem;
		color: #1f2937;
		font-weight: 600;
	}

	.info-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.info-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.info-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: #6b7280;
	}

	.info-value {
		font-size: 1rem;
		color: #1f2937;
		font-weight: 500;
	}

	/* Accounts Section */
	.accounts-section {
		background: white;
		padding: 2rem;
		border-radius: 16px;
		box-shadow: 0 4px 20px rgba(0,0,0,0.1);
		border: 1px solid #e5e7eb;
		margin-bottom: 2rem;
	}

	.accounts-section h3 {
		margin: 0 0 1.5rem 0;
		font-size: 1.5rem;
		color: #1f2937;
		font-weight: 600;
	}

	.accounts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1rem;
	}

	.account-card {
		background: #f8fafc;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 1rem;
	}

	.account-card h4 {
		margin: 0 0 0.5rem 0;
		color: #1f2937;
		font-size: 1.1rem;
	}

	.account-number, .contact-email {
		margin: 0.25rem 0;
		font-size: 0.875rem;
		color: #6b7280;
	}

	/* Performance Section */
	.performance-section {
		background: white;
		padding: 2rem;
		border-radius: 16px;
		box-shadow: 0 4px 20px rgba(0,0,0,0.1);
		border: 1px solid #e5e7eb;
		margin-bottom: 2rem;
	}

	.performance-section h3 {
		margin: 0 0 1.5rem 0;
		font-size: 1.5rem;
		color: #1f2937;
		font-weight: 600;
	}

	.table-container {
		margin-bottom: 2rem;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		overflow: hidden;
	}

	/* Table Styling */
	:global(.table-container table) {
		width: 100%;
	}

	:global(.table-container .positive) {
		color: #16a34a;
		font-weight: 600;
	}

	:global(.table-container .negative) {
		color: #dc2626;
		font-weight: 600;
	}

	/* Summary Stats */
	.summary-stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.stat-card {
		background: #f8fafc;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 1.5rem;
		text-align: center;
	}

	.stat-card h4 {
		margin: 0 0 0.5rem 0;
		font-size: 0.875rem;
		color: #6b7280;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.stat-value {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: #1f2937;
	}

	.stat-value.profit {
		color: #16a34a;
	}

	/* Read-only notice */
	.read-only-notice {
		margin-top: 1.5rem;
		padding: 1rem;
		background: #f8fafc;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		text-align: center;
	}

	.read-only-notice p {
		margin: 0;
		color: #6b7280;
		font-size: 0.875rem;
		font-style: italic;
	}

	/* Logout Section */
	.logout-section {
		text-align: center;
		margin-top: 2rem;
	}

	.logout-button {
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #dc2626, #b91c1c);
		color: white;
		border: none;
		border-radius: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		box-shadow: 0 4px 15px rgba(220,38,38,0.3);
	}

	.logout-button:hover:not(:disabled) {
		background: linear-gradient(135deg, #b91c1c, #991b1b);
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(220,38,38,0.4);
	}

	/* Mobile Responsive */
	@media (max-width: 768px) {
		.salesman-container {
			padding: 1rem;
		}

		.info-grid {
			grid-template-columns: 1fr;
		}

		.accounts-grid {
			grid-template-columns: 1fr;
		}

		.summary-stats {
			grid-template-columns: repeat(2, 1fr);
		}

		.nav-section {
			flex-direction: column;
			gap: 0.75rem;
		}
	}
</style>
