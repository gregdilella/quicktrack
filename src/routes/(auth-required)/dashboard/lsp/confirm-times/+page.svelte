<!-- LSP Confirm Times -->
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
	
	// Filter options
	let statusFilter = 'ALL'
	let priorityFilter = 'ALL'
	let dateFilter = ''
	let customerFilter = ''
	
	// Mock time confirmation data
	let timeConfirmations = [
		{
			id: 'TC-2024-0001',
			jobId: 'QT-2024-0157',
			customer: 'ACME Corporation',
			serviceType: 'Express Delivery',
			priority: 'URGENT',
			status: 'PENDING_CONFIRMATION',
			proposedPickup: '2024-01-16 09:00',
			proposedDelivery: '2024-01-18 14:00',
			confirmationDeadline: '2024-01-15 17:00',
			route: 'New York, NY → Los Angeles, CA',
			specialRequirements: 'Temperature controlled',
			customerRequested: '2024-01-16 08:00',
			lastUpdated: '2024-01-15 10:30',
			notes: 'Customer prefers morning pickup'
		},
		{
			id: 'TC-2024-0002',
			jobId: 'QT-2024-0158',
			customer: 'Global Tech Solutions',
			serviceType: 'Standard Ground',
			priority: 'STANDARD',
			status: 'CONFIRMED',
			proposedPickup: '2024-01-17 13:00',
			proposedDelivery: '2024-01-20 11:00',
			confirmationDeadline: '2024-01-16 12:00',
			route: 'Chicago, IL → Miami, FL',
			specialRequirements: 'None',
			customerRequested: '2024-01-17 14:00',
			lastUpdated: '2024-01-15 14:45',
			confirmedBy: 'LSP Coordinator',
			notes: 'Confirmed with customer via phone'
		},
		{
			id: 'TC-2024-0003',
			jobId: 'QT-2024-0159',
			customer: 'Manufacturing Plus',
			serviceType: 'Air Freight',
			priority: 'EXPRESS',
			status: 'REJECTED',
			proposedPickup: '2024-01-16 15:00',
			proposedDelivery: '2024-01-17 10:00',
			confirmationDeadline: '2024-01-15 18:00',
			route: 'Detroit, MI → Seattle, WA',
			specialRequirements: 'Industrial handling',
			customerRequested: '2024-01-16 12:00',
			lastUpdated: '2024-01-15 16:20',
			rejectedBy: 'Customer',
			rejectionReason: 'Pickup time conflicts with production schedule',
			notes: 'Customer requesting earlier pickup'
		},
		{
			id: 'TC-2024-0004',
			jobId: 'QT-2024-0160',
			customer: 'Pharma Logistics',
			serviceType: 'Critical Same Day',
			priority: 'CRITICAL',
			status: 'OVERDUE',
			proposedPickup: '2024-01-15 16:00',
			proposedDelivery: '2024-01-15 20:00',
			confirmationDeadline: '2024-01-15 15:00',
			route: 'Boston, MA → Philadelphia, PA',
			specialRequirements: 'Cold chain, signatures required',
			customerRequested: '2024-01-15 15:30',
			lastUpdated: '2024-01-15 15:45',
			notes: 'URGENT: Critical pharmaceutical delivery'
		},
		{
			id: 'TC-2024-0005',
			jobId: 'QT-2024-0161',
			customer: 'Retail Solutions Inc',
			serviceType: 'LTL Freight',
			priority: 'STANDARD',
			status: 'RESCHEDULED',
			proposedPickup: '2024-01-18 10:00',
			proposedDelivery: '2024-01-22 15:00',
			confirmationDeadline: '2024-01-17 16:00',
			route: 'Phoenix, AZ → Denver, CO',
			specialRequirements: 'Palletized',
			customerRequested: '2024-01-19 09:00',
			lastUpdated: '2024-01-15 12:10',
			rescheduledBy: 'LSP Operations',
			rescheduleReason: 'Vehicle maintenance schedule conflict',
			notes: 'Rescheduled to accommodate customer preference'
		}
	]
	
	// Selected confirmation for details
	let selectedConfirmation: any = null
	
	// Filter the confirmations based on selected filters
	$: filteredConfirmations = timeConfirmations.filter(confirmation => {
		if (statusFilter !== 'ALL' && confirmation.status !== statusFilter) return false
		if (priorityFilter !== 'ALL' && confirmation.priority !== priorityFilter) return false
		if (customerFilter && !confirmation.customer.toLowerCase().includes(customerFilter.toLowerCase())) return false
		if (dateFilter && !confirmation.proposedPickup.startsWith(dateFilter)) return false
		return true
	})

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
	
	function selectConfirmation(confirmation: any) {
		selectedConfirmation = confirmation
	}
	
	function closeDetails() {
		selectedConfirmation = null
	}
	
	function confirmTime(confirmationId: string) {
		// In a real app, this would make an API call
		console.log('Confirming time for:', confirmationId)
		const confirmation = timeConfirmations.find(c => c.id === confirmationId)
		if (confirmation) {
			confirmation.status = 'CONFIRMED'
			confirmation.confirmedBy = 'LSP Coordinator'
			confirmation.lastUpdated = new Date().toISOString().slice(0, 16)
		}
		selectedConfirmation = null
	}
	
	function rejectTime(confirmationId: string, reason: string) {
		// In a real app, this would make an API call
		console.log('Rejecting time for:', confirmationId, 'Reason:', reason)
		const confirmation = timeConfirmations.find(c => c.id === confirmationId)
		if (confirmation) {
			confirmation.status = 'REJECTED'
			confirmation.rejectedBy = 'LSP Coordinator'
			confirmation.rejectionReason = reason
			confirmation.lastUpdated = new Date().toISOString().slice(0, 16)
		}
		selectedConfirmation = null
	}
	
	function rescheduleTime(confirmationId: string, newPickup: string, newDelivery: string) {
		// In a real app, this would make an API call
		console.log('Rescheduling:', confirmationId, 'New pickup:', newPickup, 'New delivery:', newDelivery)
		const confirmation = timeConfirmations.find(c => c.id === confirmationId)
		if (confirmation) {
			confirmation.status = 'RESCHEDULED'
			confirmation.proposedPickup = newPickup
			confirmation.proposedDelivery = newDelivery
			confirmation.rescheduledBy = 'LSP Coordinator'
			confirmation.lastUpdated = new Date().toISOString().slice(0, 16)
		}
		selectedConfirmation = null
	}
	
	// Current time for checking overdue items
	let currentTime = new Date().toISOString().slice(0, 16)
	
	// Check if confirmation is overdue
	function isOverdue(deadline: string): boolean {
		return new Date(deadline) < new Date(currentTime)
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
			<span class="red-text">LSP INTERFACE - CONFIRM TIMES</span>
		</div>

		<!-- Navigation -->
		<div class="nav-section">
			<a href="/dashboard/lsp" class="nav-link">⬅ BACK TO LSP MENU</a>
			{#if userProfile?.role === 'Admin'}
				<a href="/dashboard/admin" class="admin-link">⬅ RETURN TO ADMIN PANEL</a>
			{/if}
		</div>

		<!-- User Information -->
		{#if user && userProfile}
			<div class="user-info">
				<p class="blue-text">Status: <span class="green-text">LSP PROVIDER ACCESS</span></p>
				<p class="blue-text">User: {user.email?.toUpperCase()}</p>
			</div>
		{/if}

		<!-- Filter Section -->
		<div class="filter-section">
			<h3 class="blue-text">--- TIME CONFIRMATION FILTERS ---</h3>
			<div class="filter-grid">
				<div class="filter-group">
					<label class="blue-text" for="status">Status:</label>
					<select id="status" bind:value={statusFilter} class="filter-select">
						<option value="ALL">ALL STATUSES</option>
						<option value="PENDING_CONFIRMATION">PENDING CONFIRMATION</option>
						<option value="CONFIRMED">CONFIRMED</option>
						<option value="REJECTED">REJECTED</option>
						<option value="RESCHEDULED">RESCHEDULED</option>
						<option value="OVERDUE">OVERDUE</option>
					</select>
				</div>
				
				<div class="filter-group">
					<label class="blue-text" for="priority">Priority:</label>
					<select id="priority" bind:value={priorityFilter} class="filter-select">
						<option value="ALL">ALL PRIORITIES</option>
						<option value="CRITICAL">CRITICAL</option>
						<option value="URGENT">URGENT</option>
						<option value="EXPRESS">EXPRESS</option>
						<option value="STANDARD">STANDARD</option>
					</select>
				</div>
				
				<div class="filter-group">
					<label class="blue-text" for="customer">Customer:</label>
					<input 
						id="customer" 
						type="text" 
						bind:value={customerFilter} 
						placeholder="Search by customer name"
						class="filter-input"
					/>
				</div>
				
				<div class="filter-group">
					<label class="blue-text" for="date">Pickup Date:</label>
					<input 
						id="date" 
						type="date" 
						bind:value={dateFilter} 
						class="filter-input"
					/>
				</div>
			</div>
		</div>

		<!-- Summary Section -->
		<div class="summary-section">
			<h3 class="blue-text">--- CONFIRMATION SUMMARY ---</h3>
			<div class="summary-grid">
				<div class="summary-card">
					<div class="summary-title">TOTAL CONFIRMATIONS</div>
					<div class="summary-value">{filteredConfirmations.length}</div>
				</div>
				<div class="summary-card">
					<div class="summary-title">PENDING</div>
					<div class="summary-value pending">{filteredConfirmations.filter(c => c.status === 'PENDING_CONFIRMATION').length}</div>
				</div>
				<div class="summary-card">
					<div class="summary-title">OVERDUE</div>
					<div class="summary-value overdue">{filteredConfirmations.filter(c => c.status === 'OVERDUE' || isOverdue(c.confirmationDeadline)).length}</div>
				</div>
				<div class="summary-card">
					<div class="summary-title">CONFIRMED TODAY</div>
					<div class="summary-value confirmed">{filteredConfirmations.filter(c => c.status === 'CONFIRMED' && c.lastUpdated.startsWith(new Date().toISOString().slice(0, 10))).length}</div>
				</div>
			</div>
		</div>

		<!-- Confirmations Table -->
		<div class="table-section">
			<h3 class="blue-text">--- TIME CONFIRMATIONS ---</h3>
			<div class="table-container">
				<table class="confirmations-table">
					<thead>
						<tr>
							<th>CONFIRMATION ID</th>
							<th>JOB ID</th>
							<th>CUSTOMER</th>
							<th>PRIORITY</th>
							<th>STATUS</th>
							<th>PROPOSED PICKUP</th>
							<th>PROPOSED DELIVERY</th>
							<th>DEADLINE</th>
							<th>ACTIONS</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredConfirmations as confirmation}
							<tr class="confirmation-row" 
								class:critical={confirmation.priority === 'CRITICAL'}
								class:overdue={confirmation.status === 'OVERDUE' || isOverdue(confirmation.confirmationDeadline)}
							>
								<td class="confirmation-id">{confirmation.id}</td>
								<td class="job-id">{confirmation.jobId}</td>
								<td>{confirmation.customer}</td>
								<td class="priority priority-{confirmation.priority.toLowerCase()}">{confirmation.priority}</td>
								<td class="status status-{confirmation.status.toLowerCase().replace('_', '-')}">{confirmation.status.replace('_', ' ')}</td>
								<td class="datetime">{confirmation.proposedPickup}</td>
								<td class="datetime">{confirmation.proposedDelivery}</td>
								<td class="deadline" class:overdue={isOverdue(confirmation.confirmationDeadline)}>{confirmation.confirmationDeadline}</td>
								<td>
									<button 
										on:click={() => selectConfirmation(confirmation)}
										class="action-button view-button"
									>
										VIEW
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<!-- Command Prompt -->
		<div class="command-prompt">
			<span class="red-text">([LSP-TIMES] Time Confirmation Management Terminal)</span>
		</div>

		<!-- Logout Button -->
		<div class="logout-section">
			<button on:click={handleSignOut} disabled={loading} class="logout-button">
				{loading ? 'SIGNING OUT...' : 'LOGOUT'}
			</button>
		</div>
	</div>
	
	<!-- Confirmation Details Modal -->
	{#if selectedConfirmation}
		<div class="modal-overlay" on:click={closeDetails}>
			<div class="modal-content" on:click|stopPropagation>
				<div class="modal-header">
					<h3 class="blue-text">TIME CONFIRMATION - {selectedConfirmation.id}</h3>
					<button on:click={closeDetails} class="close-button">✕</button>
				</div>
				
				<div class="modal-body">
					<div class="details-grid">
						<div class="detail-section">
							<h4 class="blue-text">JOB INFORMATION</h4>
							<div class="detail-row">
								<span class="detail-label">Job ID:</span>
								<span class="detail-value">{selectedConfirmation.jobId}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Customer:</span>
								<span class="detail-value">{selectedConfirmation.customer}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Service Type:</span>
								<span class="detail-value">{selectedConfirmation.serviceType}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Priority:</span>
								<span class="detail-value priority-{selectedConfirmation.priority.toLowerCase()}">{selectedConfirmation.priority}</span>
							</div>
						</div>
						
						<div class="detail-section">
							<h4 class="blue-text">TIMING DETAILS</h4>
							<div class="detail-row">
								<span class="detail-label">Proposed Pickup:</span>
								<span class="detail-value">{selectedConfirmation.proposedPickup}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Proposed Delivery:</span>
								<span class="detail-value">{selectedConfirmation.proposedDelivery}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Customer Requested:</span>
								<span class="detail-value">{selectedConfirmation.customerRequested}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Confirmation Deadline:</span>
								<span class="detail-value" class:overdue={isOverdue(selectedConfirmation.confirmationDeadline)}>{selectedConfirmation.confirmationDeadline}</span>
							</div>
						</div>
						
						<div class="detail-section">
							<h4 class="blue-text">ROUTE & REQUIREMENTS</h4>
							<div class="detail-row">
								<span class="detail-label">Route:</span>
								<span class="detail-value">{selectedConfirmation.route}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Special Requirements:</span>
								<span class="detail-value">{selectedConfirmation.specialRequirements}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Notes:</span>
								<span class="detail-value">{selectedConfirmation.notes}</span>
							</div>
						</div>
						
						<div class="detail-section">
							<h4 class="blue-text">STATUS & HISTORY</h4>
							<div class="detail-row">
								<span class="detail-label">Current Status:</span>
								<span class="detail-value status-{selectedConfirmation.status.toLowerCase().replace('_', '-')}">{selectedConfirmation.status.replace('_', ' ')}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Last Updated:</span>
								<span class="detail-value">{selectedConfirmation.lastUpdated}</span>
							</div>
							{#if selectedConfirmation.confirmedBy}
								<div class="detail-row">
									<span class="detail-label">Confirmed By:</span>
									<span class="detail-value">{selectedConfirmation.confirmedBy}</span>
								</div>
							{/if}
							{#if selectedConfirmation.rejectedBy}
								<div class="detail-row">
									<span class="detail-label">Rejected By:</span>
									<span class="detail-value">{selectedConfirmation.rejectedBy}</span>
								</div>
								<div class="detail-row">
									<span class="detail-label">Rejection Reason:</span>
									<span class="detail-value">{selectedConfirmation.rejectionReason}</span>
								</div>
							{/if}
							{#if selectedConfirmation.rescheduledBy}
								<div class="detail-row">
									<span class="detail-label">Rescheduled By:</span>
									<span class="detail-value">{selectedConfirmation.rescheduledBy}</span>
								</div>
								<div class="detail-row">
									<span class="detail-label">Reschedule Reason:</span>
									<span class="detail-value">{selectedConfirmation.rescheduleReason}</span>
								</div>
							{/if}
						</div>
					</div>
				</div>
				
				<div class="modal-actions">
					{#if selectedConfirmation.status === 'PENDING_CONFIRMATION' || selectedConfirmation.status === 'OVERDUE'}
						<button 
							on:click={() => confirmTime(selectedConfirmation.id)}
							class="action-button confirm-button"
						>
							CONFIRM TIME
						</button>
						<button 
							on:click={() => rejectTime(selectedConfirmation.id, 'Schedule conflict')}
							class="action-button reject-button"
						>
							REJECT TIME
						</button>
						<button 
							on:click={() => rescheduleTime(selectedConfirmation.id, selectedConfirmation.proposedPickup, selectedConfirmation.proposedDelivery)}
							class="action-button reschedule-button"
						>
							RESCHEDULE
						</button>
					{/if}
					<button on:click={closeDetails} class="action-button cancel-button">CLOSE</button>
				</div>
			</div>
		</div>
	{/if}
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

	.green-text {
		color: green;
		font-weight: bold;
	}

	.system-title {
		margin: 20px 0;
		text-align: left;
	}

	.nav-section {
		margin: 20px 0;
		display: flex;
		gap: 20px;
	}

	.nav-link, .admin-link {
		color: red;
		text-decoration: none;
		font-weight: bold;
	}

	.nav-link:hover, .admin-link:hover {
		text-decoration: underline;
	}

	.user-info {
		margin: 20px 0;
	}

	.user-info p {
		margin: 5px 0;
	}

	.filter-section {
		margin: 30px 0;
		padding: 15px;
		border: 2px solid #0066cc;
		background-color: #f8f9fa;
	}

	.filter-section h3 {
		margin: 0 0 15px 0;
		text-align: center;
	}

	.filter-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 15px;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.filter-group label {
		font-size: 12px;
	}

	.filter-select, .filter-input {
		padding: 6px;
		font-family: 'Courier New', monospace;
		font-size: 12px;
		border: 1px solid #ccc;
		background-color: white;
	}

	.summary-section {
		margin: 30px 0;
		padding: 15px;
		border: 2px solid #00cc44;
		background-color: #f0fff0;
	}

	.summary-section h3 {
		margin: 0 0 15px 0;
		text-align: center;
	}

	.summary-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 15px;
	}

	.summary-card {
		background-color: white;
		border: 1px solid #ddd;
		padding: 10px;
		text-align: center;
	}

	.summary-title {
		font-size: 10px;
		color: blue;
		font-weight: bold;
		margin-bottom: 8px;
	}

	.summary-value {
		font-size: 20px;
		font-weight: bold;
		color: black;
	}

	.summary-value.pending {
		color: orange;
	}

	.summary-value.overdue {
		color: red;
		animation: blink 1s infinite;
	}

	.summary-value.confirmed {
		color: green;
	}

	.table-section {
		margin: 30px 0;
		padding: 15px;
		border: 2px solid #6600cc;
		background-color: #faf9ff;
	}

	.table-section h3 {
		margin: 0 0 15px 0;
		text-align: center;
	}

	.table-container {
		overflow-x: auto;
		border: 1px solid #ddd;
	}

	.confirmations-table {
		width: 100%;
		border-collapse: collapse;
		background-color: white;
		font-size: 11px;
	}

	.confirmations-table th,
	.confirmations-table td {
		border: 1px solid #ddd;
		padding: 6px;
		text-align: left;
	}

	.confirmations-table th {
		background-color: #f0f0f0;
		font-weight: bold;
		color: blue;
		font-size: 10px;
	}

	.confirmation-row:hover {
		background-color: #f9f9f9;
	}

	.confirmation-row.critical {
		background-color: #ffe0e0;
	}

	.confirmation-row.overdue {
		background-color: #ffcccc;
		animation: pulse 2s infinite;
	}

	.confirmation-id, .job-id {
		font-weight: bold;
		color: blue;
	}

	.priority {
		font-weight: bold;
		text-align: center;
	}

	.priority-critical {
		color: red;
		animation: blink 1s infinite;
	}

	.priority-urgent {
		color: red;
	}

	.priority-express {
		color: orange;
	}

	.priority-standard {
		color: green;
	}

	.status {
		font-weight: bold;
		text-align: center;
		font-size: 10px;
	}

	.status-pending-confirmation {
		color: orange;
	}

	.status-confirmed {
		color: green;
	}

	.status-rejected {
		color: red;
	}

	.status-rescheduled {
		color: blue;
	}

	.status-overdue {
		color: red;
		animation: blink 1s infinite;
	}

	.datetime {
		font-size: 10px;
		font-family: monospace;
	}

	.deadline {
		font-size: 10px;
		font-family: monospace;
		font-weight: bold;
	}

	.deadline.overdue {
		color: red;
		animation: blink 1s infinite;
	}

	.action-button {
		background-color: blue;
		color: white;
		border: none;
		padding: 4px 8px;
		font-family: 'Courier New', monospace;
		font-size: 9px;
		font-weight: bold;
		cursor: pointer;
		margin: 0 2px;
	}

	.action-button:hover {
		background-color: darkblue;
	}

	.view-button {
		background-color: blue;
	}

	.confirm-button {
		background-color: green;
	}

	.confirm-button:hover {
		background-color: darkgreen;
	}

	.reject-button {
		background-color: red;
	}

	.reject-button:hover {
		background-color: darkred;
	}

	.reschedule-button {
		background-color: orange;
	}

	.reschedule-button:hover {
		background-color: darkorange;
	}

	.cancel-button {
		background-color: gray;
	}

	.cancel-button:hover {
		background-color: darkgray;
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

	/* Modal Styles */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.7);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.modal-content {
		background-color: white;
		border: 3px solid #0066cc;
		padding: 20px;
		max-width: 900px;
		width: 90%;
		max-height: 90%;
		overflow-y: auto;
		font-family: 'Courier New', monospace;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
		border-bottom: 2px solid #0066cc;
		padding-bottom: 10px;
	}

	.modal-header h3 {
		margin: 0;
	}

	.close-button {
		background-color: red;
		color: white;
		border: none;
		padding: 5px 10px;
		font-family: 'Courier New', monospace;
		font-weight: bold;
		cursor: pointer;
	}

	.close-button:hover {
		background-color: darkred;
	}

	.modal-body {
		margin-bottom: 20px;
	}

	.details-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 20px;
	}

	.detail-section {
		border: 1px solid #ddd;
		padding: 15px;
		background-color: #f9f9f9;
	}

	.detail-section h4 {
		margin: 0 0 10px 0;
		border-bottom: 1px solid #ccc;
		padding-bottom: 5px;
	}

	.detail-row {
		display: grid;
		grid-template-columns: 140px 1fr;
		gap: 10px;
		margin-bottom: 8px;
		align-items: start;
	}

	.detail-label {
		font-weight: bold;
		color: blue;
		font-size: 11px;
	}

	.detail-value {
		font-size: 11px;
		color: black;
		word-wrap: break-word;
	}

	.detail-value.overdue {
		color: red;
		font-weight: bold;
		animation: blink 1s infinite;
	}

	.modal-actions {
		display: flex;
		gap: 10px;
		justify-content: center;
		border-top: 2px solid #0066cc;
		padding-top: 15px;
	}

	.modal-actions .action-button {
		padding: 8px 16px;
		font-size: 11px;
	}

	@keyframes blink {
		0%, 50% { opacity: 1; }
		51%, 100% { opacity: 0.3; }
	}

	@keyframes pulse {
		0% { background-color: #ffcccc; }
		50% { background-color: #ffe0e0; }
		100% { background-color: #ffcccc; }
	}
</style> 