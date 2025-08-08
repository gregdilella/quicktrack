<!-- Job Search - Operations -->
<script lang="ts">
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { supabase } from '$lib/supabase'
	import { getCurrentUser } from '$lib/auth'
	import type { User } from '@supabase/supabase-js'
	
	let user: User | null = null
	let loading = false
	let searchLoading = false
	let error = ''

	// All jobs and filtered jobs
	let allJobs: any[] = []
	let filteredJobs: any[] = []
	
	// Search parameters
	let searchQuery = ''
	let statusFilter = ''
	let dateFromFilter = ''
	let dateToFilter = ''

	onMount(async () => {
		user = await getCurrentUser()
		await loadJobs()
	})

	async function loadJobs() {
		try {
			loading = true
			error = ''
			
			const { data, error: fetchError } = await supabase
				.from('jobsfile')
				.select('*')
				.order('created_at', { ascending: false })
				.limit(100) // Load most recent 100 jobs

			if (fetchError) {
				console.error('Error fetching jobs:', fetchError)
				error = 'Failed to load jobs from database'
				return
			}

			allJobs = data || []
			filteredJobs = allJobs
			
		} catch (err) {
			console.error('Error loading jobs:', err)
			error = 'An unexpected error occurred while loading jobs'
		} finally {
			loading = false
		}
	}

	function handleSearch() {
		searchLoading = true
		
		// Filter jobs based on search criteria
		filteredJobs = allJobs.filter(job => {
			// Text search across multiple fields
			if (searchQuery) {
				const query = searchQuery.toLowerCase()
				const searchableText = [
					job.jobno,
					job.job_number,
					job.shipper_name,
					job.consignee_name,
					job.commodity,
					job.bol_number,
					job.po_number
				].filter(Boolean).join(' ').toLowerCase()
				
				if (!searchableText.includes(query)) {
					return false
				}
			}
			
			// Status filter
			if (statusFilter && job.status !== statusFilter) {
				return false
			}
			
			// Date range filter
			if (dateFromFilter && job.created_at) {
				const jobDate = new Date(job.created_at)
				const fromDate = new Date(dateFromFilter)
				if (jobDate < fromDate) {
					return false
				}
			}
			
			if (dateToFilter && job.created_at) {
				const jobDate = new Date(job.created_at)
				const toDate = new Date(dateToFilter)
				toDate.setHours(23, 59, 59) // Include the entire day
				if (jobDate > toDate) {
					return false
				}
			}
			
			return true
		})
		
		searchLoading = false
	}

	function clearSearch() {
		searchQuery = ''
		statusFilter = ''
		dateFromFilter = ''
		dateToFilter = ''
		filteredJobs = allJobs
	}

	function viewJob(jobno: string) {
		goto(`/dashboard/operations/jobs/${jobno}`)
	}

	function formatDate(dateString: string | null) {
		if (!dateString) return 'N/A'
		return new Date(dateString).toLocaleDateString()
	}

	function getStatusBadgeClass(status: string | null) {
		if (!status) return 'status-pending'
		switch (status.toLowerCase()) {
			case 'completed':
			case 'delivered':
				return 'status-completed'
			case 'active':
			case 'in_transit':
				return 'status-active'
			case 'cancelled':
				return 'status-cancelled'
			default:
				return 'status-pending'
		}
	}

	// Reactive search - filter as user types
	$: if (searchQuery !== undefined) {
		handleSearch()
	}
</script>

<div class="jobsearch-container">
	<div class="main-content">
		<!-- Page Header -->
		<div class="page-header">
			<div class="header-content">
				<h1 class="page-title">Job Search</h1>
				<p class="page-subtitle">Search and manage operations jobs</p>
			</div>
			<div class="header-actions">
				<button class="action-button secondary" on:click={() => goto('/dashboard/operations')}>
					🏢 Operations Dashboard
				</button>
				<button class="action-button secondary" on:click={() => goto('/dashboard/operations/add-new-job')}>
					➕ Add New Job
				</button>
			</div>
		</div>

		<!-- Search Filters -->
		<div class="search-section">
			<div class="search-header">
				<h2 class="section-title">Search & Filter Jobs</h2>
				<div class="results-count">
					{#if loading}
						<span class="loading-text">Loading...</span>
					{:else}
						<span class="count-text">
							Showing {filteredJobs.length} of {allJobs.length} jobs
						</span>
					{/if}
				</div>
			</div>
			
			<div class="search-controls">
				<div class="search-row">
					<div class="search-field">
						<label for="search-query">Search Jobs</label>
						<input 
							id="search-query"
							type="text" 
							bind:value={searchQuery} 
							placeholder="Search by job number, customer, commodity..." 
							class="search-input"
						/>
					</div>
					<div class="filter-field">
						<label for="status-filter">Status</label>
						<select id="status-filter" bind:value={statusFilter} class="filter-select">
							<option value="">All Statuses</option>
							<option value="pending">Pending</option>
							<option value="active">Active</option>
							<option value="completed">Completed</option>
							<option value="cancelled">Cancelled</option>
						</select>
					</div>
				</div>
				
				<div class="search-row">
					<div class="filter-field">
						<label for="date-from">From Date</label>
						<input 
							id="date-from"
							type="date" 
							bind:value={dateFromFilter} 
							class="date-input"
						/>
					</div>
					<div class="filter-field">
						<label for="date-to">To Date</label>
						<input 
							id="date-to"
							type="date" 
							bind:value={dateToFilter} 
							class="date-input"
						/>
					</div>
					<div class="filter-actions">
						<button type="button" on:click={clearSearch} class="clear-button">
							Clear Filters
						</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Jobs Results -->
		{#if loading}
			<div class="loading-section">
				<div class="loading-spinner"></div>
				<p>Loading jobs from database...</p>
			</div>
		{:else if error}
			<div class="error-section">
				<div class="error-icon">⚠️</div>
				<h3>Error Loading Jobs</h3>
				<p>{error}</p>
				<button class="retry-button" on:click={loadJobs}>
					Try Again
				</button>
			</div>
		{:else if filteredJobs.length === 0}
			<div class="empty-section">
				<div class="empty-icon">📋</div>
				<h3>No Jobs Found</h3>
				<p>
					{#if allJobs.length === 0}
						No jobs have been created yet.
					{:else}
						No jobs match your search criteria.
					{/if}
				</p>
				{#if allJobs.length === 0}
					<button class="action-button primary" on:click={() => goto('/dashboard/operations/add-new-job')}>
						Create First Job
					</button>
				{:else}
					<button class="action-button secondary" on:click={clearSearch}>
						Clear Filters
					</button>
				{/if}
			</div>
		{:else}
			<div class="jobs-section">
				<div class="jobs-grid">
					{#each filteredJobs as job}
						<div class="job-card" 
							on:click={() => viewJob(job.jobno)} 
							on:keydown={(e) => e.key === 'Enter' && viewJob(job.jobno)}
							role="button" 
							tabindex="0">
							<div class="job-card-header">
								<div class="job-number">{job.jobno || job.job_number}</div>
								<div class="job-status">
									<span class="status-badge {getStatusBadgeClass(job.status)}">
										{job.status || 'Pending'}
									</span>
								</div>
							</div>
							
							<div class="job-card-content">
								<div class="job-info-row">
									<div class="job-info-item">
										<span class="label">Commodity:</span>
										<span class="value">{job.commodity || 'Not specified'}</span>
									</div>
								</div>
								
								<div class="job-locations">
									<div class="location-item">
										<span class="location-label">From:</span>
										<span class="location-value">
											{job.shipper_name || 'Not specified'}
											{#if job.shipper_city}
												<br><small>{job.shipper_city}{job.shipper_state ? `, ${job.shipper_state}` : ''}</small>
											{/if}
										</span>
									</div>
									<div class="location-arrow">→</div>
									<div class="location-item">
										<span class="location-label">To:</span>
										<span class="location-value">
											{job.consignee_name || 'Not specified'}
											{#if job.consignee_city}
												<br><small>{job.consignee_city}{job.consignee_state ? `, ${job.consignee_state}` : ''}</small>
											{/if}
										</span>
									</div>
								</div>
								
								<div class="job-meta">
									<div class="meta-item">
										<span class="meta-label">Created:</span>
										<span class="meta-value">{formatDate(job.created_at)}</span>
									</div>
									{#if job.pieces}
										<div class="meta-item">
											<span class="meta-label">Pieces:</span>
											<span class="meta-value">{job.pieces}</span>
										</div>
									{/if}
									{#if job.weight}
										<div class="meta-item">
											<span class="meta-label">Weight:</span>
											<span class="meta-value">{job.weight} lbs</span>
										</div>
									{/if}
								</div>
							</div>
							
							<div class="job-card-footer">
								<button class="view-button" on:click|stopPropagation={() => viewJob(job.jobno)}>
									View Details →
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

	</div>
</div>

<style>
	.jobsearch-container {
		min-height: 100vh;
		background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		padding: 2rem;
	}

	.main-content {
		max-width: 1400px;
		margin: 0 auto;
	}

	/* Page Header */
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		padding: 2rem;
		background: white;
		border-radius: 20px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
	}

	.header-content {
		flex: 1;
	}

	.page-title {
		font-size: 2.5rem;
		font-weight: 700;
		color: #1f2937;
		margin: 0 0 0.5rem 0;
		background: linear-gradient(45deg, #ea580c, #dc2626);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.page-subtitle {
		color: #6b7280;
		margin: 0;
		font-size: 1.1rem;
	}

	.header-actions {
		display: flex;
		gap: 1rem;
	}

	.action-button {
		padding: 0.875rem 1.5rem;
		border-radius: 12px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		border: 1px solid;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.action-button.primary {
		background: #ea580c;
		color: white;
		border-color: #ea580c;
		box-shadow: 0 2px 10px rgba(234, 88, 12, 0.3);
	}

	.action-button.primary:hover {
		background: #dc2626;
		transform: translateY(-2px);
		box-shadow: 0 4px 15px rgba(234, 88, 12, 0.4);
	}

	.action-button.secondary {
		background: white;
		color: #6b7280;
		border-color: #e5e7eb;
	}

	.action-button.secondary:hover {
		background: #fff7ed;
		color: #ea580c;
		border-color: #ea580c;
		transform: translateY(-1px);
	}

	/* Search Section */
	.search-section {
		margin-bottom: 2rem;
		background: white;
		border-radius: 20px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
		padding: 2rem;
	}

	.search-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.section-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0;
	}

	.results-count {
		font-size: 0.875rem;
		color: #6b7280;
	}

	.loading-text {
		color: #ea580c;
		font-weight: 500;
	}

	.count-text {
		background: #fff7ed;
		color: #ea580c;
		padding: 0.5rem 1rem;
		border-radius: 20px;
		font-weight: 500;
	}

	.search-controls {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.search-row {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 1.5rem;
		align-items: end;
	}

	.search-row:last-child {
		grid-template-columns: 1fr 1fr 1fr;
	}

	.search-field, .filter-field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.search-field label, .filter-field label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
	}

	.search-input, .filter-select, .date-input {
		padding: 0.75rem 1rem;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		font-size: 0.875rem;
		transition: all 0.2s ease;
		background: white;
	}

	.search-input:focus, .filter-select:focus, .date-input:focus {
		outline: none;
		border-color: #ea580c;
		box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.1);
	}

	.filter-actions {
		display: flex;
		align-items: end;
	}

	.clear-button {
		padding: 0.75rem 1.5rem;
		background: #6b7280;
		color: white;
		border: none;
		border-radius: 12px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.clear-button:hover {
		background: #4b5563;
		transform: translateY(-1px);
	}

	/* Loading, Error, Empty States */
	.loading-section, .error-section, .empty-section {
		text-align: center;
		padding: 4rem 2rem;
		background: white;
		border-radius: 20px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
	}

	.loading-spinner {
		width: 48px;
		height: 48px;
		border: 4px solid #f3f4f6;
		border-top: 4px solid #ea580c;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 1.5rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.error-icon, .empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.error-section h3, .empty-section h3 {
		color: #1f2937;
		margin: 0 0 1rem 0;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.error-section p, .empty-section p {
		color: #6b7280;
		margin: 0 0 2rem 0;
		font-size: 1rem;
	}

	.retry-button {
		background: #ea580c;
		color: white;
		border: none;
		border-radius: 12px;
		padding: 0.875rem 2rem;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.retry-button:hover {
		background: #dc2626;
		transform: translateY(-2px);
	}

	/* Jobs Grid */
	.jobs-section {
		background: white;
		border-radius: 20px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
		padding: 2rem;
	}

	.jobs-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
		gap: 1.5rem;
	}

	.job-card {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 15px;
		padding: 1.5rem;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
	}

	.job-card:hover {
		transform: translateY(-3px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
		border-color: #ea580c;
	}

	.job-card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #f3f4f6;
	}

	.job-number {
		font-size: 1.1rem;
		font-weight: 600;
		color: #1f2937;
	}

	.status-badge {
		padding: 0.5rem 1rem;
		border-radius: 20px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.status-pending {
		background: #fef3c7;
		color: #d97706;
	}

	.status-completed {
		background: #d1fae5;
		color: #065f46;
	}

	.status-active {
		background: #dbeafe;
		color: #1d4ed8;
	}

	.status-cancelled {
		background: #fee2e2;
		color: #dc2626;
	}

	.job-card-content {
		margin-bottom: 1.5rem;
	}

	.job-info-row {
		margin-bottom: 1rem;
	}

	.job-info-item {
		display: flex;
		gap: 0.5rem;
	}

	.job-info-item .label {
		font-weight: 500;
		color: #6b7280;
		min-width: 80px;
	}

	.job-info-item .value {
		color: #1f2937;
		font-weight: 500;
	}

	.job-locations {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		gap: 1rem;
		align-items: center;
		margin: 1rem 0;
		padding: 1rem;
		background: #f9fafb;
		border-radius: 12px;
	}

	.location-item {
		text-align: center;
	}

	.location-label {
		font-size: 0.75rem;
		color: #6b7280;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.location-value {
		font-size: 0.875rem;
		color: #1f2937;
		font-weight: 500;
		margin-top: 0.25rem;
		display: block;
	}

	.location-arrow {
		color: #ea580c;
		font-size: 1.5rem;
		font-weight: bold;
	}

	.job-meta {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		margin-top: 1rem;
	}

	.meta-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.meta-label {
		font-size: 0.75rem;
		color: #6b7280;
		font-weight: 500;
	}

	.meta-value {
		font-size: 0.875rem;
		color: #1f2937;
		font-weight: 500;
	}

	.job-card-footer {
		border-top: 1px solid #f3f4f6;
		padding-top: 1rem;
	}

	.view-button {
		width: 100%;
		background: #ea580c;
		color: white;
		border: none;
		border-radius: 12px;
		padding: 0.75rem 1.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.view-button:hover {
		background: #dc2626;
		transform: translateY(-1px);
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.jobsearch-container {
			padding: 1rem;
		}

		.page-header {
			flex-direction: column;
			gap: 1.5rem;
			align-items: stretch;
		}

		.header-actions {
			justify-content: center;
		}

		.page-title {
			font-size: 2rem;
		}

		.search-row {
			grid-template-columns: 1fr;
		}

		.jobs-grid {
			grid-template-columns: 1fr;
		}

		.job-locations {
			grid-template-columns: 1fr;
			text-align: center;
		}

		.location-arrow {
			transform: rotate(90deg);
		}
	}

	/* Global styles */
	:global(body) {
		background-color: #f8fafc;
	}
</style> 