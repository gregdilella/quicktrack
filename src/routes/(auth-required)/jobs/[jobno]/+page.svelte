<!-- Job Details Page - Redirect to Operations -->
<script lang="ts">
	import { page } from '$app/stores'
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'

	// Get jobno from URL params
	$: jobno = $page.params.jobno

	onMount(async () => {
		// Redirect to the new operations job detail route
		if (jobno) {
			goto(`/dashboard/operations/jobs/${jobno}`, { replaceState: true })
		} else {
			goto('/dashboard/operations/jobsearch', { replaceState: true })
		}
	})
</script>

<svelte:head>
	<title>Redirecting to Job {jobno} - CERTrack</title>
</svelte:head>

<div class="redirect-container">
	<div class="redirect-message">
		<div class="loading-spinner"></div>
		<h2>Redirecting to Operations...</h2>
		<p>Taking you to the job details in the Operations dashboard.</p>
	</div>
</div>

<style>
	.redirect-container {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 100vh;
		background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.redirect-message {
		text-align: center;
		background: white;
		padding: 3rem;
		border-radius: 20px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
	}

	.loading-spinner {
		width: 48px;
		height: 48px;
		border: 4px solid #f3f4f6;
		border-top: 4px solid #ea580c;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 1.5rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.redirect-message h2 {
		color: #1f2937;
		margin: 0 0 1rem 0;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.redirect-message p {
		color: #6b7280;
		margin: 0;
		font-size: 1rem;
	}
</style> 