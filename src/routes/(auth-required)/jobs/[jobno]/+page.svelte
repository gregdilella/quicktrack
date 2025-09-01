<svelte:head>
	<title>Job Details - Certus Freight</title>
</svelte:head>

<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getCustomerJob } from '$lib/services/customerService';
	import type { JobsFile } from '$lib/services/customerService';
	import { supabase } from '$lib/supabase';

	let job: JobsFile | null = null;
	let loading = true;
	let error = '';
	let quoteItems: { id: number; chargecode: string; charge: number; created_at: string }[] = [];
	let loadingQuote = false;

	$: jobNumber = $page.params.jobno;

	onMount(async () => {
		if (jobNumber) {
			await loadJobDetails();
		}
	});

	async function loadJobDetails() {
		loading = true;
		error = '';
		
		try {
			job = await getCustomerJob(jobNumber);
			if (!job) {
				error = 'Job not found or you do not have permission to view this job.';
			} else {
				// Load quote after job is loaded
				await loadQuoteItems();
			}
		} catch (err) {
			console.error('Error loading job details:', err);
			error = 'Failed to load job details. Please try again.';
		} finally {
			loading = false;
		}
	}

	async function loadQuoteItems() {
		if (!job?.jobnumber) return;
		try {
			loadingQuote = true;
			const { data, error: quoteError } = await supabase
				.from('quotes')
				.select('id, chargecode, charge, created_at')
				.eq('jobnumber', job.jobnumber)
				.order('chargecode', { ascending: true });
			
			if (quoteError) {
				console.error('Error loading quote items:', quoteError);
				return;
			}
			
			quoteItems = data || [];
		} catch (err) {
			console.error('Error in loadQuoteItems:', err);
		} finally {
			loadingQuote = false;
		}
	}

	function formatDate(dateString: string | null): string {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatDateOnly(dateString: string | null): string {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function getStatusColor(status: string | null): string {
		switch (status) {
			case 'New': return '#3b82f6';
			case 'Assigned': return '#f59e0b';
			case 'In Transit': return '#8b5cf6';
			case 'Delivered': return '#10b981';
			case 'Completed': return '#059669';
			case 'Cancelled': return '#ef4444';
			default: return '#6b7280';
		}
	}

	function goBack() {
		// Try to go back to the previous page, or default to job search
		if (window.history.length > 1) {
			window.history.back();
		} else {
			goto('/dashboard/customer/job-search');
		}
	}
</script>

<div class="page-container">
	{#if loading}
		<div class="loading-container">
			<div class="spinner"></div>
			<p>Loading job details...</p>
		</div>
	{:else if error}
		<div class="error-container">
			<div class="error-icon">
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
				</svg>
			</div>
			<h2>Unable to Load Job</h2>
			<p>{error}</p>
			<div class="error-actions">
				<button on:click={loadJobDetails} class="retry-btn">
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
					</svg>
					Retry
				</button>
				<button on:click={goBack} class="back-btn">
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
					</svg>
					Go Back
				</button>
			</div>
		</div>
	{:else if job}
		<!-- Header -->
		<div class="page-header">
			<div class="header-content">
				<div class="header-left">
					<button on:click={goBack} class="back-button">
						<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
						</svg>
						Back
					</button>
					<div class="header-info">
						<h1>Job {job.jobnumber}</h1>
						<p>Detailed job information and tracking</p>
					</div>
				</div>
				<div class="header-status" style="background-color: {getStatusColor(job.status)};">
					{job.status || 'Unknown'}
				</div>
			</div>
		</div>

		<!-- Job Details Content -->
		<div class="details-container">
			<!-- Basic Information -->
			<div class="details-section">
				<h2>Basic Information</h2>
				<div class="details-grid">
					<div class="detail-item">
						<span class="detail-label">Job Number</span>
						<span class="detail-value">{job.jobnumber}</span>
					</div>
					<div class="detail-item">
						<span class="detail-label">Status</span>
						<span class="detail-value status" style="color: {getStatusColor(job.status)};">
							{job.status || 'Unknown'}
						</span>
					</div>
					<div class="detail-item">
						<span class="detail-label">Commodity</span>
						<span class="detail-value">{job.commodity || 'N/A'}</span>
					</div>
					<div class="detail-item">
						<span class="detail-label">Description</span>
						<span class="detail-value">{job.description || 'N/A'}</span>
					</div>
					<div class="detail-item">
						<span class="detail-label">Created</span>
						<span class="detail-value">{formatDate(job.created_at)}</span>
					</div>
					<div class="detail-item">
						<span class="detail-label">Last Updated</span>
						<span class="detail-value">{formatDate(job.updated_at)}</span>
					</div>
				</div>
			</div>

			<!-- Shipment Details -->
			<div class="details-section">
				<h2>Shipment Details</h2>
				<div class="details-grid">
					<div class="detail-item">
						<span class="detail-label">Pieces</span>
						<span class="detail-value">{job.pieces || 'N/A'}</span>
					</div>
					<div class="detail-item">
						<span class="detail-label">Weight</span>
						<span class="detail-value">
							{#if job.weight}
								{job.weight} {job.weight_unit || 'kg'}
							{:else}
								N/A
							{/if}
						</span>
					</div>
					<div class="detail-item">
						<span class="detail-label">Dimensions</span>
						<span class="detail-value">{job.dimensions || 'N/A'}</span>
					</div>
					<div class="detail-item">
						<span class="detail-label">Declared Value</span>
						<span class="detail-value">
							{#if job.declared_value}
								${job.declared_value}
							{:else}
								N/A
							{/if}
						</span>
					</div>
					<div class="detail-item">
						<span class="detail-label">PO Number</span>
						<span class="detail-value">{job.po_number || 'N/A'}</span>
					</div>
				</div>
			</div>

			<!-- Service Information -->
			<div class="details-section">
				<h2>Service Information</h2>
				<div class="details-grid">
					<div class="detail-item">
						<span class="detail-label">Service Type</span>
						<span class="detail-value">{job.service_type || 'N/A'}</span>
					</div>
					<div class="detail-item">
						<span class="detail-label">Service Level</span>
						<span class="detail-value">{job.service_level || 'N/A'}</span>
					</div>
					<div class="detail-item">
						<span class="detail-label">Transport Mode</span>
						<span class="detail-value">{job.transport_mode || 'N/A'}</span>
					</div>
					<div class="detail-item">
						<span class="detail-label">Equipment Type</span>
						<span class="detail-value">{job.equipment_type || 'N/A'}</span>
					</div>
					<div class="detail-item">
						<span class="detail-label">Ready Date</span>
						<span class="detail-value">{formatDateOnly(job.ready_date)}</span>
					</div>
					<div class="detail-item">
						<span class="detail-label">Ready Time</span>
						<span class="detail-value">{job.ready_time || 'N/A'}</span>
					</div>
				</div>
			</div>

			<!-- Shipper Information -->
			<div class="details-section">
				<h2>Shipper Information</h2>
				<div class="address-card">
					<h3>{job.shipper_name || 'N/A'}</h3>
					<div class="contact-info">
						<p><strong>Contact:</strong> {job.shipper_contact || 'N/A'}</p>
						<p><strong>Phone:</strong> {job.shipper_phone || 'N/A'}</p>
					</div>
					<div class="address-info">
						<p>{job.shipper_address1 || 'N/A'}</p>
						{#if job.shipper_address2}
							<p>{job.shipper_address2}</p>
						{/if}
						<p>
							{job.shipper_city || 'N/A'}, {job.shipper_state || 'N/A'} {job.shipper_zip || ''}
						</p>
					</div>
				</div>
			</div>

			<!-- Consignee Information -->
			<div class="details-section">
				<h2>Consignee Information</h2>
				<div class="address-card">
					<h3>{job.consignee_name || 'N/A'}</h3>
					<div class="contact-info">
						<p><strong>Contact:</strong> {job.consignee_contact || 'N/A'}</p>
						<p><strong>Phone:</strong> {job.consignee_phone || 'N/A'}</p>
					</div>
					<div class="address-info">
						<p>{job.consignee_address1 || 'N/A'}</p>
						{#if job.consignee_address2}
							<p>{job.consignee_address2}</p>
						{/if}
						<p>
							{job.consignee_city || 'N/A'}, {job.consignee_state || 'N/A'} {job.consignee_zip || ''}
						</p>
					</div>
				</div>
			</div>

			<!-- Special Instructions -->
			{#if job.special_instructions}
				<div class="details-section">
					<h2>Special Instructions</h2>
					<div class="instructions-box">
						<p>{job.special_instructions}</p>
					</div>
				</div>
			{/if}

			<!-- Customer Information -->
			<div class="details-section">
				<h2>Customer Information</h2>
				<div class="details-grid">
					<div class="detail-item">
						<span class="detail-label">Customer Name</span>
						<span class="detail-value">{job.customer_name || 'N/A'}</span>
					</div>
					<div class="detail-item">
						<span class="detail-label">Account Number</span>
						<span class="detail-value">{job.customer_account || job.account_number || 'N/A'}</span>
					</div>
					<div class="detail-item">
						<span class="detail-label">Customer Contact</span>
						<span class="detail-value">{job.customer_contact || 'N/A'}</span>
					</div>
					<div class="detail-item">
						<span class="detail-label">Customer Email</span>
						<span class="detail-value">{job.customer_email || 'N/A'}</span>
					</div>
					<div class="detail-item">
						<span class="detail-label">Customer Phone</span>
						<span class="detail-value">{job.customer_phone || 'N/A'}</span>
					</div>
				</div>
			</div>

			<!-- Quote Section -->
			<div class="details-section">
				<h2>Quote Breakdown</h2>
				{#if loadingQuote}
					<div class="quote-loading">
						<div class="spinner"></div>
						<p>Loading quote...</p>
					</div>
				{:else if quoteItems.length === 0}
					<div class="no-quote">
						<p>No quote available for this job.</p>
					</div>
				{:else}
					<div class="quote-table-container">
						<table class="quote-table">
							<thead>
								<tr>
									<th>Charge Code</th>
									<th>Amount</th>
								</tr>
							</thead>
							<tbody>
								{#each quoteItems as item}
									<tr class:total-row={item.chargecode === 'TOTAL'}>
										<td class="charge-code">{item.chargecode}</td>
										<td class="charge-amount">${item.charge.toFixed(2)}</td>
									</tr>
								{/each}
							</tbody>
						</table>
						<div class="quote-disclaimer">
							*These are transport costs and may not include incidentals like driver waiting time.
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.page-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.loading-container, .error-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 3rem;
		background: white;
		border-radius: 16px;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
		text-align: center;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #f3f4f6;
		border-top: 4px solid #dc2626;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.error-icon {
		width: 64px;
		height: 64px;
		color: #ef4444;
	}

	.error-container h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0;
	}

	.error-container p {
		color: #6b7280;
		margin: 0.5rem 0 1.5rem 0;
	}

	.error-actions {
		display: flex;
		gap: 1rem;
	}

	.retry-btn, .back-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;
	}

	.retry-btn {
		background: #dc2626;
		color: white;
	}

	.retry-btn:hover {
		background: #b91c1c;
	}

	.back-btn {
		background: #f3f4f6;
		color: #374151;
		border: 1px solid #d1d5db;
	}

	.back-btn:hover {
		background: #e5e7eb;
	}

	.retry-btn svg, .back-btn svg {
		width: 16px;
		height: 16px;
	}

	/* Header */
	.page-header {
		background: white;
		border-radius: 16px;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
		border: 1px solid rgba(0, 0, 0, 0.05);
		padding: 2rem;
		margin-bottom: 2rem;
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 2rem;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		flex: 1;
	}

	.back-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: #f3f4f6;
		color: #374151;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		padding: 0.75rem 1rem;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.back-button:hover {
		background: #e5e7eb;
		transform: translateY(-1px);
	}

	.back-button svg {
		width: 16px;
		height: 16px;
	}

	.header-info h1 {
		font-size: 2rem;
		font-weight: 700;
		margin: 0 0 0.5rem 0;
		color: #1f2937;
	}

	.header-info p {
		font-size: 1rem;
		color: #6b7280;
		margin: 0;
	}

	.header-status {
		color: white;
		padding: 0.75rem 1.5rem;
		border-radius: 20px;
		font-size: 0.875rem;
		font-weight: 700;
		text-transform: uppercase;
		flex-shrink: 0;
	}

	/* Details Container */
	.details-container {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.details-section {
		background: white;
		border-radius: 16px;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
		border: 1px solid rgba(0, 0, 0, 0.05);
		padding: 2rem;
	}

	.details-section h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 1.5rem 0;
		padding-bottom: 0.75rem;
		border-bottom: 2px solid #dc2626;
		display: inline-block;
	}

	.details-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.detail-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.detail-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.detail-value {
		font-size: 1rem;
		color: #1f2937;
		font-weight: 500;
	}

	.detail-value.status {
		font-weight: 700;
		text-transform: uppercase;
	}

	/* Address Cards */
	.address-card {
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 1.5rem;
	}

	.address-card h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 1rem 0;
	}

	.contact-info {
		margin-bottom: 1rem;
	}

	.contact-info p {
		margin: 0.25rem 0;
		font-size: 0.875rem;
		color: #374151;
	}

	.address-info p {
		margin: 0.25rem 0;
		font-size: 0.875rem;
		color: #374151;
	}

	/* Instructions Box */
	.instructions-box {
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 1.5rem;
	}

	.instructions-box p {
		margin: 0;
		line-height: 1.6;
		color: #374151;
	}

	/* Quote Styles */
	.quote-loading, .no-quote {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		text-align: center;
		color: #6b7280;
	}

	.quote-table-container {
		overflow-x: auto;
	}

	.quote-table {
		width: 100%;
		border-collapse: collapse;
		background: white;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.quote-table th {
		background: #f8fafc;
		padding: 1rem;
		text-align: left;
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border-bottom: 2px solid #e5e7eb;
	}

	.quote-table td {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #f3f4f6;
		font-size: 0.875rem;
	}

	.charge-code {
		font-weight: 600;
		color: #1f2937;
		text-transform: uppercase;
	}

	.charge-amount {
		font-weight: 700;
		color: #059669;
		font-family: 'Courier New', monospace;
		text-align: right;
	}

	.total-row {
		background: #f0fdf4;
		border-top: 2px solid #22c55e;
	}

	.total-row .charge-code {
		color: #166534;
		font-weight: 700;
	}

	.total-row .charge-amount {
		color: #166534;
		font-size: 1.1rem;
		font-weight: 700;
	}

	.quote-disclaimer {
		margin-top: 1rem;
		padding: 0.75rem;
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		font-size: 0.75rem;
		color: #6b7280;
		font-style: italic;
		text-align: center;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.page-container {
			padding: 1rem;
		}

		.header-content {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.header-left {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
			width: 100%;
		}

		.details-grid {
			grid-template-columns: 1fr;
		}

		.error-actions {
			flex-direction: column;
			width: 100%;
		}

		.retry-btn, .back-btn {
			width: 100%;
			justify-content: center;
		}
	}
</style>