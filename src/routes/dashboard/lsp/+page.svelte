<!-- LSP Dashboard -->
<script lang="ts">
	import { onMount } from 'svelte'
	import { getCurrentUser } from '$lib/auth'
	import { getCurrentUserProfile } from '$lib/userService'
	import type { User } from '@supabase/supabase-js'
	import type { UserProfile } from '$lib/types'

	
	let user: User | null = null
	let userProfile: UserProfile | null = null

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
</script>

<div class="terminal-container">
	<div class="main-content">
		<!-- Page Title -->
		<div class="page-header">
			<h1 class="page-title">LSP DASHBOARD - OVERVIEW</h1>
		</div>

		<!-- Service Status Overview -->
		<div class="kpi-section">
			<h3 class="blue-text">--- SERVICE STATUS OVERVIEW ---</h3>
			<div class="kpi-grid">
				<div class="kpi-card">
					<div class="kpi-title">ACTIVE CONTRACTS</div>
					<div class="kpi-value">34</div>
					<div class="kpi-trend operational">OPERATIONAL</div>
				</div>
				<div class="kpi-card">
					<div class="kpi-title">PENDING REQUESTS</div>
					<div class="kpi-value">7</div>
					<div class="kpi-trend pending">REVIEW REQUIRED</div>
				</div>
				<div class="kpi-card">
					<div class="kpi-title">FLEET UTILIZATION</div>
					<div class="kpi-value">78%</div>
					<div class="kpi-trend positive">▲ OPTIMAL</div>
				</div>
				<div class="kpi-card">
					<div class="kpi-title">SLA COMPLIANCE</div>
					<div class="kpi-value">96.2%</div>
					<div class="kpi-trend excellent">▲ EXCEEDS TARGET</div>
				</div>
			</div>
		</div>

		<!-- Recent Activity -->
		<div class="activity-section">
			<h3 class="blue-text">--- RECENT ACTIVITY ---</h3>
			<div class="activity-list">
				<div class="activity-item">
					<span class="activity-time">14:32</span>
					<span class="activity-desc">New service request from ACME Corp - Priority: URGENT</span>
					<span class="activity-status new">NEW</span>
				</div>
				<div class="activity-item">
					<span class="activity-time">13:45</span>
					<span class="activity-desc">Time confirmation received for Job #QT-2024-0157</span>
					<span class="activity-status confirmed">CONFIRMED</span>
				</div>
				<div class="activity-item">
					<span class="activity-time">12:18</span>
					<span class="activity-desc">Dispute resolution completed for Job #QT-2024-0143</span>
					<span class="activity-status resolved">RESOLVED</span>
				</div>
				<div class="activity-item">
					<span class="activity-time">11:30</span>
					<span class="activity-desc">Accrual adjustment approved - $2,450.00</span>
					<span class="activity-status approved">APPROVED</span>
				</div>
			</div>
		</div>

		<!-- Support Message -->
		<div class="support-message">
			<p class="blue-text">LSP Portal: Logistics coordination and service management</p>
			<p class="blue-text">Partner support available 24/7 via LSP-HOTLINE</p>
		</div>

		<!-- Command Prompt -->
		<div class="command-prompt">
			<span class="red-text">([LSP] Logistics Service Provider Terminal)</span>
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
		max-width: 1000px;
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

	.green-text {
		color: green;
		font-weight: bold;
	}

	.system-title {
		margin: 20px 0;
		text-align: left;
	}

	.user-info {
		margin: 20px 0;
	}

	.user-info p,
	.support-message p {
		margin: 5px 0;
	}

	.admin-nav {
		margin-top: 10px;
	}

	.admin-link {
		color: red;
		text-decoration: none;
		font-weight: bold;
	}

	.admin-link:hover {
		text-decoration: underline;
	}

	.dashboard-section {
		margin: 30px 0;
		padding: 15px;
		border: 2px solid #00cc44;
		background-color: #f0fff0;
	}

	.dashboard-section h3 {
		margin: 0 0 15px 0;
		text-align: center;
	}

	.dashboard-menu {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.menu-item {
		display: block;
		padding: 12px 15px;
		background-color: white;
		border: 1px solid #ccc;
		color: blue;
		font-weight: bold;
		font-family: 'Courier New', monospace;
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.menu-item:hover {
		background-color: #e0e0e0;
		color: red;
		text-decoration: none;
	}

	.lsp-item {
		border-left: 4px solid green;
	}

	.kpi-section {
		margin: 30px 0;
		padding: 15px;
		border: 2px solid #0066cc;
		background-color: #f8f9fa;
	}

	.kpi-section h3 {
		margin: 0 0 15px 0;
		text-align: center;
	}

	.kpi-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
		font-size: 24px;
		color: black;
		font-weight: bold;
		margin-bottom: 5px;
	}

	.kpi-trend {
		font-size: 10px;
		font-weight: bold;
	}

	.kpi-trend.positive {
		color: green;
	}

	.kpi-trend.negative {
		color: red;
	}

	.kpi-trend.operational {
		color: green;
	}

	.kpi-trend.pending {
		color: orange;
	}

	.kpi-trend.excellent {
		color: green;
	}

	.activity-section {
		margin: 30px 0;
		padding: 15px;
		border: 2px solid #6600cc;
		background-color: #faf9ff;
	}

	.activity-section h3 {
		margin: 0 0 15px 0;
		text-align: center;
	}

	.activity-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.activity-item {
		display: grid;
		grid-template-columns: 60px 1fr 100px;
		gap: 10px;
		padding: 8px;
		background-color: white;
		border: 1px solid #ddd;
		align-items: center;
	}

	.activity-time {
		font-size: 10px;
		color: blue;
		font-weight: bold;
	}

	.activity-desc {
		font-size: 11px;
		color: black;
	}

	.activity-status {
		font-size: 9px;
		font-weight: bold;
		text-align: center;
		padding: 2px 4px;
		border-radius: 2px;
	}

	.activity-status.new {
		background-color: #ffe0e0;
		color: red;
	}

	.activity-status.confirmed {
		background-color: #e0ffe0;
		color: green;
	}

	.activity-status.resolved {
		background-color: #e0e0ff;
		color: blue;
	}

	.activity-status.approved {
		background-color: #fff0e0;
		color: orange;
	}

	.command-prompt {
		margin: 20px 0;
	}

	.logout-section {
		margin-top: 30px;
		text-align: center;
	}

	.logout-button {
		background-color: red;
		color: white;
		border: none;
		padding: 10px 20px;
		font-family: 'Courier New', monospace;
		font-weight: bold;
		cursor: pointer;
		font-size: 12px;
	}

	.logout-button:hover {
		background-color: darkred;
	}

	.logout-button:disabled {
		background-color: #666;
		cursor: not-allowed;
	}
</style> 