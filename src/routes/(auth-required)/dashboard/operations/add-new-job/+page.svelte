<!-- Add New Job - Operations -->
<script lang="ts">
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { getCurrentUser, signOut } from '$lib/auth'
	import { getCurrentUserProfile } from '$lib/userService'
	import { supabase } from '$lib/supabase'
	import type { User } from '@supabase/supabase-js'
	import type { UserProfile } from '$lib/types'
	
	let user: User | null = null
	let userProfile: UserProfile | null = null
	let loading = false
	let saving = false
	let customers: any[] = []
	let filteredCustomers: any[] = []
	let customerSearchQuery = ''
	let selectedCustomer: any = null
	let showCustomerDropdown = false
	let message = ''
	let success = false
	let validationErrors: Record<string, string> = {}
	
	// Helper functions
	function getTodaysDate(): string {
		const today = new Date()
		return today.toISOString().split('T')[0]
	}
	
	function getCurrentTime(): string {
		const now = new Date()
		return now.toTimeString().slice(0, 5)
	}

	function generateJobno(jobNumber: string, jobType: string): string {
		if (!jobNumber) return ''
		const typeCode = jobType === 'Call' ? 'C' : 'M'
		return jobNumber + typeCode
	}

	// Job data structure
	let jobData = {
		job_number: '',
		jobno: '',
		bol_number: '',
		po_number: '',
		commodity: '',
		pieces: 1,
		weight: 1,
		service_type: 'NFO',
		job_type: 'Call',
		
		// Customer information (required)
		customer_id: '',
		customer_name: '',
		
		// Shipper information
		shipper_name: '',
		shipper_address1: '',
		shipper_address2: '',
		shipper_city: '',
		shipper_state: '',
		shipper_zip: '',
		shipper_phone: '',
		shipper_contact: '',
		
		// Consignee information
		consignee_name: '',
		consignee_address1: '',
		consignee_address2: '',
		consignee_city: '',
		consignee_state: '',
		consignee_zip: '',
		consignee_phone: '',
		consignee_contact: '',
		
		// Timing
		ready_date: getTodaysDate(),
		ready_time: getCurrentTime()
	}

	onMount(async () => {
		loading = true
		try {
			user = await getCurrentUser()
			if (!user) {
				goto('/')
				return
			}
			userProfile = await getCurrentUserProfile()
			await loadCustomers()
		} catch (error) {
			console.error('Error loading user data:', error)
			goto('/')
		} finally {
			loading = false
		}
	})

	async function loadCustomers() {
		try {
			const { data, error } = await supabase
				.from('customers')
				.select('id, name, contact_email, account_number')
				.order('name')
			
			if (error) {
				console.error('Error loading customers:', error)
				return
			}
			
			customers = data || []
			filteredCustomers = customers
		} catch (err) {
			console.error('Error in loadCustomers:', err)
		}
	}

	function handleCustomerSearch() {
		if (!customerSearchQuery.trim()) {
			filteredCustomers = customers
			showCustomerDropdown = customers.length > 0
			return
		}
		
		const query = customerSearchQuery.toLowerCase().trim()
		filteredCustomers = customers.filter(customer => 
			customer.name?.toLowerCase().includes(query) ||
			customer.contact_email?.toLowerCase().includes(query) ||
			customer.account_number?.toLowerCase().includes(query)
		)
		showCustomerDropdown = filteredCustomers.length > 0
	}

	function selectCustomer(customer: any) {
		selectedCustomer = customer
		jobData.customer_id = customer.id
		jobData.customer_name = customer.name
		customerSearchQuery = customer.name
		showCustomerDropdown = false
		validationErrors.customer_id = ''
	}

	function clearCustomerSelection() {
		selectedCustomer = null
		jobData.customer_id = ''
		jobData.customer_name = ''
		customerSearchQuery = ''
		showCustomerDropdown = false
	}

	async function generateJobNumber(): Promise<string> {
		try {
			const { data: { session } } = await supabase.auth.getSession()
			if (!session) {
				return '3000001'
			}
			
			const { data, error } = await supabase
				.from('jobsfile')
				.select('job_number')
				.like('job_number', '3%')
				.order('job_number', { ascending: false })
				.limit(1)
			
			if (error) {
				console.error('Error fetching job numbers:', error)
				return '3000001'
			}
			
			let nextNumber = 3000001
			
			if (data && data.length > 0) {
				const lastJobNumber = data[0].job_number
				const lastNumber = parseInt(lastJobNumber)
				if (!isNaN(lastNumber)) {
					nextNumber = lastNumber + 1
				}
			}
			
			return nextNumber.toString().padStart(7, '0')
		} catch (error) {
			console.error('Error generating job number:', error)
			return '3000001'
		}
	}

	async function createNewJob() {
		saving = true
		message = ''
		success = false
		validationErrors = {}
		
		try {
			// Validation
			if (!jobData.customer_id) {
				validationErrors.customer_id = 'Customer selection is required'
			}
			if (!jobData.commodity.trim()) {
				validationErrors.commodity = 'Commodity is required'
			}
			if (!jobData.shipper_name.trim()) {
				validationErrors.shipper_name = 'Shipper name is required'
			}
			if (!jobData.consignee_name.trim()) {
				validationErrors.consignee_name = 'Consignee name is required'
			}

			if (Object.keys(validationErrors).length > 0) {
				message = 'Please fix the validation errors below'
				saving = false
				return
			}

			// Generate job number
			jobData.job_number = await generateJobNumber()
			jobData.jobno = generateJobno(jobData.job_number, jobData.job_type)

			// Get current user
			const { data: { user } } = await supabase.auth.getUser()
			
			// Insert job into database
			const { data, error } = await supabase
				.from('jobsfile')
				.insert([{
					jobnumber: jobData.job_number,
					job_number: jobData.job_number,
					jobno: jobData.jobno,
					bol_number: jobData.bol_number || null,
					po_number: jobData.po_number || null,
					commodity: jobData.commodity,
					pieces: jobData.pieces,
					weight: jobData.weight,
					service_type: jobData.service_type,
					job_type: jobData.job_type,
					
					customer_id: jobData.customer_id,
					customer_name: jobData.customer_name,
					
					shipper_name: jobData.shipper_name,
					shipper_address1: jobData.shipper_address1 || null,
					shipper_address2: jobData.shipper_address2 || null,
					shipper_city: jobData.shipper_city || null,
					shipper_state: jobData.shipper_state || null,
					shipper_zip: jobData.shipper_zip || null,
					shipper_phone: jobData.shipper_phone || null,
					shipper_contact: jobData.shipper_contact || null,
					
					consignee_name: jobData.consignee_name,
					consignee_address1: jobData.consignee_address1 || null,
					consignee_address2: jobData.consignee_address2 || null,
					consignee_city: jobData.consignee_city || null,
					consignee_state: jobData.consignee_state || null,
					consignee_zip: jobData.consignee_zip || null,
					consignee_phone: jobData.consignee_phone || null,
					consignee_contact: jobData.consignee_contact || null,
					
					ready_date: jobData.ready_date,
					ready_time: jobData.ready_time,
					
					status: 'pending',
					created_by: user?.id || null,
					created_at: new Date().toISOString()
				}])
			
			if (error) {
				console.error('Error creating job:', error)
				message = 'Error creating job: ' + error.message
				saving = false
				return
			}
			
			success = true
			message = `Job ${jobData.jobno} created successfully!`
			
			// Navigate to job detail page
			setTimeout(() => {
				goto(`/dashboard/operations/jobs/${jobData.jobno}`)
			}, 1500)
			
		} catch (error) {
			console.error('Error creating job:', error)
			message = 'An unexpected error occurred'
		} finally {
			saving = false
		}
	}

	async function handleSignOut() {
		await signOut()
		goto('/')
	}

	// Reactive statements
	$: if (customerSearchQuery !== undefined) {
		handleCustomerSearch()
	}

	$: jobData.jobno = generateJobno(jobData.job_number, jobData.job_type)
</script>

<svelte:head>
	<title>Add New Job - Operations</title>
</svelte:head>

<div class="job-container">
	<div class="main-content">
		<!-- Header -->
		<div class="header-section">
			<div class="header-content">
				<h1 class="page-title">Add New Job</h1>
				<p class="page-subtitle">Create a new job with customer assignment</p>
			</div>
		</div>

		<!-- Navigation -->
		<div class="nav-section">
			<button class="nav-link" on:click={() => goto('/dashboard/operations')}>
				⬅ Back to Operations
			</button>
		</div>

		<!-- User Information -->
		{#if user && userProfile}
			<div class="user-info">
				<p class="status-text">Status: <span class="highlight">Operations Access</span></p>
				<p class="function-text">Function: Job Creation</p>
			</div>
		{/if}

		{#if loading}
			<div class="loading-state">
				<div class="loading-spinner"></div>
				<p>Loading...</p>
			</div>
		{:else}
			<div class="form-section">
				<form on:submit|preventDefault={createNewJob}>
					<!-- Customer Selection (Required) -->
					<div class="form-group full-width">
						<h3>Customer Information</h3>
						<div class="customer-search-section">
							<label>Customer (Required) *</label>
							<div class="search-container">
								<input 
									type="text"
									bind:value={customerSearchQuery}
									placeholder="Search customers by name, email, or account number..."
									class="search-input"
									class:error={validationErrors.customer_id}
									on:focus={() => showCustomerDropdown = filteredCustomers.length > 0}
									on:blur={() => setTimeout(() => showCustomerDropdown = false, 200)}
								/>
								{#if selectedCustomer}
									<button type="button" class="clear-customer" on:click={clearCustomerSelection}>
										✕
									</button>
								{/if}
								
								{#if showCustomerDropdown && filteredCustomers.length > 0}
									<div class="customer-dropdown">
										{#each filteredCustomers as customer (customer.id)}
											<div 
												class="customer-option"
												on:click={() => selectCustomer(customer)}
												on:keydown={(e) => e.key === 'Enter' && selectCustomer(customer)}
												role="button"
												tabindex="0"
											>
												<div class="customer-name">{customer.name}</div>
												<div class="customer-details">
													{customer.contact_email}
													{#if customer.account_number}
														• #{customer.account_number}
													{/if}
												</div>
											</div>
										{/each}
									</div>
								{/if}
							</div>
							{#if validationErrors.customer_id}
								<span class="error-text">{validationErrors.customer_id}</span>
							{/if}
							{#if selectedCustomer}
								<div class="selected-customer">
									<span class="selected-label">Selected:</span>
									<span class="selected-name">{selectedCustomer.name}</span>
									{#if selectedCustomer.account_number}
										<span class="selected-account">#{selectedCustomer.account_number}</span>
									{/if}
								</div>
							{/if}
						</div>
					</div>

					<!-- Job Information -->
					<div class="form-row">
						<div class="form-group">
							<label>Job Number</label>
							<input type="text" value={jobData.job_number || 'Auto-generated'} class="form-input" readonly />
						</div>
						<div class="form-group">
							<label>BOL Number</label>
							<input type="text" bind:value={jobData.bol_number} class="form-input" />
						</div>
						<div class="form-group">
							<label>PO Number</label>
							<input type="text" bind:value={jobData.po_number} class="form-input" />
						</div>
					</div>

					<!-- Commodity & Service Info -->
					<div class="form-row">
						<div class="form-group">
							<label>Commodity *</label>
							<input type="text" bind:value={jobData.commodity} class="form-input" class:error={validationErrors.commodity} required />
							{#if validationErrors.commodity}
								<span class="error-text">{validationErrors.commodity}</span>
							{/if}
						</div>
						<div class="form-group">
							<label>Pieces</label>
							<input type="number" bind:value={jobData.pieces} class="form-input" min="1" />
						</div>
						<div class="form-group">
							<label>Weight</label>
							<input type="number" bind:value={jobData.weight} class="form-input" min="1" />
						</div>
						<div class="form-group">
							<label>Service Type</label>
							<select bind:value={jobData.service_type} class="form-input">
								<option value="NFO">NFO</option>
								<option value="NDO">NDO</option>
								<option value="OBC">OBC</option>
								<option value="Charter">Charter</option>
							</select>
						</div>
						<div class="form-group">
							<label>Job Type</label>
							<select bind:value={jobData.job_type} class="form-input">
								<option value="Call">Call</option>
								<option value="Email">Email</option>
								<option value="Web">Web</option>
							</select>
						</div>
					</div>

					<!-- Ready Date & Time -->
					<div class="form-row">
						<div class="form-group">
							<label>Ready Date</label>
							<input type="date" bind:value={jobData.ready_date} class="form-input" />
						</div>
						<div class="form-group">
							<label>Ready Time</label>
							<input type="time" bind:value={jobData.ready_time} class="form-input" />
						</div>
					</div>

					<!-- Shipper & Consignee -->
					<div class="locations-row">
						<!-- Shipper -->
						<div class="location-section">
							<h4>Shipper Information</h4>
							<div class="location-fields">
								<div class="form-group">
									<label>Company Name *</label>
									<input type="text" bind:value={jobData.shipper_name} class="form-input" class:error={validationErrors.shipper_name} required />
									{#if validationErrors.shipper_name}
										<span class="error-text">{validationErrors.shipper_name}</span>
									{/if}
								</div>
								<div class="form-group">
									<label>Address 1</label>
									<input type="text" bind:value={jobData.shipper_address1} class="form-input" />
								</div>
								<div class="form-group">
									<label>Address 2</label>
									<input type="text" bind:value={jobData.shipper_address2} class="form-input" />
								</div>
								<div class="form-row">
									<div class="form-group">
										<label>City</label>
										<input type="text" bind:value={jobData.shipper_city} class="form-input" />
									</div>
									<div class="form-group">
										<label>State</label>
										<input type="text" bind:value={jobData.shipper_state} class="form-input" />
									</div>
									<div class="form-group">
										<label>ZIP</label>
										<input type="text" bind:value={jobData.shipper_zip} class="form-input" />
									</div>
								</div>
								<div class="form-row">
									<div class="form-group">
										<label>Phone</label>
										<input type="tel" bind:value={jobData.shipper_phone} class="form-input" />
									</div>
									<div class="form-group">
										<label>Contact</label>
										<input type="text" bind:value={jobData.shipper_contact} class="form-input" />
									</div>
								</div>
							</div>
						</div>

						<!-- Consignee -->
						<div class="location-section">
							<h4>Consignee Information</h4>
							<div class="location-fields">
								<div class="form-group">
									<label>Company Name *</label>
									<input type="text" bind:value={jobData.consignee_name} class="form-input" class:error={validationErrors.consignee_name} required />
									{#if validationErrors.consignee_name}
										<span class="error-text">{validationErrors.consignee_name}</span>
									{/if}
								</div>
								<div class="form-group">
									<label>Address 1</label>
									<input type="text" bind:value={jobData.consignee_address1} class="form-input" />
								</div>
								<div class="form-group">
									<label>Address 2</label>
									<input type="text" bind:value={jobData.consignee_address2} class="form-input" />
								</div>
								<div class="form-row">
									<div class="form-group">
										<label>City</label>
										<input type="text" bind:value={jobData.consignee_city} class="form-input" />
									</div>
									<div class="form-group">
										<label>State</label>
										<input type="text" bind:value={jobData.consignee_state} class="form-input" />
									</div>
									<div class="form-group">
										<label>ZIP</label>
										<input type="text" bind:value={jobData.consignee_zip} class="form-input" />
									</div>
								</div>
								<div class="form-row">
									<div class="form-group">
										<label>Phone</label>
										<input type="tel" bind:value={jobData.consignee_phone} class="form-input" />
									</div>
									<div class="form-group">
										<label>Contact</label>
										<input type="text" bind:value={jobData.consignee_contact} class="form-input" />
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Submit Button -->
					<div class="form-actions">
						<button type="submit" class="submit-button" disabled={saving}>
							{saving ? 'Creating Job...' : 'Create Job'}
						</button>
						<button type="button" class="cancel-button" on:click={() => goto('/dashboard/operations')}>
							Cancel
						</button>
					</div>

					<!-- Message Display -->
					{#if message}
						<div class="message" class:success class:error={!success}>
							{message}
						</div>
					{/if}
				</form>
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
	.job-container {
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
		margin-bottom: 2rem;
		text-align: center;
	}

	.nav-link {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #ea580c, #dc2626);
		color: white;
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 600;
		border-radius: 12px;
		transition: all 0.3s ease;
		box-shadow: 0 4px 15px rgba(234, 88, 12, 0.3);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		border: none;
		cursor: pointer;
	}

	.nav-link:hover {
		background: linear-gradient(135deg, #dc2626, #b91c1c);
		transform: translateY(-2px);
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
		color: #ea580c;
		font-weight: 600;
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
		background: white;
		border-radius: 16px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #e5e7eb;
		border-top: 4px solid #ea580c;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.form-section {
		background: white;
		padding: 2.5rem;
		border-radius: 20px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
		margin-bottom: 2rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group.full-width {
		grid-column: 1 / -1;
	}

	.form-group h3 {
		margin: 0 0 1.5rem 0;
		font-size: 1.5rem;
		color: #1f2937;
		font-weight: 600;
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

	.form-input:focus {
		outline: none;
		border-color: #ea580c;
		background-color: #fff7ed;
		box-shadow: 0 0 0 4px rgba(234, 88, 12, 0.1);
	}

	.form-input:read-only {
		background-color: #f9fafb;
		color: #6b7280;
		cursor: not-allowed;
	}

	.form-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.customer-search-section {
		margin-bottom: 2rem;
	}

	.search-container {
		position: relative;
	}

	.search-input {
		width: 100%;
		padding: 1rem 3rem 1rem 1rem;
		border: 2px solid #e5e7eb;
		border-radius: 12px;
		font-size: 1rem;
		transition: all 0.3s ease;
		background: white;
	}

	.search-input:focus {
		outline: none;
		border-color: #ea580c;
		box-shadow: 0 0 0 4px rgba(234, 88, 12, 0.1);
	}

	.clear-customer {
		position: absolute;
		right: 1rem;
		top: 50%;
		transform: translateY(-50%);
		background: #6b7280;
		color: white;
		border: none;
		border-radius: 50%;
		width: 24px;
		height: 24px;
		cursor: pointer;
		font-size: 0.75rem;
		transition: all 0.3s ease;
	}

	.clear-customer:hover {
		background: #374151;
	}

	.customer-dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: 12px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
		z-index: 1000;
		max-height: 200px;
		overflow-y: auto;
	}

	.customer-option {
		padding: 1rem;
		cursor: pointer;
		border-bottom: 1px solid #f3f4f6;
		transition: all 0.3s ease;
	}

	.customer-option:hover {
		background: #f8fafc;
	}

	.customer-option:last-child {
		border-bottom: none;
	}

	.customer-name {
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 0.25rem;
	}

	.customer-details {
		font-size: 0.875rem;
		color: #6b7280;
	}

	.selected-customer {
		margin-top: 0.75rem;
		padding: 0.75rem;
		background: linear-gradient(135deg, #dcfce7, #bbf7d0);
		border-radius: 8px;
		border: 1px solid #22c55e;
	}

	.selected-label {
		font-size: 0.75rem;
		color: #166534;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.selected-name {
		font-weight: 600;
		color: #166534;
		margin-left: 0.5rem;
	}

	.selected-account {
		background: #16a34a;
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		margin-left: 0.5rem;
	}

	.locations-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		margin-bottom: 2rem;
	}

	.location-section {
		padding: 1.5rem;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		background: linear-gradient(135deg, #ffffff, #f8fafc);
	}

	.location-section h4 {
		margin: 0 0 1rem 0;
		font-size: 1.1rem;
		color: #374151;
		font-weight: 600;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.location-fields {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-actions {
		display: flex;
		gap: 1.5rem;
		justify-content: center;
		margin-top: 2.5rem;
		padding-top: 2rem;
		border-top: 1px solid #e5e7eb;
	}

	.submit-button {
		padding: 1rem 2rem;
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
		min-width: 150px;
	}

	.submit-button:hover:not(:disabled) {
		background: linear-gradient(135deg, #15803d, #166534);
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(22, 163, 74, 0.4);
	}

	.submit-button:disabled {
		opacity: 0.7;
		cursor: not-allowed;
		transform: none;
	}

	.cancel-button {
		padding: 1rem 2rem;
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
		min-width: 120px;
	}

	.cancel-button:hover {
		background: linear-gradient(135deg, #4b5563, #374151);
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(107, 114, 128, 0.4);
	}

	.message {
		padding: 1rem 1.5rem;
		margin-top: 1.5rem;
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

	.error-text {
		color: #dc2626;
		font-size: 0.75rem;
		margin-top: 0.25rem;
		font-weight: 500;
	}

	.form-input.error {
		border-color: #dc2626;
		background-color: #fef2f2;
		box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.1);
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
		.job-container {
			padding: 1rem;
		}
		
		.locations-row {
			grid-template-columns: 1fr;
		}
		
		.form-row {
			grid-template-columns: 1fr;
		}
		
		.form-actions {
			flex-direction: column;
			align-items: center;
		}
		
		.submit-button, .cancel-button {
			width: 100%;
			max-width: 300px;
		}
	}
</style> 