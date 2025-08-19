<svelte:head>
	<title>Create New Job - CERTrack</title>
</svelte:head>

<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { createCustomerJob, getCurrentUserCustomer } from '$lib/services/customerService';
	import { customerJobSchema, type CustomerJobFormData } from '$lib/validation/schemas';
	import type { Customer } from '$lib/services/customerService';
	
	let customer: Customer | null = null;
	let loading = false;
	let submitting = false;
	let errors: Record<string, string> = {};
	let successMessage = '';
	let errorMessage = '';

	// Form data with default values
	let formData: Partial<CustomerJobFormData> = {
		commodity: '',
		description: '',
		pieces: 1,
		weight: 0,
		weight_unit: 'kg',
		dimensions: '',
		declared_value: 0,
		service_type: 'Standard',
		service_level: 'Door to Door',
		transport_mode: 'Air',
		equipment_type: '',
		ready_date: '',
		ready_time: '',
		shipper_name: '',
		shipper_contact: '',
		shipper_phone: '',
		shipper_address1: '',
		shipper_address2: '',
		shipper_city: '',
		shipper_state: '',
		shipper_zip: '',
		consignee_name: '',
		consignee_contact: '',
		consignee_phone: '',
		consignee_address1: '',
		consignee_address2: '',
		consignee_city: '',
		consignee_state: '',
		consignee_zip: '',
		po_number: '',
		special_instructions: ''
	};

	// Get tomorrow's date as default
	function getTomorrowDate(): string {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		return tomorrow.toISOString().split('T')[0];
	}

	// Get default time (9 AM)
	function getDefaultTime(): string {
		return '09:00';
	}

	onMount(async () => {
		loading = true;
		try {
			customer = await getCurrentUserCustomer();
			// Set default date and time
			formData.ready_date = getTomorrowDate();
			formData.ready_time = getDefaultTime();
		} catch (error) {
			console.error('Error loading customer data:', error);
			errorMessage = 'Failed to load customer information';
		} finally {
			loading = false;
		}
	});

	function validateForm(): boolean {
		errors = {};
		try {
			customerJobSchema.parse(formData);
			return true;
		} catch (error: any) {
			if (error.errors) {
				error.errors.forEach((err: any) => {
					errors[err.path[0]] = err.message;
				});
			}
			return false;
		}
	}

	async function handleSubmit() {
		if (!validateForm()) {
			errorMessage = 'Please fix the errors below';
			return;
		}

		submitting = true;
		errorMessage = '';
		successMessage = '';

		try {
			const result = await createCustomerJob(formData as CustomerJobFormData);
			
			if (result.success) {
				successMessage = `Job ${result.jobNumber} created successfully!`;
				// Redirect to job search after 2 seconds
				setTimeout(() => {
					goto('/dashboard/customer/job-search');
				}, 2000);
			} else {
				errorMessage = result.error || 'Failed to create job';
			}
		} catch (error) {
			console.error('Error creating job:', error);
			errorMessage = 'An unexpected error occurred';
		} finally {
			submitting = false;
		}
	}

	function clearMessages() {
		successMessage = '';
		errorMessage = '';
	}
</script>

<div class="page-container">
	<!-- Header -->
	<div class="page-header">
		<h1>Create New Job</h1>
		<p>Fill out the details below to create a new shipment job</p>
		{#if customer}
			<p class="customer-info">Creating job for: <strong>{customer.name}</strong></p>
		{/if}
	</div>

	{#if loading}
		<div class="loading-container">
			<div class="spinner"></div>
			<p>Loading...</p>
		</div>
	{:else}
		<!-- Success/Error Messages -->
		{#if successMessage}
			<div class="message success">
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
				</svg>
				{successMessage}
			</div>
		{/if}

		{#if errorMessage}
			<div class="message error">
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
				</svg>
				{errorMessage}
			</div>
		{/if}

		<!-- Job Creation Form -->
		<form on:submit|preventDefault={handleSubmit} class="job-form">
			<!-- Job Information Section -->
			<div class="form-section">
				<h2>Job Information</h2>
				<div class="form-grid">
					<div class="form-group">
						<label for="commodity">Commodity *</label>
						<input 
							type="text" 
							id="commodity" 
							bind:value={formData.commodity}
							on:input={clearMessages}
							class:error={errors.commodity}
							placeholder="e.g., Electronics, Documents, Medical Supplies"
							required 
						/>
						{#if errors.commodity}<span class="error-text">{errors.commodity}</span>{/if}
					</div>

					<div class="form-group">
						<label for="description">Description</label>
						<input 
							type="text" 
							id="description" 
							bind:value={formData.description}
							on:input={clearMessages}
							placeholder="Additional details about the shipment"
						/>
					</div>

					<div class="form-group">
						<label for="pieces">Number of Pieces *</label>
						<input 
							type="number" 
							id="pieces" 
							bind:value={formData.pieces}
							on:input={clearMessages}
							class:error={errors.pieces}
							min="1" 
							max="9999"
							required 
						/>
						{#if errors.pieces}<span class="error-text">{errors.pieces}</span>{/if}
					</div>

					<div class="form-group">
						<label for="weight">Weight *</label>
						<div class="input-group">
							<input 
								type="number" 
								id="weight" 
								bind:value={formData.weight}
								on:input={clearMessages}
								class:error={errors.weight}
								min="0.1" 
								step="0.1"
								required 
							/>
							<select bind:value={formData.weight_unit} class:error={errors.weight_unit}>
								<option value="kg">kg</option>
								<option value="lbs">lbs</option>
							</select>
						</div>
						{#if errors.weight}<span class="error-text">{errors.weight}</span>{/if}
						{#if errors.weight_unit}<span class="error-text">{errors.weight_unit}</span>{/if}
					</div>

					<div class="form-group">
						<label for="dimensions">Dimensions (L x W x H)</label>
						<input 
							type="text" 
							id="dimensions" 
							bind:value={formData.dimensions}
							on:input={clearMessages}
							placeholder="e.g., 10 x 5 x 3 cm"
						/>
					</div>

					<div class="form-group">
						<label for="declared_value">Declared Value ($)</label>
						<input 
							type="number" 
							id="declared_value" 
							bind:value={formData.declared_value}
							on:input={clearMessages}
							min="0" 
							step="0.01"
							placeholder="0.00"
						/>
					</div>
				</div>
			</div>

			<!-- Service Information Section -->
			<div class="form-section">
				<h2>Service Information</h2>
				<div class="form-grid">
					<div class="form-group">
						<label for="service_type">Service Type *</label>
						<select id="service_type" bind:value={formData.service_type} class:error={errors.service_type} required>
							<option value="Express">Express</option>
							<option value="Standard">Standard</option>
							<option value="Economy">Economy</option>
							<option value="Overnight">Overnight</option>
							<option value="Same Day">Same Day</option>
						</select>
						{#if errors.service_type}<span class="error-text">{errors.service_type}</span>{/if}
					</div>

					<div class="form-group">
						<label for="service_level">Service Level *</label>
						<select id="service_level" bind:value={formData.service_level} class:error={errors.service_level} required>
							<option value="Door to Door">Door to Door</option>
							<option value="Door to Airport">Door to Airport</option>
							<option value="Airport to Door">Airport to Door</option>
							<option value="Airport to Airport">Airport to Airport</option>
						</select>
						{#if errors.service_level}<span class="error-text">{errors.service_level}</span>{/if}
					</div>

					<div class="form-group">
						<label for="transport_mode">Transport Mode *</label>
						<select id="transport_mode" bind:value={formData.transport_mode} class:error={errors.transport_mode} required>
							<option value="Air">Air</option>
							<option value="Ground">Ground</option>
							<option value="Ocean">Ocean</option>
							<option value="Multi-Modal">Multi-Modal</option>
						</select>
						{#if errors.transport_mode}<span class="error-text">{errors.transport_mode}</span>{/if}
					</div>

					<div class="form-group">
						<label for="equipment_type">Equipment Type</label>
						<input 
							type="text" 
							id="equipment_type" 
							bind:value={formData.equipment_type}
							on:input={clearMessages}
							placeholder="e.g., Dry van, Refrigerated, Flatbed"
						/>
					</div>
				</div>
			</div>

			<!-- Pickup Information Section -->
			<div class="form-section">
				<h2>Pickup Information</h2>
				<div class="form-grid">
					<div class="form-group">
						<label for="ready_date">Ready Date *</label>
						<input 
							type="date" 
							id="ready_date" 
							bind:value={formData.ready_date}
							on:input={clearMessages}
							class:error={errors.ready_date}
							required 
						/>
						{#if errors.ready_date}<span class="error-text">{errors.ready_date}</span>{/if}
					</div>

					<div class="form-group">
						<label for="ready_time">Ready Time *</label>
						<input 
							type="time" 
							id="ready_time" 
							bind:value={formData.ready_time}
							on:input={clearMessages}
							class:error={errors.ready_time}
							required 
						/>
						{#if errors.ready_time}<span class="error-text">{errors.ready_time}</span>{/if}
					</div>
				</div>
			</div>

			<!-- Shipper Information Section -->
			<div class="form-section">
				<h2>Shipper Information</h2>
				<div class="form-grid">
					<div class="form-group">
						<label for="shipper_name">Company/Name *</label>
						<input 
							type="text" 
							id="shipper_name" 
							bind:value={formData.shipper_name}
							on:input={clearMessages}
							class:error={errors.shipper_name}
							required 
						/>
						{#if errors.shipper_name}<span class="error-text">{errors.shipper_name}</span>{/if}
					</div>

					<div class="form-group">
						<label for="shipper_contact">Contact Person *</label>
						<input 
							type="text" 
							id="shipper_contact" 
							bind:value={formData.shipper_contact}
							on:input={clearMessages}
							class:error={errors.shipper_contact}
							required 
						/>
						{#if errors.shipper_contact}<span class="error-text">{errors.shipper_contact}</span>{/if}
					</div>

					<div class="form-group">
						<label for="shipper_phone">Phone *</label>
						<input 
							type="tel" 
							id="shipper_phone" 
							bind:value={formData.shipper_phone}
							on:input={clearMessages}
							class:error={errors.shipper_phone}
							required 
						/>
						{#if errors.shipper_phone}<span class="error-text">{errors.shipper_phone}</span>{/if}
					</div>

					<div class="form-group full-width">
						<label for="shipper_address1">Address Line 1 *</label>
						<input 
							type="text" 
							id="shipper_address1" 
							bind:value={formData.shipper_address1}
							on:input={clearMessages}
							class:error={errors.shipper_address1}
							required 
						/>
						{#if errors.shipper_address1}<span class="error-text">{errors.shipper_address1}</span>{/if}
					</div>

					<div class="form-group full-width">
						<label for="shipper_address2">Address Line 2</label>
						<input 
							type="text" 
							id="shipper_address2" 
							bind:value={formData.shipper_address2}
							on:input={clearMessages}
						/>
					</div>

					<div class="form-group">
						<label for="shipper_city">City *</label>
						<input 
							type="text" 
							id="shipper_city" 
							bind:value={formData.shipper_city}
							on:input={clearMessages}
							class:error={errors.shipper_city}
							required 
						/>
						{#if errors.shipper_city}<span class="error-text">{errors.shipper_city}</span>{/if}
					</div>

					<div class="form-group">
						<label for="shipper_state">State/Province *</label>
						<input 
							type="text" 
							id="shipper_state" 
							bind:value={formData.shipper_state}
							on:input={clearMessages}
							class:error={errors.shipper_state}
							required 
						/>
						{#if errors.shipper_state}<span class="error-text">{errors.shipper_state}</span>{/if}
					</div>

					<div class="form-group">
						<label for="shipper_zip">ZIP/Postal Code *</label>
						<input 
							type="text" 
							id="shipper_zip" 
							bind:value={formData.shipper_zip}
							on:input={clearMessages}
							class:error={errors.shipper_zip}
							required 
						/>
						{#if errors.shipper_zip}<span class="error-text">{errors.shipper_zip}</span>{/if}
					</div>
				</div>
			</div>

			<!-- Consignee Information Section -->
			<div class="form-section">
				<h2>Consignee Information</h2>
				<div class="form-grid">
					<div class="form-group">
						<label for="consignee_name">Company/Name *</label>
						<input 
							type="text" 
							id="consignee_name" 
							bind:value={formData.consignee_name}
							on:input={clearMessages}
							class:error={errors.consignee_name}
							required 
						/>
						{#if errors.consignee_name}<span class="error-text">{errors.consignee_name}</span>{/if}
					</div>

					<div class="form-group">
						<label for="consignee_contact">Contact Person *</label>
						<input 
							type="text" 
							id="consignee_contact" 
							bind:value={formData.consignee_contact}
							on:input={clearMessages}
							class:error={errors.consignee_contact}
							required 
						/>
						{#if errors.consignee_contact}<span class="error-text">{errors.consignee_contact}</span>{/if}
					</div>

					<div class="form-group">
						<label for="consignee_phone">Phone *</label>
						<input 
							type="tel" 
							id="consignee_phone" 
							bind:value={formData.consignee_phone}
							on:input={clearMessages}
							class:error={errors.consignee_phone}
							required 
						/>
						{#if errors.consignee_phone}<span class="error-text">{errors.consignee_phone}</span>{/if}
					</div>

					<div class="form-group full-width">
						<label for="consignee_address1">Address Line 1 *</label>
						<input 
							type="text" 
							id="consignee_address1" 
							bind:value={formData.consignee_address1}
							on:input={clearMessages}
							class:error={errors.consignee_address1}
							required 
						/>
						{#if errors.consignee_address1}<span class="error-text">{errors.consignee_address1}</span>{/if}
					</div>

					<div class="form-group full-width">
						<label for="consignee_address2">Address Line 2</label>
						<input 
							type="text" 
							id="consignee_address2" 
							bind:value={formData.consignee_address2}
							on:input={clearMessages}
						/>
					</div>

					<div class="form-group">
						<label for="consignee_city">City *</label>
						<input 
							type="text" 
							id="consignee_city" 
							bind:value={formData.consignee_city}
							on:input={clearMessages}
							class:error={errors.consignee_city}
							required 
						/>
						{#if errors.consignee_city}<span class="error-text">{errors.consignee_city}</span>{/if}
					</div>

					<div class="form-group">
						<label for="consignee_state">State/Province *</label>
						<input 
							type="text" 
							id="consignee_state" 
							bind:value={formData.consignee_state}
							on:input={clearMessages}
							class:error={errors.consignee_state}
							required 
						/>
						{#if errors.consignee_state}<span class="error-text">{errors.consignee_state}</span>{/if}
					</div>

					<div class="form-group">
						<label for="consignee_zip">ZIP/Postal Code *</label>
						<input 
							type="text" 
							id="consignee_zip" 
							bind:value={formData.consignee_zip}
							on:input={clearMessages}
							class:error={errors.consignee_zip}
							required 
						/>
						{#if errors.consignee_zip}<span class="error-text">{errors.consignee_zip}</span>{/if}
					</div>
				</div>
			</div>

			<!-- Additional Information Section -->
			<div class="form-section">
				<h2>Additional Information</h2>
				<div class="form-grid">
					<div class="form-group">
						<label for="po_number">PO Number</label>
						<input 
							type="text" 
							id="po_number" 
							bind:value={formData.po_number}
							on:input={clearMessages}
							placeholder="Purchase Order Number"
						/>
					</div>

					<div class="form-group full-width">
						<label for="special_instructions">Special Instructions</label>
						<textarea 
							id="special_instructions" 
							bind:value={formData.special_instructions}
							on:input={clearMessages}
							placeholder="Any special handling instructions or notes..."
							rows="4"
						></textarea>
					</div>
				</div>
			</div>

			<!-- Form Actions -->
			<div class="form-actions">
				<button type="button" class="btn secondary" on:click={() => goto('/dashboard/customer')}>
					Cancel
				</button>
				<button type="submit" class="btn primary" disabled={submitting}>
					{#if submitting}
						<div class="btn-spinner"></div>
						Creating Job...
					{:else}
						Create Job
					{/if}
				</button>
			</div>
		</form>
	{/if}
</div>

<style>
	.page-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.page-header {
		text-align: center;
		margin-bottom: 2rem;
		padding: 2rem;
		background: white;
		border-radius: 16px;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
		border: 1px solid rgba(0, 0, 0, 0.05);
	}

	.page-header h1 {
		font-size: 2.5rem;
		font-weight: 700;
		margin: 0 0 1rem 0;
		color: #dc2626;
	}

	.page-header p {
		font-size: 1.125rem;
		color: #6b7280;
		margin: 0.5rem 0;
	}

	.customer-info {
		font-size: 1rem !important;
		color: #059669 !important;
		font-weight: 500;
	}

	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 3rem;
		background: white;
		border-radius: 16px;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
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

	.message {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.5rem;
		border-radius: 12px;
		margin-bottom: 1.5rem;
		font-weight: 500;
	}

	.message.success {
		background: #dcfce7;
		color: #166534;
		border: 1px solid #bbf7d0;
	}

	.message.error {
		background: #fef2f2;
		color: #dc2626;
		border: 1px solid #fecaca;
	}

	.message svg {
		width: 20px;
		height: 20px;
		flex-shrink: 0;
	}

	.job-form {
		background: white;
		border-radius: 16px;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
		border: 1px solid rgba(0, 0, 0, 0.05);
		overflow: hidden;
	}

	.form-section {
		padding: 2rem;
		border-bottom: 1px solid #f3f4f6;
	}

	.form-section:last-child {
		border-bottom: none;
	}

	.form-section h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 1.5rem 0;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid #dc2626;
		display: inline-block;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
	}

	.form-group.full-width {
		grid-column: 1 / -1;
	}

	.form-group label {
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
		margin-bottom: 0.5rem;
	}

	.form-group input,
	.form-group select,
	.form-group textarea {
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 0.875rem;
		transition: all 0.2s ease;
		background: white;
	}

	.form-group input:focus,
	.form-group select:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: #dc2626;
		box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
	}

	.form-group input.error,
	.form-group select.error {
		border-color: #ef4444;
		background: #fef2f2;
	}

	.input-group {
		display: flex;
		gap: 0.5rem;
	}

	.input-group input {
		flex: 1;
	}

	.input-group select {
		min-width: 80px;
	}

	.error-text {
		font-size: 0.75rem;
		color: #ef4444;
		margin-top: 0.25rem;
	}

	.form-actions {
		padding: 2rem;
		background: #f9fafb;
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
	}

	.btn {
		padding: 0.875rem 2rem;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		border: none;
		text-decoration: none;
	}

	.btn.primary {
		background: #dc2626;
		color: white;
	}

	.btn.primary:hover:not(:disabled) {
		background: #b91c1c;
		transform: translateY(-1px);
		box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);
	}

	.btn.secondary {
		background: #f3f4f6;
		color: #374151;
		border: 1px solid #d1d5db;
	}

	.btn.secondary:hover {
		background: #e5e7eb;
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.btn-spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top: 2px solid white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.page-container {
			padding: 1rem;
		}

		.form-grid {
			grid-template-columns: 1fr;
		}

		.form-actions {
			flex-direction: column;
		}

		.btn {
			width: 100%;
			justify-content: center;
		}
	}
</style> 