<!--
  Flight Search Tool - Origin to Destination
  
  This page helps you find the best flights between two specific airports
-->

<script lang="ts">
	import { onMount } from 'svelte'
	
	let searchResults: any = null
	let loading = false
	let errorMessage = ''
	
	// Flight search parameters
	let searchParams = {
		origin: 'YUL',           // Montreal
		destination: 'JFK',      // New York JFK
		departureDate: '',
		returnDate: '',          // Optional for round trip
		adults: 1,
		children: 0,
		infants: 0,
		travelClass: 'ECONOMY',
		nonStop: false,
		maxResults: 20,
		currency: 'USD'
	}
	
	// Popular route combinations for easy testing
	const popularRoutes = [
		{ name: 'Montreal → New York', origin: 'YUL', destination: 'JFK' },
		{ name: 'Montreal → Toronto', origin: 'YUL', destination: 'YYZ' },
		{ name: 'Montreal → London', origin: 'YUL', destination: 'LHR' },
		{ name: 'Montreal → Paris', origin: 'YUL', destination: 'CDG' },
		{ name: 'New York → Los Angeles', origin: 'JFK', destination: 'LAX' },
		{ name: 'London → Paris', origin: 'LHR', destination: 'CDG' },
		{ name: 'Madrid → Barcelona', origin: 'MAD', destination: 'BCN' },
		{ name: 'Miami → Nashville', origin: 'MIA', destination: 'BNA' }
	]
	
	// Set default departure date to tomorrow
	onMount(() => {
		const tomorrow = new Date()
		tomorrow.setDate(tomorrow.getDate() + 1)
		searchParams.departureDate = tomorrow.toISOString().split('T')[0]
		
		// Set return date to 7 days later for round trip
		const returnDate = new Date(tomorrow)
		returnDate.setDate(returnDate.getDate() + 7)
		searchParams.returnDate = returnDate.toISOString().split('T')[0]
	})
	
	function selectRoute(route: any) {
		searchParams.origin = route.origin
		searchParams.destination = route.destination
	}
	
	async function searchFlights() {
		if (!searchParams.origin || !searchParams.destination) {
			errorMessage = 'Please select both origin and destination airports'
			return
		}
		
		if (!searchParams.departureDate) {
			errorMessage = 'Please select a departure date'
			return
		}
		
		loading = true
		errorMessage = ''
		searchResults = null
		
		try {
			console.log('🔍 Searching flights:', searchParams)
			
			const params = new URLSearchParams({
				origin: searchParams.origin,
				destination: searchParams.destination,
				departureDate: searchParams.departureDate,
				adults: searchParams.adults.toString(),
				children: searchParams.children.toString(),
				infants: searchParams.infants.toString(),
				travelClass: searchParams.travelClass,
				nonStop: searchParams.nonStop.toString(),
				currency: searchParams.currency,
				max: searchParams.maxResults.toString()
			})
			
			// Add return date if specified (for round trip)
			if (searchParams.returnDate) {
				params.append('returnDate', searchParams.returnDate)
			}
			
			console.log(`Making request to: /api/flights/search?${params.toString()}`)
			
			const response = await fetch(`/api/flights/search?${params.toString()}`)
			const data = await response.json()
			
			console.log('Search response:', data)
			
			if (!response.ok) {
				throw new Error(data.message || `Search failed: ${response.status} ${response.statusText}`)
			}
			
			searchResults = data
			console.log(`✅ Found ${data.summary?.totalOffers || 0} flight offers`)
			
		} catch (error: any) {
			console.error('❌ Flight search failed:', error)
			errorMessage = error.message || 'Failed to search flights'
		} finally {
			loading = false
		}
	}
	
	// Format price
	function formatPrice(price: number, currency: string = 'USD'): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: currency
		}).format(price)
	}
	
	// Format date/time
	function formatDateTime(dateString: string): string {
		return new Date(dateString).toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		})
	}
	
	// Format duration (convert PT2H30M to "2h 30m")
	function formatDuration(duration: string): string {
		const match = duration.match(/PT(\d+H)?(\d+M)?/)
		if (!match) return duration
		
		const hours = match[1] ? match[1].replace('H', 'h ') : ''
		const minutes = match[2] ? match[2].replace('M', 'm') : ''
		
		return (hours + minutes).trim()
	}
</script>

<svelte:head>
	<title>Flight Search - Origin to Destination</title>
</svelte:head>

<div class="search-container">
	<div class="header">
		<h1>✈️ Flight Search Tool</h1>
		<p>Find the best flights between two airports</p>
	</div>
	
	<!-- Quick Route Selection -->
	<div class="routes-section">
		<h2>🚀 Popular Routes (Click to Select)</h2>
		<div class="routes-grid">
			{#each popularRoutes as route}
				<button 
					class="route-btn" 
					class:selected={searchParams.origin === route.origin && searchParams.destination === route.destination}
					onclick={() => selectRoute(route)}
				>
					{route.name}
				</button>
			{/each}
		</div>
	</div>
	
	<!-- Search Parameters -->
	<div class="search-section">
		<h2>🎯 Search Parameters</h2>
		<div class="params-grid">
			<div class="param-group">
				<label for="origin">From Airport:</label>
				<select bind:value={searchParams.origin} id="origin">
					<option value="YUL">YUL - Montreal-Trudeau</option>
					<option value="JFK">JFK - John F. Kennedy</option>
					<option value="LAX">LAX - Los Angeles</option>
					<option value="LHR">LHR - London Heathrow</option>
					<option value="CDG">CDG - Charles de Gaulle</option>
					<option value="MAD">MAD - Madrid</option>
					<option value="BCN">BCN - Barcelona</option>
					<option value="MIA">MIA - Miami</option>
					<option value="YYZ">YYZ - Toronto</option>
					<option value="BNA">BNA - Nashville</option>
				</select>
			</div>
			
			<div class="param-group">
				<label for="destination">To Airport:</label>
				<select bind:value={searchParams.destination} id="destination">
					<option value="JFK">JFK - John F. Kennedy</option>
					<option value="YUL">YUL - Montreal-Trudeau</option>
					<option value="LAX">LAX - Los Angeles</option>
					<option value="LHR">LHR - London Heathrow</option>
					<option value="CDG">CDG - Charles de Gaulle</option>
					<option value="MAD">MAD - Madrid</option>
					<option value="BCN">BCN - Barcelona</option>
					<option value="MIA">MIA - Miami</option>
					<option value="YYZ">YYZ - Toronto</option>
					<option value="BNA">BNA - Nashville</option>
				</select>
			</div>
			
			<div class="param-group">
				<label for="departureDate">Departure Date:</label>
				<input type="date" bind:value={searchParams.departureDate} id="departureDate" />
			</div>
			
			<div class="param-group">
				<label for="returnDate">Return Date (Optional):</label>
				<input type="date" bind:value={searchParams.returnDate} id="returnDate" />
			</div>
			
			<div class="param-group">
				<label for="adults">Adults:</label>
				<select bind:value={searchParams.adults} id="adults">
					<option value="1">1</option>
					<option value="2">2</option>
					<option value="3">3</option>
					<option value="4">4</option>
				</select>
			</div>
			
			<div class="param-group">
				<label for="travelClass">Travel Class:</label>
				<select bind:value={searchParams.travelClass} id="travelClass">
					<option value="ECONOMY">Economy</option>
					<option value="PREMIUM_ECONOMY">Premium Economy</option>
					<option value="BUSINESS">Business</option>
					<option value="FIRST">First Class</option>
				</select>
			</div>
			
			<div class="param-group checkbox-group">
				<label>
					<input type="checkbox" bind:checked={searchParams.nonStop} />
					Non-stop flights only
				</label>
			</div>
			
			<div class="param-group">
				<label for="maxResults">Max Results:</label>
				<select bind:value={searchParams.maxResults} id="maxResults">
					<option value="10">10</option>
					<option value="20">20</option>
					<option value="50">50</option>
				</select>
			</div>
		</div>
		
		<button class="search-btn" onclick={searchFlights} disabled={loading}>
			{#if loading}
				<div class="spinner"></div>
				Searching Flights...
			{:else}
				🔍 Search Flights
			{/if}
		</button>
	</div>
	
	<!-- Error Message -->
	{#if errorMessage}
		<div class="error-box">
			<h4>❌ Search Error</h4>
			<p>{errorMessage}</p>
		</div>
	{/if}
	
	<!-- Search Results -->
	{#if searchResults}
		<div class="results-section">
			<h2>✅ Flight Search Results</h2>
			
			<!-- Search Summary -->
			<div class="summary-box">
				<div class="summary-item">
					<strong>Route:</strong> {searchResults.searchCriteria?.origin} → {searchResults.searchCriteria?.destination}
				</div>
				<div class="summary-item">
					<strong>Date:</strong> {searchResults.searchCriteria?.departureDate}
				</div>
				<div class="summary-item">
					<strong>Total Offers:</strong> {searchResults.summary?.totalOffers || 0}
				</div>
				<div class="summary-item">
					<strong>Direct Flights:</strong> {searchResults.summary?.directFlights || 0}
				</div>
				<div class="summary-item">
					<strong>Connecting:</strong> {searchResults.summary?.connectingFlights || 0}
				</div>
			</div>
			
			<!-- Fastest Flight Highlight -->
			{#if searchResults.summary?.fastestFlight}
				<div class="fastest-flight">
					<h3>⚡ Fastest Option</h3>
					<div class="fastest-details">
						<strong>Duration:</strong> {searchResults.summary.fastestFlight.totalDuration} |
						<strong>Route:</strong> {searchResults.summary.fastestFlight.route} |
						<strong>Stops:</strong> {searchResults.summary.fastestFlight.stops === 0 ? 'Direct' : searchResults.summary.fastestFlight.stops + ' stop(s)'}
					</div>
				</div>
			{/if}
			
			<!-- Direct Flights -->
			{#if searchResults.flights?.direct?.length > 0}
				<div class="flight-category">
					<h3>✈️ Direct Flights ({searchResults.flights.direct.length})</h3>
					<div class="flights-grid">
						{#each searchResults.flights.direct.slice(0, 10) as flight}
							<div class="flight-card direct-flight">
								<div class="flight-header">
									<h4>Direct Flight</h4>
								</div>
								<div class="flight-details">
									<div class="route"><strong>{flight.enhanced?.route || `${searchParams.origin} → ${searchParams.destination}`}</strong></div>
									<div class="timing">
										<strong>Departure:</strong> {flight.enhanced?.departureTime ? formatDateTime(flight.enhanced.departureTime) : 'N/A'} |
										<strong>Arrival:</strong> {flight.enhanced?.arrivalTime ? formatDateTime(flight.enhanced.arrivalTime) : 'N/A'}
									</div>
									<div class="duration"><strong>Duration:</strong> {flight.enhanced?.totalDuration || 'N/A'}</div>
									<div class="airlines"><strong>Airlines:</strong> {flight.enhanced?.airlines?.join(', ') || 'N/A'}</div>
									{#if flight.enhanced?.aircraft}
										<div class="aircraft"><strong>Aircraft:</strong> {flight.enhanced.aircraft}</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
			
			<!-- Connecting Flights -->
			{#if searchResults.flights?.connecting?.length > 0}
				<div class="flight-category">
					<h3>🔄 Connecting Flights ({searchResults.flights.connecting.length})</h3>
					<div class="flights-grid">
						{#each searchResults.flights.connecting.slice(0, 10) as flight}
							<div class="flight-card connecting-flight">
								<div class="flight-header">
									<h4>{flight.enhanced?.stops || 1} Stop(s)</h4>
								</div>
								<div class="flight-details">
									<div class="route"><strong>{flight.enhanced?.route || `${searchParams.origin} → ${searchParams.destination}`}</strong></div>
									<div class="timing">
										<strong>Departure:</strong> {flight.enhanced?.departureTime ? formatDateTime(flight.enhanced.departureTime) : 'N/A'} |
										<strong>Arrival:</strong> {flight.enhanced?.arrivalTime ? formatDateTime(flight.enhanced.arrivalTime) : 'N/A'}
									</div>
									<div class="duration"><strong>Duration:</strong> {flight.enhanced?.totalDuration || 'N/A'}</div>
									<div class="airlines"><strong>Airlines:</strong> {flight.enhanced?.airlines?.join(', ') || 'N/A'}</div>
									{#if flight.enhanced?.aircraft}
										<div class="aircraft"><strong>Aircraft:</strong> {flight.enhanced.aircraft}</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
			
			<!-- No Results -->
			{#if (!searchResults.flights?.direct?.length && !searchResults.flights?.connecting?.length) || searchResults.summary?.totalOffers === 0}
				<div class="no-results">
					<h3>🚫 No Flights Found</h3>
					<p>Try adjusting your search criteria:</p>
					<ul>
						<li>Choose different dates (1-4 weeks from now work best)</li>
						<li>Try popular routes like MAD→BCN or LHR→CDG</li>
						<li>Disable "Non-stop only" to see connecting flights</li>
						<li>Remember: Test API has limited flight data</li>
					</ul>
				</div>
			{/if}
		</div>
	{/if}
	
	<!-- Tips Section -->
	<div class="tips-section">
		<h2>💡 Search Tips</h2>
		<div class="tips-grid">
			<div class="tip-card">
				<h3>🎯 Best Routes for Testing</h3>
				<ul>
					<li><strong>European routes:</strong> MAD→BCN, LHR→CDG</li>
					<li><strong>US routes:</strong> JFK→LAX, MIA→BNA</li>
					<li><strong>Transatlantic:</strong> LHR→JFK, CDG→JFK</li>
				</ul>
			</div>
			<div class="tip-card">
				<h3>📅 Date Selection</h3>
				<ul>
					<li><strong>Best range:</strong> 1-4 weeks from today</li>
					<li><strong>Avoid:</strong> Same day or far future dates</li>
					<li><strong>Weekdays:</strong> Often have more flight options</li>
				</ul>
			</div>
			<div class="tip-card">
				<h3>⚙️ Search Options</h3>
				<ul>
					<li><strong>Non-stop:</strong> Fewer results but faster flights</li>
					<li><strong>Economy:</strong> Most available options</li>
					<li><strong>Max results:</strong> Start with 20 for good variety</li>
					<li><strong>Aircraft types:</strong> Now shows plane models (737, A320, etc.)</li>
				</ul>
			</div>
		</div>
	</div>
</div>

<style>
	.search-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}
	
	.header {
		text-align: center;
		margin-bottom: 2rem;
		padding: 1.5rem;
		background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
		color: white;
		border-radius: 12px;
	}
	
	.header h1 {
		margin: 0 0 0.5rem 0;
		font-size: 2rem;
	}
	
	.header p {
		margin: 0;
		opacity: 0.9;
	}
	
	.routes-section,
	.search-section,
	.results-section,
	.tips-section {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}
	
	h2 {
		margin: 0 0 1rem 0;
		color: #1f2937;
		font-size: 1.25rem;
	}
	
	h3 {
		margin: 0 0 0.75rem 0;
		color: #374151;
		font-size: 1.1rem;
	}
	
	.routes-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 0.75rem;
	}
	
	.route-btn {
		padding: 0.75rem;
		border: 2px solid #e5e7eb;
		border-radius: 8px;
		background: white;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 0.875rem;
		font-weight: 500;
	}
	
	.route-btn:hover {
		border-color: #3b82f6;
		background: #f0f9ff;
	}
	
	.route-btn.selected {
		border-color: #3b82f6;
		background: #3b82f6;
		color: white;
	}
	
	.params-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 1.5rem;
	}
	
	.param-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.checkbox-group {
		flex-direction: row;
		align-items: center;
		gap: 0.5rem;
	}
	
	.param-group label {
		font-weight: 600;
		color: #374151;
		font-size: 0.875rem;
	}
	
	.param-group select,
	.param-group input {
		padding: 0.5rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.875rem;
	}
	
	.search-btn {
		padding: 0.75rem 2rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		transition: all 0.2s;
	}
	
	.search-btn:hover:not(:disabled) {
		background: #2563eb;
		transform: translateY(-1px);
	}
	
	.search-btn:disabled {
		background: #9ca3af;
		cursor: not-allowed;
		transform: none;
	}
	
	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top: 2px solid white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
	
	.error-box {
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 8px;
		padding: 1rem;
		margin: 1rem 0;
		color: #dc2626;
	}
	
	.summary-box {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 1.5rem;
		padding: 1rem;
		background: #f0fdf4;
		border-radius: 8px;
		border: 1px solid #bbf7d0;
	}
	
	.summary-item {
		font-size: 0.875rem;
		color: #065f46;
	}
	
	.fastest-flight {
		background: #f0f9ff;
		border: 2px solid #3b82f6;
		border-radius: 8px;
		padding: 1rem;
		margin: 1rem 0;
	}
	
	.fastest-flight h3 {
		margin: 0 0 0.5rem 0;
		color: #1e40af;
	}
	
	.fastest-details {
		font-size: 0.875rem;
		color: #374151;
	}
	
	.flight-category {
		margin: 1.5rem 0;
	}
	
	.flights-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1rem;
	}
	
	.flight-card {
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 1rem;
		background: white;
		transition: all 0.2s;
	}
	
	.flight-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		transform: translateY(-2px);
	}
	
	.direct-flight {
		border-left: 4px solid #10b981;
	}
	
	.connecting-flight {
		border-left: 4px solid #f59e0b;
	}
	
	.flight-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #f3f4f6;
	}
	
	.flight-header h4 {
		margin: 0;
		color: #1f2937;
		font-size: 1rem;
	}
	
	.price {
		font-size: 1.1rem;
		font-weight: 700;
		color: #059669;
	}
	
	.flight-details {
		font-size: 0.8rem;
		line-height: 1.4;
	}
	
	.flight-details > div {
		margin-bottom: 0.5rem;
	}
	
	.aircraft {
		color: #6366f1;
		font-weight: 500;
	}
	
	.no-results {
		text-align: center;
		padding: 2rem;
		background: #fef3c7;
		border: 1px solid #fbbf24;
		border-radius: 8px;
		color: #92400e;
	}
	
	.no-results h3 {
		margin: 0 0 1rem 0;
		color: #92400e;
	}
	
	.no-results ul {
		text-align: left;
		max-width: 400px;
		margin: 0 auto;
	}
	
	.tips-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1rem;
	}
	
	.tip-card {
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 1rem;
	}
	
	.tip-card h3 {
		margin: 0 0 0.75rem 0;
		color: #1f2937;
		font-size: 1rem;
	}
	
	.tip-card ul {
		margin: 0;
		padding-left: 1.25rem;
		color: #4b5563;
	}
	
	.tip-card li {
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
	}
	
	@media (max-width: 768px) {
		.search-container {
			padding: 1rem;
		}
		
		.routes-grid,
		.params-grid,
		.flights-grid,
		.tips-grid {
			grid-template-columns: 1fr;
		}
		
		.summary-box {
			flex-direction: column;
			gap: 0.5rem;
		}
	}
</style>
