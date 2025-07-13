<!-- LSP Dispute -->
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
	let typeFilter = 'ALL'
	let customerFilter = ''
	let dateFromFilter = ''
	let dateToFilter = ''
	
	// Mock dispute data
	let disputes = [
		{
			id: 'DIS-2024-0001',
			jobId: 'QT-2024-0143',
			customer: 'ACME Corporation',
			disputeType: 'BILLING',
			priority: 'HIGH',
			status: 'OPEN',
			subject: 'Incorrect fuel surcharge calculation',
			description: 'Customer disputes the fuel surcharge amount of $245.00, claiming it should be based on a different rate structure according to their contract.',
			raisedDate: '2024-01-12',
			dueDate: '2024-01-19',
			assignedTo: 'Sarah Johnson',
			customerContact: 'john.doe@acme.com',
			disputedAmount: 245.00,
			proposedResolution: 'Review contract terms and recalculate surcharge',
			resolutionDate: null,
			resolutionNotes: '',
			escalationLevel: 1,
			lastUpdated: '2024-01-15 09:30',
			communications: [
				{
					date: '2024-01-12 10:15',
					from: 'john.doe@acme.com',
					type: 'INITIAL',
					message: 'We believe the fuel surcharge calculation is incorrect based on our contract terms.'
				},
				{
					date: '2024-01-13 14:30',
					from: 'Sarah Johnson',
					type: 'RESPONSE',
					message: 'Thank you for bringing this to our attention. We are reviewing your contract and will respond within 24 hours.'
				}
			]
		},
		{
			id: 'DIS-2024-0002',
			jobId: 'QT-2024-0156',
			customer: 'Global Tech Solutions',
			disputeType: 'DELIVERY',
			priority: 'URGENT',
			status: 'IN_PROGRESS',
			subject: 'Package delivered to wrong address',
			description: 'Package was delivered to 123 Wrong St instead of 456 Correct Ave. Customer requires immediate re-delivery and explanation.',
			raisedDate: '2024-01-14',
			dueDate: '2024-01-16',
			assignedTo: 'Mike Rodriguez',
			customerContact: 'logistics@globaltech.net',
			disputedAmount: 0.00,
			proposedResolution: 'Retrieve package and re-deliver to correct address',
			resolutionDate: null,
			resolutionNotes: '',
			escalationLevel: 2,
			lastUpdated: '2024-01-15 16:45',
			communications: [
				{
					date: '2024-01-14 08:00',
					from: 'logistics@globaltech.net',
					type: 'INITIAL',
					message: 'URGENT: Package delivered to wrong address. Our customer is waiting for critical components.'
				},
				{
					date: '2024-01-14 09:15',
					from: 'Mike Rodriguez',
					type: 'RESPONSE',
					message: 'Investigating immediately. Dispatching team to retrieve and re-deliver.'
				},
				{
					date: '2024-01-15 16:45',
					from: 'Mike Rodriguez',
					type: 'UPDATE',
					message: 'Package retrieved and re-delivered successfully. Customer confirmed receipt.'
				}
			]
		},
		{
			id: 'DIS-2024-0003',
			jobId: 'QT-2024-0139',
			customer: 'Manufacturing Plus',
			disputeType: 'DAMAGE',
			priority: 'HIGH',
			status: 'RESOLVED',
			subject: 'Damage to machinery components during transit',
			description: 'Customer reports damage to expensive machinery components valued at $25,000. Requesting full compensation and investigation.',
			raisedDate: '2024-01-08',
			dueDate: '2024-01-15',
			assignedTo: 'Lisa Chen',
			customerContact: 'claims@mfgplus.com',
			disputedAmount: 25000.00,
			proposedResolution: 'Insurance claim processing and compensation',
			resolutionDate: '2024-01-14',
			resolutionNotes: 'Insurance approved full compensation. Check issued for $25,000.',
			escalationLevel: 3,
			lastUpdated: '2024-01-14 17:20',
			communications: [
				{
					date: '2024-01-08 11:00',
					from: 'claims@mfgplus.com',
					type: 'INITIAL',
					message: 'Significant damage to machinery components. Photos attached. Requesting immediate investigation.'
				},
				{
					date: '2024-01-08 13:30',
					from: 'Lisa Chen',
					type: 'RESPONSE',
					message: 'Initiating investigation and insurance claim process. Will update within 48 hours.'
				},
				{
					date: '2024-01-14 17:20',
					from: 'Lisa Chen',
					type: 'RESOLUTION',
					message: 'Investigation complete. Insurance approved full compensation. Check being issued today.'
				}
			]
		},
		{
			id: 'DIS-2024-0004',
			jobId: 'QT-2024-0165',
			customer: 'Pharma Logistics',
			disputeType: 'SERVICE',
			priority: 'CRITICAL',
			status: 'ESCALATED',
			subject: 'Temperature breach during pharmaceutical transport',
			description: 'Cold chain breach detected during transport of temperature-sensitive pharmaceuticals. Customer reporting potential product loss.',
			raisedDate: '2024-01-15',
			dueDate: '2024-01-16',
			assignedTo: 'Regional Manager',
			customerContact: 'urgent@pharmalog.com',
			disputedAmount: 50000.00,
			proposedResolution: 'Full investigation and replacement product sourcing',
			resolutionDate: null,
			resolutionNotes: '',
			escalationLevel: 4,
			lastUpdated: '2024-01-15 20:15',
			communications: [
				{
					date: '2024-01-15 18:30',
					from: 'urgent@pharmalog.com',
					type: 'INITIAL',
					message: 'CRITICAL: Temperature breach detected. Pharmaceutical products may be compromised. Immediate action required.'
				},
				{
					date: '2024-01-15 19:00',
					from: 'Regional Manager',
					type: 'ESCALATION',
					message: 'Escalated to executive level. Full investigation team assigned. Updates every 2 hours.'
				}
			]
		},
		{
			id: 'DIS-2024-0005',
			jobId: 'QT-2024-0152',
			customer: 'Retail Solutions Inc',
			disputeType: 'TIMING',
			priority: 'MEDIUM',
			status: 'CLOSED',
			subject: 'Late delivery causing store promotion delay',
			description: 'Delivery was 2 days late causing customer to miss promotional event. Requesting compensation for lost sales.',
			raisedDate: '2024-01-10',
			dueDate: '2024-01-17',
			assignedTo: 'Customer Service',
			customerContact: 'support@retailsol.com',
			disputedAmount: 3500.00,
			proposedResolution: 'Service credit and apology letter',
			resolutionDate: '2024-01-13',
			resolutionNotes: 'Customer accepted service credit of $1,000 and formal apology. Relationship maintained.',
			escalationLevel: 1,
			lastUpdated: '2024-01-13 15:45',
			communications: [
				{
					date: '2024-01-10 09:00',
					from: 'support@retailsol.com',
					type: 'INITIAL',
					message: 'Late delivery has impacted our promotional event. Requesting compensation discussion.'
				},
				{
					date: '2024-01-11 10:00',
					from: 'Customer Service',
					type: 'RESPONSE',
					message: 'We apologize for the delay. Offering service credit as compensation.'
				},
				{
					date: '2024-01-13 15:45',
					from: 'Customer Service',
					type: 'RESOLUTION',
					message: 'Customer accepted $1,000 service credit. Case closed with customer satisfaction maintained.'
				}
			]
		}
	]
	
	// Selected dispute for details
	let selectedDispute: any = null
	
	// Filter the disputes based on selected filters
	$: filteredDisputes = disputes.filter(dispute => {
		if (statusFilter !== 'ALL' && dispute.status !== statusFilter) return false
		if (priorityFilter !== 'ALL' && dispute.priority !== priorityFilter) return false
		if (typeFilter !== 'ALL' && dispute.disputeType !== typeFilter) return false
		if (customerFilter && !dispute.customer.toLowerCase().includes(customerFilter.toLowerCase())) return false
		if (dateFromFilter && dispute.raisedDate < dateFromFilter) return false
		if (dateToFilter && dispute.raisedDate > dateToFilter) return false
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
	
	function selectDispute(dispute: any) {
		selectedDispute = dispute
	}
	
	function closeDetails() {
		selectedDispute = null
	}
	
	function updateStatus(disputeId: string, newStatus: string) {
		// In a real app, this would make an API call
		console.log('Updating status:', disputeId, newStatus)
		const dispute = disputes.find(d => d.id === disputeId)
		if (dispute) {
			dispute.status = newStatus
			dispute.lastUpdated = new Date().toISOString().slice(0, 16)
			if (newStatus === 'RESOLVED' || newStatus === 'CLOSED') {
				dispute.resolutionDate = new Date().toISOString().slice(0, 10)
			}
		}
		selectedDispute = null
	}
	
	function escalateDispute(disputeId: string) {
		// In a real app, this would make an API call
		console.log('Escalating dispute:', disputeId)
		const dispute = disputes.find(d => d.id === disputeId)
		if (dispute) {
			dispute.escalationLevel = Math.min(dispute.escalationLevel + 1, 4)
			dispute.status = 'ESCALATED'
			dispute.lastUpdated = new Date().toISOString().slice(0, 16)
		}
		selectedDispute = null
	}
	
	function addCommunication(disputeId: string, message: string) {
		// In a real app, this would make an API call
		console.log('Adding communication:', disputeId, message)
		const dispute = disputes.find(d => d.id === disputeId)
		if (dispute) {
			dispute.communications.push({
				date: new Date().toISOString().slice(0, 16),
				from: 'LSP Representative',
				type: 'UPDATE',
				message: message
			})
			dispute.lastUpdated = new Date().toISOString().slice(0, 16)
		}
		selectedDispute = null
	}
	
	// Check if dispute is overdue
	function isOverdue(dueDate: string): boolean {
		return new Date(dueDate) < new Date() && dueDate !== null
	}
	
	// Format currency
	function formatCurrency(amount: number): string {
		return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
	}
	
	// Get days remaining
	function getDaysRemaining(dueDate: string): number {
		const today = new Date()
		const due = new Date(dueDate)
		const diffTime = due.getTime() - today.getTime()
		return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
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
			<span class="red-text">LSP INTERFACE - DISPUTE MANAGEMENT</span>
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
			<h3 class="blue-text">--- DISPUTE FILTERS ---</h3>
			<div class="filter-grid">
				<div class="filter-group">
					<label class="blue-text" for="status">Status:</label>
					<select id="status" bind:value={statusFilter} class="filter-select">
						<option value="ALL">ALL STATUSES</option>
						<option value="OPEN">OPEN</option>
						<option value="IN_PROGRESS">IN PROGRESS</option>
						<option value="ESCALATED">ESCALATED</option>
						<option value="RESOLVED">RESOLVED</option>
						<option value="CLOSED">CLOSED</option>
					</select>
				</div>
				
				<div class="filter-group">
					<label class="blue-text" for="priority">Priority:</label>
					<select id="priority" bind:value={priorityFilter} class="filter-select">
						<option value="ALL">ALL PRIORITIES</option>
						<option value="CRITICAL">CRITICAL</option>
						<option value="URGENT">URGENT</option>
						<option value="HIGH">HIGH</option>
						<option value="MEDIUM">MEDIUM</option>
						<option value="LOW">LOW</option>
					</select>
				</div>
				
				<div class="filter-group">
					<label class="blue-text" for="type">Type:</label>
					<select id="type" bind:value={typeFilter} class="filter-select">
						<option value="ALL">ALL TYPES</option>
						<option value="BILLING">BILLING</option>
						<option value="DELIVERY">DELIVERY</option>
						<option value="DAMAGE">DAMAGE</option>
						<option value="SERVICE">SERVICE</option>
						<option value="TIMING">TIMING</option>
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

		<!-- Summary Section -->
		<div class="summary-section">
			<h3 class="blue-text">--- DISPUTE SUMMARY ---</h3>
			<div class="summary-grid">
				<div class="summary-card">
					<div class="summary-title">TOTAL DISPUTES</div>
					<div class="summary-value">{filteredDisputes.length}</div>
				</div>
				<div class="summary-card">
					<div class="summary-title">OPEN/IN PROGRESS</div>
					<div class="summary-value active">{filteredDisputes.filter(d => d.status === 'OPEN' || d.status === 'IN_PROGRESS').length}</div>
				</div>
				<div class="summary-card">
					<div class="summary-title">ESCALATED</div>
					<div class="summary-value escalated">{filteredDisputes.filter(d => d.status === 'ESCALATED').length}</div>
				</div>
				<div class="summary-card">
					<div class="summary-title">CRITICAL</div>
					<div class="summary-value critical">{filteredDisputes.filter(d => d.priority === 'CRITICAL' && (d.status === 'OPEN' || d.status === 'IN_PROGRESS' || d.status === 'ESCALATED')).length}</div>
				</div>
				<div class="summary-card">
					<div class="summary-title">OVERDUE</div>
					<div class="summary-value overdue">{filteredDisputes.filter(d => isOverdue(d.dueDate) && d.status !== 'RESOLVED' && d.status !== 'CLOSED').length}</div>
				</div>
			</div>
		</div>

		<!-- Disputes Table -->
		<div class="table-section">
			<h3 class="blue-text">--- DISPUTE RECORDS ---</h3>
			<div class="table-container">
				<table class="disputes-table">
					<thead>
						<tr>
							<th>DISPUTE ID</th>
							<th>JOB ID</th>
							<th>CUSTOMER</th>
							<th>TYPE</th>
							<th>PRIORITY</th>
							<th>STATUS</th>
							<th>SUBJECT</th>
							<th>RAISED DATE</th>
							<th>DUE DATE</th>
							<th>DISPUTED AMOUNT</th>
							<th>ESCALATION</th>
							<th>ACTIONS</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredDisputes as dispute}
							<tr class="dispute-row" 
								class:critical={dispute.priority === 'CRITICAL'}
								class:overdue={isOverdue(dispute.dueDate) && dispute.status !== 'RESOLVED' && dispute.status !== 'CLOSED'}
								class:escalated={dispute.status === 'ESCALATED'}
							>
								<td class="dispute-id">{dispute.id}</td>
								<td class="job-id">{dispute.jobId}</td>
								<td>{dispute.customer}</td>
								<td class="type type-{dispute.disputeType.toLowerCase()}">{dispute.disputeType}</td>
								<td class="priority priority-{dispute.priority.toLowerCase()}">{dispute.priority}</td>
								<td class="status status-{dispute.status.toLowerCase().replace('_', '-')}">{dispute.status.replace('_', ' ')}</td>
								<td class="subject">{dispute.subject}</td>
								<td>{dispute.raisedDate}</td>
								<td class="due-date" class:overdue={isOverdue(dispute.dueDate)}>{dispute.dueDate}</td>
								<td class="amount">{dispute.disputedAmount > 0 ? formatCurrency(dispute.disputedAmount) : 'N/A'}</td>
								<td class="escalation">Level {dispute.escalationLevel}</td>
								<td>
									<button 
										on:click={() => selectDispute(dispute)}
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
			<span class="red-text">([LSP-DISPUTE] Dispute Resolution Management Terminal)</span>
		</div>

		<!-- Logout Button -->
		<div class="logout-section">
			<button on:click={handleSignOut} disabled={loading} class="logout-button">
				{loading ? 'SIGNING OUT...' : 'LOGOUT'}
			</button>
		</div>
	</div>
	
	<!-- Dispute Details Modal -->
	{#if selectedDispute}
		<div class="modal-overlay" on:click={closeDetails}>
			<div class="modal-content" on:click|stopPropagation>
				<div class="modal-header">
					<h3 class="blue-text">DISPUTE DETAILS - {selectedDispute.id}</h3>
					<button on:click={closeDetails} class="close-button">✕</button>
				</div>
				
				<div class="modal-body">
					<div class="details-grid">
						<div class="detail-section">
							<h4 class="blue-text">DISPUTE INFORMATION</h4>
							<div class="detail-row">
								<span class="detail-label">Job ID:</span>
								<span class="detail-value">{selectedDispute.jobId}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Customer:</span>
								<span class="detail-value">{selectedDispute.customer}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Type:</span>
								<span class="detail-value type-{selectedDispute.disputeType.toLowerCase()}">{selectedDispute.disputeType}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Priority:</span>
								<span class="detail-value priority-{selectedDispute.priority.toLowerCase()}">{selectedDispute.priority}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Status:</span>
								<span class="detail-value status-{selectedDispute.status.toLowerCase().replace('_', '-')}">{selectedDispute.status.replace('_', ' ')}</span>
							</div>
						</div>
						
						<div class="detail-section">
							<h4 class="blue-text">TIMELINE & ASSIGNMENT</h4>
							<div class="detail-row">
								<span class="detail-label">Raised Date:</span>
								<span class="detail-value">{selectedDispute.raisedDate}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Due Date:</span>
								<span class="detail-value" class:overdue={isOverdue(selectedDispute.dueDate)}>{selectedDispute.dueDate}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Days Remaining:</span>
								<span class="detail-value" class:overdue={getDaysRemaining(selectedDispute.dueDate) < 0}>
									{getDaysRemaining(selectedDispute.dueDate) < 0 ? `${Math.abs(getDaysRemaining(selectedDispute.dueDate))} days overdue` : `${getDaysRemaining(selectedDispute.dueDate)} days`}
								</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Assigned To:</span>
								<span class="detail-value">{selectedDispute.assignedTo}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Customer Contact:</span>
								<span class="detail-value">{selectedDispute.customerContact}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Escalation Level:</span>
								<span class="detail-value escalation-{selectedDispute.escalationLevel}">Level {selectedDispute.escalationLevel}</span>
							</div>
						</div>
						
						<div class="detail-section">
							<h4 class="blue-text">FINANCIAL IMPACT</h4>
							<div class="detail-row">
								<span class="detail-label">Disputed Amount:</span>
								<span class="detail-value amount">{selectedDispute.disputedAmount > 0 ? formatCurrency(selectedDispute.disputedAmount) : 'No financial dispute'}</span>
							</div>
							{#if selectedDispute.resolutionDate}
								<div class="detail-row">
									<span class="detail-label">Resolution Date:</span>
									<span class="detail-value">{selectedDispute.resolutionDate}</span>
								</div>
							{/if}
						</div>
						
						<div class="detail-section full-width">
							<h4 class="blue-text">DISPUTE DESCRIPTION</h4>
							<div class="detail-row">
								<span class="detail-label">Subject:</span>
								<span class="detail-value subject">{selectedDispute.subject}</span>
							</div>
							<div class="detail-row">
								<span class="detail-value description">{selectedDispute.description}</span>
							</div>
						</div>
						
						<div class="detail-section full-width">
							<h4 class="blue-text">PROPOSED RESOLUTION</h4>
							<div class="detail-row">
								<span class="detail-value resolution">{selectedDispute.proposedResolution}</span>
							</div>
							{#if selectedDispute.resolutionNotes}
								<div class="detail-row">
									<span class="detail-label">Resolution Notes:</span>
									<span class="detail-value resolution-notes">{selectedDispute.resolutionNotes}</span>
								</div>
							{/if}
						</div>
						
						<div class="detail-section full-width">
							<h4 class="blue-text">COMMUNICATION HISTORY</h4>
							<div class="communications">
								{#each selectedDispute.communications as comm}
									<div class="communication-item">
										<div class="comm-header">
											<span class="comm-date">{comm.date}</span>
											<span class="comm-from">{comm.from}</span>
											<span class="comm-type comm-type-{comm.type.toLowerCase()}">{comm.type}</span>
										</div>
										<div class="comm-message">{comm.message}</div>
									</div>
								{/each}
							</div>
						</div>
					</div>
				</div>
				
				<div class="modal-actions">
					{#if selectedDispute.status === 'OPEN' || selectedDispute.status === 'IN_PROGRESS'}
						<button 
							on:click={() => updateStatus(selectedDispute.id, 'IN_PROGRESS')}
							class="action-button progress-button"
						>
							MARK IN PROGRESS
						</button>
						<button 
							on:click={() => updateStatus(selectedDispute.id, 'RESOLVED')}
							class="action-button resolve-button"
						>
							MARK RESOLVED
						</button>
						<button 
							on:click={() => escalateDispute(selectedDispute.id)}
							class="action-button escalate-button"
						>
							ESCALATE
						</button>
					{/if}
					{#if selectedDispute.status === 'RESOLVED'}
						<button 
							on:click={() => updateStatus(selectedDispute.id, 'CLOSED')}
							class="action-button close-button"
						>
							CLOSE DISPUTE
						</button>
					{/if}
					<button 
						on:click={() => addCommunication(selectedDispute.id, 'Follow-up communication sent to customer')}
						class="action-button comm-button"
					>
						ADD COMMUNICATION
					</button>
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
		max-width: 1600px;
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
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
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
		font-size: 18px;
		font-weight: bold;
		color: black;
	}

	.summary-value.active {
		color: orange;
	}

	.summary-value.escalated {
		color: purple;
	}

	.summary-value.critical {
		color: red;
		animation: blink 1s infinite;
	}

	.summary-value.overdue {
		color: red;
		animation: pulse 2s infinite;
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

	.disputes-table {
		width: 100%;
		border-collapse: collapse;
		background-color: white;
		font-size: 10px;
	}

	.disputes-table th,
	.disputes-table td {
		border: 1px solid #ddd;
		padding: 6px;
		text-align: left;
	}

	.disputes-table th {
		background-color: #f0f0f0;
		font-weight: bold;
		color: blue;
		font-size: 9px;
	}

	.dispute-row:hover {
		background-color: #f9f9f9;
	}

	.dispute-row.critical {
		background-color: #ffe0e0;
	}

	.dispute-row.overdue {
		background-color: #ffcccc;
		animation: pulse 2s infinite;
	}

	.dispute-row.escalated {
		background-color: #f0e0ff;
	}

	.dispute-id, .job-id {
		font-weight: bold;
		color: blue;
	}

	.type {
		font-weight: bold;
		text-align: center;
		font-size: 9px;
	}

	.type-billing {
		color: green;
	}

	.type-delivery {
		color: blue;
	}

	.type-damage {
		color: red;
	}

	.type-service {
		color: purple;
	}

	.type-timing {
		color: orange;
	}

	.priority {
		font-weight: bold;
		text-align: center;
		font-size: 9px;
	}

	.priority-critical {
		color: red;
		animation: blink 1s infinite;
	}

	.priority-urgent {
		color: red;
	}

	.priority-high {
		color: orange;
	}

	.priority-medium {
		color: blue;
	}

	.priority-low {
		color: green;
	}

	.status {
		font-weight: bold;
		text-align: center;
		font-size: 9px;
	}

	.status-open {
		color: orange;
	}

	.status-in-progress {
		color: blue;
	}

	.status-escalated {
		color: purple;
		animation: blink 1s infinite;
	}

	.status-resolved {
		color: green;
	}

	.status-closed {
		color: gray;
	}

	.subject {
		font-size: 9px;
		max-width: 200px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.due-date {
		font-family: monospace;
		font-size: 9px;
	}

	.due-date.overdue {
		color: red;
		font-weight: bold;
		animation: blink 1s infinite;
	}

	.amount {
		text-align: right;
		font-family: monospace;
		font-weight: bold;
		font-size: 9px;
	}

	.escalation {
		text-align: center;
		font-weight: bold;
		font-size: 9px;
		color: purple;
	}

	.action-button {
		background-color: blue;
		color: white;
		border: none;
		padding: 3px 6px;
		font-family: 'Courier New', monospace;
		font-size: 8px;
		font-weight: bold;
		cursor: pointer;
		margin: 0 1px;
	}

	.action-button:hover {
		background-color: darkblue;
	}

	.view-button {
		background-color: blue;
	}

	.progress-button {
		background-color: orange;
	}

	.progress-button:hover {
		background-color: darkorange;
	}

	.resolve-button {
		background-color: green;
	}

	.resolve-button:hover {
		background-color: darkgreen;
	}

	.escalate-button {
		background-color: purple;
	}

	.escalate-button:hover {
		background-color: darkmagenta;
	}

	.close-button {
		background-color: gray;
	}

	.close-button:hover {
		background-color: darkgray;
	}

	.comm-button {
		background-color: teal;
	}

	.comm-button:hover {
		background-color: darkcyan;
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
		max-width: 1200px;
		width: 95%;
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

	.modal-header .close-button {
		background-color: red;
		color: white;
		border: none;
		padding: 5px 10px;
		font-family: 'Courier New', monospace;
		font-weight: bold;
		cursor: pointer;
	}

	.modal-header .close-button:hover {
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

	.detail-section.full-width {
		grid-column: 1 / -1;
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

	.detail-value.subject {
		font-weight: bold;
		color: black;
		font-size: 12px;
	}

	.detail-value.description, .detail-value.resolution, .detail-value.resolution-notes {
		grid-column: 1 / -1;
		background-color: #f0f0f0;
		padding: 8px;
		border-left: 3px solid #0066cc;
		font-style: italic;
	}

	.detail-value.amount {
		font-family: monospace;
		font-weight: bold;
	}

	.detail-value.escalation-1 {
		color: green;
	}

	.detail-value.escalation-2 {
		color: orange;
	}

	.detail-value.escalation-3 {
		color: red;
	}

	.detail-value.escalation-4 {
		color: purple;
		font-weight: bold;
		animation: blink 1s infinite;
	}

	.communications {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.communication-item {
		border: 1px solid #ddd;
		padding: 10px;
		background-color: white;
	}

	.comm-header {
		display: flex;
		gap: 15px;
		margin-bottom: 5px;
		align-items: center;
	}

	.comm-date {
		font-size: 10px;
		color: blue;
		font-weight: bold;
		font-family: monospace;
	}

	.comm-from {
		font-size: 10px;
		color: green;
		font-weight: bold;
	}

	.comm-type {
		font-size: 9px;
		font-weight: bold;
		padding: 2px 6px;
		border-radius: 2px;
	}

	.comm-type-initial {
		background-color: #ffe0e0;
		color: red;
	}

	.comm-type-response {
		background-color: #e0e0ff;
		color: blue;
	}

	.comm-type-update {
		background-color: #ffe0ff;
		color: purple;
	}

	.comm-type-escalation {
		background-color: #fff0e0;
		color: orange;
	}

	.comm-type-resolution {
		background-color: #e0ffe0;
		color: green;
	}

	.comm-message {
		font-size: 11px;
		color: black;
		line-height: 1.4;
	}

	.modal-actions {
		display: flex;
		gap: 10px;
		justify-content: center;
		border-top: 2px solid #0066cc;
		padding-top: 15px;
		flex-wrap: wrap;
	}

	.modal-actions .action-button {
		padding: 8px 12px;
		font-size: 10px;
	}

	@keyframes blink {
		0%, 50% { opacity: 1; }
		51%, 100% { opacity: 0.3; }
	}

	@keyframes pulse {
		0% { background-color: inherit; }
		50% { background-color: #ffe0e0; }
		100% { background-color: inherit; }
	}
</style> 