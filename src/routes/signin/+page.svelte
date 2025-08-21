<!-- Sign In Page -->
<script lang="ts">
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { signupOrLogin, getCurrentUser, getCurrentSession, getUserDashboardRoute } from '$lib/auth'
	import { getCurrentUserProfile } from '$lib/userService'
	import { loginSchema, validateForm } from '$lib/validation/schemas'
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
	let validationErrors: Record<string, string> = {}

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
		validationErrors = {}
		
		// Validate form data using Zod
		const validation = validateForm(loginSchema, { email, password })
		if (!validation.success) {
			validationErrors = validation.errors || {}
			message = 'Please fix the validation errors below'
			loading = false
			return
		}
		
		const { user: newUser, error } = await signupOrLogin(validation.data!.email, validation.data!.password)
		
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

<div class="signin-layout">
	<!-- Left Panel - Logo and Branding -->
	<div class="left-panel">
		<div class="brand-content">
			<div class="logo-blur-container">
				<img src="/CertusLogoWhite.png" alt="Certus Freight" class="brand-logo-img" />
			</div>
		</div>
	</div>

	<!-- Right Panel - Sign In Form -->
	<div class="right-panel">
		<div class="signin-container">
			{#if !showUserInfo}
				<div class="signin-header">
					<h2>Welcome Back</h2>
					<p>Sign in to your Certus Freight account</p>
				</div>
				
				<form class="signin-form" on:submit|preventDefault={handleSignupOrLogin}>
					<div class="form-group">
						<label for="email">Email Address</label>
						<input 
							id="email"
							type="email" 
							bind:value={email} 
							placeholder="Enter your email address"
							class="form-input"
							class:error={validationErrors.email}
							on:keydown={handleKeydown}
							disabled={loading}
							required
						/>
						{#if validationErrors.email}
							<span class="error-text">{validationErrors.email}</span>
						{/if}
					</div>
					
					<div class="form-group">
						<label for="password">Password</label>
						<input 
							id="password"
							type="password" 
							bind:value={password} 
							placeholder="Enter your password"
							class="form-input"
							class:error={validationErrors.password}
							on:keydown={handleKeydown}
							disabled={loading}
							required
						/>
						{#if validationErrors.password}
							<span class="error-text">{validationErrors.password}</span>
						{/if}
					</div>
					
					<button 
						type="submit"
						disabled={loading || !email || !password} 
						class="signin-button"
					>
						{#if loading}
							<svg class="loading-spinner" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Signing In...
						{:else}
							Sign In / Sign Up
						{/if}
					</button>
					
					<p class="signin-note">
						New to Certus Freight? You'll be automatically registered with a new account.
					</p>
				</form>
			{:else}
				<div class="success-section">
					<div class="success-icon">
						<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
						</svg>
					</div>
					
					<h3>Authentication Successful!</h3>
					<p>Welcome to Certus Freight</p>
					
					{#if user && userProfile}
						<div class="user-info-card">
							<div class="info-row">
								<span class="info-label">Email:</span>
								<span class="info-value">{user.email}</span>
							</div>
							<div class="info-row">
								<span class="info-label">Role:</span>
								<span class="info-value">{userProfile.role}</span>
							</div>
							<div class="info-row">
								<span class="info-label">Access Level:</span>
								<span class="info-value">
									{userProfile.role === 'Admin' ? 'Full System Access' : 
									 userProfile.role === 'Management' ? 'Executive Access' :
									 userProfile.role === 'Operations' ? 'Operational Access' :
									 userProfile.role === 'LSP' ? 'Provider Access' : 
									 userProfile.role === 'Not-Assigned' ? 'Awaiting Assignment' : 'Customer Access'}
								</span>
							</div>
						</div>
						
						<div class="redirect-section">
							<p>Redirecting to your dashboard...</p>
							<div class="progress-bar">
								<div class="progress-fill"></div>
							</div>
						</div>
					{/if}
				</div>
			{/if}
			
			{#if message && !loginSuccess}
				<div class="error-message" class:success={message.includes('Success')} class:error={message.includes('Error') || message.includes('Invalid')}>
					<svg class="message-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						{#if message.includes('Success')}
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
						{:else}
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"/>
						{/if}
					</svg>
					{message}
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.signin-layout {
		display: flex;
		min-height: 100vh;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	/* Left Panel - Branding */
	.left-panel {
		width: 50%;
		background: #34547a;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		overflow: hidden;
	}

	.brand-content {
		text-align: center;
		z-index: 10;
	}

	.logo-blur-container {
		background: rgba(255, 255, 255, 0.18);
		backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.25);
		border-radius: 20px;
		padding: 1.5rem;
		margin: 0 auto;
		max-width: fit-content;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
		transition: all 0.3s ease;
	}

	.logo-blur-container:hover {
		background: rgba(255, 255, 255, 0.25);
		border-color: rgba(255, 255, 255, 0.35);
		transform: translateY(-2px);
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
	}

	.brand-logo-img {
		max-width: 300px;
		width: 100%;
		height: auto;
		margin: 0;
		display: block;
		transition: all 0.3s ease;
	}

	/* Right Panel - Sign In Form */
	.right-panel {
		width: 50%;
		background: #ffffff;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
	}

	.signin-container {
		width: 100%;
		max-width: 400px;
	}

	.signin-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.signin-header h2 {
		font-size: 2rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
		color: #1f2937;
	}

	.signin-header p {
		color: #6b7280;
		margin: 0;
		font-size: 1rem;
	}

	/* Form Styles */
	.signin-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
	}

	.form-input {
		padding: 0.875rem 1rem;
		border: 1px solid #d1d5db;
		border-radius: 12px;
		font-size: 1rem;
		transition: all 0.2s ease;
		background: #ffffff;
	}

	.form-input:focus {
		outline: none;
		border-color: #34547a;
		box-shadow: 0 0 0 3px rgba(52, 84, 122, 0.15);
	}

	.form-input:disabled {
		background-color: #f9fafb;
		cursor: not-allowed;
		opacity: 0.7;
	}

	.form-input.error {
		border-color: #dc2626;
		background-color: #fef2f2;
	}

	.error-text {
		color: #dc2626;
		font-size: 0.875rem;
		margin-top: 0.25rem;
		display: block;
	}

	/* Sign In Button */
	.signin-button {
		background: #34547a !important;
		color: white;
		border: none;
		border-radius: 12px;
		padding: 1rem 1.5rem;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin-top: 0.5rem;
		box-shadow: 0 4px 15px rgba(52, 84, 122, 0.3);
	}

	.signin-button:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(52, 84, 122, 0.4);
		background: #2c4766 !important;
	}

	.signin-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
		background: #34547a !important;
	}

	.signin-button:focus {
		outline: none;
		background: #34547a !important;
	}

	.signin-button:active {
		background: #2c4766 !important;
	}

	.loading-spinner {
		width: 20px;
		height: 20px;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	.signin-note {
		text-align: center;
		color: #6b7280;
		font-size: 0.875rem;
		margin: 0;
	}

	/* Success Section */
	.success-section {
		text-align: center;
	}

	.success-icon {
		display: flex;
		justify-content: center;
		margin-bottom: 1.5rem;
	}

	.success-icon svg {
		width: 64px;
		height: 64px;
		color: #059669;
	}

	.success-section h3 {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
		color: #1f2937;
	}

	.success-section > p {
		color: #6b7280;
		margin: 0 0 2rem 0;
	}

	.user-info-card {
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0;
		border-bottom: 1px solid #e5e7eb;
	}

	.info-row:last-child {
		border-bottom: none;
	}

	.info-label {
		font-weight: 500;
		color: #374151;
	}

	.info-value {
		color: #1f2937;
		font-weight: 400;
	}

	.redirect-section {
		text-align: center;
	}

	.redirect-section p {
		color: #6b7280;
		margin: 0 0 1rem 0;
	}

	.progress-bar {
		width: 100%;
		height: 6px;
		background-color: #e5e7eb;
		border-radius: 3px;
		overflow: hidden;
	}

	.progress-fill {
		width: 0%;
		height: 100%;
		background: #34547a;
		border-radius: 3px;
		animation: progress 3s ease-in-out forwards;
	}

	@keyframes progress {
		0% { width: 0%; }
		100% { width: 100%; }
	}

	/* Error Message */
	.error-message {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		border-radius: 12px;
		margin-top: 1rem;
		font-size: 0.875rem;
	}

	.error-message.success {
		background-color: #d1fae5;
		color: #047857;
		border: 1px solid #a7f3d0;
	}

	.error-message.error {
		background-color: #fee2e2;
		color: #dc2626;
		border: 1px solid #fca5a5;
	}

	.message-icon {
		width: 20px;
		height: 20px;
		flex-shrink: 0;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.signin-layout {
			flex-direction: column;
		}

		.left-panel, .right-panel {
			width: 100%;
		}

		.left-panel {
			min-height: 200px;
			padding: 1rem;
		}

		.logo-blur-container {
			padding: 1rem;
		}

		.brand-logo-img {
			max-width: 220px;
		}

		.brand-content {
			text-align: center;
		}

		.signin-header {
			text-align: center;
			margin-bottom: 2rem;
		}

		.signin-header h2 {
			font-size: 2rem;
			text-align: center;
		}

		.right-panel {
			padding: 1rem;
		}

		.signin-container {
			max-width: 100%;
			padding: 0 1rem;
		}


	}

	/* Global Styles */
	:global(body) {
		margin: 0;
		padding: 0;
		background-color: #ffffff;
	}
</style> 