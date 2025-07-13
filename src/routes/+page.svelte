<!-- Terminal Interface Recreation -->
<script lang="ts">
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { signupOrLogin, getCurrentUser, getCurrentSession, getUserDashboardRoute } from '$lib/auth'
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
	let showUserInfo = false
	let loginSuccess = false

	// Check authentication on component mount
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

	async function handleSignupOrLogin() {
		loading = true
		message = ''
		
		const { user: newUser, error } = await signupOrLogin(email, password)
		
		if (error) {
			console.log('Login error details:', error)
			console.log('Error message:', error.message)
			if (error.message.includes('Invalid email or password')) {
				message = 'Invalid email or password. Please check your credentials and try again.'
			} else if (error.message.includes('Invalid login credentials')) {
				message = 'Invalid email or password. Please try again.'
			} else if (error.message.includes('Email not confirmed')) {
				message = 'Please check your email and confirm your account before logging in.'
			} else if (error.message.includes('User already registered')) {
				message = 'This account already exists. Please check your password and try again.'
			} else {
				message = `Error: ${error.message}`
			}
		} else {
			if (newUser) {
				// Get user profile information
				try {
					user = newUser
					userProfile = await getCurrentUserProfile()
					showUserInfo = true
					loginSuccess = true
					message = 'Login successful! Loading user information...'
					
					// Clear form
					email = ''
					password = ''
					
					// Show user info for 3 seconds, then redirect
					setTimeout(async () => {
						const dashboardRoute = await getUserDashboardRoute()
						goto(dashboardRoute)
					}, 3000)
				} catch (error) {
					console.error('Error loading user profile:', error)
					message = 'Login successful! Redirecting...'
					// Fallback redirect if profile loading fails
					setTimeout(async () => {
						const dashboardRoute = await getUserDashboardRoute()
						goto(dashboardRoute)
					}, 1500)
				}
			}
		}
		
		loading = false
	}

	// Handle Enter key press for form submission
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && email && password) {
			handleSignupOrLogin()
		}
	}
</script>

<div class="terminal-container">
	<div class="main-content">
				<!-- ASCII Art Header -->
		<div class="ascii-header">
			<pre class="red-text">
QQQQQQ                               
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
			<span class="red-text">INTERNATIONAL COURIER</span>
		</div>



		<!-- Login Section -->
		<div class="login-section">
			{#if !showUserInfo}
				<h3 class="blue-text">--- SYSTEM LOGIN ---</h3>
				
				<div class="login-form">
					<p class="blue-text">Enter your credentials to access the system:</p>
					
					<div class="input-group">
						<label class="blue-text" for="email">Email:</label>
						<input 
							id="email"
							type="email" 
							bind:value={email} 
							placeholder="Enter your email"
							class="login-input"
							on:keydown={handleKeydown}
							disabled={loading}
						/>
					</div>
					
					<div class="input-group">
						<label class="blue-text" for="password">Password:</label>
						<input 
							id="password"
							type="password" 
							bind:value={password} 
							placeholder="Enter your password"
							class="login-input"
							on:keydown={handleKeydown}
							disabled={loading}
						/>
					</div>
					
					<div class="login-buttons">
						<button 
							on:click={handleSignupOrLogin} 
							disabled={loading || !email || !password} 
							class="login-button"
						>
							{loading ? 'PROCESSING...' : 'SIGNUP/LOGIN'}
						</button>
					</div>
					
					<div class="login-hint">
						<p class="blue-text">Press ENTER or click SIGNUP/LOGIN to continue</p>
						<p class="blue-text">New users will be automatically registered</p>
					</div>
				</div>
			{:else}
				<h3 class="blue-text">--- AUTHENTICATION SUCCESSFUL ---</h3>
				
				<div class="user-display">
					<p class="blue-text">Welcome to QuickTrack International Courier System</p>
					
					{#if user && userProfile}
						<div class="user-details">
							<div class="detail-row">
								<span class="blue-text">Email:</span>
								<span class="green-text">{user.email?.toUpperCase()}</span>
							</div>
							<div class="detail-row">
								<span class="blue-text">Role:</span>
								<span class="green-text">{userProfile.role}</span>
							</div>
							<div class="detail-row">
								<span class="blue-text">Access Level:</span>
								<span class="green-text">
									{userProfile.role === 'Admin' ? 'FULL SYSTEM ACCESS' : 
									 userProfile.role === 'Management' ? 'EXECUTIVE ACCESS' :
									 userProfile.role === 'Operations' ? 'OPERATIONAL ACCESS' :
									 userProfile.role === 'LSP' ? 'PROVIDER ACCESS' : 'CUSTOMER ACCESS'}
								</span>
							</div>
							<div class="detail-row">
								<span class="blue-text">Status:</span>
								<span class="green-text">AUTHENTICATED</span>
							</div>
						</div>
						
						<div class="redirect-info">
							<p class="blue-text">Redirecting to {userProfile.role} dashboard...</p>
							<div class="loading-bar">
								<div class="loading-progress"></div>
							</div>
						</div>
					{/if}
				</div>
			{/if}
			
			{#if message && !loginSuccess}
				<div class="login-message" class:success={message.includes('Success')} class:error={message.includes('Error') || message.includes('Invalid')}>
					{message}
				</div>
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
</div>

<style>
	/* Terminal Container */
	.terminal-container {
		background-color: white;
		font-family: 'Courier New', monospace;
		font-size: 14px;
		line-height: 1.2;
		padding: 20px;
		min-height: 100vh;
		box-sizing: border-box;
		display: flex;
		justify-content: center;
	}

	/* Main Content Area */
	.main-content {
		max-width: 800px;
		width: 100%;
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

	/* Support Message */
	.support-message p {
		margin: 5px 0;
	}

	/* Login Section */
	.login-section {
		margin: 30px 0;
		padding: 20px;
		border: 2px solid #0066cc;
		background-color: #f8f9fa;
	}

	.login-section h3 {
		margin: 0 0 20px 0;
		text-align: center;
	}

	.login-form {
		display: flex;
		flex-direction: column;
		gap: 15px;
	}

	.input-group {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.input-group label {
		font-size: 12px;
	}

	.login-input {
		padding: 8px 12px;
		font-family: 'Courier New', monospace;
		font-size: 14px;
		border: 2px solid #ccc;
		background-color: white;
		color: black;
	}

	.login-input:focus {
		outline: none;
		border-color: #0066cc;
		background-color: #ffffcc;
	}

	.login-input:disabled {
		background-color: #f0f0f0;
		color: #666;
	}

	.login-buttons {
		display: flex;
		justify-content: center;
		margin-top: 10px;
	}

	.login-button {
		padding: 10px 30px;
		font-family: 'Courier New', monospace;
		font-size: 12px;
		background-color: #0066cc;
		color: white;
		border: none;
		cursor: pointer;
		font-weight: bold;
		min-width: 120px;
	}

	.login-button:hover:not(:disabled) {
		background-color: #0052a3;
	}

	.login-button:disabled {
		background-color: #cccccc;
		cursor: not-allowed;
	}

	.login-hint {
		text-align: center;
		margin-top: 10px;
	}

	.login-hint p {
		font-size: 12px;
		margin: 0;
	}

	.login-message {
		margin-top: 15px;
		padding: 10px;
		border: 1px solid #ccc;
		font-size: 12px;
		color: #333;
		text-align: center;
	}

	.login-message.success {
		background-color: #d4edda;
		border-color: #c3e6cb;
		color: #155724;
	}

	.login-message.error {
		background-color: #f8d7da;
		border-color: #f5c6cb;
		color: #721c24;
	}

	/* User Display Styles */
	.user-display {
		text-align: center;
	}

	.user-details {
		margin: 20px 0;
		padding: 15px;
		background-color: white;
		border: 1px solid #0066cc;
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin: 8px 0;
		padding: 4px 0;
		border-bottom: 1px dotted #ccc;
	}

	.detail-row:last-child {
		border-bottom: none;
	}

	.green-text {
		color: green;
		font-weight: bold;
	}

	.redirect-info {
		margin-top: 20px;
		text-align: center;
	}

	.loading-bar {
		width: 100%;
		height: 4px;
		background-color: #e0e0e0;
		margin-top: 10px;
		overflow: hidden;
	}

	.loading-progress {
		width: 0%;
		height: 100%;
		background-color: #0066cc;
		animation: loading 3s ease-in-out forwards;
	}

	@keyframes loading {
		0% { width: 0%; }
		100% { width: 100%; }
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

	/* Global Styles */
	:global(body) {
		margin: 0;
		padding: 0;
		background-color: white;
	}
</style>
