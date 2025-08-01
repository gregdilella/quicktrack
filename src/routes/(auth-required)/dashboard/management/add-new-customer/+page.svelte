<!-- Add New Customer - Management -->
<script lang="ts">
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { getCurrentUser, signOut } from '$lib/auth'
	import { getCurrentUserProfile } from '$lib/userService'
	import { customerSchema, validateForm } from '$lib/validation/schemas'
	import type { User } from '@supabase/supabase-js'
	import type { UserProfile } from '$lib/types'
	
	let user: User | null = null
	let userProfile: UserProfile | null = null
	let loading = false
	let message = ''
	let validationErrors: Record<string, string> = {}

	// Customer form data
	let customerData = {
		name: '',
		contact_email: '',
		contact_phone: '',
		address1: '',
		address2: '',
		city: '',
		state: '',
		zip: '',
		billing_contact: '',
		payment_terms: 'NET_30' as const
	}

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

	function handleSubmit() {
		// Validate form data using Zod
		const validation = validateForm(customerSchema, customerData)
		if (!validation.success) {
			validationErrors = validation.errors || {}
			message = 'Please fix the validation errors below'
			return
		}

		// Clear any previous validation errors
		validationErrors = {}
		
		// TODO: Implement customer creation logic
		console.log('Creating new customer:', validation.data)
		message = 'Customer created successfully!'
		
		// Reset form after successful creation
		customerData = {
			name: '',
			contact_email: '',
			contact_phone: '',
			address1: '',
			address2: '',
			city: '',
			state: '',
			zip: '',
			billing_contact: '',
			payment_terms: 'NET_30' as const
		}
	}

	function copyContactToBilling() {
		customerData.billing_contact = customerData.contact_email
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
			<span class="red-text">MANAGEMENT PORTAL - ADD NEW CUSTOMER</span>
		</div>

		<!-- Navigation -->
		<div class="nav-section">
			<a href="/dashboard/management" class="nav-link">⬅ BACK TO MANAGEMENT MENU</a>
		</div>

		<!-- User Information -->
		{#if user && userProfile}
			<div class="user-info">
				<p class="blue-text">Status: <span class="purple-text">MANAGEMENT ACCESS</span></p>
				<p class="blue-text">Function: CUSTOMER REGISTRATION</p>
			</div>
		{/if}

		<!-- Customer Registration Form -->
		<div class="form-section">
			<h3 class="blue-text">--- NEW CUSTOMER REGISTRATION ---</h3>
			<form on:submit|preventDefault={handleSubmit} class="customer-form">
				
				<!-- Company Information -->
				<div class="form-section-header">
					<h4 class="purple-text">COMPANY INFORMATION</h4>
				</div>
				
				<div class="form-row">
					<div class="form-group">
						<label class="blue-text">COMPANY NAME:</label>
						<input type="text" bind:value={customerData.name} required class="form-input" class:error={validationErrors.name} />
						{#if validationErrors.name}
							<span class="error-text">{validationErrors.name}</span>
						{/if}
					</div>
				</div>

				<!-- Contact Information -->
				<div class="form-section-header">
					<h4 class="purple-text">PRIMARY CONTACT</h4>
				</div>
				
				<div class="form-row">
					<div class="form-group">
						<label class="blue-text">EMAIL:</label>
						<input type="email" bind:value={customerData.contact_email} required class="form-input" class:error={validationErrors.contact_email} />
						{#if validationErrors.contact_email}
							<span class="error-text">{validationErrors.contact_email}</span>
						{/if}
					</div>
					<div class="form-group">
						<label class="blue-text">PHONE:</label>
						<input type="tel" bind:value={customerData.contact_phone} class="form-input" class:error={validationErrors.contact_phone} />
						{#if validationErrors.contact_phone}
							<span class="error-text">{validationErrors.contact_phone}</span>
						{/if}
					</div>
					<div class="form-group">
						<!-- Empty space for alignment -->
					</div>
				</div>

				<!-- Address Information -->
				<div class="form-section-header">
					<h4 class="purple-text">COMPANY ADDRESS</h4>
				</div>
				
				<div class="form-row">
					<div class="form-group full-width">
						<label class="blue-text">ADDRESS LINE 1:</label>
						<input type="text" bind:value={customerData.address1} class="form-input" class:error={validationErrors.address1} />
						{#if validationErrors.address1}
							<span class="error-text">{validationErrors.address1}</span>
						{/if}
					</div>
				</div>

				<div class="form-row">
					<div class="form-group full-width">
						<label class="blue-text">ADDRESS LINE 2:</label>
						<input type="text" bind:value={customerData.address2} class="form-input" class:error={validationErrors.address2} />
						{#if validationErrors.address2}
							<span class="error-text">{validationErrors.address2}</span>
						{/if}
					</div>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label class="blue-text">CITY:</label>
						<input type="text" bind:value={customerData.city} class="form-input" class:error={validationErrors.city} />
						{#if validationErrors.city}
							<span class="error-text">{validationErrors.city}</span>
						{/if}
					</div>
					<div class="form-group">
						<label class="blue-text">STATE/PROVINCE:</label>
						<input type="text" bind:value={customerData.state} class="form-input" class:error={validationErrors.state} />
						{#if validationErrors.state}
							<span class="error-text">{validationErrors.state}</span>
						{/if}
					</div>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label class="blue-text">ZIP CODE:</label>
						<input type="text" bind:value={customerData.zip} class="form-input" class:error={validationErrors.zip} />
						{#if validationErrors.zip}
							<span class="error-text">{validationErrors.zip}</span>
						{/if}
					</div>
				</div>

				<!-- Billing Information -->
				<div class="form-section-header">
					<h4 class="purple-text">BILLING INFORMATION</h4>
					<button type="button" on:click={copyContactToBilling} class="copy-button">COPY FROM CONTACT</button>
				</div>
				
				<div class="form-row">
					<div class="form-group">
						<label class="blue-text">BILLING CONTACT:</label>
						<input type="text" bind:value={customerData.billing_contact} class="form-input" />
					</div>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label class="blue-text">PAYMENT TERMS:</label>
						<select bind:value={customerData.payment_terms} class="form-input">
							<option value="NET_30">NET 30 DAYS</option>
							<option value="NET_60">NET 60 DAYS</option>
							<option value="COD">COD</option>
							<option value="PREPAID">PREPAID</option>
						</select>
					</div>
				</div>

				<div class="form-actions">
					<button type="submit" class="submit-button">CREATE CUSTOMER</button>
					<button type="button" on:click={() => goto('/dashboard/management')} class="cancel-button">CANCEL</button>
				</div>
			</form>
			
			{#if message}
				<div class="message" class:success={message.includes('success')} class:error={message.includes('error') || message.includes('fix')}>
					{message}
				</div>
			{/if}
		</div>

		<!-- Command Prompt -->
		<div class="command-prompt">
			<span class="red-text">([MGMT] Customer Registration Module - Ready for Input)</span>
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
		max-width: 900px;
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

	.form-section {
		margin: 30px 0;
		padding: 25px;
		border: 2px solid #8800cc;
		background-color: #f8f0ff;
	}

	.form-section h3 {
		margin: 0 0 25px 0;
		text-align: center;
	}

	.form-section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin: 25px 0 15px 0;
		padding-bottom: 10px;
		border-bottom: 1px solid #8800cc;
	}

	.form-section-header h4 {
		margin: 0;
		font-size: 12px;
	}

	.copy-button {
		padding: 4px 8px;
		font-family: 'Courier New', monospace;
		font-size: 10px;
		background-color: #0066cc;
		color: white;
		border: none;
		cursor: pointer;
		font-weight: bold;
	}

	.copy-button:hover {
		background-color: #004499;
	}

	.customer-form {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 20px;
		align-items: end;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.form-group.full-width {
		grid-column: 1 / -1;
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

	.form-textarea {
		resize: vertical;
	}

	.form-input:focus {
		outline: none;
		border-color: #8800cc;
		background-color: #f8f9fa;
	}

	.form-actions {
		display: flex;
		gap: 15px;
		justify-content: center;
		margin-top: 30px;
	}

	.submit-button {
		padding: 12px 25px;
		font-family: 'Courier New', monospace;
		font-size: 12px;
		background-color: #008800;
		color: white;
		border: none;
		cursor: pointer;
		font-weight: bold;
	}

	.submit-button:hover {
		background-color: #006600;
	}

	.cancel-button {
		padding: 12px 25px;
		font-family: 'Courier New', monospace;
		font-size: 12px;
		background-color: #888888;
		color: white;
		border: none;
		cursor: pointer;
		font-weight: bold;
	}

	.cancel-button:hover {
		background-color: #666666;
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

	/* Error styling for form validation */
	.form-input.error {
		border-color: #dc2626;
		background-color: #fef2f2;
	}

	.error-text {
		color: #dc2626;
		font-size: 10px;
		margin-top: 2px;
		display: block;
	}

	.message {
		padding: 10px;
		margin: 10px 0;
		border-radius: 4px;
		text-align: center;
		font-weight: bold;
	}

	.message.success {
		background-color: #dcfce7;
		color: #166534;
		border: 1px solid #bbf7d0;
	}

	.message.error {
		background-color: #fef2f2;
		color: #dc2626;
		border: 1px solid #fecaca;
	}
</style> 