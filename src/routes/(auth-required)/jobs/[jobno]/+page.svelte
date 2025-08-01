<!-- Job Details Page -->
<script lang="ts">
	import { page } from '$app/stores'
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { supabase } from '$lib/supabase'
	import { getCurrentUser } from '$lib/auth'
	import type { User } from '@supabase/supabase-js'
	import TabSystem from '$lib/components/TabSystem.svelte'
	import JobTabContent from '$lib/components/JobTabContent.svelte'

	let user: User | null = null
	let loading = true
	let job: any = null
	let error = ''
	let activeTab = 'where'
	
	// Get jobno from URL params
	$: jobno = $page.params.jobno

	onMount(async () => {
		user = await getCurrentUser()
		if (jobno) {
			await fetchJob()
		}
	})

	async function fetchJob() {
		try {
			loading = true
			error = ''
			
					const { data, error: fetchError } = await supabase
			.from('jobsfile')
			.select('*')
			.eq('jobno', jobno)
			.single()

			if (fetchError) {
				console.error('Error fetching job:', fetchError)
				error = `Job ${jobno} not found`
				return
			}

			job = data
		} catch (err) {
			console.error('Error:', err)
			error = 'Failed to load job details'
		} finally {
			loading = false
		}
	}


</script>

<svelte:head>
	<title>Job {jobno} - CERTrack</title>
</svelte:head>

<div class="job-details-container">
	<div class="header">
		<div class="breadcrumb">
			<a href="/dashboard" class="breadcrumb-link">Dashboard</a>
			<span class="breadcrumb-separator">›</span>
			<a href="/jobs/search" class="breadcrumb-link">Job Search</a>
			<span class="breadcrumb-separator">›</span>
			<span class="breadcrumb-current">Job {jobno}</span>
		</div>
		
		<div class="header-actions">
			<button class="back-button" on:click={() => goto('/jobs/search')}>
				← Back to Search
			</button>
		</div>
	</div>

	{#if loading}
		<div class="loading">
			<div class="loading-spinner"></div>
			<p>Loading job details...</p>
		</div>
	{:else if error}
		<div class="error">
			<div class="error-icon">⚠️</div>
			<h2>Job Not Found</h2>
			<p>{error}</p>
			<button class="error-button" on:click={() => goto('/jobs/search')}>
				Go to Job Search
			</button>
		</div>
	{:else if job}
		<div class="job-details">
			<div class="job-header">
				<h1 class="job-title">Job {job.jobno}</h1>
				<div class="job-status">
					<span class="status-badge status-{job.status}">{job.status}</span>
				</div>
			</div>

			<!-- Tab System with Job Tab Content -->
			<TabSystem {activeTab} on:tabChange={(e) => activeTab = e.detail.activeTab}>
				<JobTabContent {activeTab} jobData={job} />
			</TabSystem>
		</div>
	{/if}
</div>

<style>
	.job-details-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 20px;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 30px;
		padding-bottom: 20px;
		border-bottom: 1px solid #e5e7eb;
	}

	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 14px;
	}

	.breadcrumb-link {
		color: #3b82f6;
		text-decoration: none;
	}

	.breadcrumb-link:hover {
		text-decoration: underline;
	}

	.breadcrumb-separator {
		color: #6b7280;
	}

	.breadcrumb-current {
		color: #374151;
		font-weight: 500;
	}

	.back-button {
		background: #f3f4f6;
		color: #374151;
		border: 1px solid #d1d5db;
		padding: 8px 16px;
		border-radius: 6px;
		font-size: 14px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.back-button:hover {
		background: #e5e7eb;
	}

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60px 20px;
		color: #6b7280;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 3px solid #e5e7eb;
		border-top: 3px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 16px;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.error {
		text-align: center;
		padding: 60px 20px;
		color: #dc2626;
	}

	.error-icon {
		font-size: 48px;
		margin-bottom: 16px;
	}

	.error h2 {
		margin: 0 0 12px 0;
		color: #374151;
	}

	.error-button {
		background: #3b82f6;
		color: white;
		border: none;
		padding: 12px 24px;
		border-radius: 6px;
		font-size: 16px;
		cursor: pointer;
		margin-top: 20px;
		transition: all 0.2s;
	}

	.error-button:hover {
		background: #2563eb;
	}

	.job-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 30px;
	}

	.job-title {
		font-size: 32px;
		font-weight: 700;
		color: #1f2937;
		margin: 0;
	}

	.status-badge {
		padding: 6px 12px;
		border-radius: 20px;
		font-size: 12px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.status-pending {
		background: #fef3c7;
		color: #d97706;
	}

	.status-completed {
		background: #d1fae5;
		color: #065f46;
	}



	@media (max-width: 768px) {
		.job-details-container {
			padding: 12px;
		}

		.header {
			flex-direction: column;
			gap: 16px;
			align-items: flex-start;
		}

		.job-title {
			font-size: 24px;
		}
	}
</style> 