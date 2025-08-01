<!-- LSP Accrual -->
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
	let periodFilter = 'ALL'
	let customerFilter = ''
	let amountMinFilter = ''
	let amountMaxFilter = ''
	
	// Mock accrual data
	let accruals = [
		{
			id: 'ACC-2024-0001',
			jobId: 'QT-2024-0145',
			customer: 'ACME Corporation',
			serviceType: 'Express Delivery',
			completionDate: '2024-01-10',
			invoiceDate: '2024-01-12',
			dueDate: '2024-01-27',
			baseAmount: 2450.00,
			fuelSurcharge: 245.00,
			accessorialCharges: 150.00,
			totalAmount: 2845.00,
			paidAmount: 2845.00,
			outstandingAmount: 0.00,
			status: 'PAID',
			paymentDate: '2024-01-25',
			paymentMethod: 'Wire Transfer',
			referenceNumber: 'WT-2024-0034',
			invoiceNumber: 'INV-2024-0067',
			notes: 'Payment received on time'
		},
		{
			id: 'ACC-2024-0002',
			jobId: 'QT-2024-0156',
			customer: 'Global Tech Solutions',
			serviceType: 'Standard Ground',
			completionDate: '2024-01-12',
			invoiceDate: '2024-01-14',
			dueDate: '2024-01-29',
			baseAmount: 890.00,
			fuelSurcharge: 89.00,
			accessorialCharges: 45.00,
			totalAmount: 1024.00,
			paidAmount: 0.00,
			outstandingAmount: 1024.00,
			status: 'OUTSTANDING',
			paymentDate: null,
			paymentMethod: null,
			referenceNumber: null,
			invoiceNumber: 'INV-2024-0072',
			notes: 'Customer requesting extended payment terms'
		},
		{
			id: 'ACC-2024-0003',
			jobId: 'QT-2024-0148',
			customer: 'Manufacturing Plus',
			serviceType: 'Air Freight',
			completionDate: '2024-01-08',
			invoiceDate: '2024-01-10',
			dueDate: '2024-01-25',
			baseAmount: 5670.00,
			fuelSurcharge: 567.00,
			accessorialCharges: 280.00,
			totalAmount: 6517.00,
			paidAmount: 3000.00,
			outstandingAmount: 3517.00,
			status: 'PARTIAL',
			paymentDate: '2024-01-20',
			paymentMethod: 'Check',
			referenceNumber: 'CHK-4567890',
			invoiceNumber: 'INV-2024-0058',
			notes: 'Partial payment received, balance due'
		},
		{
			id: 'ACC-2024-0004',
			jobId: 'QT-2024-0140',
			customer: 'Pharma Logistics',
			serviceType: 'Critical Same Day',
			completionDate: '2024-01-05',
			invoiceDate: '2024-01-07',
			dueDate: '2024-01-22',
			baseAmount: 1850.00,
			fuelSurcharge: 185.00,
			accessorialCharges: 95.00,
			totalAmount: 2130.00,
			paidAmount: 0.00,
			outstandingAmount: 2130.00,
			status: 'OVERDUE',
			paymentDate: null,
			paymentMethod: null,
			referenceNumber: null,
			invoiceNumber: 'INV-2024-0045',
			notes: 'Payment overdue - follow up required'
		},
		{
			id: 'ACC-2024-0005',
			jobId: 'QT-2024-0162',
			customer: 'Retail Solutions Inc',
			serviceType: 'LTL Freight',
			completionDate: '2024-01-14',
			invoiceDate: '2024-01-15',
			dueDate: '2024-01-30',
			baseAmount: 3420.00,
			fuelSurcharge: 342.00,
			accessorialCharges: 125.00,
			totalAmount: 3887.00,
			paidAmount: 0.00,
			outstandingAmount: 3887.00,
			status: 'INVOICED',
			paymentDate: null,
			paymentMethod: null,
			referenceNumber: null,
			invoiceNumber: 'INV-2024-0078',
			notes: 'Recently invoiced, payment pending'
		}
	]
	
	// Selected accrual for details
	let selectedAccrual: any = null
	
	// Filter the accruals based on selected filters
	$: filteredAccruals = accruals.filter(accrual => {
		if (statusFilter !== 'ALL' && accrual.status !== statusFilter) return false
		if (customerFilter && !accrual.customer.toLowerCase().includes(customerFilter.toLowerCase())) return false
		if (amountMinFilter && accrual.totalAmount < parseFloat(amountMinFilter)) return false
		if (amountMaxFilter && accrual.totalAmount > parseFloat(amountMaxFilter)) return false
		if (periodFilter !== 'ALL') {
			const currentDate = new Date()
			const accrualDate = new Date(accrual.completionDate)
			const diffDays = Math.floor((currentDate.getTime() - accrualDate.getTime()) / (1000 * 60 * 60 * 24))
			
			if (periodFilter === 'LAST_7_DAYS' && diffDays > 7) return false
			if (periodFilter === 'LAST_30_DAYS' && diffDays > 30) return false
			if (periodFilter === 'LAST_90_DAYS' && diffDays > 90) return false
		}
		return true
	})
	
	// Calculate totals
	$: totalAccrued = filteredAccruals.reduce((sum, accrual) => sum + accrual.totalAmount, 0)
	$: totalPaid = filteredAccruals.reduce((sum, accrual) => sum + accrual.paidAmount, 0)
	$: totalOutstanding = filteredAccruals.reduce((sum, accrual) => sum + accrual.outstandingAmount, 0)

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
	
	function selectAccrual(accrual: any) {
		selectedAccrual = accrual
	}
	
	function closeDetails() {
		selectedAccrual = null
	}
	
	function recordPayment(accrualId: string, amount: number, method: string, reference: string) {
		// In a real app, this would make an API call
		console.log('Recording payment:', accrualId, amount, method, reference)
		const accrual = accruals.find(a => a.id === accrualId)
		if (accrual) {
			accrual.paidAmount += amount
			accrual.outstandingAmount = accrual.totalAmount - accrual.paidAmount
			accrual.paymentDate = new Date().toISOString().slice(0, 10)
			accrual.paymentMethod = method
			accrual.referenceNumber = reference
			
			if (accrual.outstandingAmount <= 0) {
				accrual.status = 'PAID'
			} else {
				accrual.status = 'PARTIAL'
			}
		}
		selectedAccrual = null
	}
	
	function markAsOverdue(accrualId: string) {
		// In a real app, this would make an API call
		console.log('Marking as overdue:', accrualId)
		const accrual = accruals.find(a => a.id === accrualId)
		if (accrual) {
			accrual.status = 'OVERDUE'
		}
		selectedAccrual = null
	}
	
	function addAdjustment(accrualId: string, amount: number, reason: string) {
		// In a real app, this would make an API call
		console.log('Adding adjustment:', accrualId, amount, reason)
		const accrual = accruals.find(a => a.id === accrualId)
		if (accrual) {
			accrual.totalAmount += amount
			accrual.outstandingAmount = accrual.totalAmount - accrual.paidAmount
			accrual.notes += ` | Adjustment: ${amount > 0 ? '+' : ''}$${amount.toFixed(2)} (${reason})`
		}
		selectedAccrual = null
	}
	
	// Check if payment is overdue
	function isOverdue(dueDate: string): boolean {
		return new Date(dueDate) < new Date() && dueDate !== null
	}
	
	// Format currency
	function formatCurrency(amount: number): string {
		return `$${amount.toFixed(2)}`
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
			<span class="red-text">LSP INTERFACE - ACCRUAL MANAGEMENT</span>
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
			<h3 class="blue-text">--- ACCRUAL FILTERS ---</h3>
			<div class="filter-grid">
				<div class="filter-group">
					<label class="blue-text" for="status">Status:</label>
					<select id="status" bind:value={statusFilter} class="filter-select">
						<option value="ALL">ALL STATUSES</option>
						<option value="INVOICED">INVOICED</option>
						<option value="OUTSTANDING">OUTSTANDING</option>
						<option value="PARTIAL">PARTIAL</option>
						<option value="PAID">PAID</option>
						<option value="OVERDUE">OVERDUE</option>
					</select>
				</div>
				
				<div class="filter-group">
					<label class="blue-text" for="period">Period:</label>
					<select id="period" bind:value={periodFilter} class="filter-select">
						<option value="ALL">ALL PERIODS</option>
						<option value="LAST_7_DAYS">LAST 7 DAYS</option>
						<option value="LAST_30_DAYS">LAST 30 DAYS</option>
						<option value="LAST_90_DAYS">LAST 90 DAYS</option>
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
					<label class="blue-text" for="amountMin">Min Amount:</label>
					<input 
						id="amountMin" 
						type="number" 
						bind:value={amountMinFilter} 
						placeholder="0.00"
						class="filter-input"
						step="0.01"
					/>
				</div>
				
				<div class="filter-group">
					<label class="blue-text" for="amountMax">Max Amount:</label>
					<input 
						id="amountMax" 
						type="number" 
						bind:value={amountMaxFilter} 
						placeholder="99999.99"
						class="filter-input"
						step="0.01"
					/>
				</div>
			</div>
		</div>

		<!-- Financial Summary -->
		<div class="summary-section">
			<h3 class="blue-text">--- FINANCIAL SUMMARY ---</h3>
			<div class="summary-grid">
				<div class="summary-card">
					<div class="summary-title">TOTAL ACCRUED</div>
					<div class="summary-value">{formatCurrency(totalAccrued)}</div>
				</div>
				<div class="summary-card">
					<div class="summary-title">TOTAL PAID</div>
					<div class="summary-value paid">{formatCurrency(totalPaid)}</div>
				</div>
				<div class="summary-card">
					<div class="summary-title">OUTSTANDING</div>
					<div class="summary-value outstanding">{formatCurrency(totalOutstanding)}</div>
				</div>
				<div class="summary-card">
					<div class="summary-title">COLLECTION RATE</div>
					<div class="summary-value rate">{totalAccrued > 0 ? ((totalPaid / totalAccrued) * 100).toFixed(1) : 0}%</div>
				</div>
			</div>
		</div>

		<!-- Status Breakdown -->
		<div class="breakdown-section">
			<h3 class="blue-text">--- STATUS BREAKDOWN ---</h3>
			<div class="breakdown-grid">
				<div class="breakdown-card">
					<div class="breakdown-title">INVOICED</div>
					<div class="breakdown-count invoiced">{filteredAccruals.filter(a => a.status === 'INVOICED').length}</div>
				</div>
				<div class="breakdown-card">
					<div class="breakdown-title">OUTSTANDING</div>
					<div class="breakdown-count outstanding">{filteredAccruals.filter(a => a.status === 'OUTSTANDING').length}</div>
				</div>
				<div class="breakdown-card">
					<div class="breakdown-title">PARTIAL</div>
					<div class="breakdown-count partial">{filteredAccruals.filter(a => a.status === 'PARTIAL').length}</div>
				</div>
				<div class="breakdown-card">
					<div class="breakdown-title">OVERDUE</div>
					<div class="breakdown-count overdue">{filteredAccruals.filter(a => a.status === 'OVERDUE').length}</div>
				</div>
				<div class="breakdown-card">
					<div class="breakdown-title">PAID</div>
					<div class="breakdown-count paid">{filteredAccruals.filter(a => a.status === 'PAID').length}</div>
				</div>
			</div>
		</div>

		<!-- Accruals Table -->
		<div class="table-section">
			<h3 class="blue-text">--- ACCRUAL RECORDS ---</h3>
			<div class="table-container">
				<table class="accruals-table">
					<thead>
						<tr>
							<th>ACCRUAL ID</th>
							<th>JOB ID</th>
							<th>CUSTOMER</th>
							<th>SERVICE TYPE</th>
							<th>INVOICE DATE</th>
							<th>DUE DATE</th>
							<th>TOTAL AMOUNT</th>
							<th>PAID AMOUNT</th>
							<th>OUTSTANDING</th>
							<th>STATUS</th>
							<th>ACTIONS</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredAccruals as accrual}
							<tr class="accrual-row" 
								class:overdue={accrual.status === 'OVERDUE' || isOverdue(accrual.dueDate)}
								class:paid={accrual.status === 'PAID'}
							>
								<td class="accrual-id">{accrual.id}</td>
								<td class="job-id">{accrual.jobId}</td>
								<td>{accrual.customer}</td>
								<td>{accrual.serviceType}</td>
								<td>{accrual.invoiceDate}</td>
								<td class="due-date" class:overdue={isOverdue(accrual.dueDate)}>{accrual.dueDate}</td>
								<td class="amount">{formatCurrency(accrual.totalAmount)}</td>
								<td class="amount">{formatCurrency(accrual.paidAmount)}</td>
								<td class="amount outstanding">{formatCurrency(accrual.outstandingAmount)}</td>
								<td class="status status-{accrual.status.toLowerCase()}">{accrual.status}</td>
								<td>
									<button 
										on:click={() => selectAccrual(accrual)}
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
			<span class="red-text">([LSP-ACCRUAL] Financial Accrual Management Terminal)</span>
		</div>

		<!-- Logout Button -->
		<div class="logout-section">
			<button on:click={handleSignOut} disabled={loading} class="logout-button">
				{loading ? 'SIGNING OUT...' : 'LOGOUT'}
			</button>
		</div>
	</div>
	
	<!-- Accrual Details Modal -->
	{#if selectedAccrual}
		<div class="modal-overlay" on:click={closeDetails}>
			<div class="modal-content" on:click|stopPropagation>
				<div class="modal-header">
					<h3 class="blue-text">ACCRUAL DETAILS - {selectedAccrual.id}</h3>
					<button on:click={closeDetails} class="close-button">✕</button>
				</div>
				
				<div class="modal-body">
					<div class="details-grid">
						<div class="detail-section">
							<h4 class="blue-text">JOB INFORMATION</h4>
							<div class="detail-row">
								<span class="detail-label">Job ID:</span>
								<span class="detail-value">{selectedAccrual.jobId}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Customer:</span>
								<span class="detail-value">{selectedAccrual.customer}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Service Type:</span>
								<span class="detail-value">{selectedAccrual.serviceType}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Completion Date:</span>
								<span class="detail-value">{selectedAccrual.completionDate}</span>
							</div>
						</div>
						
						<div class="detail-section">
							<h4 class="blue-text">BILLING DETAILS</h4>
							<div class="detail-row">
								<span class="detail-label">Invoice Number:</span>
								<span class="detail-value">{selectedAccrual.invoiceNumber}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Invoice Date:</span>
								<span class="detail-value">{selectedAccrual.invoiceDate}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Due Date:</span>
								<span class="detail-value" class:overdue={isOverdue(selectedAccrual.dueDate)}>{selectedAccrual.dueDate}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Status:</span>
								<span class="detail-value status-{selectedAccrual.status.toLowerCase()}">{selectedAccrual.status}</span>
							</div>
						</div>
						
						<div class="detail-section">
							<h4 class="blue-text">AMOUNT BREAKDOWN</h4>
							<div class="detail-row">
								<span class="detail-label">Base Amount:</span>
								<span class="detail-value">{formatCurrency(selectedAccrual.baseAmount)}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Fuel Surcharge:</span>
								<span class="detail-value">{formatCurrency(selectedAccrual.fuelSurcharge)}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Accessorial Charges:</span>
								<span class="detail-value">{formatCurrency(selectedAccrual.accessorialCharges)}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Total Amount:</span>
								<span class="detail-value total">{formatCurrency(selectedAccrual.totalAmount)}</span>
							</div>
						</div>
						
						<div class="detail-section">
							<h4 class="blue-text">PAYMENT STATUS</h4>
							<div class="detail-row">
								<span class="detail-label">Paid Amount:</span>
								<span class="detail-value paid">{formatCurrency(selectedAccrual.paidAmount)}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Outstanding:</span>
								<span class="detail-value outstanding">{formatCurrency(selectedAccrual.outstandingAmount)}</span>
							</div>
							{#if selectedAccrual.paymentDate}
								<div class="detail-row">
									<span class="detail-label">Payment Date:</span>
									<span class="detail-value">{selectedAccrual.paymentDate}</span>
								</div>
								<div class="detail-row">
									<span class="detail-label">Payment Method:</span>
									<span class="detail-value">{selectedAccrual.paymentMethod}</span>
								</div>
								<div class="detail-row">
									<span class="detail-label">Reference Number:</span>
									<span class="detail-value">{selectedAccrual.referenceNumber}</span>
								</div>
							{/if}
						</div>
						
						{#if selectedAccrual.notes}
							<div class="detail-section full-width">
								<h4 class="blue-text">NOTES</h4>
								<div class="detail-row">
									<span class="detail-value notes">{selectedAccrual.notes}</span>
								</div>
							</div>
						{/if}
					</div>
				</div>
				
				<div class="modal-actions">
					{#if selectedAccrual.status !== 'PAID'}
						<button 
							on:click={() => recordPayment(selectedAccrual.id, selectedAccrual.outstandingAmount, 'Wire Transfer', 'WT-2024-AUTO')}
							class="action-button payment-button"
						>
							RECORD PAYMENT
						</button>
						<button 
							on:click={() => addAdjustment(selectedAccrual.id, 50.00, 'Late fee adjustment')}
							class="action-button adjustment-button"
						>
							ADD ADJUSTMENT
						</button>
					{/if}
					{#if selectedAccrual.status === 'OUTSTANDING' && isOverdue(selectedAccrual.dueDate)}
						<button 
							on:click={() => markAsOverdue(selectedAccrual.id)}
							class="action-button overdue-button"
						>
							MARK OVERDUE
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
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 15px;
	}

	.summary-card {
		background-color: white;
		border: 1px solid #ddd;
		padding: 12px;
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

	.summary-value.paid {
		color: green;
	}

	.summary-value.outstanding {
		color: red;
	}

	.summary-value.rate {
		color: blue;
	}

	.breakdown-section {
		margin: 30px 0;
		padding: 15px;
		border: 2px solid #6600cc;
		background-color: #faf9ff;
	}

	.breakdown-section h3 {
		margin: 0 0 15px 0;
		text-align: center;
	}

	.breakdown-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 10px;
	}

	.breakdown-card {
		background-color: white;
		border: 1px solid #ddd;
		padding: 10px;
		text-align: center;
	}

	.breakdown-title {
		font-size: 10px;
		color: blue;
		font-weight: bold;
		margin-bottom: 5px;
	}

	.breakdown-count {
		font-size: 16px;
		font-weight: bold;
	}

	.breakdown-count.invoiced {
		color: blue;
	}

	.breakdown-count.outstanding {
		color: orange;
	}

	.breakdown-count.partial {
		color: purple;
	}

	.breakdown-count.overdue {
		color: red;
		animation: blink 1s infinite;
	}

	.breakdown-count.paid {
		color: green;
	}

	.table-section {
		margin: 30px 0;
		padding: 15px;
		border: 2px solid #cc6600;
		background-color: #fff9f0;
	}

	.table-section h3 {
		margin: 0 0 15px 0;
		text-align: center;
	}

	.table-container {
		overflow-x: auto;
		border: 1px solid #ddd;
	}

	.accruals-table {
		width: 100%;
		border-collapse: collapse;
		background-color: white;
		font-size: 11px;
	}

	.accruals-table th,
	.accruals-table td {
		border: 1px solid #ddd;
		padding: 6px;
		text-align: left;
	}

	.accruals-table th {
		background-color: #f0f0f0;
		font-weight: bold;
		color: blue;
		font-size: 10px;
	}

	.accrual-row:hover {
		background-color: #f9f9f9;
	}

	.accrual-row.overdue {
		background-color: #ffcccc;
	}

	.accrual-row.paid {
		background-color: #e0ffe0;
	}

	.accrual-id, .job-id {
		font-weight: bold;
		color: blue;
	}

	.amount {
		text-align: right;
		font-family: monospace;
		font-weight: bold;
	}

	.amount.outstanding {
		color: red;
	}

	.due-date {
		font-family: monospace;
	}

	.due-date.overdue {
		color: red;
		font-weight: bold;
	}

	.status {
		font-weight: bold;
		text-align: center;
		font-size: 10px;
	}

	.status-invoiced {
		color: blue;
	}

	.status-outstanding {
		color: orange;
	}

	.status-partial {
		color: purple;
	}

	.status-paid {
		color: green;
	}

	.status-overdue {
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

	.payment-button {
		background-color: green;
	}

	.payment-button:hover {
		background-color: darkgreen;
	}

	.adjustment-button {
		background-color: orange;
	}

	.adjustment-button:hover {
		background-color: darkorange;
	}

	.overdue-button {
		background-color: red;
	}

	.overdue-button:hover {
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
		max-width: 1000px;
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

	.detail-value.total {
		font-weight: bold;
		color: black;
		font-size: 12px;
	}

	.detail-value.paid {
		color: green;
		font-weight: bold;
	}

	.detail-value.outstanding {
		color: red;
		font-weight: bold;
	}

	.detail-value.overdue {
		color: red;
		font-weight: bold;
		animation: blink 1s infinite;
	}

	.detail-value.notes {
		grid-column: 1 / -1;
		font-style: italic;
		background-color: #f0f0f0;
		padding: 8px;
		border-left: 3px solid #0066cc;
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