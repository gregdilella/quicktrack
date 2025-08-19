<!-- Add New Selection - Management -->
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

	// Navigation options
	const addOptions = [
		{
			title: 'Customer',
			description: 'Add a new customer to the system',
			icon: '👥',
			href: '/dashboard/management/add-new-customer',
			color: '#16a34a'
		},
		{
			title: 'LSP',
			description: 'Add a new logistics service provider',
			icon: '🚚',
			href: '/dashboard/management/add-new-lsp',
			color: '#7c3aed'
		},
		{
			title: 'Airline',
			description: 'Add a new airline to the system',
			icon: '✈️',
			href: '/dashboard/management/add-new-airline',
			color: '#2563eb'
		}
	]
</script>

<div class="selection-container">
	<div class="main-content">
		<!-- ASCII Art Header -->
		<div class="ascii-header">
			<pre class="red-text">CCCCCC EEEEEEE RRRRRR TTTTTTTT UU   UU  SSSSS
CC     EE      RR   RR   TT    UU   UU SS    
CC     EE      RR   RR   TT    UU   UU SS    
CC     EEEE    RRRRRR    TT    UU   UU  SSSSS
CC     EEEE    RR RR     TT    UU   UU      SS
CC     EE      RR  RR    TT    UU   UU      SS
CCCCCC EEEEEEE RR   RR   TT     UUUUU   SSSSS</pre>
		</div>

		<!-- System Title -->
		<div class="system-title">
			<span class="red-text">MANAGEMENT PORTAL - ADD NEW</span>
		</div>

		<!-- Navigation -->
		<div class="nav-section">
			<a href="/dashboard/management" class="nav-link">⬅ BACK TO MANAGEMENT MENU</a>
		</div>

		<!-- User Information -->
		{#if user && userProfile}
			<div class="user-info">
				<p class="blue-text">Status: <span class="purple-text">MANAGEMENT ACCESS</span></p>
				<p class="blue-text">Function: ADD NEW ENTITY</p>
			</div>
		{/if}

		<!-- Selection Grid -->
		<div class="selection-section">
			<h3 class="blue-text">--- SELECT WHAT TO ADD ---</h3>
			<p class="selection-subtitle">Choose the type of entity you want to add to the system</p>
			
			<div class="options-grid">
				{#each addOptions as option}
					<a href={option.href} class="option-card" style="--option-color: {option.color};">
						<div class="option-icon">{option.icon}</div>
						<div class="option-content">
							<h4 class="option-title">{option.title}</h4>
							<p class="option-description">{option.description}</p>
						</div>
						<div class="option-arrow">→</div>
					</a>
				{/each}
			</div>
		</div>

		<!-- Command Prompt -->
		<div class="command-prompt">
			<span class="red-text">([MGMT] Add New Selection - Choose Entity Type)</span>
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
	.selection-container {
		background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-size: 14px;
		line-height: 1.5;
		padding: 2rem;
		min-height: 100vh;
		box-sizing: border-box;
	}

	.main-content {
		max-width: 1000px;
		margin: 0 auto;
	}

	.ascii-header {
		margin-bottom: 2rem;
		background: white;
		padding: 1.5rem;
		border-radius: 16px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
	}

	.ascii-header pre {
		margin: 0;
		font-size: 12px;
		line-height: 1;
		font-family: 'Courier New', monospace;
	}

	.red-text {
		color: #ea580c;
		font-weight: 700;
	}

	.blue-text {
		color: #2563eb;
		font-weight: 600;
	}

	.purple-text {
		color: #7c3aed;
		font-weight: 600;
	}

	.system-title {
		margin: 2rem 0;
		text-align: center;
		background: white;
		padding: 1.5rem;
		border-radius: 16px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
	}

	.nav-section {
		margin: 2rem 0;
		text-align: center;
	}

	.nav-link {
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
	}

	.nav-link:hover {
		background: linear-gradient(135deg, #6d28d9, #5b21b6);
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(124, 58, 237, 0.4);
	}

	.user-info {
		margin: 2rem 0;
		background: white;
		padding: 1.5rem;
		border-radius: 16px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
	}

	.user-info p {
		margin: 0.5rem 0;
		font-size: 0.95rem;
	}

	.selection-section {
		margin: 2rem 0;
		padding: 2.5rem;
		border-radius: 20px;
		background: white;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
	}

	.selection-section h3 {
		margin: 0 0 1rem 0;
		text-align: center;
		font-size: 1.5rem;
		color: #1f2937;
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.selection-subtitle {
		text-align: center;
		color: #6b7280;
		font-size: 1rem;
		margin: 0 0 2.5rem 0;
	}

	.options-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
		margin-top: 2rem;
	}

	.option-card {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		padding: 2rem;
		background: linear-gradient(135deg, #ffffff, #f8fafc);
		border: 2px solid #e5e7eb;
		border-radius: 16px;
		text-decoration: none;
		transition: all 0.3s ease;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
		position: relative;
		overflow: hidden;
	}

	.option-card:hover {
		border-color: var(--option-color);
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
		transform: translateY(-4px);
		background: linear-gradient(135deg, #ffffff, var(--option-color)08);
	}

	.option-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 4px;
		height: 100%;
		background: var(--option-color);
		transform: scaleY(0);
		transition: transform 0.3s ease;
		transform-origin: bottom;
	}

	.option-card:hover::before {
		transform: scaleY(1);
	}

	.option-icon {
		font-size: 3rem;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 4rem;
		height: 4rem;
		background: var(--option-color)15;
		border-radius: 50%;
		transition: all 0.3s ease;
	}

	.option-card:hover .option-icon {
		background: var(--option-color)25;
		transform: scale(1.1);
	}

	.option-content {
		flex: 1;
	}

	.option-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 0.5rem 0;
		transition: color 0.3s ease;
	}

	.option-card:hover .option-title {
		color: var(--option-color);
	}

	.option-description {
		font-size: 0.875rem;
		color: #6b7280;
		margin: 0;
		line-height: 1.5;
	}

	.option-arrow {
		font-size: 1.5rem;
		color: #9ca3af;
		font-weight: bold;
		transition: all 0.3s ease;
		transform: translateX(0);
	}

	.option-card:hover .option-arrow {
		color: var(--option-color);
		transform: translateX(0.5rem);
	}

	.command-prompt {
		margin-top: 2rem;
		background: linear-gradient(135deg, #ea580c, #dc2626);
		color: white;
		padding: 1rem 1.5rem;
		font-weight: 600;
		border-radius: 12px;
		box-shadow: 0 4px 15px rgba(234, 88, 12, 0.3);
		text-align: center;
	}

	.logout-section {
		margin-top: 2rem;
		text-align: center;
	}

	.logout-button {
		padding: 0.75rem 1.5rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-size: 0.875rem;
		background: linear-gradient(135deg, #dc2626, #b91c1c);
		color: white;
		border: none;
		border-radius: 12px;
		cursor: pointer;
		font-weight: 600;
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
		.selection-container {
			padding: 1rem;
		}
		
		.options-grid {
			grid-template-columns: 1fr;
		}
		
		.option-card {
			padding: 1.5rem;
		}
		
		.option-icon {
			font-size: 2.5rem;
			width: 3.5rem;
			height: 3.5rem;
		}
		
		.selection-section {
			padding: 1.5rem;
		}
	}
</style>
