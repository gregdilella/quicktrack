<!-- Terminal Interface Recreation -->
<script lang="ts">
	import { onMount } from 'svelte'
	import { signUp, signIn, signOut, getCurrentUser, getCurrentSession } from '$lib/auth'
	import { getCurrentUserProfile } from '$lib/userService'
	import type { User, Session } from '@supabase/supabase-js'
	import type { UserProfile } from '$lib/types'
	
	let user: User | null = null
	let userProfile: UserProfile | null = null
	let session: Session | null = null
	let email = ''
	let password = ''
	let loading = false
	let message = ''

	// Test authentication on component mount
	onMount(async () => {
		await checkAuth()
	})

	async function checkAuth() {
		try {
			user = await getCurrentUser()
			session = await getCurrentSession()
			if (user) {
				userProfile = await getCurrentUserProfile()
			}
		} catch (error) {
			console.error('Auth check error:', error)
		}
	}

	async function handleSignUp() {
		loading = true
		message = ''
		
		const { user: newUser, error } = await signUp(email, password)
		
		if (error) {
			message = `Sign up error: ${error.message}`
		} else {
			message = 'Sign up successful! Check your email for verification.'
			await checkAuth()
		}
		
		loading = false
	}

	async function handleSignIn() {
		loading = true
		message = ''
		
		const { user: newUser, error } = await signIn(email, password)
		
		if (error) {
			message = `Sign in error: ${error.message}`
		} else {
			message = 'Sign in successful!'
			await checkAuth()
		}
		
		loading = false
	}

	async function handleSignOut() {
		loading = true
		message = ''
		
		const { error } = await signOut()
		
		if (error) {
			message = `Sign out error: ${error.message}`
		} else {
			message = 'Signed out successfully!'
			user = null
			userProfile = null
			session = null
		}
		
		loading = false
	}
</script>

<div class="terminal-container">
	<div class="main-content">
		<!-- ASCII Art Header -->
		<div class="ascii-header">
			<pre class="red-text">QQQQQ            ii          k
QQ    QQ              k
QQ    QQ uu   uu iii   cc     kk  kk
QQ    QQ uu   uu  ii  cc      kk kk
QQ QQ QQ uu   uu  ii  cc      kkk
QQQQ  QQ uu   uu  ii  cc      kk kk
  QQQQQ    uuuu   iiii   cccc kk  kk
QQ</pre>
		</div>

		<!-- System Title -->
		<div class="system-title">
			<span class="red-text">INTERNATIONAL COURIER</span>
		</div>

		<!-- Date and Time -->
		<div class="datetime-section">
			<p class="blue-text">Date : 28 JUN 2025   Time: 19:03</p>
		</div>

		<!-- User Information -->
		<div class="user-info">
			<p class="blue-text">Port : 153</p>
			<p class="blue-text">Name : Greg Dilella</p>
			<p class="blue-text">Dept : Corporate Solutions Team Qa - Contracto</p>
			<p class="blue-text">Email: GREG_DILELLA@QINTL.COM</p>
		</div>

		<!-- Authentication Test Section -->
		<div class="auth-section">
			<h3 class="blue-text">--- AUTHENTICATION TEST ---</h3>
			
			{#if user}
				<div class="auth-info">
					<p class="blue-text">✅ Logged in as: {user.email}</p>
					<p class="blue-text">User ID: {user.id}</p>
					{#if userProfile}
						<p class="blue-text">Role: {userProfile.role}</p>
						<p class="blue-text">Profile Created: {new Date(userProfile.created_at).toLocaleDateString()}</p>
					{/if}
					<button on:click={handleSignOut} disabled={loading} class="auth-button">
						{loading ? 'Signing out...' : 'Sign Out'}
					</button>
				</div>
			{:else}
				<div class="auth-form">
					<p class="blue-text">Test your authentication:</p>
					<input 
						type="email" 
						bind:value={email} 
						placeholder="Email"
						class="auth-input"
					/>
					<input 
						type="password" 
						bind:value={password} 
						placeholder="Password"
						class="auth-input"
					/>
					<div class="auth-buttons">
						<button on:click={handleSignIn} disabled={loading} class="auth-button">
							{loading ? 'Signing in...' : 'Sign In'}
						</button>
						<button on:click={handleSignUp} disabled={loading} class="auth-button">
							{loading ? 'Signing up...' : 'Sign Up'}
						</button>
					</div>
				</div>
			{/if}
			
			{#if message}
				<p class="auth-message">{message}</p>
			{/if}
		</div>

		<!-- Support Message -->
		<div class="support-message">
			<p class="blue-text">Please report ALL IT</p>
			<p class="blue-text">issues via Jira and TOPdesk</p>
		</div>

		<!-- Command Prompt -->
		<div class="command-prompt">
			<span class="red-text">([RETURN] or &lt;FILE&gt;)Execute, &lt;EXIT&gt;Abort</span>
		</div>
	</div>

	<!-- Sidebar -->
	<div class="sidebar">
		<div class="accounts-header">
			<h3>Available User Accounts</h3>
		</div>
		<div class="accounts-list">
			<div class="account-item development">Development - QICDEV1.0</div>
			<div class="account-item">QICAP - Accounts Payable</div>
			<div class="account-item">QICJFK - New York</div>
			<div class="account-item">QICSJO - Cost Rica</div>
			<div class="account-item">QICSEAT - Seat</div>
			<div class="account-item">QICSTATUK - Stat UK</div>
			<div class="account-item">QICUK - United Kingdom</div>
			<div class="account-item">Sterling</div>
			<div class="account-item">TCL</div>
			<div class="account-item">Logout</div>
		</div>
	</div>
</div>

<style>
	/* Terminal Container */
	.terminal-container {
		background-color: white;
		font-family: 'Courier New', monospace;
		font-size: 14px;
		line-height: 1.2;
		padding: 20px;
		display: flex;
		gap: 20px;
		min-height: 100vh;
		box-sizing: border-box;
	}

	/* Main Content Area */
	.main-content {
		flex: 2;
		max-width: 700px;
	}

	/* ASCII Art Header */
	.ascii-header {
		margin-bottom: 20px;
	}

	.ascii-header pre {
		margin: 0;
		font-size: 12px;
		line-height: 1;
	}

	/* Color Classes */
	.red-text {
		color: red;
		font-weight: bold;
	}

	.blue-text {
		color: blue;
		font-weight: bold;
	}

	/* System Title */
	.system-title {
		margin: 20px 0;
		text-align: left;
	}

	/* Date/Time Section */
	.datetime-section {
		margin: 20px 0;
	}

	/* User Information */
	.user-info {
		margin: 20px 0;
	}

	.user-info p,
	.datetime-section p,
	.support-message p {
		margin: 5px 0;
	}

	/* Authentication Section */
	.auth-section {
		margin: 30px 0;
		padding: 15px;
		border: 2px solid #0066cc;
		background-color: #f8f9fa;
	}

	.auth-section h3 {
		margin: 0 0 15px 0;
		text-align: center;
	}

	.auth-form {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.auth-input {
		padding: 8px;
		font-family: 'Courier New', monospace;
		font-size: 14px;
		border: 1px solid #ccc;
		background-color: white;
	}

	.auth-buttons {
		display: flex;
		gap: 10px;
	}

	.auth-button {
		padding: 8px 16px;
		font-family: 'Courier New', monospace;
		font-size: 12px;
		background-color: #0066cc;
		color: white;
		border: none;
		cursor: pointer;
		font-weight: bold;
	}

	.auth-button:hover {
		background-color: #0052a3;
	}

	.auth-button:disabled {
		background-color: #cccccc;
		cursor: not-allowed;
	}

	.auth-info {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.auth-message {
		margin-top: 10px;
		padding: 5px;
		background-color: #ffffcc;
		border: 1px solid #ffcc00;
		font-size: 12px;
		color: #333;
	}

	/* Support Message */
	.support-message {
		margin: 20px 0;
	}

	/* Command Prompt */
	.command-prompt {
		margin-top: 30px;
		background-color: red;
		color: white;
		padding: 5px 10px;
		font-weight: bold;
	}

	/* Sidebar */
	.sidebar {
		flex: 1;
		max-width: 300px;
		border: 2px solid #ccc;
		background-color: #f5f5f5;
	}

	.accounts-header {
		background-color: #ddd;
		padding: 10px;
		margin: 0;
		text-align: center;
		border-bottom: 2px solid #ccc;
	}

	.accounts-header h3 {
		margin: 0;
		font-size: 14px;
		font-weight: bold;
		color: black;
	}

	/* Accounts List */
	.accounts-list {
		padding: 5px;
	}

	.account-item {
		padding: 3px 5px;
		font-size: 12px;
		color: black;
		cursor: pointer;
		border-bottom: 1px solid #eee;
	}

	.account-item:hover {
		background-color: #e0e0e0;
	}

	/* Special styling for Development item */
	.account-item.development {
		background-color: #800000;
		color: yellow;
		font-weight: bold;
	}

	.account-item.development:hover {
		background-color: #600000;
	}

	/* Global Styles */
	:global(body) {
		margin: 0;
		padding: 0;
		background-color: white;
	}
</style>
