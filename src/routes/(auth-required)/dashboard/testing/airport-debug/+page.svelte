<!--
  Airport Debug Page
  
  This page helps debug the airport finding functionality
-->

<script lang="ts">
	import { findNearbyAirports, findNearestAirportWithRoute, validateAddress } from '$lib/services/googleMapsService';
	import AddressMap from '$lib/components/AddressMap.svelte';
	
	let testAddress = '5175 Chemin de la Côte Saint Luc, Montréal, QC'; // The address that was giving wrong results
	let testResults: any = null;
	let loading = false;
	let validatedAddress: any = null;
	
	async function testAirportSearch() {
		loading = true;
		testResults = null;
		
		try {
			console.log('=== AIRPORT DEBUG TEST START ===');
			
			// First validate the address
			console.log('1. Validating address:', testAddress);
			const validated = await validateAddress(testAddress);
			
			if (!validated) {
				testResults = { error: 'Could not validate address' };
				return;
			}
			
			validatedAddress = validated;
			console.log('2. Address validated:', validated);
			
			// Test airport finding
			console.log('3. Searching for nearby airports...');
			const airports = await findNearbyAirports(validated.latitude, validated.longitude, 50);
			console.log('4. Found airports:', airports);
			
			// Test route calculation
			console.log('5. Finding nearest airport with route...');
			const airportRoute = await findNearestAirportWithRoute(validated.latitude, validated.longitude);
			console.log('6. Airport route result:', airportRoute);
			
			// Test direct API call to route calculation
			if (airports.length > 0) {
				console.log('7. Testing direct route calculation to first airport...');
				const directRouteTest = await fetch('/api/routes/calculate', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						origin: `${validated.latitude},${validated.longitude}`,
						destination: `${airports[0].latitude},${airports[0].longitude}`
					})
				});
				const directRouteResult = await directRouteTest.json();
				console.log('8. Direct route test result:', directRouteResult);
			}
			
			testResults = {
				validatedAddress: validated,
				airports,
				airportRoute,
				success: true
			};
			
			console.log('=== AIRPORT DEBUG TEST END ===');
			
		} catch (error) {
			console.error('Airport test failed:', error);
			testResults = { 
				error: error instanceof Error ? error.message : 'Unknown error',
				success: false 
			};
		} finally {
			loading = false;
		}
	}
</script>

<div class="debug-container">
	<h1>Airport Search Debug Tool</h1>
	<p>Use this tool to test and debug the airport finding functionality.</p>
	
	<div class="test-section">
		<h2>Test Address</h2>
		<div class="input-group">
			<input 
				type="text" 
				bind:value={testAddress}
				placeholder="Enter an address to test"
				class="address-input"
			/>
			<button 
				on:click={testAirportSearch}
				disabled={loading}
				class="test-btn"
			>
				{#if loading}
					<div class="spinner"></div>
					Testing...
				{:else}
					Test Airport Search
				{/if}
			</button>
		</div>
	</div>
	
	{#if testResults}
		<div class="results-section">
			<h2>Results</h2>
			
			{#if testResults.error}
				<div class="error-result">
					<h3>❌ Error</h3>
					<p>{testResults.error}</p>
				</div>
			{:else if testResults.success}
				<div class="success-result">
					<h3>✅ Test Completed</h3>
					
					<div class="result-item">
						<h4>Validated Address</h4>
						<pre>{JSON.stringify(testResults.validatedAddress, null, 2)}</pre>
					</div>
					
					<div class="result-item">
						<h4>Found Airports ({testResults.airports?.length || 0})</h4>
						<pre>{JSON.stringify(testResults.airports, null, 2)}</pre>
					</div>
					
					<div class="result-item">
						<h4>Nearest Airport Route</h4>
						<pre>{JSON.stringify(testResults.airportRoute, null, 2)}</pre>
					</div>
				</div>
			{/if}
		</div>
	{/if}
	
	{#if validatedAddress}
		<div class="map-section">
			<h2>Address Map with Airport Route</h2>
			<p>The map below should show driving directions to the nearest airport once the route is calculated.</p>
			<AddressMap 
				validatedAddress={validatedAddress}
				title="Test Location"
				showAirportRoute={true}
				showDetails={true}
			/>
		</div>
	{/if}
	
	<div class="instructions">
		<h2>How to Debug</h2>
		<ol>
			<li><strong>Open browser console</strong> (F12) to see detailed logs</li>
			<li><strong>Enter a test address</strong> - try your actual address or a known location</li>
			<li><strong>Click "Test Airport Search"</strong> to run the full test</li>
			<li><strong>Check the results</strong> - both in the UI and console logs</li>
			<li><strong>Look for API errors</strong> in the Network tab if no results appear</li>
		</ol>
		
		<h3>Common Issues</h3>
		<ul>
			<li><strong>No airports found:</strong> Try increasing search radius or different locations</li>
			<li><strong>API errors:</strong> Check Google Maps API key and quotas</li>
			<li><strong>CORS errors:</strong> Make sure you're using the server-side API endpoints</li>
			<li><strong>Route calculation fails:</strong> Check if the addresses are valid driving destinations</li>
		</ul>
	</div>
</div>

<style>
	.debug-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}
	
	h1 {
		color: #1f2937;
		margin-bottom: 0.5rem;
	}
	
	h2 {
		color: #374151;
		margin-top: 2rem;
		margin-bottom: 1rem;
	}
	
	h3 {
		color: #4b5563;
		margin-bottom: 0.5rem;
	}
	
	h4 {
		color: #6b7280;
		margin-bottom: 0.5rem;
		font-size: 1rem;
	}
	
	.test-section {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}
	
	.input-group {
		display: flex;
		gap: 1rem;
		align-items: center;
	}
	
	.address-input {
		flex: 1;
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.875rem;
	}
	
	.address-input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
	
	.test-btn {
		padding: 0.75rem 1.5rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition: background-color 0.2s;
	}
	
	.test-btn:hover:not(:disabled) {
		background: #2563eb;
	}
	
	.test-btn:disabled {
		background: #9ca3af;
		cursor: not-allowed;
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
	
	.results-section {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}
	
	.error-result {
		padding: 1rem;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 6px;
		color: #dc2626;
	}
	
	.success-result {
		color: #059669;
	}
	
	.result-item {
		margin-bottom: 1.5rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}
	
	.result-item:last-child {
		border-bottom: none;
		margin-bottom: 0;
		padding-bottom: 0;
	}
	
	pre {
		background: #f9fafb;
		padding: 1rem;
		border-radius: 6px;
		overflow-x: auto;
		font-size: 0.75rem;
		color: #374151;
		border: 1px solid #e5e7eb;
		white-space: pre-wrap;
		word-wrap: break-word;
	}
	
	.map-section {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}
	
	.instructions {
		background: #f0f9ff;
		padding: 1.5rem;
		border-radius: 8px;
		border: 1px solid #e0f2fe;
	}
	
	.instructions h2 {
		color: #0c4a6e;
		margin-top: 0;
	}
	
	.instructions h3 {
		color: #0369a1;
		margin-top: 1.5rem;
	}
	
	.instructions ol,
	.instructions ul {
		color: #1e40af;
		padding-left: 1.5rem;
	}
	
	.instructions li {
		margin-bottom: 0.5rem;
	}
	
	.instructions strong {
		color: #1e3a8a;
	}
	
	@media (max-width: 768px) {
		.debug-container {
			padding: 1rem;
		}
		
		.input-group {
			flex-direction: column;
			align-items: stretch;
		}
		
		.test-btn {
			justify-content: center;
		}
		
		pre {
			font-size: 0.7rem;
		}
	}
</style>
