<svelte:head>
	<title>Job Search - Certus Freight</title>
</svelte:head>

<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getCurrentCustomerJobs, searchCustomerJobs } from '$lib/services/customerService';
	import type { JobsFile } from '$lib/services/customerService';

	let jobs: JobsFile[] = [];
	let filteredJobs: JobsFile[] = [];
	let loading = true;
	let searching = false;
	let searchTerm = '';
	let selectedStatus = '';
	let selectedServiceType = '';
	let sortBy = 'created_at';
	let sortOrder: 'asc' | 'desc' = 'desc';

	// Status options for filtering
	const statusOptions = ['New', 'Assigned', 'In Transit', 'Delivered', 'Completed', 'Cancelled'];
	const serviceTypeOptions = ['Express', 'Standard', 'Economy', 'Overnight', 'Same Day'];

	onMount(async () => {
		await loadJobs();
	});

	async function loadJobs() {
		loading = true;
		try {
			jobs = await getCurrentCustomerJobs();
			applyFilters();
		} catch (error) {
			console.error('Error loading jobs:', error);
		} finally {
			loading = false;
		}
	}

	async function handleSearch() {
		if (!searchTerm.trim()) {
			await loadJobs();
			return;
		}

		searching = true;
		try {
			jobs = await searchCustomerJobs(searchTerm.trim());
			applyFilters();
		} catch (error) {
			console.error('Error searching jobs:', error);
		} finally {
			searching = false;
		}
	}

	function applyFilters() {
		filteredJobs = jobs.filter(job => {
			// Status filter
			if (selectedStatus && job.status !== selectedStatus) {
				return false;
			}
			
			// Service type filter
			if (selectedServiceType && job.service_type !== selectedServiceType) {
				return false;
			}
			
			return true;
		});

		// Apply sorting
		filteredJobs.sort((a, b) => {
			let aValue, bValue;
			
			switch (sortBy) {
				case 'created_at':
					aValue = new Date(a.created_at || '').getTime();
					bValue = new Date(b.created_at || '').getTime();
					break;
				case 'jobnumber':
					aValue = a.jobnumber || '';
					bValue = b.jobnumber || '';
					break;
				case 'commodity':
					aValue = a.commodity || '';
					bValue = b.commodity || '';
					break;
				case 'status':
					aValue = a.status || '';
					bValue = b.status || '';
					break;
				default:
					return 0;
			}
			
			if (sortOrder === 'asc') {
				return aValue > bValue ? 1 : -1;
			} else {
				return aValue < bValue ? 1 : -1;
			}
		});
	}

	function clearFilters() {
		searchTerm = '';
		selectedStatus = '';
		selectedServiceType = '';
		loadJobs();
	}

	function formatDate(dateString: string | null): string {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function getStatusColor(status: string | null): string {
		switch (status) {
			case 'New': return '#3b82f6';
			case 'Assigned': return '#f59e0b';
			case 'In Transit': return '#8b5cf6';
			case 'Delivered': return '#10b981';
			case 'Completed': return '#059669';
			case 'Cancelled': return '#ef4444';
			default: return '#6b7280';
		}
	}

	function viewJobDetails(jobNumber: string) {
		goto(`/jobs/${jobNumber}`);
	}

	// Reactive statements for filtering
	$: {
		applyFilters();
	}
</script>

<div class="page-container">
	<!-- Header -->
	<div class="page-header">
		<h1>Job Search</h1>
		<p>Search and track all your shipments</p>
	</div>

	<!-- Search and Filters -->
	<div class="search-section">
		<div class="search-bar">
			<div class="search-input-group">
				<svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
				</svg>
				<input 
					type="text" 
					placeholder="Search by job number, commodity, shipper, or consignee..." 
					bind:value={searchTerm}
					on:keydown={(e) => e.key === 'Enter' && handleSearch()}
					class="search-input"
				/>
				<button 
					on:click={handleSearch} 
					disabled={searching}
					class="search-button"
				>
					{#if searching}
						<div class="spinner"></div>
					{:else}
						Search
					{/if}
				</button>
			</div>
		</div>

		<!-- Filters -->
		<div class="filters-section">
			<div class="filters-grid">
				<div class="filter-group">
					<label for="status-filter">Status</label>
					<select id="status-filter" bind:value={selectedStatus}>
						<option value="">All Statuses</option>
						{#each statusOptions as status}
							<option value={status}>{status}</option>
						{/each}
					</select>
				</div>

				<div class="filter-group">
					<label for="service-filter">Service Type</label>
					<select id="service-filter" bind:value={selectedServiceType}>
						<option value="">All Services</option>
						{#each serviceTypeOptions as serviceType}
							<option value={serviceType}>{serviceType}</option>
						{/each}
					</select>
				</div>

				<div class="filter-group">
					<label for="sort-filter">Sort By</label>
					<select id="sort-filter" bind:value={sortBy}>
						<option value="created_at">Date Created</option>
						<option value="jobnumber">Job Number</option>
						<option value="commodity">Commodity</option>
						<option value="status">Status</option>
					</select>
				</div>

				<div class="filter-group">
					<label for="order-filter">Order</label>
					<select id="order-filter" bind:value={sortOrder}>
						<option value="desc">Newest First</option>
						<option value="asc">Oldest First</option>
					</select>
				</div>
			</div>

			<div class="filter-actions">
				<button on:click={clearFilters} class="clear-filters-btn">
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
					</svg>
					Clear Filters
				</button>
			</div>
		</div>
	</div>

	<!-- Results Section -->
	<div class="results-section">
		{#if loading}
			<div class="loading-container">
				<div class="spinner large"></div>
				<p>Loading your jobs...</p>
			</div>
		{:else}
			<!-- Results Header -->
			<div class="results-header">
				<p class="results-count">
					{filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
				</p>
				{#if searchTerm}
					<p class="search-info">
						Searching for: <strong>"{searchTerm}"</strong>
					</p>
				{/if}
			</div>

			<!-- Jobs List -->
			{#if filteredJobs.length === 0}
				<div class="no-results">
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
					</svg>
					<h3>No jobs found</h3>
					<p>Try adjusting your search criteria or create a new job to get started.</p>
					<a href="/dashboard/customer/new-job" class="create-job-btn">
						Create New Job
					</a>
				</div>
			{:else}
				<div class="jobs-grid">
					{#each filteredJobs as job}
						<div class="job-card" on:click={() => viewJobDetails(job.jobnumber)} on:keydown={(e) => e.key === 'Enter' && viewJobDetails(job.jobnumber)} tabindex="0" role="button">
							<div class="job-header">
								<div class="job-number">
									<strong>{job.jobno}</strong>
								</div>
								<div class="job-status" style="background-color: {getStatusColor(job.status)};">
									{job.status || 'Unknown'}
								</div>
							</div>

							<div class="job-details">
								<div class="job-detail">
									<span class="detail-label">Commodity:</span>
									<span class="detail-value">{job.commodity || 'N/A'}</span>
								</div>

								<div class="job-detail">
									<span class="detail-label">Service:</span>
									<span class="detail-value">{job.service_type || 'N/A'}</span>
								</div>

								{#if job.pieces}
									<div class="job-detail">
										<span class="detail-label">Pieces:</span>
										<span class="detail-value">{job.pieces}</span>
									</div>
								{/if}

								{#if job.weight}
									<div class="job-detail">
										<span class="detail-label">Weight:</span>
										<span class="detail-value">{job.weight} {job.weight_unit || 'kg'}</span>
									</div>
								{/if}

								<div class="job-detail">
									<span class="detail-label">From:</span>
									<span class="detail-value">{job.shipper_city || 'N/A'}, {job.shipper_state || 'N/A'}</span>
								</div>

								<div class="job-detail">
									<span class="detail-label">To:</span>
									<span class="detail-value">{job.consignee_city || 'N/A'}, {job.consignee_state || 'N/A'}</span>
								</div>

								<div class="job-detail">
									<span class="detail-label">Created:</span>
									<span class="detail-value">{formatDate(job.created_at)}</span>
								</div>
							</div>

							<div class="job-actions">
								<button class="view-details-btn">
									<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
									</svg>
									View Details
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	.page-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.page-header {
		text-align: center;
		margin-bottom: 2rem;
		padding: 2rem;
		background: white;
		border-radius: 16px;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
		border: 1px solid rgba(0, 0, 0, 0.05);
	}

	.page-header h1 {
		font-size: 2.5rem;
		font-weight: 700;
		margin: 0 0 1rem 0;
		color: #34547a;
	}

	.page-header p {
		font-size: 1.125rem;
		color: #6b7280;
		margin: 0;
	}

	/* Search Section */
	.search-section {
		background: white;
		border-radius: 16px;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
		border: 1px solid rgba(0, 0, 0, 0.05);
		padding: 2rem;
		margin-bottom: 2rem;
	}

	.search-bar {
		margin-bottom: 1.5rem;
	}

	.search-input-group {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: #f9fafb;
		border: 1px solid #d1d5db;
		border-radius: 12px;
		padding: 0.75rem;
	}

	.search-icon {
		width: 20px;
		height: 20px;
		color: #6b7280;
		flex-shrink: 0;
	}

	.search-input {
		flex: 1;
		border: none;
		background: transparent;
		outline: none;
		font-size: 0.875rem;
		padding: 0.5rem;
	}

	.search-button {
		background: #34547a;
		color: white;
		border: none;
		border-radius: 8px;
		padding: 0.75rem 1.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 100px;
		justify-content: center;
	}

	.search-button:hover:not(:disabled) {
		background: #5a7fb8;
		transform: translateY(-1px);
	}

	.search-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	/* Filters */
	.filters-section {
		border-top: 1px solid #f3f4f6;
		padding-top: 1.5rem;
	}

	.filters-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
	}

	.filter-group label {
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
		margin-bottom: 0.5rem;
	}

	.filter-group select {
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 0.875rem;
		background: white;
		cursor: pointer;
	}

	.filter-group select:focus {
		outline: none;
		border-color: #34547a;
		box-shadow: 0 0 0 3px rgba(52, 84, 122, 0.1);
	}

	.filter-actions {
		display: flex;
		justify-content: flex-end;
	}

	.clear-filters-btn {
		background: #f3f4f6;
		color: #374151;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		padding: 0.75rem 1rem;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.clear-filters-btn:hover {
		background: #e5e7eb;
	}

	.clear-filters-btn svg {
		width: 16px;
		height: 16px;
	}

	/* Results Section */
	.results-section {
		background: white;
		border-radius: 16px;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
		border: 1px solid rgba(0, 0, 0, 0.05);
		padding: 2rem;
	}

	.results-header {
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #f3f4f6;
	}

	.results-count {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 0.5rem 0;
	}

	.search-info {
		font-size: 0.875rem;
		color: #6b7280;
		margin: 0;
	}

	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 3rem;
	}

	.spinner {
		width: 20px;
		height: 20px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top: 2px solid currentColor;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	.spinner.large {
		width: 40px;
		height: 40px;
		border: 4px solid #f3f4f6;
		border-top: 4px solid #34547a;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	/* No Results */
	.no-results {
		text-align: center;
		padding: 3rem;
	}

	.no-results svg {
		width: 64px;
		height: 64px;
		color: #d1d5db;
		margin-bottom: 1rem;
	}

	.no-results h3 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 0.5rem 0;
	}

	.no-results p {
		color: #6b7280;
		margin: 0 0 1.5rem 0;
	}

	.create-job-btn {
		background: #34547a;
		color: white;
		padding: 0.875rem 2rem;
		border-radius: 8px;
		text-decoration: none;
		font-weight: 600;
		display: inline-block;
		transition: all 0.2s ease;
	}

	.create-job-btn:hover {
		background: #5a7fb8;
		transform: translateY(-1px);
	}

	/* Jobs Grid */
	.jobs-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
		gap: 1.5rem;
	}

	.job-card {
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 1.5rem;
		transition: all 0.2s ease;
		cursor: pointer;
		background: white;
	}

	.job-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
		border-color: #34547a;
	}

	.job-card:focus {
		outline: none;
		border-color: #34547a;
		box-shadow: 0 0 0 3px rgba(52, 84, 122, 0.1);
	}

	.job-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #f3f4f6;
	}

	.job-number {
		font-size: 1.125rem;
		color: #1f2937;
	}

	.job-status {
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.job-details {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.job-detail {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.detail-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: #6b7280;
		text-transform: uppercase;
	}

	.detail-value {
		font-size: 0.875rem;
		color: #1f2937;
		font-weight: 500;
	}

	.job-actions {
		display: flex;
		justify-content: flex-end;
	}

	.view-details-btn {
		background: #34547a;
		color: white;
		border: none;
		border-radius: 8px;
		padding: 0.75rem 1rem;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.view-details-btn:hover {
		background: #5a7fb8;
		transform: translateY(-1px);
	}

	.view-details-btn svg {
		width: 16px;
		height: 16px;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.page-container {
			padding: 1rem;
		}

		.filters-grid {
			grid-template-columns: 1fr;
		}

		.jobs-grid {
			grid-template-columns: 1fr;
		}

		.job-details {
			grid-template-columns: 1fr;
		}

		.search-input-group {
			flex-direction: column;
			gap: 1rem;
		}

		.search-button {
			width: 100%;
		}
	}
</style> 