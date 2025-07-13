<!-- Add New Customer - Management -->
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

	// Customer form data
	let customerData = {
		company_name: '',
		contact_person: '',
		email: '',
		phone: '',
		address_line1: '',
		address_line2: '',
		city: '',
		state: '',
		postal_code: '',
		country: '',
		billing_contact: '',
		billing_email: '',
		payment_terms: '30',
		credit_limit: '',
		industry: '',
		notes: ''
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
		// TODO: Implement customer creation logic
		console.log('Creating new customer:', customerData)
		alert('Customer creation functionality will be implemented here')
	}

	function copyContactToBilling() {
		customerData.billing_contact = customerData.contact_person
		customerData.billing_email = customerData.email
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
						<input type="text" bind:value={customerData.company_name} required class="form-input" />
					</div>
					<div class="form-group">
						<label class="blue-text">INDUSTRY:</label>
						<select bind:value={customerData.industry} class="form-input">
							<option value="">SELECT INDUSTRY</option>
							<option value="technology">TECHNOLOGY</option>
							<option value="manufacturing">MANUFACTURING</option>
							<option value="healthcare">HEALTHCARE</option>
							<option value="finance">FINANCE</option>
							<option value="retail">RETAIL</option>
							<option value="other">OTHER</option>
						</select>
					</div>
				</div>

				<!-- Contact Information -->
				<div class="form-section-header">
					<h4 class="purple-text">PRIMARY CONTACT</h4>
				</div>
				
				<div class="form-row">
					<div class="form-group">
						<label class="blue-text">CONTACT PERSON:</label>
						<input type="text" bind:value={customerData.contact_person} required class="form-input" />
					</div>
					<div class="form-group">
						<label class="blue-text">EMAIL:</label>
						<input type="email" bind:value={customerData.email} required class="form-input" />
					</div>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label class="blue-text">PHONE:</label>
						<input type="tel" bind:value={customerData.phone} required class="form-input" />
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
						<input type="text" bind:value={customerData.address_line1} required class="form-input" />
					</div>
				</div>

				<div class="form-row">
					<div class="form-group full-width">
						<label class="blue-text">ADDRESS LINE 2:</label>
						<input type="text" bind:value={customerData.address_line2} class="form-input" />
					</div>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label class="blue-text">CITY:</label>
						<input type="text" bind:value={customerData.city} required class="form-input" />
					</div>
					<div class="form-group">
						<label class="blue-text">STATE/PROVINCE:</label>
						<input type="text" bind:value={customerData.state} required class="form-input" />
					</div>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label class="blue-text">POSTAL CODE:</label>
						<input type="text" bind:value={customerData.postal_code} required class="form-input" />
					</div>
					<div class="form-group">
						<label class="blue-text">COUNTRY:</label>
						<input type="text" bind:value={customerData.country} required class="form-input" />
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
					<div class="form-group">
						<label class="blue-text">BILLING EMAIL:</label>
						<input type="email" bind:value={customerData.billing_email} class="form-input" />
					</div>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label class="blue-text">PAYMENT TERMS (DAYS):</label>
						<select bind:value={customerData.payment_terms} class="form-input">
							<option value="15">15 DAYS</option>
							<option value="30">30 DAYS</option>
							<option value="45">45 DAYS</option>
							<option value="60">60 DAYS</option>
						</select>
					</div>
					<div class="form-group">
						<label class="blue-text">CREDIT LIMIT ($):</label>
						<input type="number" bind:value={customerData.credit_limit} class="form-input" min="0" step="100" />
					</div>
				</div>

				<div class="form-row">
					<div class="form-group full-width">
						<label class="blue-text">NOTES:</label>
						<textarea bind:value={customerData.notes} class="form-input form-textarea" rows="3"></textarea>
					</div>
				</div>

				<div class="form-actions">
					<button type="submit" class="submit-button">CREATE CUSTOMER</button>
					<button type="button" on:click={() => goto('/dashboard/management')} class="cancel-button">CANCEL</button>
				</div>
			</form>
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
</style> 