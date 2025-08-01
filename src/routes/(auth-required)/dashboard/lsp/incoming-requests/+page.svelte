<!-- LSP Incoming Requests -->
<script lang="ts">
	import { onMount } from 'svelte'
	import { getCurrentUser } from '$lib/auth'
	import { getCurrentUserProfile } from '$lib/userService'
	import type { User } from '@supabase/supabase-js'
	import type { UserProfile } from '$lib/types'

	
	let user: User | null = null
	let userProfile: UserProfile | null = null
	
	// Filter options
	let priorityFilter = 'ALL'
	let statusFilter = 'ALL'
	let customerFilter = ''
	let dateFromFilter = ''
	let dateToFilter = ''
	
	// Mock incoming requests data
	let incomingRequests = [
		{
			id: 'REQ-2024-0001',
			customer: 'ACME Corporation',
			contactEmail: 'logistics@acme.com',
			serviceType: 'Express Delivery',
			priority: 'URGENT',
			status: 'NEW',
			requestDate: '2024-01-15',
			requiredDate: '2024-01-17',
			origin: 'New York, NY',
			destination: 'Los Angeles, CA',
			weight: '125 lbs',
			dimensions: '24x18x12 in',
			estimatedValue: '$15,750',
			specialRequirements: 'Temperature controlled',
			notes: 'Fragile medical equipment'
		},
		{
			id: 'REQ-2024-0002',
			customer: 'Global Tech Solutions',
			contactEmail: 'ship@globaltech.net',
			serviceType: 'Standard Ground',
			priority: 'STANDARD',
			status: 'REVIEW',
			requestDate: '2024-01-15',
			requiredDate: '2024-01-20',
			origin: 'Chicago, IL',
			destination: 'Miami, FL',
			weight: '45 lbs',
			dimensions: '12x8x6 in',
			estimatedValue: '$2,300',
			specialRequirements: 'None',
			notes: 'Standard office equipment'
		},
		{
			id: 'REQ-2024-0003',
			customer: 'Manufacturing Plus',
			contactEmail: 'ops@mfgplus.com',
			serviceType: 'Air Freight',
			priority: 'EXPRESS',
			status: 'QUOTED',
			requestDate: '2024-01-14',
			requiredDate: '2024-01-16',
			origin: 'Detroit, MI',
			destination: 'Seattle, WA',
			weight: '2,850 lbs',
			dimensions: '48x36x24 in',
			estimatedValue: '$85,000',
			specialRequirements: 'Industrial handling equipment',
			notes: 'Heavy machinery components'
		},
		{
			id: 'REQ-2024-0004',
			customer: 'Retail Solutions Inc',
			contactEmail: 'logistics@retailsol.com',
			serviceType: 'LTL Freight',
			priority: 'STANDARD',
			status: 'NEW',
			requestDate: '2024-01-15',
			requiredDate: '2024-01-22',
			origin: 'Phoenix, AZ',
			destination: 'Denver, CO',
			weight: '1,250 lbs',
			dimensions: '48x40x36 in',
			estimatedValue: '$12,500',
			specialRequirements: 'Palletized',
			notes: 'Retail merchandise for stores'
		},
		{
			id: 'REQ-2024-0005',
			customer: 'Pharma Logistics',
			contactEmail: 'urgent@pharmalog.com',
			serviceType: 'Critical Same Day',
			priority: 'CRITICAL',
			status: 'ACCEPTED',
			requestDate: '2024-01-15',
			requiredDate: '2024-01-15',
			origin: 'Boston, MA',
			destination: 'Philadelphia, PA',
			weight: '8 lbs',
			dimensions: '8x6x4 in',
			estimatedValue: '$50,000',
			specialRequirements: 'Cold chain, signatures required',
			notes: 'Critical pharmaceutical samples'
		}
	]
	
	// Selected request for details
	let selectedRequest: any = null
	
	// Filter the requests based on selected filters
	$: filteredRequests = incomingRequests.filter(request => {
		if (priorityFilter !== 'ALL' && request.priority !== priorityFilter) return false
		if (statusFilter !== 'ALL' && request.status !== statusFilter) return false
		if (customerFilter && !request.customer.toLowerCase().includes(customerFilter.toLowerCase())) return false
		if (dateFromFilter && request.requestDate < dateFromFilter) return false
		if (dateToFilter && request.requestDate > dateToFilter) return false
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


	
	function selectRequest(request: any) {
		selectedRequest = request
	}
	
	function closeDetails() {
		selectedRequest = null
	}
	
	function acceptRequest(requestId: string) {
		// In a real app, this would make an API call
		console.log('Accepting request:', requestId)
		const request = incomingRequests.find(r => r.id === requestId)
		if (request) {
			request.status = 'ACCEPTED'
		}
		selectedRequest = null
	}
	
	function rejectRequest(requestId: string) {
		// In a real app, this would make an API call
		console.log('Rejecting request:', requestId)
		const request = incomingRequests.find(r => r.id === requestId)
		if (request) {
			request.status = 'REJECTED'
		}
		selectedRequest = null
	}
	
	function requestQuote(requestId: string) {
		// In a real app, this would make an API call
		console.log('Requesting quote for:', requestId)
		const request = incomingRequests.find(r => r.id === requestId)
		if (request) {
			request.status = 'QUOTED'
		}
		selectedRequest = null
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
			<span class="red-text">LSP INTERFACE - INCOMING REQUESTS</span>
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
			<h3 class="blue-text">--- REQUEST FILTERS ---</h3>
			<div class="filter-grid">
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
					<label class="blue-text" for="status">Status:</label>
					<select id="status" bind:value={statusFilter} class="filter-select">
						<option value="ALL">ALL STATUSES</option>
						<option value="NEW">NEW</option>
						<option value="REVIEW">REVIEW</option>
						<option value="QUOTED">QUOTED</option>
						<option value="ACCEPTED">ACCEPTED</option>
						<option value="REJECTED">REJECTED</option>
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
					<label class="blue-text" for="dateFrom">Date From:</label>
					<input 
						id="dateFrom" 
						type="date" 
						bind:value={dateFromFilter} 
						class="filter-input"
					/>
				</div>
				
				<div class="filter-group">
					<label class="blue-text" for="dateTo">Date To:</label>
					<input 
						id="dateTo" 
						type="date" 
						bind:value={dateToFilter} 
						class="filter-input"
					/>
				</div>
			</div>
		</div>

		<!-- Requests Summary -->
		<div class="summary-section">
			<h3 class="blue-text">--- REQUESTS SUMMARY ---</h3>
			<div class="summary-grid">
				<div class="summary-card">
					<div class="summary-title">TOTAL REQUESTS</div>
					<div class="summary-value">{filteredRequests.length}</div>
				</div>
				<div class="summary-card">
					<div class="summary-title">NEW REQUESTS</div>
					<div class="summary-value new">{filteredRequests.filter(r => r.status === 'NEW').length}</div>
				</div>
				<div class="summary-card">
					<div class="summary-title">CRITICAL PRIORITY</div>
					<div class="summary-value critical">{filteredRequests.filter(r => r.priority === 'CRITICAL').length}</div>
				</div>
				<div class="summary-card">
					<div class="summary-title">PENDING RESPONSE</div>
					<div class="summary-value pending">{filteredRequests.filter(r => r.status === 'REVIEW' || r.status === 'NEW').length}</div>
				</div>
			</div>
		</div>

		<!-- Requests Table -->
		<div class="table-section">
			<h3 class="blue-text">--- INCOMING SERVICE REQUESTS ---</h3>
			<div class="table-container">
				<table class="requests-table">
					<thead>
						<tr>
							<th>REQUEST ID</th>
							<th>CUSTOMER</th>
							<th>SERVICE TYPE</th>
							<th>PRIORITY</th>
							<th>STATUS</th>
							<th>REQUEST DATE</th>
							<th>REQUIRED DATE</th>
							<th>ROUTE</th>
							<th>ACTIONS</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredRequests as request}
							<tr class="request-row" class:critical={request.priority === 'CRITICAL'}>
								<td class="request-id">{request.id}</td>
								<td>{request.customer}</td>
								<td>{request.serviceType}</td>
								<td class="priority priority-{request.priority.toLowerCase()}">{request.priority}</td>
								<td class="status status-{request.status.toLowerCase()}">{request.status}</td>
								<td>{request.requestDate}</td>
								<td>{request.requiredDate}</td>
								<td class="route">{request.origin} → {request.destination}</td>
								<td>
									<button 
										on:click={() => selectRequest(request)}
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
			<span class="red-text">([LSP-REQUESTS] Service Request Management Terminal)</span>
		</div>
	</div>
	
	<!-- Request Details Modal -->
	{#if selectedRequest}
		<div class="modal-overlay" on:click={closeDetails}>
			<div class="modal-content" on:click|stopPropagation>
				<div class="modal-header">
					<h3 class="blue-text">REQUEST DETAILS - {selectedRequest.id}</h3>
					<button on:click={closeDetails} class="close-button">✕</button>
				</div>
				
				<div class="modal-body">
					<div class="details-grid">
						<div class="detail-section">
							<h4 class="blue-text">CUSTOMER INFORMATION</h4>
							<div class="detail-row">
								<span class="detail-label">Customer:</span>
								<span class="detail-value">{selectedRequest.customer}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Contact:</span>
								<span class="detail-value">{selectedRequest.contactEmail}</span>
							</div>
						</div>
						
						<div class="detail-section">
							<h4 class="blue-text">SERVICE DETAILS</h4>
							<div class="detail-row">
								<span class="detail-label">Service Type:</span>
								<span class="detail-value">{selectedRequest.serviceType}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Priority:</span>
								<span class="detail-value priority-{selectedRequest.priority.toLowerCase()}">{selectedRequest.priority}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Status:</span>
								<span class="detail-value status-{selectedRequest.status.toLowerCase()}">{selectedRequest.status}</span>
							</div>
						</div>
						
						<div class="detail-section">
							<h4 class="blue-text">SHIPMENT INFORMATION</h4>
							<div class="detail-row">
								<span class="detail-label">Origin:</span>
								<span class="detail-value">{selectedRequest.origin}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Destination:</span>
								<span class="detail-value">{selectedRequest.destination}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Weight:</span>
								<span class="detail-value">{selectedRequest.weight}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Dimensions:</span>
								<span class="detail-value">{selectedRequest.dimensions}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Est. Value:</span>
								<span class="detail-value">{selectedRequest.estimatedValue}</span>
							</div>
						</div>
						
						<div class="detail-section">
							<h4 class="blue-text">REQUIREMENTS & NOTES</h4>
							<div class="detail-row">
								<span class="detail-label">Special Requirements:</span>
								<span class="detail-value">{selectedRequest.specialRequirements}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Notes:</span>
								<span class="detail-value">{selectedRequest.notes}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Request Date:</span>
								<span class="detail-value">{selectedRequest.requestDate}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Required Date:</span>
								<span class="detail-value">{selectedRequest.requiredDate}</span>
							</div>
						</div>
					</div>
				</div>
				
				<div class="modal-actions">
					{#if selectedRequest.status === 'NEW' || selectedRequest.status === 'REVIEW'}
						<button 
							on:click={() => acceptRequest(selectedRequest.id)}
							class="action-button accept-button"
						>
							ACCEPT REQUEST
						</button>
						<button 
							on:click={() => requestQuote(selectedRequest.id)}
							class="action-button quote-button"
						>
							REQUEST QUOTE
						</button>
						<button 
							on:click={() => rejectRequest(selectedRequest.id)}
							class="action-button reject-button"
						>
							REJECT REQUEST
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

	.summary-value.new {
		color: red;
	}

	.summary-value.critical {
		color: red;
		animation: blink 1s infinite;
	}

	.summary-value.pending {
		color: orange;
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

	.requests-table {
		width: 100%;
		border-collapse: collapse;
		background-color: white;
		font-size: 11px;
	}

	.requests-table th,
	.requests-table td {
		border: 1px solid #ddd;
		padding: 8px;
		text-align: left;
	}

	.requests-table th {
		background-color: #f0f0f0;
		font-weight: bold;
		color: blue;
		font-size: 10px;
	}

	.request-row:hover {
		background-color: #f9f9f9;
	}

	.request-row.critical {
		background-color: #ffe0e0;
	}

	.request-id {
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
	}

	.status-new {
		color: red;
	}

	.status-review {
		color: orange;
	}

	.status-quoted {
		color: blue;
	}

	.status-accepted {
		color: green;
	}

	.status-rejected {
		color: gray;
	}

	.route {
		font-size: 10px;
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

	.accept-button {
		background-color: green;
	}

	.accept-button:hover {
		background-color: darkgreen;
	}

	.quote-button {
		background-color: orange;
	}

	.quote-button:hover {
		background-color: darkorange;
	}

	.reject-button {
		background-color: red;
	}

	.reject-button:hover {
		background-color: darkred;
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
		max-width: 800px;
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
		grid-template-columns: 120px 1fr;
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
</style> 