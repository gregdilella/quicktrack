<!--
  Amadeus API Debug Page
  
  This page helps debug specific Amadeus API issues with detailed logging
-->

<script lang="ts">
	import { onMount } from 'svelte'
	
	let testResults: any = null
	let loading = false
	let debugLogs: string[] = []
	
	// Test parameters
	let testParams = {
		origin: 'YUL',
		departureDate: '',
		oneWay: true,
		duration: '1,15',
		nonStop: false,
		maxPrice: '1000',
		currency: 'USD'
	}
	
	// Set default departure date to tomorrow
	onMount(() => {
		const tomorrow = new Date()
		tomorrow.setDate(tomorrow.getDate() + 1)
		testParams.departureDate = tomorrow.toISOString().split('T')[0]
	})
	
	function addLog(message: string) {
		debugLogs = [...debugLogs, `[${new Date().toLocaleTimeString()}] ${message}`]
	}
	
	function clearLogs() {
		debugLogs = []
	}
	
	// Test 1: Check API Authentication
	async function testAuthentication() {
		loading = true
		clearLogs()
		addLog('🔐 Testing Amadeus API Authentication...')
		
		try {
			// Make a direct call to test authentication
			const response = await fetch('/api/flights/amadeus/auth-test', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			})
			
			const data = await response.json()
			
			if (response.ok) {
				addLog('✅ Authentication successful')
				addLog(`Token received: ${data.token ? 'YES' : 'NO'}`)
				testResults = { authTest: data, success: true }
			} else {
				addLog('❌ Authentication failed')
				addLog(`Error: ${data.message || response.statusText}`)
				testResults = { authTest: data, success: false }
			}
		} catch (error: any) {
			addLog('💥 Authentication test crashed')
			addLog(`Error: ${error.message}`)
			testResults = { error: error.message, success: false }
		} finally {
			loading = false
		}
	}
	
	// Test 2: Test Flight Inspiration API
	async function testFlightInspiration() {
		loading = true
		clearLogs()
		addLog('✈️ Testing Amadeus Flight Inspiration API...')
		
		try {
			addLog(`Parameters: ${JSON.stringify(testParams)}`)
			
			const params = new URLSearchParams({
				origin: testParams.origin,
				departureDate: testParams.departureDate,
				one_way: testParams.oneWay.toString(),
				duration: testParams.duration,
				non_stop: testParams.nonStop.toString(),
				max_price: testParams.maxPrice,
				currency: testParams.currency
			})
			
			addLog(`Making request to: /api/flights/amadeus?${params.toString()}`)
			
			const response = await fetch(`/api/flights/amadeus?${params.toString()}`)
			const data = await response.json()
			
			addLog(`Response status: ${response.status} ${response.statusText}`)
			
			if (response.ok) {
				addLog('✅ Flight Inspiration API successful')
				addLog(`Found ${data.data?.length || 0} destinations`)
				testResults = { inspirationTest: data, success: true }
			} else {
				addLog('❌ Flight Inspiration API failed')
				addLog(`Error: ${data.message || 'Unknown error'}`)
				testResults = { inspirationTest: data, success: false }
			}
		} catch (error: any) {
			addLog('💥 Flight Inspiration test crashed')
			addLog(`Error: ${error.message}`)
			testResults = { error: error.message, success: false }
		} finally {
			loading = false
		}
	}
	
	// Test 3: Test Different API Endpoint
	async function testFlightOffers() {
		loading = true
		clearLogs()
		addLog('🎯 Testing Amadeus Flight Offers API (alternative endpoint)...')
		
		try {
			const params = new URLSearchParams({
				origin: testParams.origin,
				destination: 'JFK', // Need destination for flight offers
				departureDate: testParams.departureDate,
				adults: '1',
				currency: testParams.currency,
				max: '10'
			})
			
			addLog(`Making request to: /api/flights/search?${params.toString()}`)
			
			const response = await fetch(`/api/flights/search?${params.toString()}`)
			const data = await response.json()
			
			addLog(`Response status: ${response.status} ${response.statusText}`)
			
			if (response.ok) {
				addLog('✅ Flight Offers API successful')
				addLog(`Found ${data.summary?.totalOffers || 0} flight offers`)
				testResults = { offersTest: data, success: true }
			} else {
				addLog('❌ Flight Offers API failed')
				addLog(`Error: ${data.message || 'Unknown error'}`)
				testResults = { offersTest: data, success: false }
			}
		} catch (error: any) {
			addLog('💥 Flight Offers test crashed')
			addLog(`Error: ${error.message}`)
			testResults = { error: error.message, success: false }
		} finally {
			loading = false
		}
	}
	
	// Test 4: Raw Amadeus API Call
	async function testRawAmadeusCall() {
		loading = true
		clearLogs()
		addLog('🔧 Testing Raw Amadeus API Call...')
		
		try {
			const response = await fetch('/api/flights/amadeus/raw-test', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					endpoint: 'flight-inspirations',
					params: testParams
				})
			})
			
			const data = await response.json()
			
			addLog(`Response status: ${response.status} ${response.statusText}`)
			
			if (response.ok) {
				addLog('✅ Raw API call successful')
				addLog(`Response data available: ${data.data ? 'YES' : 'NO'}`)
				testResults = { rawTest: data, success: true }
			} else {
				addLog('❌ Raw API call failed')
				addLog(`Error: ${data.message || 'Unknown error'}`)
				addLog(`Full error: ${JSON.stringify(data, null, 2)}`)
				testResults = { rawTest: data, success: false }
			}
		} catch (error: any) {
			addLog('💥 Raw API test crashed')
			addLog(`Error: ${error.message}`)
			testResults = { error: error.message, success: false }
		} finally {
			loading = false
		}
	}
</script>

<svelte:head>
	<title>Amadeus API Debug - Certus Freight</title>
</svelte:head>

<div class="debug-container">
	<div class="header">
		<h1>🔍 Amadeus API Debug Tool</h1>
		<p>Comprehensive debugging for the "Resource not found" error</p>
	</div>
	
	<!-- Test Parameters -->
	<div class="params-section">
		<h2>Test Parameters</h2>
		<div class="params-grid">
			<div class="param-group">
				<label for="origin">Origin Airport:</label>
				<select bind:value={testParams.origin} id="origin">
					<option value="YUL">YUL - Montreal</option>
					<option value="JFK">JFK - New York</option>
					<option value="LAX">LAX - Los Angeles</option>
					<option value="LHR">LHR - London</option>
					<option value="CDG">CDG - Paris</option>
				</select>
			</div>
			<div class="param-group">
				<label for="date">Departure Date:</label>
				<input type="date" bind:value={testParams.departureDate} id="date" />
			</div>
			<div class="param-group">
				<label for="maxPrice">Max Price (USD):</label>
				<select bind:value={testParams.maxPrice} id="maxPrice">
					<option value="500">$500</option>
					<option value="1000">$1,000</option>
					<option value="2000">$2,000</option>
					<option value="5000">$5,000</option>
				</select>
			</div>
		</div>
	</div>
	
	<!-- Test Buttons -->
	<div class="tests-section">
		<h2>Debug Tests</h2>
		<p>Run these tests in order to identify the issue:</p>
		
		<div class="test-buttons">
			<button 
				class="test-btn auth-btn" 
				onclick={testAuthentication}
				disabled={loading}
			>
				{#if loading}
					<div class="spinner"></div>
				{/if}
				1️⃣ Test Authentication
			</button>
			
			<button 
				class="test-btn inspiration-btn" 
				onclick={testFlightInspiration}
				disabled={loading}
			>
				{#if loading}
					<div class="spinner"></div>
				{/if}
				2️⃣ Test Flight Inspiration
			</button>
			
			<button 
				class="test-btn offers-btn" 
				onclick={testFlightOffers}
				disabled={loading}
			>
				{#if loading}
					<div class="spinner"></div>
				{/if}
				3️⃣ Test Flight Offers
			</button>
			
			<button 
				class="test-btn raw-btn" 
				onclick={testRawAmadeusCall}
				disabled={loading}
			>
				{#if loading}
					<div class="spinner"></div>
				{/if}
				4️⃣ Raw API Test
			</button>
		</div>
	</div>
	
	<!-- Debug Logs -->
	{#if debugLogs.length > 0}
		<div class="logs-section">
			<div class="logs-header">
				<h2>🐛 Debug Logs</h2>
				<button class="clear-btn" onclick={clearLogs}>Clear Logs</button>
			</div>
			<div class="logs-container">
				{#each debugLogs as log}
					<div class="log-line">{log}</div>
				{/each}
			</div>
		</div>
	{/if}
	
	<!-- Test Results -->
	{#if testResults}
		<div class="results-section">
			<h2>📊 Test Results</h2>
			<div class="results-container">
				<pre>{JSON.stringify(testResults, null, 2)}</pre>
			</div>
		</div>
	{/if}
	
	<!-- Troubleshooting Guide -->
	<div class="guide-section">
		<h2>🛠️ Troubleshooting Guide</h2>
		
		<div class="guide-item">
			<h3>❌ "Resource not found" Error</h3>
			<ul>
				<li><strong>Invalid Airport Code:</strong> Make sure the origin airport code is valid (3-letter IATA code)</li>
				<li><strong>Wrong API Endpoint:</strong> The Flight Inspiration API might not support your parameters</li>
				<li><strong>Date Format:</strong> Ensure date is in YYYY-MM-DD format and not in the past</li>
				<li><strong>API Limitations:</strong> Test environment has limited data compared to production</li>
			</ul>
		</div>
		
		<div class="guide-item">
			<h3>🔐 Authentication Issues</h3>
			<ul>
				<li><strong>Invalid Credentials:</strong> Check AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET in .env</li>
				<li><strong>Token Expired:</strong> The cached token might be invalid</li>
				<li><strong>API Access:</strong> Ensure your Amadeus account has access to the APIs</li>
			</ul>
		</div>
		
		<div class="guide-item">
			<h3>🌐 API Environment</h3>
			<ul>
				<li><strong>Test vs Production:</strong> Currently using test.api.amadeus.com (limited data)</li>
				<li><strong>Rate Limits:</strong> Check if you've exceeded API quotas</li>
				<li><strong>Network Issues:</strong> Verify internet connection and firewall settings</li>
			</ul>
		</div>
	</div>
</div>

<style>
	.debug-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}
	
	.header {
		text-align: center;
		margin-bottom: 2rem;
		padding: 1.5rem;
		background: linear-gradient(135deg, #dc2626 0%, #7c2d12 100%);
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
	
	.params-section,
	.tests-section,
	.logs-section,
	.results-section,
	.guide-section {
		background: white;
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
	
	h2 {
		margin: 0 0 1rem 0;
		color: #1f2937;
		font-size: 1.25rem;
	}
	
	.params-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}
	
	.param-group {
		display: flex;
		flex-direction: column;
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
	
	.test-buttons {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-top: 1rem;
	}
	
	.test-btn {
		padding: 0.75rem 1rem;
		border: none;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		color: white;
	}
	
	.auth-btn { background: #3b82f6; }
	.inspiration-btn { background: #10b981; }
	.offers-btn { background: #8b5cf6; }
	.raw-btn { background: #f59e0b; }
	
	.test-btn:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}
	
	.test-btn:disabled {
		opacity: 0.6;
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
	
	.logs-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}
	
	.clear-btn {
		padding: 0.5rem 1rem;
		background: #ef4444;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 0.75rem;
		cursor: pointer;
	}
	
	.logs-container {
		background: #1f2937;
		color: #f9fafb;
		padding: 1rem;
		border-radius: 6px;
		font-family: 'Monaco', 'Menlo', monospace;
		font-size: 0.75rem;
		max-height: 300px;
		overflow-y: auto;
	}
	
	.log-line {
		margin-bottom: 0.25rem;
		line-height: 1.4;
	}
	
	.results-container {
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
		padding: 1rem;
		overflow-x: auto;
	}
	
	pre {
		margin: 0;
		font-size: 0.75rem;
		color: #374151;
		white-space: pre-wrap;
		word-wrap: break-word;
	}
	
	.guide-item {
		margin-bottom: 1.5rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}
	
	.guide-item:last-child {
		border-bottom: none;
		margin-bottom: 0;
		padding-bottom: 0;
	}
	
	.guide-item h3 {
		margin: 0 0 0.75rem 0;
		color: #dc2626;
		font-size: 1rem;
	}
	
	.guide-item ul {
		margin: 0;
		padding-left: 1.5rem;
		color: #4b5563;
	}
	
	.guide-item li {
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
	}
	
	.guide-item strong {
		color: #1f2937;
	}
	
	@media (max-width: 768px) {
		.debug-container {
			padding: 1rem;
		}
		
		.test-buttons {
			grid-template-columns: 1fr;
		}
		
		.params-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
