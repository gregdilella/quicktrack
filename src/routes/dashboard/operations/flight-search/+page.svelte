<!-- Flight Search - Operations -->
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

	// Flight search parameters
	let searchParams = {
		flight_number: '',
		airline: '',
		departure_airport: '',
		arrival_airport: '',
		departure_date: '',
		status: ''
	}

	// Mock flight results
	let flightResults = [
		{ 
			flight_number: 'UA1234', 
			airline: 'United Airlines', 
			departure: 'JFK - 14:30', 
			arrival: 'LAX - 17:45', 
			status: 'ON_TIME',
			capacity: '15/50 packages'
		},
		{ 
			flight_number: 'AA5678', 
			airline: 'American Airlines', 
			departure: 'ORD - 09:15', 
			arrival: 'MIA - 13:30', 
			status: 'DELAYED',
			capacity: '32/40 packages'
		},
		{ 
			flight_number: 'DL9012', 
			airline: 'Delta Air Lines', 
			departure: 'ATL - 11:00', 
			arrival: 'SEA - 13:20', 
			status: 'BOARDING',
			capacity: '8/35 packages'
		}
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
		// TODO: Implement actual flight search logic
		console.log('Searching flights with params:', searchParams)
		showResults = true
	}

	function clearSearch() {
		searchParams = {
			flight_number: '',
			airline: '',
			departure_airport: '',
			arrival_airport: '',
			departure_date: '',
			status: ''
		}
		showResults = false
	}

	function bookFlight(flightNumber: string) {
		// TODO: Implement flight booking logic
		alert(`Booking cargo space on flight ${flightNumber}`)
	}
</script>

<div class="terminal-container">
	<div class="main-content">
		<!-- ASCII Art Header -->
		<div class="ascii-header">
			<pre class="red-text">QQQQQQ                               
QQ    QQ          ii        k      k       
QQ    QQ uu   uu iii   cccc kk   kk
QQ    QQ uu   uu  ii  cc    kk kk
QQ QQ QQ uu   uu  ii  cc    kkk
QQQQ  QQ uu   uu  ii  cc    kk kk
  QQQQQQ    uuuu  iiii  cccc kk   kk
QQ</pre>
		</div>

		<!-- System Title -->
		<div class="system-title">
			<span class="red-text">OPERATIONS CENTER - FLIGHT SEARCH</span>
		</div>

		<!-- Navigation -->
		<div class="nav-section">
			<a href="/dashboard/operations" class="nav-link">⬅ BACK TO OPERATIONS MENU</a>
		</div>

		<!-- User Information -->
		{#if user && userProfile}
			<div class="user-info">
				<p class="blue-text">Status: <span class="orange-text">OPERATIONS ACCESS</span></p>
				<p class="blue-text">Function: FLIGHT SEARCH</p>
			</div>
		{/if}

		<!-- Flight Search Form -->
		<div class="search-section">
			<h3 class="blue-text">--- FLIGHT SEARCH PARAMETERS ---</h3>
			<form on:submit|preventDefault={handleSearch} class="search-form">
				<div class="search-row">
					<div class="form-group">
						<label class="blue-text">FLIGHT NUMBER:</label>
						<input type="text" bind:value={searchParams.flight_number} class="form-input" placeholder="UA1234" />
					</div>
					<div class="form-group">
						<label class="blue-text">AIRLINE:</label>
						<select bind:value={searchParams.airline} class="form-input">
							<option value="">ALL AIRLINES</option>
							<option value="united">UNITED AIRLINES</option>
							<option value="american">AMERICAN AIRLINES</option>
							<option value="delta">DELTA AIR LINES</option>
							<option value="southwest">SOUTHWEST</option>
							<option value="jetblue">JETBLUE</option>
						</select>
					</div>
				</div>

				<div class="search-row">
					<div class="form-group">
						<label class="blue-text">DEPARTURE AIRPORT:</label>
						<input type="text" bind:value={searchParams.departure_airport} class="form-input" placeholder="JFK, LAX, ORD..." />
					</div>
					<div class="form-group">
						<label class="blue-text">ARRIVAL AIRPORT:</label>
						<input type="text" bind:value={searchParams.arrival_airport} class="form-input" placeholder="JFK, LAX, ORD..." />
					</div>
				</div>

				<div class="search-row">
					<div class="form-group">
						<label class="blue-text">DEPARTURE DATE:</label>
						<input type="date" bind:value={searchParams.departure_date} class="form-input" />
					</div>
					<div class="form-group">
						<label class="blue-text">FLIGHT STATUS:</label>
						<select bind:value={searchParams.status} class="form-input">
							<option value="">ALL STATUSES</option>
							<option value="on_time">ON TIME</option>
							<option value="delayed">DELAYED</option>
							<option value="boarding">BOARDING</option>
							<option value="departed">DEPARTED</option>
							<option value="arrived">ARRIVED</option>
							<option value="cancelled">CANCELLED</option>
						</select>
					</div>
				</div>

				<div class="search-actions">
					<button type="submit" class="search-button">SEARCH FLIGHTS</button>
					<button type="button" on:click={clearSearch} class="clear-button">CLEAR</button>
				</div>
			</form>
		</div>

		<!-- Flight Results -->
		{#if showResults}
			<div class="results-section">
				<h3 class="blue-text">--- AVAILABLE FLIGHTS ---</h3>
				<div class="results-table">
					<div class="table-header">
						<div class="col">FLIGHT</div>
						<div class="col">AIRLINE</div>
						<div class="col">DEPARTURE</div>
						<div class="col">ARRIVAL</div>
						<div class="col">STATUS</div>
						<div class="col">CAPACITY</div>
						<div class="col">ACTIONS</div>
					</div>
					{#each flightResults as flight}
						<div class="table-row">
							<div class="col">{flight.flight_number}</div>
							<div class="col">{flight.airline}</div>
							<div class="col">{flight.departure}</div>
							<div class="col">{flight.arrival}</div>
							<div class="col status-{flight.status.toLowerCase()}">{flight.status.replace('_', ' ')}</div>
							<div class="col">{flight.capacity}</div>
							<div class="col">
								<button class="action-button" on:click={() => bookFlight(flight.flight_number)}>BOOK</button>
								<button class="action-button">DETAILS</button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Flight Status Legend -->
		<div class="legend-section">
			<h4 class="blue-text">--- FLIGHT STATUS LEGEND ---</h4>
			<div class="legend-grid">
				<div class="legend-item">
					<span class="status-indicator status-on_time">●</span>
					<span class="blue-text">ON TIME</span>
				</div>
				<div class="legend-item">
					<span class="status-indicator status-delayed">●</span>
					<span class="blue-text">DELAYED</span>
				</div>
				<div class="legend-item">
					<span class="status-indicator status-boarding">●</span>
					<span class="blue-text">BOARDING</span>
				</div>
				<div class="legend-item">
					<span class="status-indicator status-departed">●</span>
					<span class="blue-text">DEPARTED</span>
				</div>
			</div>
		</div>

		<!-- Command Prompt -->
		<div class="command-prompt">
			<span class="red-text">([OPS] Flight Search Module - {showResults ? 'Results Displayed' : 'Ready for Search'})</span>
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
		max-width: 1400px;
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
		grid-template-columns: 100px 150px 120px 120px 100px 120px 120px;
		background-color: #0066cc;
		color: white;
		font-weight: bold;
		font-size: 10px;
	}

	.table-row {
		display: grid;
		grid-template-columns: 100px 150px 120px 120px 100px 120px 120px;
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

	.status-on_time {
		color: green;
		font-weight: bold;
	}

	.status-delayed {
		color: red;
		font-weight: bold;
	}

	.status-boarding {
		color: orange;
		font-weight: bold;
	}

	.status-departed {
		color: blue;
		font-weight: bold;
	}

	.status-arrived {
		color: purple;
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

	.legend-section {
		margin: 20px 0;
		padding: 15px;
		border: 1px solid #ccc;
		background-color: #f9f9f9;
	}

	.legend-section h4 {
		margin: 0 0 10px 0;
		text-align: center;
	}

	.legend-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 10px;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 5px;
	}

	.status-indicator {
		font-size: 16px;
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