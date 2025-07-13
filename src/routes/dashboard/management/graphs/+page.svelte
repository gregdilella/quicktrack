<!-- Tableau Style Graphs - Management -->
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

	// Mock data for charts
	let monthlyRevenue = [
		{ month: 'Jan', revenue: 245000, target: 220000 },
		{ month: 'Feb', revenue: 267000, target: 230000 },
		{ month: 'Mar', revenue: 298000, target: 250000 },
		{ month: 'Apr', revenue: 312000, target: 270000 },
		{ month: 'May', revenue: 334000, target: 290000 },
		{ month: 'Jun', revenue: 356000, target: 310000 }
	]

	let customerDistribution = [
		{ type: 'Enterprise', count: 45, percentage: 18 },
		{ type: 'Mid-Market', count: 78, percentage: 31 },
		{ type: 'Small Business', count: 134, percentage: 51 }
	]

	let serviceTypes = [
		{ service: 'Express Delivery', jobs: 156, revenue: 234000 },
		{ service: 'Standard Shipping', jobs: 298, revenue: 187000 },
		{ service: 'International', jobs: 67, revenue: 145000 },
		{ service: 'Same Day', jobs: 89, revenue: 178000 },
		{ service: 'Freight', jobs: 34, revenue: 89000 }
	]

	let performanceMetrics = [
		{ metric: 'On-Time Delivery', current: 94.7, target: 95.0, trend: 'up' },
		{ metric: 'Customer Satisfaction', current: 4.6, target: 4.5, trend: 'up' },
		{ metric: 'Cost per Job', current: 187, target: 200, trend: 'down' },
		{ metric: 'Average Job Value', current: 1834, target: 1750, trend: 'up' }
	]

	// Chart view options
	let selectedChart = 'revenue'
	let chartPeriod = 'monthly'

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

	function getBarHeight(value: number, max: number): number {
		return Math.max((value / max) * 100, 5) // Minimum 5% height for visibility
	}

	function getMaxRevenue(): number {
		return Math.max(...monthlyRevenue.map(m => Math.max(m.revenue, m.target)))
	}

	function exportChart() {
		// TODO: Implement chart export
		alert('Chart export functionality will be implemented here')
	}

	function refreshData() {
		// TODO: Implement data refresh
		alert('Data refresh functionality will be implemented here')
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
			<span class="red-text">MANAGEMENT PORTAL - BUSINESS INTELLIGENCE DASHBOARD</span>
		</div>

		<!-- Navigation -->
		<div class="nav-section">
			<a href="/dashboard/management" class="nav-link">⬅ BACK TO MANAGEMENT MENU</a>
		</div>

		<!-- User Information -->
		{#if user && userProfile}
			<div class="user-info">
				<p class="blue-text">Status: <span class="purple-text">MANAGEMENT ACCESS</span></p>
				<p class="blue-text">Function: DATA VISUALIZATION</p>
			</div>
		{/if}

		<!-- Chart Controls -->
		<div class="controls-section">
			<h3 class="blue-text">--- VISUALIZATION CONTROLS ---</h3>
			<div class="controls-row">
				<div class="form-group">
					<label class="blue-text">CHART TYPE:</label>
					<select bind:value={selectedChart} class="form-input">
						<option value="revenue">REVENUE TRENDS</option>
						<option value="customers">CUSTOMER DISTRIBUTION</option>
						<option value="services">SERVICE PERFORMANCE</option>
						<option value="metrics">KEY METRICS</option>
					</select>
				</div>
				<div class="form-group">
					<label class="blue-text">TIME PERIOD:</label>
					<select bind:value={chartPeriod} class="form-input">
						<option value="daily">DAILY</option>
						<option value="weekly">WEEKLY</option>
						<option value="monthly">MONTHLY</option>
						<option value="quarterly">QUARTERLY</option>
					</select>
				</div>
				<div class="form-group">
					<button on:click={refreshData} class="action-button">REFRESH</button>
					<button on:click={exportChart} class="action-button">EXPORT</button>
				</div>
			</div>
		</div>

		<!-- Revenue Trends Chart -->
		{#if selectedChart === 'revenue'}
			<div class="chart-section">
				<h3 class="blue-text">--- MONTHLY REVENUE vs TARGET ---</h3>
				<div class="bar-chart">
					<div class="chart-legend">
						<div class="legend-item">
							<span class="legend-color actual"></span>
							<span class="blue-text">ACTUAL REVENUE</span>
						</div>
						<div class="legend-item">
							<span class="legend-color target"></span>
							<span class="blue-text">TARGET REVENUE</span>
						</div>
					</div>
					<div class="chart-container">
						{#each monthlyRevenue as month}
							<div class="bar-group">
								<div class="bars">
									<div class="bar actual" style="height: {getBarHeight(month.revenue, getMaxRevenue())}%">
										<div class="bar-value">${(month.revenue / 1000).toFixed(0)}K</div>
									</div>
									<div class="bar target" style="height: {getBarHeight(month.target, getMaxRevenue())}%">
										<div class="bar-value">${(month.target / 1000).toFixed(0)}K</div>
									</div>
								</div>
								<div class="bar-label">{month.month}</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}

		<!-- Customer Distribution Chart -->
		{#if selectedChart === 'customers'}
			<div class="chart-section">
				<h3 class="blue-text">--- CUSTOMER DISTRIBUTION BY SEGMENT ---</h3>
				<div class="pie-chart-container">
					<div class="pie-chart-data">
						{#each customerDistribution as segment}
							<div class="segment-row">
								<div class="segment-bar">
									<div class="segment-fill" style="width: {segment.percentage}%; background-color: {segment.type === 'Enterprise' ? '#8800cc' : segment.type === 'Mid-Market' ? '#0066cc' : '#ff8800'}"></div>
								</div>
								<div class="segment-info">
									<span class="segment-type">{segment.type}</span>
									<span class="segment-stats">{segment.count} customers ({segment.percentage}%)</span>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}

		<!-- Service Performance Chart -->
		{#if selectedChart === 'services'}
			<div class="chart-section">
				<h3 class="blue-text">--- SERVICE TYPE PERFORMANCE ---</h3>
				<div class="service-chart">
					<div class="service-header">
						<div class="col">SERVICE</div>
						<div class="col">JOBS</div>
						<div class="col">REVENUE</div>
						<div class="col">PERFORMANCE</div>
					</div>
					{#each serviceTypes as service}
						<div class="service-row">
							<div class="col service-name">{service.service}</div>
							<div class="col">{service.jobs}</div>
							<div class="col revenue">${(service.revenue / 1000).toFixed(0)}K</div>
							<div class="col">
								<div class="performance-bar">
									<div class="performance-fill" style="width: {(service.revenue / 250000) * 100}%"></div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Key Metrics Dashboard -->
		{#if selectedChart === 'metrics'}
			<div class="chart-section">
				<h3 class="blue-text">--- KEY PERFORMANCE INDICATORS ---</h3>
				<div class="metrics-grid">
					{#each performanceMetrics as metric}
						<div class="metric-card">
							<div class="metric-title">{metric.metric}</div>
							<div class="metric-values">
								<div class="metric-current">{metric.current}</div>
								<div class="metric-target">Target: {metric.target}</div>
							</div>
							<div class="metric-trend">
								<span class="trend-indicator {metric.trend}">
									{metric.trend === 'up' ? '▲' : '▼'}
								</span>
								<span class="trend-text">
									{metric.trend === 'up' ? 'Above Target' : 'Below Target'}
								</span>
							</div>
							<div class="metric-gauge">
								<div class="gauge-fill" style="width: {Math.min((metric.current / metric.target) * 100, 100)}%"></div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Data Summary -->
		<div class="summary-section">
			<h3 class="blue-text">--- DATA INSIGHTS ---</h3>
			<div class="insights-text">
				<div class="insight-item">
					<span class="blue-text">• REVENUE PERFORMANCE:</span> 
					<span>Q2 showing 34% growth over Q1 targets</span>
				</div>
				<div class="insight-item">
					<span class="blue-text">• CUSTOMER TRENDS:</span> 
					<span>Small business segment driving 51% of total volume</span>
				</div>
				<div class="insight-item">
					<span class="blue-text">• SERVICE OPTIMIZATION:</span> 
					<span>Express delivery outperforming with highest margins</span>
				</div>
				<div class="insight-item">
					<span class="blue-text">• OPERATIONAL EXCELLENCE:</span> 
					<span>On-time delivery rate exceeding industry standards</span>
				</div>
			</div>
		</div>

		<!-- Command Prompt -->
		<div class="command-prompt">
			<span class="red-text">([MGMT] Business Intelligence - {selectedChart.toUpperCase()} Chart Active)</span>
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

	.purple-text {
		color: purple;
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
		background-color: #8800cc;
		color: white;
		text-decoration: none;
		font-size: 10px;
		font-weight: bold;
		border: 1px solid #6600aa;
	}

	.nav-link:hover {
		background-color: #6600aa;
	}

	.user-info {
		margin: 20px 0;
	}

	.user-info p {
		margin: 5px 0;
	}

	.controls-section {
		margin: 30px 0;
		padding: 20px;
		border: 2px solid #8800cc;
		background-color: #f8f0ff;
	}

	.controls-section h3 {
		margin: 0 0 15px 0;
		text-align: center;
	}

	.controls-row {
		display: grid;
		grid-template-columns: 1fr 1fr 200px;
		gap: 20px;
		align-items: end;
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

	.action-button {
		padding: 8px 12px;
		font-family: 'Courier New', monospace;
		font-size: 12px;
		background-color: #0066cc;
		color: white;
		border: none;
		cursor: pointer;
		font-weight: bold;
		margin-right: 5px;
	}

	.action-button:hover {
		background-color: #004499;
	}

	.chart-section {
		margin: 30px 0;
		padding: 25px;
		border: 2px solid #0066cc;
		background-color: #f8f9fa;
	}

	.chart-section h3 {
		margin: 0 0 25px 0;
		text-align: center;
	}

	/* Bar Chart Styles */
	.bar-chart {
		width: 100%;
	}

	.chart-legend {
		display: flex;
		justify-content: center;
		gap: 30px;
		margin-bottom: 20px;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.legend-color {
		width: 15px;
		height: 15px;
		border: 1px solid #000;
	}

	.legend-color.actual {
		background-color: #8800cc;
	}

	.legend-color.target {
		background-color: #0066cc;
	}

	.chart-container {
		display: flex;
		justify-content: space-around;
		align-items: end;
		height: 300px;
		border-bottom: 2px solid #000;
		border-left: 2px solid #000;
		padding: 10px;
	}

	.bar-group {
		display: flex;
		flex-direction: column;
		align-items: center;
		height: 100%;
	}

	.bars {
		display: flex;
		gap: 5px;
		height: calc(100% - 30px);
		align-items: end;
	}

	.bar {
		width: 25px;
		min-height: 10px;
		position: relative;
		display: flex;
		align-items: end;
		justify-content: center;
	}

	.bar.actual {
		background-color: #8800cc;
	}

	.bar.target {
		background-color: #0066cc;
	}

	.bar-value {
		position: absolute;
		top: -15px;
		font-size: 8px;
		font-weight: bold;
		color: black;
		white-space: nowrap;
	}

	.bar-label {
		margin-top: 10px;
		font-size: 12px;
		font-weight: bold;
		color: blue;
	}

	/* Pie Chart Styles */
	.pie-chart-container {
		max-width: 600px;
		margin: 0 auto;
	}

	.segment-row {
		display: flex;
		align-items: center;
		margin-bottom: 15px;
		gap: 15px;
	}

	.segment-bar {
		width: 200px;
		height: 25px;
		border: 1px solid #000;
		background-color: #f0f0f0;
		position: relative;
	}

	.segment-fill {
		height: 100%;
		transition: width 0.3s ease;
	}

	.segment-info {
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.segment-type {
		font-weight: bold;
		color: purple;
		font-size: 12px;
	}

	.segment-stats {
		font-size: 10px;
		color: blue;
	}

	/* Service Chart Styles */
	.service-chart {
		width: 100%;
	}

	.service-header {
		display: grid;
		grid-template-columns: 200px 100px 120px 1fr;
		background-color: #8800cc;
		color: white;
		font-weight: bold;
		font-size: 12px;
	}

	.service-row {
		display: grid;
		grid-template-columns: 200px 100px 120px 1fr;
		border: 1px solid #ddd;
		background-color: white;
		font-size: 12px;
	}

	.service-row:hover {
		background-color: #f0f0f0;
	}

	.service-name {
		font-weight: bold;
		color: purple;
	}

	.revenue {
		color: green;
		font-weight: bold;
	}

	.performance-bar {
		margin: 5px;
		height: 15px;
		background-color: #f0f0f0;
		border: 1px solid #ccc;
	}

	.performance-fill {
		height: 100%;
		background-color: #008800;
		transition: width 0.3s ease;
	}

	/* Metrics Styles */
	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 20px;
	}

	.metric-card {
		background-color: white;
		border: 2px solid #0066cc;
		padding: 20px;
		text-align: center;
	}

	.metric-title {
		font-size: 12px;
		font-weight: bold;
		color: blue;
		margin-bottom: 10px;
	}

	.metric-current {
		font-size: 24px;
		font-weight: bold;
		color: purple;
		margin-bottom: 5px;
	}

	.metric-target {
		font-size: 10px;
		color: gray;
		margin-bottom: 10px;
	}

	.metric-trend {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 5px;
		margin-bottom: 10px;
	}

	.trend-indicator {
		font-size: 16px;
		font-weight: bold;
	}

	.trend-indicator.up {
		color: green;
	}

	.trend-indicator.down {
		color: red;
	}

	.trend-text {
		font-size: 10px;
		font-weight: bold;
	}

	.metric-gauge {
		height: 10px;
		background-color: #f0f0f0;
		border: 1px solid #ccc;
		margin-top: 10px;
	}

	.gauge-fill {
		height: 100%;
		background-color: #008800;
		transition: width 0.3s ease;
	}

	.summary-section {
		margin: 30px 0;
		padding: 20px;
		border: 2px solid #008800;
		background-color: #f0fff0;
	}

	.summary-section h3 {
		margin: 0 0 15px 0;
		text-align: center;
	}

	.insights-text {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.insight-item {
		font-size: 12px;
		line-height: 1.4;
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

	.col {
		padding: 10px;
		border-right: 1px solid #ddd;
	}

	.col:last-child {
		border-right: none;
	}
</style> 