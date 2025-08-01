<!-- Job Search - Operations -->
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

	// Search parameters
	let searchParams = {
		job_number: '',
		customer_id: '',
		status: '',
		date_from: '',
		date_to: ''
	}

	// Mock search results
	let searchResults = [
		{ job_number: 'JOB-2024-001', customer: 'ACME Corp', status: 'IN_TRANSIT', pickup: 'NEW YORK', delivery: 'BOSTON' },
		{ job_number: 'JOB-2024-002', customer: 'Tech Solutions', status: 'DELIVERED', pickup: 'CHICAGO', delivery: 'DETROIT' },
		{ job_number: 'JOB-2024-003', customer: 'Global Industries', status: 'PENDING', pickup: 'LOS ANGELES', delivery: 'SAN FRANCISCO' }
	]

	let showResults = false

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
			goto('/')
		}
		loading = false
	}

	function handleSearch() {
		// TODO: Implement actual search logic
		console.log('Searching jobs with params:', searchParams)
		showResults = true
	}

	function clearSearch() {
		searchParams = {
			job_number: '',
			customer_id: '',
			status: '',
			date_from: '',
			date_to: ''
		}
		showResults = false
	}
</script>

<div class="terminal-container">
	<div class="main-content">
		<!-- ASCII Art Header -->
		<div class="ascii-header">
			<pre class="red-text">CCCCCC EEEEEEE RRRRRR TTTTTTTT UU   UU  SSSSS
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
			<span class="red-text">OPERATIONS CENTER - JOB SEARCH</span>
		</div>

		<!-- Navigation -->
		<div class="nav-section">
			<a href="/dashboard/operations" class="nav-link">⬅ BACK TO OPERATIONS MENU</a>
		</div>

		<!-- User Information -->
		{#if user && userProfile}
			<div class="user-info">
				<p class="blue-text">Status: <span class="orange-text">OPERATIONS ACCESS</span></p>
				<p class="blue-text">Function: JOB SEARCH</p>
			</div>
		{/if}

		<!-- Search Form -->
		<div class="search-section">
			<h3 class="blue-text">--- JOB SEARCH PARAMETERS ---</h3>
			<form on:submit|preventDefault={handleSearch} class="search-form">
				<div class="search-row">
					<div class="form-group">
						<label class="blue-text">JOB NUMBER:</label>
						<input type="text" bind:value={searchParams.job_number} class="form-input" placeholder="JOB-2024-XXX" />
					</div>
					<div class="form-group">
						<label class="blue-text">CUSTOMER ID:</label>
						<input type="text" bind:value={searchParams.customer_id} class="form-input" placeholder="CUSTOMER ID" />
					</div>
				</div>

				<div class="search-row">
					<div class="form-group">
						<label class="blue-text">STATUS:</label>
						<select bind:value={searchParams.status} class="form-input">
							<option value="">ALL STATUSES</option>
							<option value="pending">PENDING</option>
							<option value="in_transit">IN TRANSIT</option>
							<option value="delivered">DELIVERED</option>
							<option value="cancelled">CANCELLED</option>
						</select>
					</div>
					<div class="form-group">
						<label class="blue-text">DATE RANGE:</label>
						<div class="date-range">
							<input type="date" bind:value={searchParams.date_from} class="form-input date-input" />
							<span class="blue-text">TO</span>
							<input type="date" bind:value={searchParams.date_to} class="form-input date-input" />
						</div>
					</div>
				</div>

				<div class="search-actions">
					<button type="submit" class="search-button">SEARCH JOBS</button>
					<button type="button" on:click={clearSearch} class="clear-button">CLEAR</button>
				</div>
			</form>
		</div>

		<!-- Search Results -->
		{#if showResults}
			<div class="results-section">
				<h3 class="blue-text">--- SEARCH RESULTS ---</h3>
				<div class="results-table">
					<div class="table-header">
						<div class="col">JOB NUMBER</div>
						<div class="col">CUSTOMER</div>
						<div class="col">STATUS</div>
						<div class="col">PICKUP</div>
						<div class="col">DELIVERY</div>
						<div class="col">ACTIONS</div>
					</div>
					{#each searchResults as job}
						<div class="table-row">
							<div class="col">{job.job_number}</div>
							<div class="col">{job.customer}</div>
							<div class="col status-{job.status.toLowerCase()}">{job.status}</div>
							<div class="col">{job.pickup}</div>
							<div class="col">{job.delivery}</div>
							<div class="col">
								<button class="action-button">VIEW</button>
								<button class="action-button">EDIT</button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Command Prompt -->
		<div class="command-prompt">
			<span class="red-text">([OPS] Job Search Module - {showResults ? 'Results Displayed' : 'Ready for Search'})</span>
		</div>

		<!-- Logout Button -->
		<div class="logout-section">
			<button on:click={handleSignOut} disabled={loading} class="logout-button">
				{loading ? 'SIGNING OUT...' : 'LOGOUT'}
			</button>
		</div>
	</div>
</div>

<style>
	.terminal-container {
		background-color: white;
		font-family: 'Courier New', monospace;
		font-size: 14px;
		line-height: 1.2;
		padding: 20px;
		min-height: 100vh;
		box-sizing: border-box;
	}

	.main-content {
		max-width: 1200px;
		margin: 0 auto;
	}

	.ascii-header {
		margin-bottom: 20px;
	}

	.ascii-header pre {
		margin: 0;
		font-size: 12px;
		line-height: 1;
	}

	.red-text {
		color: red;
		font-weight: bold;
	}

	.blue-text {
		color: blue;
		font-weight: bold;
	}

	.orange-text {
		color: orange;
		font-weight: bold;
	}

	.system-title {
		margin: 20px 0;
		text-align: left;
	}

	.nav-section {
		margin: 20px 0;
	}

	.nav-link {
		display: inline-block;
		padding: 6px 12px;
		background-color: #0066cc;
		color: white;
		text-decoration: none;
		font-size: 10px;
		font-weight: bold;
		border: 1px solid #004499;
	}

	.nav-link:hover {
		background-color: #004499;
	}

	.user-info {
		margin: 20px 0;
	}

	.user-info p {
		margin: 5px 0;
	}

	.search-section {
		margin: 30px 0;
		padding: 20px;
		border: 2px solid #ff8800;
		background-color: #fff8f0;
	}

	.search-section h3 {
		margin: 0 0 20px 0;
		text-align: center;
	}

	.search-form {
		display: flex;
		flex-direction: column;
		gap: 15px;
	}

	.search-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 20px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.form-group label {
		font-size: 12px;
	}

	.form-input {
		padding: 8px;
		font-family: 'Courier New', monospace;
		font-size: 12px;
		border: 1px solid #ccc;
		background-color: white;
	}

	.date-range {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.date-input {
		flex: 1;
	}

	.search-actions {
		display: flex;
		gap: 10px;
		justify-content: center;
		margin-top: 20px;
	}

	.search-button {
		padding: 10px 20px;
		font-family: 'Courier New', monospace;
		font-size: 12px;
		background-color: #008800;
		color: white;
		border: none;
		cursor: pointer;
		font-weight: bold;
	}

	.search-button:hover {
		background-color: #006600;
	}

	.clear-button {
		padding: 10px 20px;
		font-family: 'Courier New', monospace;
		font-size: 12px;
		background-color: #888888;
		color: white;
		border: none;
		cursor: pointer;
		font-weight: bold;
	}

	.clear-button:hover {
		background-color: #666666;
	}

	.results-section {
		margin: 30px 0;
		padding: 20px;
		border: 2px solid #0066cc;
		background-color: #f8f9fa;
	}

	.results-section h3 {
		margin: 0 0 20px 0;
		text-align: center;
	}

	.results-table {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.table-header {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr 1fr 1fr 120px;
		background-color: #0066cc;
		color: white;
		font-weight: bold;
		font-size: 10px;
	}

	.table-row {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr 1fr 1fr 120px;
		background-color: white;
		border: 1px solid #ddd;
		font-size: 10px;
	}

	.table-row:hover {
		background-color: #f0f0f0;
	}

	.col {
		padding: 8px;
		border-right: 1px solid #ddd;
	}

	.col:last-child {
		border-right: none;
	}

	.status-pending {
		color: orange;
		font-weight: bold;
	}

	.status-in_transit {
		color: blue;
		font-weight: bold;
	}

	.status-delivered {
		color: green;
		font-weight: bold;
	}

	.status-cancelled {
		color: red;
		font-weight: bold;
	}

	.action-button {
		padding: 4px 8px;
		font-family: 'Courier New', monospace;
		font-size: 8px;
		background-color: #0066cc;
		color: white;
		border: none;
		cursor: pointer;
		margin-right: 5px;
	}

	.action-button:hover {
		background-color: #004499;
	}

	.command-prompt {
		margin-top: 30px;
		background-color: red;
		color: white;
		padding: 5px 10px;
		font-weight: bold;
	}

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
</style> 