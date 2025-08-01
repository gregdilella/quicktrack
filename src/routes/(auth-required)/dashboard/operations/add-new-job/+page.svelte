<!-- Add New Job - Operations -->
<script lang="ts">
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { getCurrentUser, signOut } from '$lib/auth'
	import { getCurrentUserProfile } from '$lib/userService'
	import CreateNewJob from '$lib/components/CreateNewJob.svelte'
	import type { User } from '@supabase/supabase-js'
	import type { UserProfile } from '$lib/types'
	
	let user: User | null = null
	let userProfile: UserProfile | null = null
	let loading = false

	onMount(async () => {
		loading = true
		try {
			user = await getCurrentUser()
			if (!user) {
				goto('/')
				return
			}
			userProfile = await getCurrentUserProfile()
		} catch (error) {
			console.error('Error loading user data:', error)
			goto('/')
		} finally {
			loading = false
		}
	})

	async function handleSignOut() {
		await signOut()
		goto('/')
	}
</script>

<svelte:head>
	<title>Add New Job - Operations</title>
</svelte:head>

<div class="operations-container">
	<header class="operations-header">
		<div class="header-content">
			<h1 class="page-title">Add New Job</h1>
			<div class="user-info">
				{#if userProfile}
					<span class="user-role">{userProfile.role}</span>
					<span class="user-name">{userProfile.first_name} {userProfile.last_name}</span>
				{/if}
				<button class="back-button" on:click={() => goto('/dashboard/operations')}>
					← Back to Operations
				</button>
			</div>
		</div>
	</header>

	{#if loading}
		<div class="loading">
			<p>Loading...</p>
		</div>
	{:else}
		<div class="content">
			<CreateNewJob />
		</div>
	{/if}
</div>

<style>
	.operations-container {
		min-height: 100vh;
		background-color: #f8f9fa;
		padding: 20px;
	}

	.operations-header {
		background-color: white;
		border-radius: 8px;
		padding: 20px;
		margin-bottom: 20px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		max-width: 1200px;
		margin: 0 auto;
	}

	.page-title {
		font-size: 24px;
		font-weight: bold;
		color: #dc2626;
		margin: 0;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 15px;
	}

	.user-role {
		background-color: #dc2626;
		color: white;
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 12px;
		font-weight: bold;
		text-transform: uppercase;
	}

	.user-name {
		font-weight: 500;
		color: #374151;
	}

	.back-button {
		background-color: #6b7280;
		color: white;
		border: none;
		padding: 8px 16px;
		border-radius: 4px;
		cursor: pointer;
		font-size: 14px;
		transition: background-color 0.2s;
	}

	.back-button:hover {
		background-color: #4b5563;
	}

	.content {
		max-width: 1200px;
		margin: 0 auto;
	}

	.loading {
		text-align: center;
		padding: 40px;
		color: #6b7280;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.header-content {
			flex-direction: column;
			gap: 15px;
			text-align: center;
		}

		.user-info {
			flex-wrap: wrap;
			justify-content: center;
		}

		.operations-container {
			padding: 10px;
		}
	}
</style> 