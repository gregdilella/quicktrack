<!-- Flight API Testing Page -->
<script lang="ts">
	import { onMount } from 'svelte'

	// API response data
	let aviationStackResults: any = null
	let amadeusResults: any = null
	let flightSearchResults: any = null
	let loading = { aviationStack: false, amadeus: false, flightSearch: false }
	let errors = { aviationStack: '', amadeus: '', flightSearch: '' }

	// Form data for AviationStack API
	let aviationStackForm = {
		airport: 'YUL',
		limit: '20'
	}

	// Form data for Amadeus API
	let amadeusForm = {
		origin: 'YUL',
		departureDate: '',
		one_way: true,
		duration: '1,15',
		non_stop: false,
		max_price: '500',
		currency: 'USD'
	}

	// Form data for Flight Search API
	let flightSearchForm = {
		origin: 'YUL',
		destination: 'BNA',
		departureDate: '',
		departureTime: '06:00',
		adults: 1,
		children: 0,
		infants: 0,
		travelClass: 'ECONOMY',
		nonStop: false,
		currency: 'USD',
		maxResults: 20
	}

	// Set default departure date to tomorrow (for 6AM flight planning)
	onMount(() => {
		const tomorrow = new Date()
		tomorrow.setDate(tomorrow.getDate() + 1)
		const tomorrowStr = tomorrow.toISOString().split('T')[0]
		
		amadeusForm.departureDate = tomorrowStr
		flightSearchForm.departureDate = tomorrowStr
	})

	// Test AviationStack API
	async function testAviationStack() {
		loading.aviationStack = true
		errors.aviationStack = ''
		aviationStackResults = null

		try {
			const params = new URLSearchParams({
				airport: aviationStackForm.airport,
				limit: aviationStackForm.limit
			})

			const response = await fetch(`/api/flights?${params}`)
			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.message || 'API request failed')
			}

			aviationStackResults = data
		} catch (error: any) {
			errors.aviationStack = error.message || 'Failed to fetch AviationStack data'
			console.error('AviationStack error:', error)
		} finally {
			loading.aviationStack = false
		}
	}

	// Test Amadeus API
	async function testAmadeus() {
		loading.amadeus = true
		errors.amadeus = ''
		amadeusResults = null

		try {
			const params = new URLSearchParams({
				origin: amadeusForm.origin,
				departureDate: amadeusForm.departureDate,
				one_way: amadeusForm.one_way.toString(),
				duration: amadeusForm.duration,
				non_stop: amadeusForm.non_stop.toString(),
				max_price: amadeusForm.max_price,
				currency: amadeusForm.currency
			})

			const response = await fetch(`/api/flights/amadeus?${params}`)
			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.message || 'API request failed')
			}

			amadeusResults = data
		} catch (error: any) {
			errors.amadeus = error.message || 'Failed to fetch Amadeus data'
			console.error('Amadeus error:', error)
		} finally {
			loading.amadeus = false
		}
	}

	// Test Flight Search API
	async function testFlightSearch() {
		loading.flightSearch = true
		errors.flightSearch = ''
		flightSearchResults = null

		try {
			const params = new URLSearchParams({
				origin: flightSearchForm.origin,
				destination: flightSearchForm.destination,
				departureDate: flightSearchForm.departureDate,
				departureTime: flightSearchForm.departureTime,
				adults: flightSearchForm.adults.toString(),
				children: flightSearchForm.children.toString(),
				infants: flightSearchForm.infants.toString(),
				travelClass: flightSearchForm.travelClass,
				nonStop: flightSearchForm.nonStop.toString(),
				currency: flightSearchForm.currency,
				max: flightSearchForm.maxResults.toString()
			})

			const response = await fetch(`/api/flights/search?${params}`)
			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.message || 'Flight search failed')
			}

			flightSearchResults = data
		} catch (error: any) {
			errors.flightSearch = error.message || 'Failed to search flights'
			console.error('Flight search error:', error)
		} finally {
			loading.flightSearch = false
		}
	}

	// Format currency
	function formatPrice(price: number, currency: string = 'USD'): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: currency
		}).format(price)
	}

	// Format date/time
	function formatDateTime(dateString: string): string {
		return new Date(dateString).toLocaleString()
	}

	// Format duration
	function formatDuration(minutes: number): string {
		const hours = Math.floor(minutes / 60)
		const mins = minutes % 60
		return `${hours}h ${mins}m`
	}
</script>

<svelte:head>
	<title>Flight API Testing - CERTrack</title>
</svelte:head>

<div class="testing-container">
	<div class="header">
		<h1>Flight API Testing Dashboard</h1>
		<p>Test both AviationStack (Real-time Flights) and Amadeus (Flight Inspiration Search) APIs</p>
	</div>

	<div class="api-sections">
		<!-- AviationStack API Section -->
		<div class="api-section aviationstack-section">
			<div class="section-header">
				<h2>🛫 AviationStack API</h2>
				<p>Real-time flight departures and tracking</p>
			</div>

			<div class="form-section">
				<h3>Test Parameters</h3>
				<div class="form-grid">
					<div class="form-group">
						<label for="airport">Airport Code:</label>
						<select bind:value={aviationStackForm.airport} id="airport">
							<option value="YUL">YUL - Montreal-Trudeau</option>
							<option value="JFK">JFK - John F. Kennedy</option>
							<option value="LAX">LAX - Los Angeles</option>
							<option value="LHR">LHR - London Heathrow</option>
							<option value="CDG">CDG - Charles de Gaulle</option>
							<option value="NRT">NRT - Tokyo Narita</option>
							<option value="SJO">SJO - San José Costa Rica</option>
						</select>
					</div>
					<div class="form-group">
						<label for="limit">Results Limit:</label>
						<select bind:value={aviationStackForm.limit} id="limit">
							<option value="10">10</option>
							<option value="20">20</option>
							<option value="50">50</option>
							<option value="100">100</option>
						</select>
					</div>
				</div>
				<button class="test-button aviationstack-btn" on:click={testAviationStack} disabled={loading.aviationStack}>
					{#if loading.aviationStack}
						<span class="spinner"></span> Testing AviationStack API...
					{:else}
						🚀 Test AviationStack API
					{/if}
				</button>
			</div>

			<!-- AviationStack Results -->
			{#if errors.aviationStack}
				<div class="error-box">
					<h4>❌ AviationStack API Error</h4>
					<p>{errors.aviationStack}</p>
				</div>
			{/if}

			{#if aviationStackResults}
				<div class="results-section">
					<h3>✅ AviationStack Results</h3>
					<div class="results-summary">
						<div class="summary-item">
							<strong>Airport:</strong> {aviationStackResults.airport}
						</div>
						<div class="summary-item">
							<strong>Total Flights:</strong> {aviationStackResults.total}
						</div>
						<div class="summary-item">
							<strong>Timestamp:</strong> {formatDateTime(aviationStackResults.timestamp)}
						</div>
					</div>

					<div class="flights-grid">
						{#each aviationStackResults.flights.slice(0, 10) as flight, index}
							<div class="flight-card aviationstack-card">
								<div class="flight-header">
									<h4>{flight.flight?.iata || flight.flight?.icao || 'Unknown Flight'}</h4>
									<span class="flight-status {flight.flight_status}">{flight.flight_status}</span>
								</div>
								<div class="flight-details">
									<div class="route">
										<strong>Route:</strong> {flight.departure?.iata || 'N/A'} → {flight.arrival?.iata || 'N/A'}
									</div>
									<div class="times">
										<div><strong>Scheduled:</strong> {flight.departure?.scheduled ? formatDateTime(flight.departure.scheduled) : 'N/A'}</div>
										{#if flight.departure?.actual}
											<div><strong>Actual:</strong> {formatDateTime(flight.departure.actual)}</div>
										{/if}
									</div>
									<div class="airline">
										<strong>Airline:</strong> {flight.airline?.name || 'Unknown'}
									</div>
									{#if flight.aircraft?.model}
										<div class="aircraft">
											<strong>Aircraft:</strong> {flight.aircraft.model}
										</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- Amadeus API Section -->
		<div class="api-section amadeus-section">
			<div class="section-header">
				<h2>✈️ Amadeus Flight Inspiration API</h2>
				<p>Discover flight destinations and prices from your origin</p>
			</div>

			<div class="form-section">
				<h3>Search Parameters</h3>
				<div class="form-grid">
					<div class="form-group">
						<label for="origin">Origin Airport:</label>
						<select bind:value={amadeusForm.origin} id="origin">
							<option value="YUL">YUL - Montreal-Trudeau</option>
							<option value="JFK">JFK - John F. Kennedy</option>
							<option value="LAX">LAX - Los Angeles</option>
							<option value="LHR">LHR - London Heathrow</option>
							<option value="CDG">CDG - Charles de Gaulle</option>
							<option value="NRT">NRT - Tokyo Narita</option>
						</select>
					</div>
					<div class="form-group">
						<label for="departureDate">Departure Date:</label>
						<input type="date" bind:value={amadeusForm.departureDate} id="departureDate" />
					</div>
					<div class="form-group">
						<label for="duration">Trip Duration (days):</label>
						<select bind:value={amadeusForm.duration} id="duration">
							<option value="1,3">1-3 days</option>
							<option value="4,7">4-7 days</option>
							<option value="8,14">1-2 weeks</option>
							<option value="1,15">1-15 days</option>
						</select>
					</div>
					<div class="form-group">
						<label for="maxPrice">Max Price (USD):</label>
						<select bind:value={amadeusForm.max_price} id="maxPrice">
							<option value="200">$200</option>
							<option value="500">$500</option>
							<option value="1000">$1,000</option>
							<option value="2000">$2,000</option>
							<option value="5000">$5,000</option>
						</select>
					</div>
					<div class="form-group checkbox-group">
						<label>
							<input type="checkbox" bind:checked={amadeusForm.one_way} />
							One-way trip
						</label>
					</div>
					<div class="form-group checkbox-group">
						<label>
							<input type="checkbox" bind:checked={amadeusForm.non_stop} />
							Non-stop flights only
						</label>
					</div>
				</div>
				<button class="test-button amadeus-btn" on:click={testAmadeus} disabled={loading.amadeus}>
					{#if loading.amadeus}
						<span class="spinner"></span> Searching Amadeus API...
					{:else}
						🌍 Search Flight Inspirations
					{/if}
				</button>
			</div>

			<!-- Amadeus Results -->
			{#if errors.amadeus}
				<div class="error-box">
					<h4>❌ Amadeus API Error</h4>
					<p>{errors.amadeus}</p>
				</div>
			{/if}

			{#if amadeusResults}
				<div class="results-section">
					<h3>✅ Flight Inspiration Results</h3>
					<div class="results-summary">
						<div class="summary-item">
							<strong>Origin:</strong> {amadeusResults.origin}
						</div>
						<div class="summary-item">
							<strong>Destinations Found:</strong> {amadeusResults.data?.length || 0}
						</div>
						<div class="summary-item">
							<strong>Search Date:</strong> {amadeusResults.departureDate}
						</div>
					</div>

					<div class="destinations-grid">
						{#each (amadeusResults.data || []).slice(0, 12) as destination, index}
							<div class="destination-card amadeus-card">
								<div class="destination-header">
									<h4>{destination.destination}</h4>
									<span class="price">{formatPrice(destination.price.total, amadeusResults.currency)}</span>
								</div>
								<div class="destination-details">
									<div class="route">
										<strong>Route:</strong> {amadeusResults.origin} → {destination.destination}
									</div>
									<div class="dates">
										<strong>Departure:</strong> {destination.departureDate}<br>
										<strong>Return:</strong> {destination.returnDate || 'One-way'}
									</div>
									{#if destination.links?.flightOffers}
										<div class="offers">
											<strong>Flight Offers:</strong> 
											<a href="{destination.links.flightOffers}" target="_blank" class="offers-link">
												View Details →
											</a>
										</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- Flight Route Search Section -->
		<div class="api-section flight-search-section">
			<div class="section-header">
				<h2>🛩️ Flight Route Search</h2>
				<p>Find specific flights between two airports with departure times (YUL → Nashville)</p>
			</div>

			<div class="form-section">
				<h3>Route Planning</h3>
				<div class="form-grid">
					<div class="form-group">
						<label for="searchOrigin">From Airport:</label>
						<select bind:value={flightSearchForm.origin} id="searchOrigin">
							<option value="YUL">YUL - Montreal-Trudeau</option>
							<option value="JFK">JFK - John F. Kennedy</option>
							<option value="LAX">LAX - Los Angeles</option>
							<option value="LHR">LHR - London Heathrow</option>
							<option value="CDG">CDG - Charles de Gaulle</option>
							<option value="NRT">NRT - Tokyo Narita</option>
						</select>
					</div>
					<div class="form-group">
						<label for="searchDestination">To Airport:</label>
						<select bind:value={flightSearchForm.destination} id="searchDestination">
							<option value="BNA">BNA - Nashville International</option>
							<option value="JFK">JFK - John F. Kennedy</option>
							<option value="LAX">LAX - Los Angeles</option>
							<option value="LHR">LHR - London Heathrow</option>
							<option value="CDG">CDG - Charles de Gaulle</option>
							<option value="ATL">ATL - Atlanta</option>
							<option value="ORD">ORD - Chicago O'Hare</option>
							<option value="DFW">DFW - Dallas Fort Worth</option>
						</select>
					</div>
					<div class="form-group">
						<label for="searchDate">Departure Date:</label>
						<input type="date" bind:value={flightSearchForm.departureDate} id="searchDate" />
					</div>
					<div class="form-group">
						<label for="searchTime">Departure Time:</label>
						<input type="time" bind:value={flightSearchForm.departureTime} id="searchTime" />
					</div>
					<div class="form-group">
						<label for="searchAdults">Adults:</label>
						<select bind:value={flightSearchForm.adults} id="searchAdults">
							<option value="1">1</option>
							<option value="2">2</option>
							<option value="3">3</option>
							<option value="4">4</option>
						</select>
					</div>
					<div class="form-group">
						<label for="searchClass">Travel Class:</label>
						<select bind:value={flightSearchForm.travelClass} id="searchClass">
							<option value="ECONOMY">Economy</option>
							<option value="PREMIUM_ECONOMY">Premium Economy</option>
							<option value="BUSINESS">Business</option>
							<option value="FIRST">First Class</option>
						</select>
					</div>
					<div class="form-group checkbox-group">
						<label>
							<input type="checkbox" bind:checked={flightSearchForm.nonStop} />
							Direct flights only
						</label>
					</div>
					<div class="form-group">
						<label for="searchMax">Max Results:</label>
						<select bind:value={flightSearchForm.maxResults} id="searchMax">
							<option value="10">10</option>
							<option value="20">20</option>
							<option value="50">50</option>
						</select>
					</div>
				</div>
				<button class="test-button flight-search-btn" on:click={testFlightSearch} disabled={loading.flightSearch}>
					{#if loading.flightSearch}
						<span class="spinner"></span> Searching Routes...
					{:else}
						🎯 Find Quickest Routes
					{/if}
				</button>
			</div>

			<!-- Flight Search Results -->
			{#if errors.flightSearch}
				<div class="error-box">
					<h4>❌ Flight Search Error</h4>
					<p>{errors.flightSearch}</p>
				</div>
			{/if}

			{#if flightSearchResults}
				<div class="results-section">
					<h3>✅ Route Search Results</h3>
					<div class="results-summary">
						<div class="summary-item">
							<strong>Route:</strong> {flightSearchResults.searchCriteria.origin} → {flightSearchResults.searchCriteria.destination}
						</div>
						<div class="summary-item">
							<strong>Date:</strong> {flightSearchResults.searchCriteria.departureDate}
						</div>
						<div class="summary-item">
							<strong>Time:</strong> {flightSearchResults.searchCriteria.departureTime}
						</div>
						<div class="summary-item">
							<strong>Total Flights:</strong> {flightSearchResults.summary.totalOffers}
						</div>
						<div class="summary-item">
							<strong>Direct Flights:</strong> {flightSearchResults.summary.directFlights}
						</div>
						<div class="summary-item">
							<strong>Connecting:</strong> {flightSearchResults.summary.connectingFlights}
						</div>
					</div>

					{#if flightSearchResults.summary.fastestFlight}
						<div class="fastest-flight">
							<h4>⚡ Fastest Option</h4>
							<div class="fastest-details">
								<strong>Duration:</strong> {flightSearchResults.summary.fastestFlight.totalDuration} |
								<strong>Route:</strong> {flightSearchResults.summary.fastestFlight.route} |
								<strong>Stops:</strong> {flightSearchResults.summary.fastestFlight.stops === 0 ? 'Direct' : flightSearchResults.summary.fastestFlight.stops + ' stop(s)'}
							</div>
						</div>
					{/if}

					<!-- Direct Flights -->
					{#if flightSearchResults.flights.direct.length > 0}
						<div class="flight-category">
							<h4>✈️ Direct Flights ({flightSearchResults.flights.direct.length})</h4>
							<div class="flights-grid">
								{#each flightSearchResults.flights.direct.slice(0, 5) as flight}
									<div class="flight-card direct-flight">
										<div class="flight-header">
											<h5>Direct Flight</h5>
											<span class="price">${flight.price.total} {flight.price.currency}</span>
										</div>
										<div class="flight-details">
											<div class="route"><strong>{flight.enhanced.route}</strong></div>
											<div class="timing">
												<strong>Departure:</strong> {new Date(flight.enhanced.departureTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} |
												<strong>Arrival:</strong> {new Date(flight.enhanced.arrivalTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
											</div>
											<div class="duration"><strong>Duration:</strong> {flight.enhanced.totalDuration}</div>
											<div class="airlines"><strong>Airlines:</strong> {flight.enhanced.airlines.join(', ')}</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Connecting Flights -->
					{#if flightSearchResults.flights.connecting.length > 0}
						<div class="flight-category">
							<h4>🔄 Connecting Flights ({flightSearchResults.flights.connecting.length})</h4>
							<div class="flights-grid">
								{#each flightSearchResults.flights.connecting.slice(0, 8) as flight}
									<div class="flight-card connecting-flight">
										<div class="flight-header">
											<h5>{flight.enhanced.stops} Stop(s)</h5>
											<span class="price">${flight.price.total} {flight.price.currency}</span>
										</div>
										<div class="flight-details">
											<div class="route"><strong>{flight.enhanced.route}</strong></div>
											<div class="timing">
												<strong>Departure:</strong> {new Date(flight.enhanced.departureTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} |
												<strong>Arrival:</strong> {new Date(flight.enhanced.arrivalTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
											</div>
											<div class="duration"><strong>Duration:</strong> {flight.enhanced.totalDuration}</div>
											<div class="airlines"><strong>Airlines:</strong> {flight.enhanced.airlines.join(', ')}</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					{#if flightSearchResults.flights.all.length === 0}
						<div class="no-flights">
							<h4>🚫 No Flights Found</h4>
							<p>Try different dates, times, or disable "Direct flights only"</p>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>

	<!-- API Information Section -->
	<div class="info-section">
		<h2>📋 API Information</h2>
		<div class="api-info-grid">
			<div class="api-info-card">
				<h3>AviationStack API</h3>
				<ul>
					<li><strong>Purpose:</strong> Real-time flight tracking and departures</li>
					<li><strong>Data:</strong> Live flight status, schedules, aircraft info</li>
					<li><strong>Update Frequency:</strong> Real-time</li>
					<li><strong>Best For:</strong> Current flight tracking, operations</li>
				</ul>
			</div>
			<div class="api-info-card">
				<h3>Amadeus Flight Inspiration</h3>
				<ul>
					<li><strong>Purpose:</strong> Flight destination discovery and pricing</li>
					<li><strong>Data:</strong> Available destinations, prices, travel dates</li>
					<li><strong>Update Frequency:</strong> Daily</li>
					<li><strong>Best For:</strong> Trip planning, price comparison</li>
				</ul>
			</div>
			<div class="api-info-card">
				<h3>Flight Route Search</h3>
				<ul>
					<li><strong>Purpose:</strong> Specific route planning with times</li>
					<li><strong>Data:</strong> Direct & connecting flights, pricing, schedules</li>
					<li><strong>Update Frequency:</strong> Real-time</li>
					<li><strong>Best For:</strong> YUL→Nashville route planning at 6AM</li>
				</ul>
			</div>
		</div>
	</div>
</div>

<style>
	.testing-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 20px;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.header {
		text-align: center;
		margin-bottom: 40px;
		padding: 20px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border-radius: 12px;
	}

	.header h1 {
		margin: 0 0 10px 0;
		font-size: 2.5rem;
	}

	.header p {
		margin: 0;
		opacity: 0.9;
		font-size: 1.1rem;
	}

	.api-sections {
		display: grid;
		gap: 30px;
		margin-bottom: 40px;
	}

	.api-section {
		border: 2px solid #e5e7eb;
		border-radius: 12px;
		padding: 25px;
		background: white;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.aviationstack-section {
		border-color: #3b82f6;
	}

	.amadeus-section {
		border-color: #10b981;
	}

	.flight-search-section {
		border-color: #8b5cf6;
	}

	.section-header {
		margin-bottom: 25px;
		padding-bottom: 15px;
		border-bottom: 1px solid #e5e7eb;
	}

	.section-header h2 {
		margin: 0 0 8px 0;
		font-size: 1.8rem;
		color: #1f2937;
	}

	.section-header p {
		margin: 0;
		color: #6b7280;
		font-size: 1rem;
	}

	.form-section {
		margin-bottom: 25px;
	}

	.form-section h3 {
		margin: 0 0 15px 0;
		color: #374151;
		font-size: 1.2rem;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 15px;
		margin-bottom: 20px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.checkbox-group {
		flex-direction: row;
		align-items: center;
		gap: 8px;
	}

	.checkbox-group input[type="checkbox"] {
		margin: 0;
	}

	.form-group label {
		font-weight: 600;
		color: #374151;
		font-size: 14px;
	}

	.form-group select,
	.form-group input {
		padding: 8px 12px;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 14px;
		background: white;
	}

	.form-group select:focus,
	.form-group input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.test-button {
		padding: 12px 24px;
		border: none;
		border-radius: 8px;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		gap: 10px;
		justify-content: center;
		min-width: 200px;
	}

	.aviationstack-btn {
		background: #3b82f6;
		color: white;
	}

	.aviationstack-btn:hover:not(:disabled) {
		background: #2563eb;
		transform: translateY(-1px);
	}

	.amadeus-btn {
		background: #10b981;
		color: white;
	}

	.amadeus-btn:hover:not(:disabled) {
		background: #059669;
		transform: translateY(-1px);
	}

	.flight-search-btn {
		background: #8b5cf6;
		color: white;
	}

	.flight-search-btn:hover:not(:disabled) {
		background: #7c3aed;
		transform: translateY(-1px);
	}

	.test-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid transparent;
		border-top: 2px solid currentColor;
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
		padding: 15px;
		margin: 20px 0;
	}

	.error-box h4 {
		margin: 0 0 8px 0;
		color: #dc2626;
		font-size: 1rem;
	}

	.error-box p {
		margin: 0;
		color: #b91c1c;
		font-size: 14px;
	}

	.results-section {
		margin-top: 25px;
		padding-top: 20px;
		border-top: 1px solid #e5e7eb;
	}

	.results-section h3 {
		margin: 0 0 15px 0;
		color: #059669;
		font-size: 1.3rem;
	}

	.results-summary {
		display: flex;
		flex-wrap: wrap;
		gap: 20px;
		margin-bottom: 20px;
		padding: 15px;
		background: #f0fdf4;
		border-radius: 8px;
		border: 1px solid #bbf7d0;
	}

	.summary-item {
		font-size: 14px;
		color: #065f46;
	}

	.flights-grid,
	.destinations-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 15px;
	}

	.flight-card,
	.destination-card {
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 15px;
		background: white;
		transition: all 0.2s;
	}

	.flight-card:hover,
	.destination-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		transform: translateY(-2px);
	}

	.aviationstack-card {
		border-left: 4px solid #3b82f6;
	}

	.amadeus-card {
		border-left: 4px solid #10b981;
	}

	.flight-header,
	.destination-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
		padding-bottom: 8px;
		border-bottom: 1px solid #f3f4f6;
	}

	.flight-header h4,
	.destination-header h4 {
		margin: 0;
		color: #1f2937;
		font-size: 1.1rem;
	}

	.flight-status {
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 12px;
		font-weight: 600;
		text-transform: uppercase;
	}

	.flight-status.active { background: #dcfce7; color: #166534; }
	.flight-status.scheduled { background: #dbeafe; color: #1e40af; }
	.flight-status.delayed { background: #fed7aa; color: #c2410c; }
	.flight-status.cancelled { background: #fecaca; color: #dc2626; }

	.price {
		font-size: 1.2rem;
		font-weight: 700;
		color: #059669;
	}

	.flight-details,
	.destination-details {
		font-size: 13px;
		line-height: 1.5;
	}

	.flight-details > div,
	.destination-details > div {
		margin-bottom: 6px;
	}

	.offers-link {
		color: #3b82f6;
		text-decoration: none;
		font-weight: 500;
	}

	.offers-link:hover {
		text-decoration: underline;
	}

	/* Flight Search Specific Styles */
	.fastest-flight {
		background: #f0f9ff;
		border: 2px solid #3b82f6;
		border-radius: 8px;
		padding: 15px;
		margin: 15px 0;
	}

	.fastest-flight h4 {
		margin: 0 0 8px 0;
		color: #1e40af;
	}

	.fastest-details {
		font-size: 14px;
		color: #374151;
	}

	.flight-category {
		margin: 20px 0;
	}

	.flight-category h4 {
		margin: 0 0 15px 0;
		color: #374151;
		font-size: 1.2rem;
		border-bottom: 1px solid #e5e7eb;
		padding-bottom: 8px;
	}

	.direct-flight {
		border-left: 4px solid #10b981;
	}

	.connecting-flight {
		border-left: 4px solid #f59e0b;
	}

	.flight-card h5 {
		margin: 0;
		font-size: 1rem;
		color: #1f2937;
	}

	.no-flights {
		text-align: center;
		padding: 30px;
		background: #fef3c7;
		border: 1px solid #fbbf24;
		border-radius: 8px;
		margin: 20px 0;
	}

	.no-flights h4 {
		margin: 0 0 8px 0;
		color: #92400e;
	}

	.no-flights p {
		margin: 0;
		color: #78350f;
	}

	.info-section {
		background: #f9fafb;
		border-radius: 12px;
		padding: 25px;
		margin-top: 40px;
	}

	.info-section h2 {
		margin: 0 0 20px 0;
		color: #374151;
	}

	.api-info-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 20px;
	}

	.api-info-card {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 20px;
	}

	.api-info-card h3 {
		margin: 0 0 15px 0;
		color: #1f2937;
		font-size: 1.2rem;
	}

	.api-info-card ul {
		margin: 0;
		padding-left: 20px;
		color: #6b7280;
	}

	.api-info-card li {
		margin-bottom: 8px;
		font-size: 14px;
	}

	/* Desktop: Extra padding from sidebar */
	@media (min-width: 769px) {
		.testing-container {
			padding-left: 40px;
		}
	}

	@media (max-width: 768px) {
		.testing-container {
			padding: 15px;
			padding-left: 15px; /* Reset extra padding on mobile */
		}

		.header h1 {
			font-size: 2rem;
		}

		.form-grid {
			grid-template-columns: 1fr;
		}

		.results-summary {
			flex-direction: column;
			gap: 10px;
		}

		.flights-grid,
		.destinations-grid {
			grid-template-columns: 1fr;
		}
	}
</style> 