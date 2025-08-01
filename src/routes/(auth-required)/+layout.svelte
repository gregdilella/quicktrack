<!-- Auth Required Layout -->
<script lang="ts">
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { getCurrentUser, getCurrentSession } from '$lib/auth'
	import { getCurrentUserProfile } from '$lib/userService'
	import type { User, Session } from '@supabase/supabase-js'
	import type { UserProfile } from '$lib/types'
	
	let user: User | null = null
	let userProfile: UserProfile | null = null
	let session: Session | null = null
	let loading = true
	let authChecked = false

	onMount(() => {
		checkAuth()
		
		// Set up periodic authentication check (every 10 minutes)
		const authInterval = setInterval(async () => {
			try {
				const currentUser = await getCurrentUser()
				const currentSession = await getCurrentSession()
				
				if (!currentUser || !currentSession) {
					clearInterval(authInterval)
					goto('/')
				}
			} catch (error) {
				console.error('Periodic auth check error:', error)
				clearInterval(authInterval)
				goto('/')
			}
		}, 10 * 60 * 1000) // 10 minutes
		
		// Clean up interval on component destroy
		return () => clearInterval(authInterval)
	})

	async function checkAuth() {
		try {
			// Check if user is authenticated
			user = await getCurrentUser()
			session = await getCurrentSession()
			
			if (!user || !session) {
				// User is not authenticated, redirect to signin
				goto('/')
				return
			}
			
			// User is authenticated, get their profile
			try {
				userProfile = await getCurrentUserProfile()
				authChecked = true
			} catch (error) {
				console.error('Error loading user profile:', error)
				// Profile loading failed, but user is authenticated
				// Let them proceed but show they need profile setup
				authChecked = true
			}
		} catch (error) {
			console.error('Auth check error:', error)
			// Authentication check failed, redirect to signin
			goto('/')
			return
		} finally {
			loading = false
		}
	}
</script>

{#if loading}
	<div class="auth-loading">
		<div class="loading-container">
			<div class="loading-spinner">
				<svg fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
			</div>
			<p class="loading-text">Authenticating...</p>
		</div>
	</div>
{:else if authChecked}
	<!-- User is authenticated, show the protected content -->
	<slot />
{:else}
	<!-- Authentication failed, show error (this should rarely happen as we redirect) -->
	<div class="auth-error">
		<div class="error-container">
			<h2>Authentication Required</h2>
			<p>Please sign in to access this page.</p>
			<button on:click={() => goto('/')} class="signin-redirect-btn">
				Go to Sign In
			</button>
		</div>
	</div>
{/if}

<style>
	.auth-loading {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 100vh;
		background-color: #ffffff;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.loading-container {
		text-align: center;
		color: #6b7280;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		margin: 0 auto 1rem auto;
		animation: spin 1s linear infinite;
		color: #dc2626;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	.loading-text {
		font-size: 1rem;
		margin: 0;
		color: #374151;
	}

	.auth-error {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 100vh;
		background-color: #ffffff;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.error-container {
		text-align: center;
		max-width: 400px;
		padding: 2rem;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		background-color: #f9fafb;
	}

	.error-container h2 {
		color: #dc2626;
		margin: 0 0 1rem 0;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.error-container p {
		color: #6b7280;
		margin: 0 0 1.5rem 0;
		font-size: 1rem;
	}

	.signin-redirect-btn {
		background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
		color: white;
		border: none;
		border-radius: 8px;
		padding: 0.75rem 1.5rem;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.signin-redirect-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
	}
</style> 