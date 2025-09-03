<!-- Customer Detail View - Management -->
<script lang="ts">
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { getCurrentUser, signOut } from '$lib/auth'
	import { getCurrentUserProfile } from '$lib/userService'
	import { supabase } from '$lib/supabase'
	import type { User } from '@supabase/supabase-js'
	import type { UserProfile } from '$lib/types'
	
	let user: User | null = null
	let userProfile: UserProfile | null = null
	let loading = false
	let saving = false
	let customer: any = null
	let editMode = false
	let message = ''
	let customerId: string
	let salesmen: any[] = []
	let loadingSalesmen = false
	
	// Form data for editing
	let editData = {
		name: '',
		account_number: '',
		contact_email: '',
		phone: '',
		address1: '',
		address2: '',
		city: '',
		state: '',
		zip: '',
		billing_contact: '',
		payment_terms: 'NET_30',
		notes: '',
		salesman_id: ''
	}

	onMount(async () => {
		customerId = $page.params.id
		user = await getCurrentUser()
		if (user) {
			try {
				userProfile = await getCurrentUserProfile()
				await loadCustomer()
				await loadSalesmen()
			} catch (error) {
				console.error('Error loading user profile:', error)
			}
		}
	})

	async function loadCustomer() {
		try {
			loading = true
			const { data, error } = await supabase
				.from('customers')
				.select('*')
				.eq('id', customerId)
				.single()
			
			if (error) {
				console.error('Error loading customer:', error)
				message = 'Customer not found'
				return
			}
			
			customer = data
			// Populate edit data
			editData = {
				name: customer.name || '',
				account_number: customer.account_number || '',
				contact_email: customer.contact_email || '',
				phone: customer.phone || '',
				address1: customer.address1 || '',
				address2: customer.address2 || '',
				city: customer.city || '',
				state: customer.state || '',
				zip: customer.zip || '',
				billing_contact: customer.billing_contact || '',
				payment_terms: customer.payment_terms || 'NET_30',
				notes: customer.notes || '',
				salesman_id: customer.salesman_id || ''
			}
		} catch (err) {
			console.error('Error in loadCustomer:', err)
			message = 'Error loading customer details'
		} finally {
			loading = false
		}
	}

	async function loadSalesmen() {
		try {
			loadingSalesmen = true
			const { data, error } = await supabase
				.from('salesman')
				.select('id, name, email, fin_cono')
				.order('name', { ascending: true })
			
			if (error) {
				console.error('Error loading salesmen:', error)
				return
			}
			
			salesmen = data || []
		} catch (err) {
			console.error('Error in loadSalesmen:', err)
		} finally {
			loadingSalesmen = false
		}
	}

	async function handleSave() {
		try {
			saving = true
			message = ''
			
			const { data, error } = await supabase
				.from('customers')
				.update({
					name: editData.name.trim(),
					account_number: editData.account_number.trim() || null,
					contact_email: editData.contact_email.trim(),
					phone: editData.phone.trim() || null,
					address1: editData.address1.trim() || null,
					address2: editData.address2.trim() || null,
					city: editData.city.trim() || null,
					state: editData.state.trim() || null,
					zip: editData.zip.trim() || null,
					billing_contact: editData.billing_contact.trim() || null,
					payment_terms: editData.payment_terms,
					notes: editData.notes.trim() || null,
					salesman_id: editData.salesman_id || null
				})
				.eq('id', customerId)
				.select()
				.single()
			
			if (error) {
				console.error('Error updating customer:', error)
				message = `Error updating customer: ${error.message}`
				return
			}
			
			customer = data
			editMode = false
			message = 'Customer updated successfully!'
			
			// Clear success message after 3 seconds
			setTimeout(() => {
				message = ''
			}, 3000)
			
		} catch (err) {
			console.error('Error in handleSave:', err)
			message = 'An unexpected error occurred. Please try again.'
		} finally {
			saving = false
		}
	}

	function handleCancel() {
		editMode = false
		// Reset edit data to original values
		editData = {
			name: customer.name || '',
			account_number: customer.account_number || '',
			contact_email: customer.contact_email || '',
			phone: customer.phone || '',
			address1: customer.address1 || '',
			address2: customer.address2 || '',
			city: customer.city || '',
			state: customer.state || '',
			zip: customer.zip || '',
			billing_contact: customer.billing_contact || '',
			payment_terms: customer.payment_terms || 'NET_30',
			notes: customer.notes || '',
			salesman_id: customer.salesman_id || ''
		}
		message = ''
	}

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

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleString()
	}
</script>

<div class="detail-container">
	<div class="main-content">
		<!-- Header -->
		<div class="header-section">
			<div class="header-content">
				<h1 class="page-title">Customer Details</h1>
				<p class="page-subtitle">View and manage customer information</p>
			</div>
		</div>

		<!-- Navigation -->
		<div class="nav-section">
			<a href="/dashboard/management/customer-search" class="nav-link">⬅ Back to Search</a>
			<a href="/dashboard/management" class="nav-link">🏠 Management Dashboard</a>
			{#if !editMode && customer}
				<button on:click={() => editMode = true} class="nav-link edit-button">✏️ Edit Customer</button>
			{/if}
		</div>

		<!-- User Information -->
		{#if user && userProfile}
			<div class="user-info">
				<p class="status-text">Status: <span class="highlight">Management Access</span></p>
				<p class="function-text">Function: Customer Detail Management</p>
			</div>
		{/if}

		<!-- Loading State -->
		{#if loading}
			<div class="loading-section">
				<div class="loading-spinner"></div>
				<p>Loading customer details...</p>
			</div>
		{:else if !customer}
			<div class="error-section">
				<div class="error-icon">❌</div>
				<h3>Customer Not Found</h3>
				<p>The requested customer could not be found.</p>
				<a href="/dashboard/management/customer-search" class="error-action">Return to Search</a>
			</div>
		{:else}
			<!-- Customer Information -->
			<div class="customer-section">
				{#if message}
					<div class="message" class:success={message.includes('success')} class:error={message.includes('error') || message.includes('Error')}>
						{message}
					</div>
				{/if}

				{#if editMode}
					<!-- Edit Mode -->
					<div class="edit-form">
						<div class="form-header">
							<h3>Edit Customer Information</h3>
							<div class="form-actions">
								<button on:click={handleSave} disabled={saving} class="save-button">
									{saving ? 'Saving...' : 'Save Changes'}
								</button>
								<button on:click={handleCancel} disabled={saving} class="cancel-button">Cancel</button>
							</div>
						</div>

						<div class="form-grid">
							<!-- Company Information -->
							<div class="form-section">
								<h4>Company Information</h4>
								<div class="form-row">
									<div class="form-group">
										<label>Company Name</label>
										<input type="text" bind:value={editData.name} class="form-input" required />
									</div>
									<div class="form-group">
										<label>Account Number</label>
										<input type="text" bind:value={editData.account_number} class="form-input" placeholder="Optional" />
									</div>
								</div>
							</div>

							<!-- Contact Information -->
							<div class="form-section">
								<h4>Contact Information</h4>
								<div class="form-row">
									<div class="form-group">
										<label>Email Address</label>
										<input type="email" bind:value={editData.contact_email} class="form-input" required />
									</div>
									<div class="form-group">
										<label>Phone Number</label>
										<input type="tel" bind:value={editData.phone} class="form-input" />
									</div>
								</div>
							</div>

							<!-- Address Information -->
							<div class="form-section">
								<h4>Address Information</h4>
								<div class="form-row full-width">
									<div class="form-group">
										<label>Address Line 1</label>
										<input type="text" bind:value={editData.address1} class="form-input" />
									</div>
								</div>
								<div class="form-row full-width">
									<div class="form-group">
										<label>Address Line 2</label>
										<input type="text" bind:value={editData.address2} class="form-input" />
									</div>
								</div>
								<div class="form-row">
									<div class="form-group">
										<label>City</label>
										<input type="text" bind:value={editData.city} class="form-input" />
									</div>
									<div class="form-group">
										<label>State/Province</label>
										<input type="text" bind:value={editData.state} class="form-input" />
									</div>
									<div class="form-group">
										<label>ZIP Code</label>
										<input type="text" bind:value={editData.zip} class="form-input" />
									</div>
								</div>
							</div>

							<!-- Billing Information -->
							<div class="form-section">
								<h4>Billing Information</h4>
								<div class="form-row">
									<div class="form-group">
										<label>Billing Contact</label>
										<input type="text" bind:value={editData.billing_contact} class="form-input" />
									</div>
									<div class="form-group">
										<label>Payment Terms</label>
										<select bind:value={editData.payment_terms} class="form-input">
											<option value="NET_30">NET 30 DAYS</option>
											<option value="NET_60">NET 60 DAYS</option>
											<option value="COD">COD</option>
											<option value="PREPAID">PREPAID</option>
										</select>
									</div>
								</div>
								<div class="form-row">
									<div class="form-group">
										<label>Assigned Salesman</label>
										<select bind:value={editData.salesman_id} class="form-input">
											<option value="">-- No Salesman Assigned --</option>
											{#if loadingSalesmen}
												<option disabled>Loading salesmen...</option>
											{:else}
												{#each salesmen as salesman (salesman.id)}
													<option value={salesman.id}>{salesman.name} {salesman.fin_cono ? `(${salesman.fin_cono})` : ''}</option>
												{/each}
											{/if}
										</select>
									</div>
								</div>
							</div>

							<!-- Notes -->
							<div class="form-section">
								<h4>Additional Information</h4>
								<div class="form-row full-width">
									<div class="form-group">
										<label>Notes</label>
										<textarea bind:value={editData.notes} class="form-input form-textarea" rows="4" placeholder="Any additional notes about this customer..."></textarea>
									</div>
								</div>
							</div>
						</div>
					</div>
				{:else}
					<!-- View Mode -->
					<div class="customer-info">
						<div class="info-header">
							<div class="customer-title">
								<h2>{customer.name}</h2>
								{#if customer.account_number}
									<span class="account-badge">#{customer.account_number}</span>
								{/if}
							</div>
							<div class="customer-meta">
								<span class="created-date">Created: {formatDate(customer.created_at)}</span>
							</div>
						</div>

						<div class="info-grid">
							<!-- Contact Information -->
							<div class="info-section">
								<h4>Contact Information</h4>
								<div class="info-details">
									{#if customer.contact_email}
										<div class="info-row">
											<span class="info-label">Email:</span>
											<span class="info-value">
												<a href="mailto:{customer.contact_email}" class="email-link">{customer.contact_email}</a>
											</span>
										</div>
									{/if}
									{#if customer.phone}
										<div class="info-row">
											<span class="info-label">Phone:</span>
											<span class="info-value">
												<a href="tel:{customer.phone}" class="phone-link">{customer.phone}</a>
											</span>
										</div>
									{/if}
									{#if customer.billing_contact}
										<div class="info-row">
											<span class="info-label">Billing Contact:</span>
											<span class="info-value">{customer.billing_contact}</span>
										</div>
									{/if}
								</div>
							</div>

							<!-- Address Information -->
							{#if customer.address1 || customer.city || customer.state}
								<div class="info-section">
									<h4>Address Information</h4>
									<div class="info-details">
										{#if customer.address1}
											<div class="info-row">
												<span class="info-label">Address:</span>
												<span class="info-value">
													{customer.address1}
													{#if customer.address2}<br />{customer.address2}{/if}
												</span>
											</div>
										{/if}
										{#if customer.city || customer.state || customer.zip}
											<div class="info-row">
												<span class="info-label">Location:</span>
												<span class="info-value">
													{customer.city}{customer.city && (customer.state || customer.zip) ? ', ' : ''}
													{customer.state} {customer.zip}
												</span>
											</div>
										{/if}
									</div>
								</div>
							{/if}

							<!-- Business Information -->
							<div class="info-section">
								<h4>Business Information</h4>
								<div class="info-details">
									{#if customer.payment_terms}
										<div class="info-row">
											<span class="info-label">Payment Terms:</span>
											<span class="info-value payment-terms">{customer.payment_terms}</span>
										</div>
									{/if}
									<div class="info-row">
										<span class="info-label">Customer ID:</span>
										<span class="info-value customer-id">{customer.id}</span>
									</div>
									<div class="info-row">
										<span class="info-label">Assigned Salesman:</span>
										<span class="info-value">
											{#if customer.salesman_id}
												{#each salesmen as salesman (salesman.id)}
													{#if salesman.id === customer.salesman_id}
														{salesman.name} {salesman.fin_cono ? `(${salesman.fin_cono})` : ''}
													{/if}
												{/each}
											{:else}
												<span style="color: #6b7280;">No salesman assigned</span>
											{/if}
										</span>
									</div>
								</div>
							</div>

							<!-- Notes -->
							{#if customer.notes}
								<div class="info-section full-width">
									<h4>Additional Notes</h4>
									<div class="info-details">
										<div class="notes-content">{customer.notes}</div>
									</div>
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Logout Button -->
		<div class="logout-section">
			<button on:click={handleSignOut} disabled={loading} class="logout-button">
				{loading ? 'Signing Out...' : 'Logout'}
			</button>
		</div>
	</div>
</div>

<style>
	.detail-container {
		background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		min-height: 100vh;
		padding: 2rem;
	}

	.main-content {
		max-width: 1200px;
		margin: 0 auto;
	}

	.header-section {
		background: white;
		padding: 2rem;
		border-radius: 16px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
		margin-bottom: 2rem;
	}

	.header-content {
		text-align: center;
	}

	.page-title {
		font-size: 2.5rem;
		font-weight: 700;
		color: #1f2937;
		margin: 0 0 0.5rem 0;
		background: linear-gradient(135deg, #ea580c, #dc2626);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.page-subtitle {
		font-size: 1.1rem;
		color: #6b7280;
		margin: 0;
	}

	.nav-section {
		display: flex;
		gap: 1rem;
		margin-bottom: 2rem;
		flex-wrap: wrap;
	}

	.nav-link, .edit-button {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #7c3aed, #6d28d9);
		color: white;
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 600;
		border-radius: 12px;
		transition: all 0.3s ease;
		box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		border: none;
		cursor: pointer;
	}

	.nav-link:hover, .edit-button:hover {
		background: linear-gradient(135deg, #6d28d9, #5b21b6);
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(124, 58, 237, 0.4);
	}

	.edit-button {
		background: linear-gradient(135deg, #ea580c, #dc2626);
		box-shadow: 0 4px 15px rgba(234, 88, 12, 0.3);
	}

	.edit-button:hover {
		background: linear-gradient(135deg, #dc2626, #b91c1c);
		box-shadow: 0 8px 25px rgba(234, 88, 12, 0.4);
	}

	.user-info {
		background: white;
		padding: 1.5rem;
		border-radius: 16px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
		margin-bottom: 2rem;
	}

	.status-text, .function-text {
		margin: 0.25rem 0;
		font-size: 0.95rem;
		color: #374151;
	}

	.highlight {
		color: #7c3aed;
		font-weight: 600;
	}

	.loading-section, .error-section {
		background: white;
		padding: 4rem 2rem;
		border-radius: 16px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
		text-align: center;
		margin-bottom: 2rem;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #e5e7eb;
		border-top: 4px solid #ea580c;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 1rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.error-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.error-section h3 {
		color: #1f2937;
		margin: 0 0 0.5rem 0;
		font-size: 1.5rem;
	}

	.error-section p {
		color: #6b7280;
		margin: 0 0 1.5rem 0;
	}

	.error-action {
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #7c3aed, #6d28d9);
		color: white;
		text-decoration: none;
		border-radius: 12px;
		font-weight: 600;
		transition: all 0.3s ease;
	}

	.error-action:hover {
		background: linear-gradient(135deg, #6d28d9, #5b21b6);
		transform: translateY(-2px);
	}

	.customer-section {
		background: white;
		border-radius: 16px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
		margin-bottom: 2rem;
		padding: 2rem;
	}

	.message {
		padding: 1rem 1.5rem;
		margin-bottom: 2rem;
		border-radius: 12px;
		text-align: center;
		font-weight: 600;
		font-size: 0.95rem;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
	}

	.message.success {
		background: linear-gradient(135deg, #dcfce7, #bbf7d0);
		color: #166534;
		border: 2px solid #22c55e;
	}

	.message.error {
		background: linear-gradient(135deg, #fef2f2, #fecaca);
		color: #dc2626;
		border: 2px solid #ef4444;
	}

	/* Edit Form Styles */
	.form-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid #e5e7eb;
	}

	.form-header h3 {
		margin: 0;
		font-size: 1.5rem;
		color: #1f2937;
	}

	.form-actions {
		display: flex;
		gap: 1rem;
	}

	.save-button {
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #16a34a, #15803d);
		color: white;
		border: none;
		border-radius: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		box-shadow: 0 4px 15px rgba(22, 163, 74, 0.3);
	}

	.save-button:hover:not(:disabled) {
		background: linear-gradient(135deg, #15803d, #166534);
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(22, 163, 74, 0.4);
	}

	.save-button:disabled {
		opacity: 0.7;
		cursor: not-allowed;
		transform: none;
	}

	.cancel-button {
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #6b7280, #4b5563);
		color: white;
		border: none;
		border-radius: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		box-shadow: 0 4px 15px rgba(107, 114, 128, 0.3);
	}

	.cancel-button:hover:not(:disabled) {
		background: linear-gradient(135deg, #4b5563, #374151);
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(107, 114, 128, 0.4);
	}

	.form-grid {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.form-section {
		padding: 1.5rem;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		background: linear-gradient(135deg, #ffffff, #f8fafc);
	}

	.form-section h4 {
		margin: 0 0 1rem 0;
		font-size: 1.1rem;
		color: #374151;
		font-weight: 600;
	}

	.form-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.form-row.full-width {
		grid-template-columns: 1fr;
	}

	.form-row:last-child {
		margin-bottom: 0;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group label {
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
	}

	.form-input {
		padding: 0.875rem 1rem;
		border: 2px solid #e5e7eb;
		background-color: white;
		border-radius: 12px;
		transition: all 0.3s ease;
		color: #1f2937;
		font-size: 0.95rem;
	}

	.form-textarea {
		resize: vertical;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		line-height: 1.5;
	}

	.form-input:focus {
		outline: none;
		border-color: #ea580c;
		background-color: #fff7ed;
		box-shadow: 0 0 0 4px rgba(234, 88, 12, 0.1);
	}

	/* View Mode Styles */
	.info-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid #e5e7eb;
	}

	.customer-title {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.customer-title h2 {
		margin: 0;
		font-size: 2rem;
		color: #1f2937;
		font-weight: 700;
	}

	.account-badge {
		background: linear-gradient(135deg, #7c3aed, #6d28d9);
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 12px;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.customer-meta {
		text-align: right;
	}

	.created-date {
		font-size: 0.875rem;
		color: #6b7280;
		font-weight: 500;
	}

	.info-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
		gap: 2rem;
	}

	.info-section {
		padding: 1.5rem;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		background: linear-gradient(135deg, #ffffff, #f8fafc);
	}

	.info-section.full-width {
		grid-column: 1 / -1;
	}

	.info-section h4 {
		margin: 0 0 1rem 0;
		font-size: 1.1rem;
		color: #374151;
		font-weight: 600;
		border-bottom: 1px solid #e5e7eb;
		padding-bottom: 0.5rem;
	}

	.info-details {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.info-row {
		display: flex;
		gap: 1rem;
	}

	.info-label {
		font-weight: 600;
		color: #6b7280;
		min-width: 120px;
		font-size: 0.875rem;
	}

	.info-value {
		color: #1f2937;
		font-size: 0.875rem;
		flex: 1;
	}

	.email-link, .phone-link {
		color: #ea580c;
		text-decoration: none;
		font-weight: 500;
		transition: color 0.3s ease;
	}

	.email-link:hover, .phone-link:hover {
		color: #dc2626;
		text-decoration: underline;
	}

	.payment-terms {
		background: linear-gradient(135deg, #16a34a, #15803d);
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.75rem;
		display: inline-block;
	}

	.customer-id {
		font-family: 'Courier New', monospace;
		background: #f3f4f6;
		padding: 0.25rem 0.5rem;
		border-radius: 6px;
		font-size: 0.75rem;
	}

	.notes-content {
		background: #f8fafc;
		padding: 1rem;
		border-radius: 8px;
		border-left: 4px solid #ea580c;
		line-height: 1.6;
		white-space: pre-wrap;
	}

	.logout-section {
		text-align: center;
		margin-top: 2rem;
	}

	.logout-button {
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #dc2626, #b91c1c);
		color: white;
		border: none;
		border-radius: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);
	}

	.logout-button:hover:not(:disabled) {
		background: linear-gradient(135deg, #b91c1c, #991b1b);
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(220, 38, 38, 0.4);
	}

	.logout-button:disabled {
		opacity: 0.7;
		cursor: not-allowed;
		transform: none;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.detail-container {
			padding: 1rem;
		}
		
		.nav-section {
			flex-direction: column;
		}
		
		.form-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}
		
		.form-actions {
			width: 100%;
			justify-content: stretch;
		}
		
		.save-button, .cancel-button {
			flex: 1;
		}
		
		.info-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}
		
		.customer-title {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}
		
		.info-grid {
			grid-template-columns: 1fr;
		}
		
		.info-row {
			flex-direction: column;
			gap: 0.25rem;
		}
		
		.info-label {
			min-width: auto;
		}
	}
</style>
