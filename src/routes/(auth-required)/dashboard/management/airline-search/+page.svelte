<!-- Airline Search - Management -->
<script lang="ts">
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { getCurrentUser, signOut } from '$lib/auth'
	import { getCurrentUserProfile } from '$lib/userService'
	import { supabase } from '$lib/supabase'
	import type { User } from '@supabase/supabase-js'
	import type { UserProfile } from '$lib/types'
	
	let user: User | null = null
	let userProfile: UserProfile | null = null
	let loading = false
	let searching = false
	let searchQuery = ''
	let airlines: any[] = []
	let filteredAirlines: any[] = []
	let currentPage = 1
	let airlinesPerPage = 20
	let totalAirlines = 0
	let totalPages = 0
	let paginatedAirlines: any[] = []
	
	onMount(async () => {
		user = await getCurrentUser()
		if (user) {
			try {
				userProfile = await getCurrentUserProfile()
				await loadAirlines()
			} catch (error) {
				console.error('Error loading user profile:', error)
			}
		}
	})

	async function loadAirlines() {
		try {
			searching = true
			const { data, error } = await supabase
				.from('airlines')
				.select('*')
				.not('airline_name', 'is', null)
				.neq('airline_name', '')
				.order('created_at', { ascending: false })
			
			if (error) {
				console.error('Error loading airlines:', error)
				return
			}
			
			airlines = data || []
			filteredAirlines = airlines
			updatePagination()
		} catch (err) {
			console.error('Error in loadAirlines:', err)
		} finally {
			searching = false
		}
	}

	function handleSearch() {
		if (!searchQuery.trim()) {
			filteredAirlines = airlines
		} else {
			const query = searchQuery.toLowerCase().trim()
			filteredAirlines = airlines.filter(airline => 
				airline.airline_name?.toLowerCase().includes(query) ||
				airline.airline_code?.toLowerCase().includes(query) ||
				airline.contact_email?.toLowerCase().includes(query) ||
				airline.phone?.toLowerCase().includes(query)
			)
		}
		currentPage = 1 // Reset to first page when searching
		updatePagination()
	}

	function updatePagination() {
		totalAirlines = filteredAirlines.length
		totalPages = Math.ceil(totalAirlines / airlinesPerPage)
		
		// Ensure current page is valid
		if (currentPage > totalPages && totalPages > 0) {
			currentPage = totalPages
		}
		
		// Calculate paginated results
		const startIndex = (currentPage - 1) * airlinesPerPage
		const endIndex = startIndex + airlinesPerPage
		paginatedAirlines = filteredAirlines.slice(startIndex, endIndex)
	}

	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages) {
			currentPage = page
			updatePagination()
		}
	}

	function handleAirlineClick(airlineId: number) {
		// For now, just log the click - you can implement airline detail view later
		console.log('Airline clicked:', airlineId)
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

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString()
	}

	// Reactive search and pagination
	$: if (searchQuery !== undefined) {
		handleSearch()
	}

	// Generate page numbers for pagination
	function getPageNumbers() {
		const pages = []
		const maxVisible = 5
		
		if (totalPages <= maxVisible) {
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i)
			}
		} else {
			const half = Math.floor(maxVisible / 2)
			let start = Math.max(1, currentPage - half)
			let end = Math.min(totalPages, start + maxVisible - 1)
			
			if (end - start + 1 < maxVisible) {
				start = Math.max(1, end - maxVisible + 1)
			}
			
			for (let i = start; i <= end; i++) {
				pages.push(i)
			}
		}
		
		return pages
	}
</script>

<div class="search-container">
	<div class="main-content">
		<!-- Header -->
		<div class="header-section">
			<div class="header-content">
				<h1 class="page-title">Airline Search</h1>
				<p class="page-subtitle">Find and manage airline information</p>
			</div>
		</div>

		<!-- Navigation -->
		<div class="nav-section">
			<a href="/dashboard/management" class="nav-link">⬅ Back to Management</a>
			<a href="/dashboard/management/add-new-airline" class="nav-link add-airline">+ Add New Airline</a>
		</div>

		<!-- User Information -->
		{#if user && userProfile}
			<div class="user-info">
				<p class="status-text">Status: <span class="highlight">Management Access</span></p>
				<p class="function-text">Function: Airline Search & Management</p>
			</div>
		{/if}

		<!-- Search Section -->
		<div class="search-section">
			<div class="search-header">
				<h3>Search Airlines</h3>
				<div class="search-stats">
					{filteredAirlines.length} of {airlines.length} airlines
				</div>
			</div>
			
			<div class="search-controls">
				<div class="search-input-group">
					<input 
						type="text" 
						bind:value={searchQuery}
						placeholder="Search by airline name, code, email, or phone..."
						class="search-input"
					/>
					<button 
						type="button" 
						on:click={() => { searchQuery = ''; handleSearch(); }} 
						class="clear-button"
						class:visible={searchQuery.length > 0}
					>
						Clear
					</button>
				</div>
			</div>
		</div>

		<!-- Results Section -->
		<div class="results-section">
			{#if searching}
				<div class="loading-state">
					<div class="loading-spinner"></div>
					<p>Loading airlines...</p>
				</div>
			{:else if filteredAirlines.length === 0 && airlines.length > 0}
				<div class="empty-state">
					<div class="empty-icon">🔍</div>
					<h3>No airlines found</h3>
					<p>Try adjusting your search terms</p>
				</div>
			{:else if airlines.length === 0}
				<div class="empty-state">
					<div class="empty-icon">✈️</div>
					<h3>No airlines yet</h3>
					<p>Create your first airline to get started</p>
					<a href="/dashboard/management/add-new-airline" class="empty-action">Add First Airline</a>
				</div>
			{:else}
				<!-- Pagination Info -->
				<div class="pagination-info">
					<p>Showing {((currentPage - 1) * airlinesPerPage) + 1} to {Math.min(currentPage * airlinesPerPage, filteredAirlines.length)} of {filteredAirlines.length} airlines</p>
				</div>

				<!-- Airlines Grid -->
				<div class="airlines-grid">
					{#each paginatedAirlines as airline (airline.id)}
						<div 
							class="airline-card" 
							on:click={() => handleAirlineClick(airline.id)}
							on:keydown={(e) => e.key === 'Enter' && handleAirlineClick(airline.id)}
							role="button"
							tabindex="0"
						>
							<div class="airline-header">
								<h4 class="airline-name">{airline.airline_name}</h4>
								<span class="airline-code-badge">{airline.airline_code}</span>
							</div>
							
							<div class="airline-details">
								{#if airline.contact_email}
									<div class="detail-row">
										<span class="detail-label">Email:</span>
										<span class="detail-value">{airline.contact_email}</span>
									</div>
								{/if}
								
								{#if airline.phone}
									<div class="detail-row">
										<span class="detail-label">Phone:</span>
										<span class="detail-value">{airline.phone}</span>
									</div>
								{/if}
							</div>
							
							<div class="airline-footer">
								<span class="created-date">Created: {formatDate(airline.created_at)}</span>
								<span class="click-hint">Click to view details →</span>
							</div>
						</div>
					{/each}
				</div>

				<!-- Pagination Controls -->
				{#if totalPages > 1}
					<div class="pagination-controls">
						<button 
							class="pagination-btn" 
							disabled={currentPage === 1}
							on:click={() => goToPage(currentPage - 1)}
						>
							← Previous
						</button>
						
						<div class="pagination-numbers">
							{#each getPageNumbers() as pageNum}
								<button 
									class="pagination-num" 
									class:active={pageNum === currentPage}
									on:click={() => goToPage(pageNum)}
								>
									{pageNum}
								</button>
							{/each}
						</div>
						
						<button 
							class="pagination-btn" 
							disabled={currentPage === totalPages}
							on:click={() => goToPage(currentPage + 1)}
						>
							Next →
						</button>
					</div>
				{/if}
			{/if}
		</div>

		<!-- Logout Button -->
		<div class="logout-section">
			<button on:click={handleSignOut} disabled={loading} class="logout-button">
				{loading ? 'Signing Out...' : 'Logout'}
			</button>
		</div>
	</div>
</div>

<style>
	.search-container {
		background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		min-height: 100vh;
		padding: 2rem;
	}

	.main-content {
		max-width: 1200px;
		margin: 0 auto;
	}

	.header-section {
		background: white;
		padding: 2rem;
		border-radius: 16px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
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
		background: linear-gradient(135deg, #ea580c, #dc2626);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.page-subtitle {
		font-size: 1.1rem;
		color: #6b7280;
		margin: 0;
	}

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
		box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.nav-link:hover {
		background: linear-gradient(135deg, #6d28d9, #5b21b6);
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(124, 58, 237, 0.4);
	}

	.nav-link.add-airline {
		background: linear-gradient(135deg, #16a34a, #15803d);
		box-shadow: 0 4px 15px rgba(22, 163, 74, 0.3);
	}

	.nav-link.add-airline:hover {
		background: linear-gradient(135deg, #15803d, #166534);
		box-shadow: 0 8px 25px rgba(22, 163, 74, 0.4);
	}

	.user-info {
		background: white;
		padding: 1.5rem;
		border-radius: 16px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
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

	.search-section {
		background: white;
		padding: 2rem;
		border-radius: 16px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
		margin-bottom: 2rem;
	}

	.search-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.search-header h3 {
		margin: 0;
		font-size: 1.5rem;
		color: #1f2937;
		font-weight: 600;
	}

	.search-stats {
		font-size: 0.875rem;
		color: #6b7280;
		font-weight: 500;
	}

	.search-input-group {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.search-input {
		flex: 1;
		padding: 1rem 1.25rem;
		border: 2px solid #e5e7eb;
		border-radius: 12px;
		font-size: 1rem;
		transition: all 0.3s ease;
		background: white;
	}

	.search-input:focus {
		outline: none;
		border-color: #ea580c;
		box-shadow: 0 0 0 4px rgba(234, 88, 12, 0.1);
	}

	.clear-button {
		padding: 1rem 1.5rem;
		background: linear-gradient(135deg, #6b7280, #4b5563);
		color: white;
		border: none;
		border-radius: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		opacity: 0;
		transform: scale(0.9);
	}

	.clear-button.visible {
		opacity: 1;
		transform: scale(1);
	}

	.clear-button:hover {
		background: linear-gradient(135deg, #4b5563, #374151);
		transform: translateY(-1px);
	}

	.results-section {
		background: white;
		border-radius: 16px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
		margin-bottom: 2rem;
		min-height: 400px;
	}

	.loading-state, .empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #e5e7eb;
		border-top: 4px solid #ea580c;
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

	.empty-state h3 {
		color: #1f2937;
		margin: 0 0 0.5rem 0;
		font-size: 1.5rem;
	}

	.empty-state p {
		color: #6b7280;
		margin: 0 0 1.5rem 0;
	}

	.empty-action {
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #16a34a, #15803d);
		color: white;
		text-decoration: none;
		border-radius: 12px;
		font-weight: 600;
		transition: all 0.3s ease;
	}

	.empty-action:hover {
		background: linear-gradient(135deg, #15803d, #166534);
		transform: translateY(-2px);
	}

	.pagination-info {
		padding: 1rem 2rem;
		border-bottom: 1px solid #e5e7eb;
		color: #6b7280;
		font-size: 0.875rem;
	}

	.pagination-info p {
		margin: 0;
	}

	.airlines-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
		gap: 1.5rem;
		padding: 2rem;
	}

	.airline-card {
		background: linear-gradient(135deg, #ffffff, #f8fafc);
		border: 2px solid #e5e7eb;
		border-radius: 16px;
		padding: 1.5rem;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
	}

	.airline-card:hover {
		border-color: #ea580c;
		box-shadow: 0 8px 30px rgba(234, 88, 12, 0.15);
		transform: translateY(-4px);
	}

	.airline-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.airline-name {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0;
		flex: 1;
		margin-right: 1rem;
	}

	.airline-code-badge {
		background: linear-gradient(135deg, #2563eb, #1d4ed8);
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 700;
		letter-spacing: 0.5px;
		min-width: fit-content;
	}

	.airline-details {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.detail-row {
		display: flex;
		gap: 0.75rem;
	}

	.detail-label {
		font-weight: 600;
		color: #6b7280;
		min-width: 60px;
		font-size: 0.875rem;
	}

	.detail-value {
		color: #1f2937;
		font-size: 0.875rem;
		flex: 1;
	}

	.airline-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 0.75rem;
		border-top: 1px solid #e5e7eb;
	}

	.created-date {
		font-size: 0.75rem;
		color: #9ca3af;
	}

	.click-hint {
		font-size: 0.75rem;
		color: #ea580c;
		font-weight: 600;
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.airline-card:hover .click-hint {
		opacity: 1;
	}

	.pagination-controls {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1rem;
		padding: 2rem;
		border-top: 1px solid #e5e7eb;
	}

	.pagination-btn {
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #6b7280, #4b5563);
		color: white;
		border: none;
		border-radius: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		font-size: 0.875rem;
	}

	.pagination-btn:hover:not(:disabled) {
		background: linear-gradient(135deg, #4b5563, #374151);
		transform: translateY(-2px);
	}

	.pagination-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	.pagination-numbers {
		display: flex;
		gap: 0.5rem;
	}

	.pagination-num {
		padding: 0.75rem 1rem;
		background: white;
		color: #6b7280;
		border: 2px solid #e5e7eb;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		min-width: 45px;
	}

	.pagination-num:hover {
		border-color: #ea580c;
		color: #ea580c;
	}

	.pagination-num.active {
		background: linear-gradient(135deg, #ea580c, #dc2626);
		color: white;
		border-color: #ea580c;
	}

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
		box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);
	}

	.logout-button:hover:not(:disabled) {
		background: linear-gradient(135deg, #b91c1c, #991b1b);
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(220, 38, 38, 0.4);
	}

	.logout-button:disabled {
		opacity: 0.7;
		cursor: not-allowed;
		transform: none;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.search-container {
			padding: 1rem;
		}
		
		.airlines-grid {
			grid-template-columns: 1fr;
			padding: 1rem;
		}
		
		.nav-section {
			flex-direction: column;
			gap: 0.75rem;
		}
		
		.search-input-group {
			flex-direction: column;
		}
		
		.clear-button {
			width: 100%;
		}
		
		.airline-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.airline-name {
			margin-right: 0;
		}

		.pagination-controls {
			flex-direction: column;
			gap: 1rem;
		}

		.pagination-numbers {
			flex-wrap: wrap;
			justify-content: center;
		}
	}
</style>
