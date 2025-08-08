<!-- Job Details Page (Operations) -->
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

	function goBack() {
		// Navigate back to operations job search since this is likely where they came from
		goto('/dashboard/operations/jobsearch')
	}

	function goToOperations() {
		goto('/dashboard/operations')
	}

	function goToJobSearch() {
		goto('/dashboard/operations/jobsearch')
	}

	function goToAddNewJob() {
		goto('/dashboard/operations/add-new-job')
	}
</script>

<svelte:head>
	<title>Job {jobno} - Operations - CERTrack</title>
</svelte:head>

<div class="job-details-container">
	<div class="header">
		<div class="breadcrumb">
			<a href="/dashboard/operations" class="breadcrumb-link">Operations Dashboard</a>
			<span class="breadcrumb-separator">›</span>
			<a href="/dashboard/operations/jobsearch" class="breadcrumb-link">Job Search</a>
			<span class="breadcrumb-separator">›</span>
			<span class="breadcrumb-current">Job {jobno}</span>
		</div>
		
		<div class="header-actions">
			<button class="action-button secondary" on:click={goToOperations}>
				🏢 Operations Dashboard
			</button>
			<button class="action-button secondary" on:click={goToJobSearch}>
				🔍 Job Search
			</button>
			<button class="action-button secondary" on:click={goToAddNewJob}>
				➕ Add New Job
			</button>
			<button class="action-button primary" on:click={goBack}>
				← Back
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
			<div class="error-actions">
				<button class="error-button primary" on:click={goToJobSearch}>
					Go to Job Search
				</button>
				<button class="error-button secondary" on:click={goToOperations}>
					Operations Dashboard
				</button>
				<button class="error-button secondary" on:click={goToAddNewJob}>
					Add New Job
				</button>
			</div>
		</div>
	{:else if job}
		<div class="job-details">
			<div class="job-header">
				<div class="job-title-section">
					<h1 class="job-title">Job {job.jobno}</h1>
					<div class="job-meta">
						{#if job.shipper_name}
							<span class="job-info">From: <strong>{job.shipper_name}</strong></span>
						{/if}
						{#if job.consignee_name}
							<span class="job-info">To: <strong>{job.consignee_name}</strong></span>
						{/if}
						{#if job.commodity}
							<span class="job-info">Commodity: <strong>{job.commodity}</strong></span>
						{/if}
						{#if job.created_at}
							<span class="job-info">Created: <strong>{new Date(job.created_at).toLocaleDateString()}</strong></span>
						{/if}
					</div>
				</div>
				<div class="job-status">
					<span class="status-badge status-{job.status || 'pending'}">{job.status || 'Pending'}</span>
				</div>
			</div>

			<!-- Tab System with Job Tab Content -->
			<div class="tab-container">
				<TabSystem {activeTab} on:tabChange={(e) => activeTab = e.detail.activeTab}>
					<JobTabContent {activeTab} jobData={job} />
				</TabSystem>
			</div>
		</div>
	{/if}
</div>

<style>
	.job-details-container {
		min-height: 100vh;
		background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		padding: 2rem;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		padding: 1.5rem;
		background: white;
		border-radius: 15px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
	}

	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
	}

	.breadcrumb-link {
		color: #ea580c;
		text-decoration: none;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.breadcrumb-link:hover {
		color: #dc2626;
		text-decoration: underline;
	}

	.breadcrumb-separator {
		color: #6b7280;
	}

	.breadcrumb-current {
		color: #1f2937;
		font-weight: 600;
	}

	.header-actions {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.action-button {
		padding: 0.75rem 1.25rem;
		border-radius: 12px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		border: 1px solid;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		white-space: nowrap;
	}

	.action-button.primary {
		background: #ea580c;
		color: white;
		border-color: #ea580c;
		box-shadow: 0 2px 10px rgba(234, 88, 12, 0.3);
	}

	.action-button.primary:hover {
		background: #dc2626;
		border-color: #dc2626;
		transform: translateY(-2px);
		box-shadow: 0 4px 15px rgba(234, 88, 12, 0.4);
	}

	.action-button.secondary {
		background: white;
		color: #6b7280;
		border-color: #e5e7eb;
	}

	.action-button.secondary:hover {
		background: #fff7ed;
		color: #ea580c;
		border-color: #ea580c;
		transform: translateY(-1px);
	}

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		color: #6b7280;
		background: white;
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
		margin-bottom: 1rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.error {
		text-align: center;
		padding: 4rem 2rem;
		background: white;
		border-radius: 20px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
	}

	.error-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.error h2 {
		margin: 0 0 1rem 0;
		color: #1f2937;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.error p {
		color: #6b7280;
		margin-bottom: 2rem;
		font-size: 1rem;
	}

	.error-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.error-button {
		padding: 0.875rem 2rem;
		border-radius: 12px;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		border: 1px solid;
	}

	.error-button.primary {
		background: #ea580c;
		color: white;
		border-color: #ea580c;
	}

	.error-button.primary:hover {
		background: #dc2626;
		transform: translateY(-2px);
		box-shadow: 0 4px 15px rgba(234, 88, 12, 0.4);
	}

	.error-button.secondary {
		background: white;
		color: #6b7280;
		border-color: #e5e7eb;
	}

	.error-button.secondary:hover {
		background: #fff7ed;
		color: #ea580c;
		border-color: #ea580c;
	}

	.job-details {
		background: white;
		border-radius: 20px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
		overflow: hidden;
	}

	.job-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 2rem;
		border-bottom: 1px solid #f3f4f6;
		background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
	}

	.job-title-section {
		flex: 1;
	}

	.job-title {
		font-size: 2rem;
		font-weight: 700;
		color: #1f2937;
		margin: 0 0 1rem 0;
		background: linear-gradient(45deg, #ea580c, #dc2626);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.job-meta {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 0.75rem;
		font-size: 0.875rem;
		color: #6b7280;
	}

	.job-info {
		font-weight: 400;
	}

	.job-info strong {
		color: #1f2937;
		font-weight: 600;
	}

	.status-badge {
		padding: 0.75rem 1.5rem;
		border-radius: 20px;
		font-size: 0.875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		white-space: nowrap;
	}

	.status-pending {
		background: #fef3c7;
		color: #d97706;
		border: 1px solid #f59e0b;
	}

	.status-completed {
		background: #d1fae5;
		color: #065f46;
		border: 1px solid #10b981;
	}

	.status-active {
		background: #dbeafe;
		color: #1d4ed8;
		border: 1px solid #3b82f6;
	}

	.status-cancelled {
		background: #fee2e2;
		color: #dc2626;
		border: 1px solid #ef4444;
	}

	.tab-container {
		padding: 0;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.job-details-container {
			padding: 1rem;
		}

		.header {
			flex-direction: column;
			gap: 1rem;
			align-items: stretch;
		}

		.header-actions {
			justify-content: center;
		}

		.job-header {
			flex-direction: column;
			gap: 1.5rem;
			align-items: flex-start;
		}

		.job-title {
			font-size: 1.5rem;
		}

		.job-meta {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}

		.error-actions {
			flex-direction: column;
			align-items: center;
		}

		.action-button {
			justify-content: center;
		}
	}

	/* Global styles to match operations theme */
	:global(body) {
		background-color: #f8fafc;
	}
</style>
