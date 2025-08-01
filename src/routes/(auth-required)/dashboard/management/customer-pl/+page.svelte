<!-- Customer P&L - Management -->
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

	// Filter parameters
	let filters = {
		customer: '',
		period: 'quarter',
		year: '2024'
	}

	// Mock customer P&L data
	let customerPL = [
		{
			customer: 'ACME Corporation',
			revenue: 245000,
			costs: 198000,
			gross_profit: 47000,
			margin: 19.2,
			jobs: 156,
			avg_job_value: 1571
		},
		{
			customer: 'Tech Solutions Inc',
			revenue: 189000,
			costs: 142000,
			gross_profit: 47000,
			margin: 24.9,
			jobs: 98,
			avg_job_value: 1929
		},
		{
			customer: 'Global Manufacturing',
			revenue: 312000,
			costs: 267000,
			gross_profit: 45000,
			margin: 14.4,
			jobs: 203,
			avg_job_value: 1537
		},
		{
			customer: 'Medical Supplies Co',
			revenue: 87000,
			costs: 61000,
			gross_profit: 26000,
			margin: 29.9,
			jobs: 45,
			avg_job_value: 1933
		}
	]

	let showResults = true

	// Summary totals
	$: totalRevenue = customerPL.reduce((sum, item) => sum + item.revenue, 0)
	$: totalCosts = customerPL.reduce((sum, item) => sum + item.costs, 0)
	$: totalProfit = customerPL.reduce((sum, item) => sum + item.gross_profit, 0)
	$: overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

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

	function applyFilters() {
		// TODO: Implement actual filtering logic
		console.log('Applying filters:', filters)
		showResults = true
	}

	function exportReport() {
		// TODO: Implement export functionality
		alert('Export functionality will be implemented here')
	}

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0
		}).format(amount)
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
			<span class="red-text">MANAGEMENT PORTAL - CUSTOMER P&L ANALYSIS</span>
		</div>

		<!-- Navigation -->
		<div class="nav-section">
			<a href="/dashboard/management" class="nav-link">⬅ BACK TO MANAGEMENT MENU</a>
		</div>

		<!-- User Information -->
		{#if user && userProfile}
			<div class="user-info">
				<p class="blue-text">Status: <span class="purple-text">MANAGEMENT ACCESS</span></p>
				<p class="blue-text">Function: CUSTOMER PROFITABILITY</p>
			</div>
		{/if}

		<!-- Filters Section -->
		<div class="filters-section">
			<h3 class="blue-text">--- REPORT PARAMETERS ---</h3>
			<div class="filters-form">
				<div class="filter-row">
					<div class="form-group">
						<label class="blue-text">CUSTOMER:</label>
						<select bind:value={filters.customer} class="form-input">
							<option value="">ALL CUSTOMERS</option>
							<option value="acme">ACME Corporation</option>
							<option value="tech">Tech Solutions Inc</option>
							<option value="global">Global Manufacturing</option>
							<option value="medical">Medical Supplies Co</option>
						</select>
					</div>
					<div class="form-group">
						<label class="blue-text">PERIOD:</label>
						<select bind:value={filters.period} class="form-input">
							<option value="month">MONTHLY</option>
							<option value="quarter">QUARTERLY</option>
							<option value="year">YEARLY</option>
						</select>
					</div>
					<div class="form-group">
						<label class="blue-text">YEAR:</label>
						<select bind:value={filters.year} class="form-input">
							<option value="2024">2024</option>
							<option value="2023">2023</option>
							<option value="2022">2022</option>
						</select>
					</div>
					<div class="form-group">
						<button on:click={applyFilters} class="filter-button">APPLY</button>
						<button on:click={exportReport} class="export-button">EXPORT</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Summary KPIs -->
		<div class="summary-section">
			<h3 class="blue-text">--- FINANCIAL SUMMARY ---</h3>
			<div class="kpi-grid">
				<div class="kpi-card">
					<div class="kpi-title">TOTAL REVENUE</div>
					<div class="kpi-value">{formatCurrency(totalRevenue)}</div>
				</div>
				<div class="kpi-card">
					<div class="kpi-title">TOTAL COSTS</div>
					<div class="kpi-value costs">{formatCurrency(totalCosts)}</div>
				</div>
				<div class="kpi-card">
					<div class="kpi-title">GROSS PROFIT</div>
					<div class="kpi-value profit">{formatCurrency(totalProfit)}</div>
				</div>
				<div class="kpi-card">
					<div class="kpi-title">OVERALL MARGIN</div>
					<div class="kpi-value">{overallMargin.toFixed(1)}%</div>
				</div>
			</div>
		</div>

		<!-- P&L Results Table -->
		{#if showResults}
			<div class="results-section">
				<h3 class="blue-text">--- CUSTOMER PROFITABILITY ANALYSIS ---</h3>
				<div class="results-table">
					<div class="table-header">
						<div class="col">CUSTOMER</div>
						<div class="col">REVENUE</div>
						<div class="col">COSTS</div>
						<div class="col">GROSS PROFIT</div>
						<div class="col">MARGIN %</div>
						<div class="col">JOBS</div>
						<div class="col">AVG JOB VALUE</div>
					</div>
					{#each customerPL as customer}
						<div class="table-row">
							<div class="col customer-name">{customer.customer}</div>
							<div class="col revenue">{formatCurrency(customer.revenue)}</div>
							<div class="col costs">{formatCurrency(customer.costs)}</div>
							<div class="col profit">{formatCurrency(customer.gross_profit)}</div>
							<div class="col margin" class:high-margin={customer.margin >= 25} class:low-margin={customer.margin < 15}>
								{customer.margin.toFixed(1)}%
							</div>
							<div class="col">{customer.jobs}</div>
							<div class="col">{formatCurrency(customer.avg_job_value)}</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Performance Insights -->
		<div class="insights-section">
			<h3 class="blue-text">--- PERFORMANCE INSIGHTS ---</h3>
			<div class="insights-grid">
				<div class="insight-card">
					<div class="insight-title">TOP PERFORMER</div>
					<div class="insight-value">Medical Supplies Co</div>
					<div class="insight-detail">29.9% margin</div>
				</div>
				<div class="insight-card">
					<div class="insight-title">HIGHEST VOLUME</div>
					<div class="insight-value">Global Manufacturing</div>
					<div class="insight-detail">203 jobs completed</div>
				</div>
				<div class="insight-card">
					<div class="insight-title">IMPROVEMENT NEEDED</div>
					<div class="insight-value">Global Manufacturing</div>
					<div class="insight-detail">14.4% margin (below target)</div>
				</div>
			</div>
		</div>

		<!-- Command Prompt -->
		<div class="command-prompt">
			<span class="red-text">([MGMT] P&L Analysis Module - Financial Data Active)</span>
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

	.filters-section {
		margin: 30px 0;
		padding: 20px;
		border: 2px solid #8800cc;
		background-color: #f8f0ff;
	}

	.filters-section h3 {
		margin: 0 0 15px 0;
		text-align: center;
	}

	.filter-row {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr 200px;
		gap: 15px;
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

	.filter-button {
		padding: 8px 15px;
		font-family: 'Courier New', monospace;
		font-size: 12px;
		background-color: #008800;
		color: white;
		border: none;
		cursor: pointer;
		font-weight: bold;
		margin-right: 5px;
	}

	.filter-button:hover {
		background-color: #006600;
	}

	.export-button {
		padding: 8px 15px;
		font-family: 'Courier New', monospace;
		font-size: 12px;
		background-color: #0066cc;
		color: white;
		border: none;
		cursor: pointer;
		font-weight: bold;
	}

	.export-button:hover {
		background-color: #004499;
	}

	.summary-section {
		margin: 30px 0;
		padding: 20px;
		border: 2px solid #0066cc;
		background-color: #f8f9fa;
	}

	.summary-section h3 {
		margin: 0 0 20px 0;
		text-align: center;
	}

	.kpi-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 15px;
	}

	.kpi-card {
		background-color: white;
		border: 1px solid #ddd;
		padding: 15px;
		text-align: center;
	}

	.kpi-title {
		font-size: 10px;
		color: blue;
		font-weight: bold;
		margin-bottom: 8px;
	}

	.kpi-value {
		font-size: 18px;
		font-weight: bold;
		color: purple;
	}

	.kpi-value.costs {
		color: red;
	}

	.kpi-value.profit {
		color: green;
	}

	.results-section {
		margin: 30px 0;
		padding: 20px;
		border: 2px solid #ff8800;
		background-color: #fff8f0;
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
		grid-template-columns: 200px 120px 120px 120px 80px 80px 120px;
		background-color: #8800cc;
		color: white;
		font-weight: bold;
		font-size: 10px;
	}

	.table-row {
		display: grid;
		grid-template-columns: 200px 120px 120px 120px 80px 80px 120px;
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

	.customer-name {
		font-weight: bold;
		color: purple;
	}

	.revenue {
		color: blue;
		font-weight: bold;
	}

	.costs {
		color: red;
		font-weight: bold;
	}

	.profit {
		color: green;
		font-weight: bold;
	}

	.margin.high-margin {
		color: green;
		font-weight: bold;
	}

	.margin.low-margin {
		color: red;
		font-weight: bold;
	}

	.insights-section {
		margin: 30px 0;
		padding: 20px;
		border: 2px solid #008800;
		background-color: #f0fff0;
	}

	.insights-section h3 {
		margin: 0 0 20px 0;
		text-align: center;
	}

	.insights-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 15px;
	}

	.insight-card {
		background-color: white;
		border: 1px solid #ddd;
		padding: 15px;
		text-align: center;
	}

	.insight-title {
		font-size: 10px;
		color: blue;
		font-weight: bold;
		margin-bottom: 8px;
	}

	.insight-value {
		font-size: 14px;
		font-weight: bold;
		color: purple;
		margin-bottom: 5px;
	}

	.insight-detail {
		font-size: 10px;
		color: green;
		font-weight: bold;
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