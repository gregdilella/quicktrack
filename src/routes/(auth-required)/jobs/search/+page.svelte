<!-- Job Search Page -->
<script lang="ts">
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { supabase } from '$lib/supabase'
	import { getCurrentUser } from '$lib/auth'
	import type { User } from '@supabase/supabase-js'

	let user: User | null = null
	let loading = false
	let jobs: any[] = []
	let totalJobs = 0
	let currentPage = 1
	let jobsPerPage = 10
	let searchQuery = ''
	let searchInput = ''
	let autocompleteResults: any[] = []
	let showAutocomplete = false
	let autocompleteLoading = false
	let searchTimeout: NodeJS.Timeout

	// Calculated values
	$: totalPages = Math.ceil(totalJobs / jobsPerPage)
	$: startIndex = (currentPage - 1) * jobsPerPage
	$: endIndex = Math.min(startIndex + jobsPerPage, totalJobs)

	onMount(async () => {
		user = await getCurrentUser()
		await loadJobs()
	})

	async function loadJobs() {
		try {
			loading = true
			
					// Get total count
		const { count } = await supabase
			.from('jobsfile')
			.select('*', { count: 'exact', head: true })
			.ilike('jobno', `%${searchQuery}%`)

		totalJobs = count || 0

		// Get jobs for current page
		const { data, error } = await supabase
			.from('jobsfile')
			.select('*')
			.ilike('jobno', `%${searchQuery}%`)
			.order('created_at', { ascending: false })
			.range(startIndex, startIndex + jobsPerPage - 1)

			if (error) {
				console.error('Error loading jobs:', error)
				return
			}

			jobs = data || []
		} catch (error) {
			console.error('Error:', error)
		} finally {
			loading = false
		}
	}

	async function searchAutocomplete(query: string) {
		if (!query.trim()) {
			autocompleteResults = []
			showAutocomplete = false
			return
		}

		try {
			autocompleteLoading = true
			
			const { data, error } = await supabase
				.from('jobsfile')
				.select('jobno, job_number, commodity, shipper_name, consignee_name, created_at')
				.or(`jobno.ilike.%${query}%,job_number.ilike.%${query}%,commodity.ilike.%${query}%,shipper_name.ilike.%${query}%,consignee_name.ilike.%${query}%`)
				.order('created_at', { ascending: false })
				.limit(8)

			if (error) {
				console.error('Autocomplete error:', error)
				return
			}

			autocompleteResults = data || []
			showAutocomplete = true
		} catch (error) {
			console.error('Autocomplete error:', error)
		} finally {
			autocompleteLoading = false
		}
	}

	function handleSearchInput(event: Event) {
		const target = event.target as HTMLInputElement
		searchInput = target.value
		
		// Clear previous timeout
		if (searchTimeout) {
			clearTimeout(searchTimeout)
		}
		
		// Debounce the autocomplete search
		searchTimeout = setTimeout(() => {
			searchAutocomplete(searchInput)
		}, 300)
	}

	function handleSearch() {
		searchQuery = searchInput.trim()
		currentPage = 1
		showAutocomplete = false
		loadJobs()
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleSearch()
		}
		if (event.key === 'Escape') {
			showAutocomplete = false
		}
	}

	function selectAutocompleteItem(item: any) {
		searchInput = item.jobno
		searchQuery = item.jobno
		showAutocomplete = false
		currentPage = 1
		loadJobs()
	}

	function goToPage(page: number) {
		currentPage = page
		loadJobs()
	}

	function clearSearch() {
		searchInput = ''
		searchQuery = ''
		showAutocomplete = false
		currentPage = 1
		loadJobs()
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString()
	}

	function highlightMatch(text: string, query: string) {
		if (!query.trim()) return text
		
		const regex = new RegExp(`(${query})`, 'gi')
		return text.replace(regex, '<mark>$1</mark>')
	}

	// Close autocomplete when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement
		if (!target.closest('.search-container')) {
			showAutocomplete = false
		}
	}

	onMount(() => {
		document.addEventListener('click', handleClickOutside)
		return () => document.removeEventListener('click', handleClickOutside)
	})
</script>

<svelte:head>
	<title>Job Search - CERTrack</title>
</svelte:head>

<div class="search-page-container">
	<div class="header">
		<div class="breadcrumb">
			<a href="/dashboard" class="breadcrumb-link">Dashboard</a>
			<span class="breadcrumb-separator">›</span>
			<span class="breadcrumb-current">Job Search</span>
		</div>
		
		<div class="header-actions">
			<button class="create-job-button" on:click={() => goto('/dashboard/operations/add-new-job')}>
				+ Create New Job
			</button>
		</div>
	</div>

	<div class="search-section">
		<h1 class="page-title">Job Search</h1>
		
		<div class="search-container">
			<div class="search-input-wrapper">
				<input
					type="text"
					class="search-input"
					placeholder="Search by job number, commodity, shipper, or consignee..."
					bind:value={searchInput}
					on:input={handleSearchInput}
					on:keydown={handleKeyPress}
				/>
				
				<div class="search-actions">
					{#if searchInput}
						<button class="clear-button" on:click={clearSearch}>
							✕
						</button>
					{/if}
					<button class="search-button" on:click={handleSearch}>
						🔍
					</button>
				</div>
			</div>

			{#if showAutocomplete}
				<div class="autocomplete-dropdown">
					{#if autocompleteLoading}
						<div class="autocomplete-loading">
							<div class="loading-spinner-small"></div>
							<span>Searching...</span>
						</div>
					{:else if autocompleteResults.length > 0}
						{#each autocompleteResults as result}
							<div class="autocomplete-item" on:click={() => selectAutocompleteItem(result)}>
								<div class="autocomplete-main">
									<span class="jobno">{@html highlightMatch(result.jobno, searchInput)}</span>
									<span class="commodity">{@html highlightMatch(result.commodity, searchInput)}</span>
								</div>
								<div class="autocomplete-sub">
									<span class="shipper">{@html highlightMatch(result.shipper_name, searchInput)}</span>
									<span class="arrow">→</span>
									<span class="consignee">{@html highlightMatch(result.consignee_name, searchInput)}</span>
								</div>
							</div>
						{/each}
					{:else}
						<div class="autocomplete-no-results">
							No jobs found matching "{searchInput}"
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>

	<div class="results-section">
		{#if loading}
			<div class="loading">
				<div class="loading-spinner"></div>
				<p>Loading jobs...</p>
			</div>
		{:else}
			<div class="results-header">
				<div class="results-info">
					{#if searchQuery}
						<h2>Search Results for "{searchQuery}"</h2>
						<p>Found {totalJobs} jobs • Page {currentPage} of {totalPages}</p>
					{:else}
						<h2>All Jobs</h2>
						<p>Total {totalJobs} jobs • Page {currentPage} of {totalPages}</p>
					{/if}
				</div>
				
				{#if totalJobs > 0}
					<div class="page-info">
						Showing {startIndex + 1}-{endIndex} of {totalJobs}
					</div>
				{/if}
			</div>

			{#if jobs.length > 0}
				<div class="jobs-grid">
					{#each jobs as job}
						<div class="job-card" on:click={() => goto(`/jobs/${job.jobno}`)}>
							<div class="job-card-header">
								<div class="job-number">{job.jobno}</div>
								<div class="job-date">{formatDate(job.created_at)}</div>
							</div>
							
							<div class="job-card-content">
								<div class="commodity">{job.commodity}</div>
								<div class="job-details">
									<span class="pieces">{job.pieces} pcs</span>
									<span class="weight">{job.weight} lbs</span>
									<span class="service-type">{job.service_type}</span>
								</div>
							</div>
							
							<div class="job-card-footer">
								<div class="route">
									<div class="shipper">{job.shipper_name}</div>
									<div class="arrow">→</div>
									<div class="consignee">{job.consignee_name}</div>
								</div>
								<div class="status">
									<span class="status-badge status-{job.status}">{job.status}</span>
								</div>
							</div>
						</div>
					{/each}
				</div>

				{#if totalPages > 1}
					<div class="pagination">
						<button
							class="pagination-button"
							class:disabled={currentPage === 1}
							on:click={() => goToPage(currentPage - 1)}
							disabled={currentPage === 1}
						>
							← Previous
						</button>
						
						<div class="page-numbers">
							{#each Array(totalPages) as _, i}
								{#if i + 1 === 1 || i + 1 === totalPages || Math.abs(i + 1 - currentPage) <= 2}
									<button
										class="page-number"
										class:active={i + 1 === currentPage}
										on:click={() => goToPage(i + 1)}
									>
										{i + 1}
									</button>
								{:else if i + 1 === currentPage - 3 || i + 1 === currentPage + 3}
									<span class="page-ellipsis">...</span>
								{/if}
							{/each}
						</div>
						
						<button
							class="pagination-button"
							class:disabled={currentPage === totalPages}
							on:click={() => goToPage(currentPage + 1)}
							disabled={currentPage === totalPages}
						>
							Next →
						</button>
					</div>
				{/if}
			{:else}
				<div class="no-results">
					<div class="no-results-icon">🔍</div>
					<h3>No jobs found</h3>
					{#if searchQuery}
						<p>No jobs match your search "{searchQuery}"</p>
						<button class="clear-search-button" on:click={clearSearch}>
							Clear Search
						</button>
					{:else}
						<p>No jobs have been created yet.</p>
						<button class="create-first-job-button" on:click={() => goto('/dashboard/operations/add-new-job')}>
							Create Your First Job
						</button>
					{/if}
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	.search-page-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 20px;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 30px;
		padding-bottom: 20px;
		border-bottom: 1px solid #e5e7eb;
	}

	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 14px;
	}

	.breadcrumb-link {
		color: #3b82f6;
		text-decoration: none;
	}

	.breadcrumb-link:hover {
		text-decoration: underline;
	}

	.breadcrumb-separator {
		color: #6b7280;
	}

	.breadcrumb-current {
		color: #374151;
		font-weight: 500;
	}

	.create-job-button {
		background: #16a34a;
		color: white;
		border: none;
		padding: 12px 20px;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.create-job-button:hover {
		background: #15803d;
		transform: translateY(-1px);
	}

	.search-section {
		margin-bottom: 40px;
	}

	.page-title {
		font-size: 32px;
		font-weight: 700;
		color: #1f2937;
		margin: 0 0 24px 0;
	}

	.search-container {
		position: relative;
		max-width: 600px;
	}

	.search-input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: 12px;
		overflow: hidden;
		transition: border-color 0.2s;
	}

	.search-input-wrapper:focus-within {
		border-color: #3b82f6;
	}

	.search-input {
		flex: 1;
		padding: 16px 20px;
		border: none;
		font-size: 16px;
		background: transparent;
		outline: none;
	}

	.search-input::placeholder {
		color: #9ca3af;
	}

	.search-actions {
		display: flex;
		align-items: center;
		padding: 0 8px;
	}

	.clear-button {
		background: none;
		border: none;
		color: #6b7280;
		cursor: pointer;
		padding: 8px;
		border-radius: 4px;
		font-size: 14px;
		transition: all 0.2s;
	}

	.clear-button:hover {
		color: #374151;
		background: #f3f4f6;
	}

	.search-button {
		background: #3b82f6;
		color: white;
		border: none;
		padding: 12px 16px;
		border-radius: 8px;
		cursor: pointer;
		font-size: 16px;
		margin-left: 8px;
		transition: all 0.2s;
	}

	.search-button:hover {
		background: #2563eb;
	}

	.autocomplete-dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
		z-index: 10;
		max-height: 400px;
		overflow-y: auto;
		margin-top: 4px;
	}

	.autocomplete-loading {
		padding: 16px;
		display: flex;
		align-items: center;
		gap: 12px;
		color: #6b7280;
	}

	.loading-spinner-small {
		width: 16px;
		height: 16px;
		border: 2px solid #e5e7eb;
		border-top: 2px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	.autocomplete-item {
		padding: 12px 16px;
		cursor: pointer;
		border-bottom: 1px solid #f3f4f6;
		transition: background-color 0.2s;
	}

	.autocomplete-item:hover {
		background: #f8fafc;
	}

	.autocomplete-item:last-child {
		border-bottom: none;
	}

	.autocomplete-main {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 4px;
	}

	.autocomplete-main .jobno {
		font-weight: 600;
		color: #dc2626;
	}

	.autocomplete-main .commodity {
		color: #374151;
	}

	.autocomplete-sub {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 12px;
		color: #6b7280;
	}

	.autocomplete-sub .arrow {
		color: #9ca3af;
	}

	.autocomplete-no-results {
		padding: 16px;
		text-align: center;
		color: #6b7280;
		font-style: italic;
	}

	.results-section {
		min-height: 400px;
	}

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 80px 20px;
		color: #6b7280;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 3px solid #e5e7eb;
		border-top: 3px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 16px;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.results-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24px;
	}

	.results-info h2 {
		font-size: 24px;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 4px 0;
	}

	.results-info p {
		color: #6b7280;
		margin: 0;
	}

	.page-info {
		color: #6b7280;
		font-size: 14px;
	}

	.jobs-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
		gap: 20px;
		margin-bottom: 40px;
	}

	.job-card {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 20px;
		cursor: pointer;
		transition: all 0.2s;
		position: relative;
		overflow: hidden;
	}

	.job-card:hover {
		border-color: #3b82f6;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.job-card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}

	.job-number {
		font-size: 18px;
		font-weight: 700;
		color: #dc2626;
	}

	.job-date {
		font-size: 12px;
		color: #6b7280;
	}

	.job-card-content {
		margin-bottom: 16px;
	}

	.commodity {
		font-size: 16px;
		font-weight: 500;
		color: #1f2937;
		margin-bottom: 8px;
	}

	.job-details {
		display: flex;
		gap: 12px;
		font-size: 12px;
		color: #6b7280;
	}

	.job-details span {
		background: #f3f4f6;
		padding: 4px 8px;
		border-radius: 4px;
	}

	.job-card-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.route {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 12px;
		color: #374151;
		flex: 1;
		min-width: 0;
	}

	.shipper, .consignee {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 120px;
	}

	.arrow {
		color: #9ca3af;
		flex-shrink: 0;
	}

	.status-badge {
		padding: 4px 8px;
		border-radius: 12px;
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.status-pending {
		background: #fef3c7;
		color: #d97706;
	}

	.status-completed {
		background: #d1fae5;
		color: #065f46;
	}

	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 8px;
		margin-top: 40px;
	}

	.pagination-button {
		background: white;
		border: 1px solid #e5e7eb;
		color: #374151;
		padding: 8px 16px;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.pagination-button:hover:not(.disabled) {
		background: #f3f4f6;
		border-color: #d1d5db;
	}

	.pagination-button.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.page-numbers {
		display: flex;
		gap: 4px;
		margin: 0 16px;
	}

	.page-number {
		background: white;
		border: 1px solid #e5e7eb;
		color: #374151;
		padding: 8px 12px;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
		min-width: 40px;
	}

	.page-number:hover {
		background: #f3f4f6;
		border-color: #d1d5db;
	}

	.page-number.active {
		background: #3b82f6;
		color: white;
		border-color: #3b82f6;
	}

	.page-ellipsis {
		padding: 8px 4px;
		color: #6b7280;
	}

	.no-results {
		text-align: center;
		padding: 80px 20px;
		color: #6b7280;
	}

	.no-results-icon {
		font-size: 48px;
		margin-bottom: 16px;
	}

	.no-results h3 {
		font-size: 20px;
		color: #374151;
		margin: 0 0 8px 0;
	}

	.no-results p {
		margin: 0 0 24px 0;
	}

	.clear-search-button, .create-first-job-button {
		background: #3b82f6;
		color: white;
		border: none;
		padding: 12px 24px;
		border-radius: 8px;
		font-size: 16px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.clear-search-button:hover, .create-first-job-button:hover {
		background: #2563eb;
	}

	/* Highlight search matches */
	:global(mark) {
		background: #fef3c7;
		color: #d97706;
		padding: 0 2px;
		border-radius: 2px;
	}

	@media (max-width: 768px) {
		.search-page-container {
			padding: 12px;
		}

		.header {
			flex-direction: column;
			gap: 16px;
			align-items: flex-start;
		}

		.page-title {
			font-size: 24px;
		}

		.jobs-grid {
			grid-template-columns: 1fr;
		}

		.job-card {
			padding: 16px;
		}

		.results-header {
			flex-direction: column;
			gap: 12px;
			align-items: flex-start;
		}

		.pagination {
			flex-wrap: wrap;
			gap: 4px;
		}

		.page-numbers {
			margin: 0 8px;
		}

		.search-container {
			max-width: 100%;
		}
	}
</style> 