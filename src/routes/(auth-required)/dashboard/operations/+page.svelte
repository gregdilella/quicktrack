<!-- Operations Dashboard -->
<script lang="ts">
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { getCurrentUser, signOut } from '$lib/auth'
	import { getCurrentUserProfile } from '$lib/userService'
	import { getActiveJobsWithTimeline, groupJobsByStage, TIMELINE_STAGES_GROUPED, formatTimestamp } from '$lib/services/operationsTableService'
	import type { User } from '@supabase/supabase-js'
	import type { UserProfile } from '$lib/types'
	import type { JobWithTimeline } from '$lib/services/operationsTableService'
	import * as Table from "$lib/components/ui/table"
	
	let user: User | null = null
	let userProfile: UserProfile | null = null
	let loading = false
	let jobs: JobWithTimeline[] = []
	let groupedJobs: Record<string, JobWithTimeline[]> = {}
	let dataLoading = true

	onMount(async () => {
		user = await getCurrentUser()
		if (user) {
			try {
				userProfile = await getCurrentUserProfile()
			} catch (error) {
				console.error('Error loading user profile:', error)
			}
		}
		await loadOperationsData()
		
		// Listen for timeline updates from job edit pages
		const handleTimelineUpdate = (event: CustomEvent) => {
			console.log('Timeline updated for job:', event.detail.jobno)
			// Refresh the operations data to reflect changes
			loadOperationsData()
		}
		
		window.addEventListener('jobTimelineUpdated', handleTimelineUpdate as EventListener)
		
		// Cleanup event listener on component destroy
		return () => {
			window.removeEventListener('jobTimelineUpdated', handleTimelineUpdate as EventListener)
		}
	})

	async function loadOperationsData() {
		try {
			dataLoading = true
			jobs = await getActiveJobsWithTimeline()
			groupedJobs = groupJobsByStage(jobs)
		} catch (error) {
			console.error('Error loading operations data:', error)
		} finally {
			dataLoading = false
		}
	}

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

	function viewJob(jobno: string) {
		goto(`/dashboard/operations/jobs/${jobno}`)
	}
</script>

<div class="operations-container">
	<div class="main-content">
		<!-- ASCII Art Header -->
		<div class="ascii-header">
			<pre class="red-text">CCCCCC EEEEEEE RRRRRR TTTTTTTT UU   UU  SSSSS
CC     EE      RR   RR   TT    UU   UU SS    
CC     EE      RR   RR   TT    UU   UU SS    
CC     EEEE    RRRRRR    TT    UU   UU  SSSSS
CC     EEEE    RR RR     TT    UU   UU      SS
CC     EE      RR  RR    TT    UU   UU      SS
CCCCCC EEEEEEE RR   RR   TT     UUUUU   SSSSS
</pre>
		</div>



		<!-- Operations Table -->
		<div class="operations-table-section">
			<div class="section-header">
				<h2>Active Jobs Progress Tracking</h2>
				<button onclick={loadOperationsData} disabled={dataLoading} class="refresh-btn">
					{dataLoading ? 'Loading...' : 'Refresh'}
				</button>
			</div>

			{#if dataLoading}
				<div class="loading-state">
					<p>Loading active jobs...</p>
				</div>
			{:else if jobs.length === 0}
				<div class="empty-state">
					<p>No active jobs found</p>
				</div>
			{:else}
				<div class="table-container">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head class="row-header">Dispatch</Table.Head>
								{#each TIMELINE_STAGES_GROUPED.dispatch as stage}
									<Table.Head class="stage-header">{stage.label}</Table.Head>
								{/each}
							</Table.Row>
						</Table.Header>
						<Table.Body>
							<Table.Row>
								<Table.Cell class="row-label">Dispatch</Table.Cell>
								{#each TIMELINE_STAGES_GROUPED.dispatch as stage}
									<Table.Cell class="job-cell">
										{#if groupedJobs[stage.key]}
											{#each groupedJobs[stage.key] as job}
												<div class="job-item">
													<button 
														class="job-button"
														onclick={() => viewJob(job.jobsfile.jobno || job.jobsfile.jobnumber)}
													>
														{job.jobsfile.jobno || job.jobsfile.jobnumber}
													</button>
													{#if stage.key === 'ready' && job.jobsfile.ready_date}
														<div class="job-time">
															{new Date(job.jobsfile.ready_date).toLocaleDateString()}
															{#if job.jobsfile.ready_time}
																{job.jobsfile.ready_time}
															{/if}
														</div>
													{:else if job.timetable && (job.timetable as any)[stage.field]}
														<div class="job-time">
															{formatTimestamp((job.timetable as any)[stage.field])}
														</div>
													{/if}
												</div>
											{/each}
										{/if}
									</Table.Cell>
								{/each}
							</Table.Row>
						</Table.Body>
					</Table.Root>

					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head class="row-header">Pickup Process</Table.Head>
								{#each TIMELINE_STAGES_GROUPED.pickup as stage}
									<Table.Head class="stage-header">{stage.label}</Table.Head>
								{/each}
							</Table.Row>
						</Table.Header>
						<Table.Body>
							<Table.Row>
								<Table.Cell class="row-label">Pickup</Table.Cell>
								{#each TIMELINE_STAGES_GROUPED.pickup as stage}
									<Table.Cell class="job-cell">
										{#if groupedJobs[stage.key]}
											{#each groupedJobs[stage.key] as job}
												<div class="job-item">
													<button 
														class="job-button"
														onclick={() => viewJob(job.jobsfile.jobno || job.jobsfile.jobnumber)}
													>
														{job.jobsfile.jobno || job.jobsfile.jobnumber}
													</button>
													{#if job.timetable && (job.timetable as any)[stage.field]}
														<div class="job-time">
															{formatTimestamp((job.timetable as any)[stage.field])}
														</div>
													{/if}
												</div>
											{/each}
										{/if}
									</Table.Cell>
								{/each}
							</Table.Row>
						</Table.Body>
					</Table.Root>

					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head class="row-header">Airport & Flight</Table.Head>
								{#each TIMELINE_STAGES_GROUPED.airport as stage}
									<Table.Head class="stage-header">{stage.label}</Table.Head>
								{/each}
							</Table.Row>
						</Table.Header>
						<Table.Body>
							<Table.Row>
								<Table.Cell class="row-label">Airport</Table.Cell>
								{#each TIMELINE_STAGES_GROUPED.airport as stage}
									<Table.Cell class="job-cell">
										{#if groupedJobs[stage.key]}
											{#each groupedJobs[stage.key] as job}
												<div class="job-item">
													<button 
														class="job-button"
														onclick={() => viewJob(job.jobsfile.jobno || job.jobsfile.jobnumber)}
													>
														{job.jobsfile.jobno || job.jobsfile.jobnumber}
													</button>
													{#if job.timetable && (job.timetable as any)[stage.field]}
														<div class="job-time">
															{formatTimestamp((job.timetable as any)[stage.field])}
														</div>
													{/if}
												</div>
											{/each}
										{/if}
									</Table.Cell>
								{/each}
							</Table.Row>
						</Table.Body>
					</Table.Root>

					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head class="row-header">Delivery Process</Table.Head>
								{#each TIMELINE_STAGES_GROUPED.delivery as stage}
									<Table.Head class="stage-header">{stage.label}</Table.Head>
								{/each}
							</Table.Row>
						</Table.Header>
						<Table.Body>
							<Table.Row>
								<Table.Cell class="row-label">Delivery</Table.Cell>
								{#each TIMELINE_STAGES_GROUPED.delivery as stage}
									<Table.Cell class="job-cell">
										{#if groupedJobs[stage.key]}
											{#each groupedJobs[stage.key] as job}
												<div class="job-item">
													<button 
														class="job-button"
														onclick={() => viewJob(job.jobsfile.jobno || job.jobsfile.jobnumber)}
													>
														{job.jobsfile.jobno || job.jobsfile.jobnumber}
													</button>
													{#if job.timetable && (job.timetable as any)[stage.field]}
														<div class="job-time">
															{formatTimestamp((job.timetable as any)[stage.field])}
														</div>
													{/if}
												</div>
											{/each}
										{/if}
									</Table.Cell>
								{/each}
							</Table.Row>
						</Table.Body>
					</Table.Root>
				</div>
			{/if}
		</div>

		<!-- Logout Button -->
		<div class="logout-section">
			<button onclick={handleSignOut} disabled={loading} class="logout-button">
				{loading ? 'SIGNING OUT...' : 'LOGOUT'}
			</button>
		</div>
	</div>
</div>

<style>
	.operations-container {
		min-height: 100vh;
		background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		padding: 2rem;
	}

	.main-content {
		max-width: 1200px;
		margin: 0 auto;
	}



	.blue-text {
		color: #34547a;
		font-weight: bold;
	}

	.orange-text {
		color: #16a34a;
		font-weight: bold;
	}



	/* Operations Table Styles */
	.operations-table-section {
		margin: 2rem 0;
		padding: 2rem;
		background: white;
		border-radius: 20px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.section-header h2 {
		margin: 0;
		font-size: 1.75rem;
		font-weight: 600;
		color: #34547a;
	}

	.refresh-btn {
		padding: 0.5rem 1rem;
		background: #34547a;
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.refresh-btn:hover:not(:disabled) {
		background: #2a4362;
		transform: translateY(-1px);
	}

	.refresh-btn:disabled {
		background: #9ca3af;
		cursor: not-allowed;
		transform: none;
	}

	.loading-state, .empty-state {
		text-align: center;
		padding: 3rem;
		color: #6b7280;
		font-size: 1.1rem;
	}

	.table-container {
		overflow-x: auto;
		width: 100%;
	}

	:global(.operations-table-section table) {
		width: 100% !important;
		table-layout: fixed !important;
		margin-bottom: 1.5rem !important;
		border-radius: 12px;
		border: 1px solid #e5e7eb;
		overflow: hidden;
	}

	:global(.operations-table-section table:last-child) {
		margin-bottom: 0 !important;
	}

	:global(.operations-table-section .stage-header) {
		background: #34547a !important;
		color: white !important;
		font-weight: 600 !important;
		text-align: center !important;
		padding: 1rem !important;
		border-bottom: 2px solid #2a4362 !important;
		min-width: 150px;
	}

	:global(.operations-table-section .job-cell) {
		vertical-align: top !important;
		padding: 1rem !important;
		border-right: 1px solid #e5e7eb !important;
		background: #f8fafc !important;
		min-height: 120px;
	}

	:global(.operations-table-section .job-cell:last-child) {
		border-right: none !important;
	}

	:global(.operations-table-section .row-header) {
		background: #2a4362 !important;
		color: white !important;
		font-weight: 700 !important;
		text-align: center !important;
		padding: 1rem !important;
		border-bottom: 2px solid #1f3a56 !important;
		font-size: 1rem !important;
	}

	:global(.operations-table-section .row-label) {
		background: #f1f5f9 !important;
		color: #34547a !important;
		font-weight: 600 !important;
		text-align: center !important;
		padding: 1rem !important;
		border-right: 1px solid #e5e7eb !important;
		vertical-align: middle !important;
		font-size: 0.875rem !important;
	}

	.job-item {
		margin-bottom: 0.75rem;
		padding: 0.5rem;
		background: white;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
	}

	.job-item:last-child {
		margin-bottom: 0;
	}

	.job-button {
		display: block;
		width: 100%;
		padding: 0.5rem;
		background: #34547a;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 500;
		font-size: 0.875rem;
		transition: all 0.2s ease;
		margin-bottom: 0.25rem;
	}

	.job-button:hover {
		background: #2a4362;
		transform: translateY(-1px);
	}

	.job-time {
		font-size: 0.75rem;
		color: #6b7280;
		text-align: center;
		line-height: 1.2;
	}





	.logout-section {
		margin-top: 20px;
		text-align: center;
	}

	.logout-button {
		padding: 0.875rem 2rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-size: 1rem;
		background: #ea580c;
		color: white;
		border: none;
		border-radius: 12px;
		cursor: pointer;
		font-weight: 500;
		transition: all 0.2s ease;
		box-shadow: 0 2px 10px rgba(234, 88, 12, 0.3);
	}

	.logout-button:hover:not(:disabled) {
		background: #dc2626;
		transform: translateY(-2px);
		box-shadow: 0 4px 15px rgba(234, 88, 12, 0.4);
	}

	.logout-button:disabled {
		background: #9ca3af;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.operations-container {
			padding: 1rem;
		}

		.main-content {
			max-width: 100%;
		}

		.ascii-header pre {
			font-size: 10px;
		}
	}

	:global(body) {
		margin: 0;
		padding: 0;
		background-color: #f8fafc;
	}
</style> 