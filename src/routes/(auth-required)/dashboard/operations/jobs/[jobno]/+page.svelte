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
import JobFiles from '$lib/components/JobFiles.svelte'

	let user: User | null = null
	let loading = true
	let job: any = null
	let timeline: any = null
	let salesman: any = null
	let error = ''
	let activeTab = 'where'
	let saving = false
	let jobTabContentRef: any = null
	
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
			
			// Fetch job data with customer information
			const { data, error: fetchError } = await supabase
				.from('jobsfile')
				.select(`
					*,
					customers:customer_id (
						id,
						name,
						account_number,
						contact_email,
						phone,
						salesman_id
					)
				`)
				.eq('jobno', jobno)
				.single()

			if (fetchError) {
				console.error('Error fetching job:', fetchError)
				error = `Job ${jobno} not found`
				return
			}

			job = data
			// Load salesman info if linked from customer
			salesman = null
			if (job?.customers?.salesman_id) {
				console.log('Loading salesman for customer salesman_id:', job.customers.salesman_id)
				const { data: sm, error: sErr } = await supabase
					.from('salesman')
					.select('id, salesman_id, name, email, fin_cono')
					.eq('id', job.customers.salesman_id)  // Query by 'id' since that's what the foreign key references
					.single()
				console.log('Salesman lookup result:', { data: sm, error: sErr })
				if (!sErr && sm) {
					salesman = sm
				}
			}
			
			// Also fetch timeline data to determine status
			await fetchTimeline()
		} catch (err) {
			console.error('Error:', err)
			error = 'Failed to load job details'
		} finally {
			loading = false
		}
	}

	async function fetchTimeline() {
		try {
			const { data, error: timelineError } = await supabase
				.from('timetable')
				.select('*')
				.eq('jobnumber', jobno)
				.single()

			if (timelineError && timelineError.code !== 'PGRST116') { // PGRST116 = not found
				console.error('Error fetching timeline:', timelineError)
			} else if (data) {
				timeline = data
			}
		} catch (err) {
			console.error('Error fetching timeline:', err)
		}
	}

	/**
	 * Determine the current job status based on timeline progress
	 */
	function getJobStatus() {
		if (!timeline) {
			return 'Basic Scheduling'
		}

		// Check timeline progression to determine current phase
		if (timeline.pod) {
			return 'Completed'
		} else if (timeline.ddriver_delivery) {
			return 'Delivery Completed'
		} else if (timeline.ddriver_recovered) {
			return 'Delivery in Progress'
		} else if (timeline.ddriver_dispatched) {
			return 'Delivery Process'
		} else if (timeline.flight_recovered) {
			return 'Flight Arrived'
		} else if (timeline.flight_tenured) {
			return 'Flight in Progress'
		} else if (timeline.airport_dropoff) {
			return 'Airport & Flight'
		} else if (timeline.pdriver_pickup) {
			return 'Pickup Completed'
		} else if (timeline.pdriver_arrived) {
			return 'Pickup in Progress'
		} else if (timeline.pdriver_dispatched) {
			return 'Pickup Process'
		} else if (timeline.jobcreated) {
			return 'Job Created'
		} else {
			return 'Basic Scheduling'
		}
	}

	/**
	 * Get status badge class based on current status
	 */
	function getStatusClass(status: string) {
		const statusMap: { [key: string]: string } = {
			'Basic Scheduling': 'pending',
			'Job Created': 'created',
			'Pickup Process': 'pickup',
			'Pickup in Progress': 'pickup',
			'Pickup Completed': 'pickup-complete',
			'Airport & Flight': 'transit',
			'Flight in Progress': 'transit',
			'Flight Arrived': 'transit-complete',
			'Delivery Process': 'delivery',
			'Delivery in Progress': 'delivery',
			'Delivery Completed': 'delivery-complete',
			'Completed': 'completed'
		}
		return statusMap[status] || 'pending'
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
	
	/**
	 * Handle customer information updates from JobTabContent
	 * This will refresh the job data to reflect the updated customer info
	 */
	function handleCustomerUpdate(event: CustomEvent) {
		console.log('Customer information updated:', event.detail)
		
		// Update the local job data with the new customer information
		if (event.detail.jobData) {
			job = { ...job, ...event.detail.jobData }
		}
		
		// Optionally refresh the job data from the database
		// fetchJob()
	}
	
	/**
	 * Handle transportation information updates from JobTabContent
	 * This will refresh the job data to reflect the updated transportation info
	 */
	function handleTransportationUpdate(event: CustomEvent) {
		console.log('Transportation information updated:', event.detail)
		
		// Update the local job data with the new transportation information
		if (event.detail.jobData) {
			job = { ...job, ...event.detail.jobData }
		}
		
		// Optionally refresh the job data from the database
		// fetchJob()
	}
	
	/**
	 * Handle commodity information updates from JobTabContent
	 * This will refresh the job data to reflect the updated commodity info
	 */
	function handleCommodityUpdate(event: CustomEvent) {
		console.log('Commodity information updated:', event.detail)
		
		// Update the local job data with the new commodity information
		if (event.detail.jobData) {
			job = { ...job, ...event.detail.jobData }
		}
		
		// Optionally refresh the job data from the database
		// fetchJob()
	}
	
	/**
	 * Handle timeline information updates from JobTabContent
	 * This will refresh the job data to reflect the updated timeline info
	 */
	function handleTimelineUpdate(event: CustomEvent) {
		console.log('Timeline information updated:', event.detail)
		
		// Update the local timeline data to refresh the status badge
		if (event.detail.timelineData) {
			timeline = event.detail.timelineData
			console.log('Timeline data updated, new status:', getJobStatus())
		}
	}

	/**
	 * Handle save and return functionality
	 * Saves all job data and navigates back to operations dashboard
	 */
	async function handleSaveAndReturn() {
		if (!jobTabContentRef) {
			console.error('JobTabContent reference not available')
			return
		}

		try {
			saving = true
			
			// Call the saveAllData function from JobTabContent
			const success = await jobTabContentRef.saveAllData()
			
			if (success) {
				// Navigate back to operations dashboard after successful save
				setTimeout(() => {
					goto('/dashboard/operations')
				}, 1000) // Small delay to show success message
			}
		} catch (err) {
			console.error('Error in handleSaveAndReturn:', err)
		} finally {
			saving = false
		}
	}
</script>

<svelte:head>
	<title>Job {jobno} - Operations - Certus Freight</title>
</svelte:head>

<div class="job-details-container">
	<div class="header">
		<div class="breadcrumb">
			<a href="/dashboard/operations" class="breadcrumb-link">Operations Dashboard</a>
			<span class="breadcrumb-separator">›</span>
			<a href="/dashboard/operations/jobsearch" class="breadcrumb-link">Job Search</a>
			<span class="breadcrumb-separator">›</span>
			<span class="breadcrumb-current"><span class="text-blue-600">Job {jobno}</span></span>
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
					<div class="jobno-badge">JOB NO: {job.jobno}</div>
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
					<!-- Customer Information Section -->
					<div class="customer-info">
						{#if job.customers?.name || job.customer_name}
							<span class="customer-info-item">Customer: <strong>{job.customers?.name || job.customer_name}</strong></span>
						{/if}
						{#if job.customers?.account_number || job.customer_account}
							<span class="customer-info-item">Account: <strong>{job.customers?.account_number || job.customer_account}</strong></span>
						{/if}
						{#if job.customers?.contact_email || job.customer_email}
							<span class="customer-info-item">Email: <strong>{job.customers?.contact_email || job.customer_email}</strong></span>
						{/if}
						{#if job.customers?.phone || job.customer_phone}
							<span class="customer-info-item">Phone: <strong>{job.customers?.phone || job.customer_phone}</strong></span>
						{/if}
						{#if salesman}
							<span class="customer-info-item">Salesman: <strong>{salesman.name}</strong></span>
							{#if salesman.fin_cono}
								<span class="customer-info-item">FIN CONO: <strong>{salesman.fin_cono}</strong></span>
							{/if}
						{/if}
					</div>
				</div>
				<div class="job-status">
					<span class="status-badge status-{getStatusClass(getJobStatus())}">{getJobStatus()}</span>
					<div class="mt-3 status-badge">
						<button
							class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500 text-red-600 bg-white/90 hover:bg-red-50 hover:border-red-600 shadow-sm ml-2"
							on:click={() => goto(`/dashboard/operations/jobs/${jobno}/file_uploads`)}
						>
							Upload Files
						</button>
					</div>
				</div>
			</div>

			<!-- Tab System with Job Tab Content -->
			<div class="tab-container">
				<TabSystem 
					{activeTab} 
					{saving}
					on:tabChange={(e) => activeTab = e.detail.activeTab}
					on:saveAndReturn={handleSaveAndReturn}
				>
					<JobTabContent 
						bind:this={jobTabContentRef}
						{activeTab} 
						jobData={job} 
						on:customerUpdated={handleCustomerUpdate}
						on:transportationUpdated={handleTransportationUpdate}
						on:commodityUpdated={handleCommodityUpdate}
						on:timelineUpdated={handleTimelineUpdate}
					/>
					
				</TabSystem>
			</div>
		</div>
	{/if}
</div>

<style>
	.job-details-container {
		min-height: 100vh;
		background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%);
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
		background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
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

	.jobno-badge {
		display: inline-block;
		margin-top: 0.25rem;
		padding: 0.25rem 0.75rem;
		border: 1px solid #ea580c;
		color: #ea580c;
		background: #ffffff;
		border-radius: 9999px;
		font-size: 0.85rem;
		font-weight: 700;
		letter-spacing: 0.05em;
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

	.customer-info {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 0.75rem;
		padding: 1rem;
		background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		margin-top: 1rem;
		font-size: 0.875rem;
	}

	.customer-info-item {
		color: #6b7280;
		font-weight: 400;
	}

	.customer-info-item strong {
		color: #ea580c;
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

	/* Timeline-based status classes */
	.status-created {
		background: #e0f2fe;
		color: #0369a1;
		border: 1px solid #0ea5e9;
	}

	.status-pickup {
		background: #fef3c7;
		color: #d97706;
		border: 1px solid #f59e0b;
	}

	.status-pickup-complete {
		background: #fef3c7;
		color: #92400e;
		border: 1px solid #d97706;
	}

	.status-transit {
		background: #e0e7ff;
		color: #3730a3;
		border: 1px solid #6366f1;
	}

	.status-transit-complete {
		background: #e0e7ff;
		color: #1e1b4b;
		border: 1px solid #4338ca;
	}

	.status-delivery {
		background: #ecfdf5;
		color: #047857;
		border: 1px solid #10b981;
	}

	.status-delivery-complete {
		background: #dcfce7;
		color: #14532d;
		border: 1px solid #16a34a;
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
