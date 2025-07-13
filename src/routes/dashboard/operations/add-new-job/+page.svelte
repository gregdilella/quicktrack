<!-- Add New Job - Operations -->
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

	// Form data
	let jobData = {
		customer_id: '',
		pickup_location: '',
		delivery_location: '',
		shipment_type: '',
		priority: 'standard',
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
		// TODO: Implement job creation logic
		console.log('Creating new job:', jobData)
		alert('Job creation functionality will be implemented here')
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
			<span class="red-text">OPERATIONS CENTER - ADD NEW JOB</span>
		</div>

		<!-- Navigation -->
		<div class="nav-section">
			<a href="/dashboard/operations" class="nav-link">⬅ BACK TO OPERATIONS MENU</a>
		</div>

		<!-- User Information -->
		{#if user && userProfile}
			<div class="user-info">
				<p class="blue-text">Status: <span class="orange-text">OPERATIONS ACCESS</span></p>
				<p class="blue-text">Function: ADD NEW JOB</p>
			</div>
		{/if}

		<!-- Job Creation Form -->
		<div class="form-section">
			<h3 class="blue-text">--- NEW JOB ENTRY FORM ---</h3>
			<form on:submit|preventDefault={handleSubmit} class="job-form">
				<div class="form-group">
					<label class="blue-text">CUSTOMER ID:</label>
					<input type="text" bind:value={jobData.customer_id} required class="form-input" />
				</div>

				<div class="form-group">
					<label class="blue-text">PICKUP LOCATION:</label>
					<input type="text" bind:value={jobData.pickup_location} required class="form-input" />
				</div>

				<div class="form-group">
					<label class="blue-text">DELIVERY LOCATION:</label>
					<input type="text" bind:value={jobData.delivery_location} required class="form-input" />
				</div>

				<div class="form-group">
					<label class="blue-text">SHIPMENT TYPE:</label>
					<input type="text" bind:value={jobData.shipment_type} required class="form-input" />
				</div>

				<div class="form-group">
					<label class="blue-text">PRIORITY:</label>
					<select bind:value={jobData.priority} class="form-input">
						<option value="standard">STANDARD</option>
						<option value="urgent">URGENT</option>
						<option value="express">EXPRESS</option>
						<option value="critical">CRITICAL</option>
					</select>
				</div>

				<div class="form-group">
					<label class="blue-text">NOTES:</label>
					<textarea bind:value={jobData.notes} class="form-input form-textarea" rows="3"></textarea>
				</div>

				<div class="form-actions">
					<button type="submit" class="submit-button">CREATE JOB</button>
					<button type="button" on:click={() => goto('/dashboard/operations')} class="cancel-button">CANCEL</button>
				</div>
			</form>
		</div>

		<!-- Command Prompt -->
		<div class="command-prompt">
			<span class="red-text">([OPS] Job Creation Module - Ready for Input)</span>
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
		max-width: 800px;
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

	.orange-text {
		color: orange;
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
		background-color: #0066cc;
		color: white;
		text-decoration: none;
		font-size: 10px;
		font-weight: bold;
		border: 1px solid #004499;
	}

	.nav-link:hover {
		background-color: #004499;
	}

	.user-info {
		margin: 20px 0;
	}

	.user-info p {
		margin: 5px 0;
	}

	.form-section {
		margin: 30px 0;
		padding: 20px;
		border: 2px solid #ff8800;
		background-color: #fff8f0;
	}

	.form-section h3 {
		margin: 0 0 20px 0;
		text-align: center;
	}

	.job-form {
		display: flex;
		flex-direction: column;
		gap: 15px;
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

	.form-textarea {
		resize: vertical;
	}

	.form-input:focus {
		outline: none;
		border-color: #0066cc;
		background-color: #f8f9fa;
	}

	.form-actions {
		display: flex;
		gap: 10px;
		justify-content: center;
		margin-top: 20px;
	}

	.submit-button {
		padding: 10px 20px;
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
		padding: 10px 20px;
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