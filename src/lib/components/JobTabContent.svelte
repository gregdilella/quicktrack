<!-- Job Tab Content Component -->
<script lang="ts">
	export let activeTab: string = 'where'
	export let jobData: any = {}
	
	function generateJobNumber(): string {
		const timestamp = Date.now().toString().slice(-6)
		const random = Math.random().toString(36).substring(2, 5).toUpperCase()
		return `${timestamp}${random}`
	}
	
	// Initialize job number if not provided
	if (!jobData.job_number) {
		jobData.job_number = generateJobNumber()
	}
</script>

<div class="tab-panel">
	<!-- WHO Tab - Customer Information -->
	{#if activeTab === 'who'}
		<h3 class="blue-text">--- CUSTOMER/ACCOUNT INFORMATION ---</h3>
		<div class="form-grid">
			<div class="form-group">
				<label class="blue-text">CUSTOMER ACCOUNT:</label>
				<input type="text" bind:value={jobData.customer_account} class="form-input" />
			</div>
			<div class="form-group">
				<label class="blue-text">CUSTOMER NAME:</label>
				<input type="text" bind:value={jobData.customer_name} required class="form-input" />
			</div>
			<div class="form-group">
				<label class="blue-text">CONTACT PERSON:</label>
				<input type="text" bind:value={jobData.customer_contact} class="form-input" />
			</div>
			<div class="form-group">
				<label class="blue-text">PHONE NUMBER:</label>
				<input type="tel" bind:value={jobData.customer_phone} class="form-input" />
			</div>
			<div class="form-group">
				<label class="blue-text">EMAIL ADDRESS:</label>
				<input type="email" bind:value={jobData.customer_email} class="form-input" />
			</div>
		</div>
	{/if}

	<!-- WHAT Tab - Commodity Information -->
	{#if activeTab === 'what'}
		<h3 class="blue-text">--- COMMODITY/CARGO INFORMATION ---</h3>
		<div class="form-grid">
			<div class="form-group">
				<label class="blue-text">COMMODITY:</label>
				<input type="text" bind:value={jobData.commodity} required class="form-input" />
			</div>
			<div class="form-group">
				<label class="blue-text">COMMODITY CODE:</label>
				<input type="text" bind:value={jobData.commodity_code} class="form-input" />
			</div>
			<div class="form-group">
				<label class="blue-text">PIECES (PCS):</label>
				<input type="number" bind:value={jobData.pieces} required class="form-input" />
			</div>
			<div class="form-group">
				<label class="blue-text">WEIGHT:</label>
				<div class="input-group">
					<input type="number" bind:value={jobData.weight} required class="form-input" />
					<select bind:value={jobData.weight_unit} class="form-input weight-unit">
						<option value="lbs">LBS</option>
						<option value="kg">KG</option>
					</select>
				</div>
			</div>
			<div class="form-group">
				<label class="blue-text">DIMENSIONS:</label>
				<input type="text" bind:value={jobData.dimensions} placeholder="L x W x H" class="form-input" />
			</div>
			<div class="form-group">
				<label class="blue-text">DECLARED VALUE:</label>
				<input type="number" bind:value={jobData.value} class="form-input" />
			</div>
			<div class="form-group full-width">
				<label class="blue-text">DESCRIPTION:</label>
				<textarea bind:value={jobData.description} class="form-input form-textarea" rows="3"></textarea>
			</div>
		</div>
	{/if}

	<!-- WHERE Tab - Shipper/Consignee Information -->
	{#if activeTab === 'where'}
		<div class="where-layout">
			<!-- Row 1: Job Info (Job, BOL, PO#) -->
			<div class="row-box">
				<div class="field-group">
					<label class="blue-text">Job</label>
					<input type="text" bind:value={jobData.job_number} class="field-input" readonly />
				</div>
				<div class="field-group">
					<label class="blue-text">BOL</label>
					<input type="text" bind:value={jobData.bol_number} class="field-input" />
				</div>
				<div class="field-group">
					<label class="blue-text">PO#</label>
					<input type="text" bind:value={jobData.po_number} class="field-input" />
				</div>
			</div>

			<!-- Row 2: Commodity Info (Commodity, #Pcs, Weight, Type of Service) -->
			<div class="row-box">
				<div class="field-group">
					<label class="blue-text">Commodity</label>
					<input type="text" bind:value={jobData.commodity} class="field-input commodity-field" />
				</div>
				<div class="field-group">
					<label class="blue-text">#Pcs</label>
					<input type="number" bind:value={jobData.pieces} class="field-input small-field" />
				</div>
				<div class="field-group">
					<label class="blue-text">Weight</label>
					<input type="number" bind:value={jobData.weight} class="field-input small-field" />
				</div>
				<div class="field-group">
					<label class="blue-text">Type of Service</label>
					<select bind:value={jobData.service_type} class="field-input service-field">
						<option value="ground">Ground</option>
						<option value="air">Air</option>
						<option value="ocean">Ocean</option>
						<option value="express">Express</option>
					</select>
				</div>
			</div>

			<!-- Row 3: Shipper/Consignee (Two Columns) -->
			<div class="shipper-consignee-row">
				<!-- Shipper Column -->
				<div class="location-column">
					<div class="location-header">
						<span class="red-text">Shipper</span>
						<span class="date-time">{new Date().toLocaleDateString('en-US', { year: '2-digit', month: '2-digit', day: '2-digit' })} {new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}</span>
					</div>
					<div class="location-content">
						<input type="text" bind:value={jobData.shipper_name} placeholder="Company Name" class="location-input" />
						<input type="text" bind:value={jobData.shipper_address1} placeholder="Address 1" class="location-input" />
						<input type="text" bind:value={jobData.shipper_address2} placeholder="Address 2" class="location-input" />
						<div class="city-state-zip">
							<input type="text" bind:value={jobData.shipper_city} placeholder="City" class="city-input" />
							<input type="text" bind:value={jobData.shipper_state} placeholder="ST" class="state-input" />
							<input type="text" bind:value={jobData.shipper_zip} placeholder="ZIP" class="zip-input" />
						</div>
						<input type="tel" bind:value={jobData.shipper_phone} placeholder="Phone" class="location-input" />
						<input type="text" bind:value={jobData.shipper_contact} placeholder="Contact" class="location-input" />
					</div>
				</div>

				<!-- Consignee Column -->
				<div class="location-column">
					<div class="location-header">
						<span class="red-text">Consignee</span>
						<span class="date-time">{new Date().toLocaleDateString('en-US', { year: '2-digit', month: '2-digit', day: '2-digit' })} {new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}</span>
					</div>
					<div class="location-content">
						<input type="text" bind:value={jobData.consignee_name} placeholder="Company Name" class="location-input" />
						<input type="text" bind:value={jobData.consignee_address1} placeholder="Address 1" class="location-input" />
						<input type="text" bind:value={jobData.consignee_address2} placeholder="Address 2" class="location-input" />
						<div class="city-state-zip">
							<input type="text" bind:value={jobData.consignee_city} placeholder="City" class="city-input" />
							<input type="text" bind:value={jobData.consignee_state} placeholder="ST" class="state-input" />
							<input type="text" bind:value={jobData.consignee_zip} placeholder="ZIP" class="zip-input" />
						</div>
						<input type="tel" bind:value={jobData.consignee_phone} placeholder="Phone" class="location-input" />
						<input type="text" bind:value={jobData.consignee_contact} placeholder="Contact" class="location-input" />
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- HOW Tab - Service Type -->
	{#if activeTab === 'how'}
		<h3 class="blue-text">--- SERVICE TYPE/TRANSPORTATION ---</h3>
		<div class="form-grid">
			<div class="form-group">
				<label class="blue-text">SERVICE TYPE:</label>
				<select bind:value={jobData.service_type} required class="form-input">
					<option value="">Select Service Type</option>
					<option value="ground">Ground Transportation</option>
					<option value="air">Air Transportation</option>
					<option value="ocean">Ocean Freight</option>
					<option value="express">Express Delivery</option>
					<option value="ltl">LTL (Less Than Truckload)</option>
					<option value="ftl">FTL (Full Truckload)</option>
				</select>
			</div>
			<div class="form-group">
				<label class="blue-text">TRANSPORT MODE:</label>
				<select bind:value={jobData.transport_mode} class="form-input">
					<option value="">Select Mode</option>
					<option value="truck">Truck</option>
					<option value="air">Air</option>
					<option value="rail">Rail</option>
					<option value="ocean">Ocean</option>
					<option value="intermodal">Intermodal</option>
				</select>
			</div>
			<div class="form-group">
				<label class="blue-text">EQUIPMENT TYPE:</label>
				<select bind:value={jobData.equipment_type} class="form-input">
					<option value="">Select Equipment</option>
					<option value="van">Dry Van</option>
					<option value="reefer">Refrigerated</option>
					<option value="flatbed">Flatbed</option>
					<option value="container">Container</option>
					<option value="aircraft">Aircraft</option>
				</select>
			</div>
			<div class="form-group">
				<label class="blue-text">SERVICE LEVEL:</label>
				<select bind:value={jobData.service_level} class="form-input">
					<option value="standard">Standard</option>
					<option value="expedited">Expedited</option>
					<option value="priority">Priority</option>
					<option value="critical">Critical</option>
				</select>
			</div>
			<div class="form-group full-width">
				<label class="blue-text">SPECIAL INSTRUCTIONS:</label>
				<textarea bind:value={jobData.special_instructions} class="form-input form-textarea" rows="3"></textarea>
			</div>
		</div>
	{/if}

	<!-- WHEN Tab - Scheduling -->
	{#if activeTab === 'when'}
		<h3 class="blue-text">--- SCHEDULING INFORMATION ---</h3>
		<div class="form-grid">
			<div class="form-group">
				<label class="blue-text">READY DATE:</label>
				<input type="date" bind:value={jobData.ready_date} class="form-input" />
			</div>
			<div class="form-group">
				<label class="blue-text">READY TIME:</label>
				<input type="time" bind:value={jobData.ready_time} class="form-input" />
			</div>
			<div class="form-group">
				<label class="blue-text">PICKUP DATE:</label>
				<input type="date" bind:value={jobData.pickup_date} required class="form-input" />
			</div>
			<div class="form-group">
				<label class="blue-text">PICKUP TIME:</label>
				<input type="time" bind:value={jobData.pickup_time} class="form-input" />
			</div>
			<div class="form-group">
				<label class="blue-text">DELIVERY DATE:</label>
				<input type="date" bind:value={jobData.delivery_date} required class="form-input" />
			</div>
			<div class="form-group">
				<label class="blue-text">DELIVERY TIME:</label>
				<input type="time" bind:value={jobData.delivery_time} class="form-input" />
			</div>
			<div class="form-group">
				<label class="blue-text">PRIORITY:</label>
				<select bind:value={jobData.priority} class="form-input">
					<option value="standard">Standard</option>
					<option value="urgent">Urgent</option>
					<option value="express">Express</option>
					<option value="critical">Critical</option>
				</select>
			</div>
			<div class="form-group full-width">
				<label class="blue-text">ADDITIONAL NOTES:</label>
				<textarea bind:value={jobData.notes} class="form-input form-textarea" rows="3"></textarea>
			</div>
		</div>
	{/if}
</div>

<style>
	.tab-panel {
		height: 100%;
		min-height: 370px; /* Reduced height for all tabs */
		display: flex;
		flex-direction: column;
		background-color: #fff8f0; /* Ensure full background coverage */
		position: relative;
		z-index: 2; /* Layer above tab content background */
		overflow: hidden; /* Prevent content overflow */
	}

	.tab-panel h3 {
		margin: 0 0 20px 0;
		text-align: center;
		flex-shrink: 0;
	}

	.red-text {
		color: red;
		font-weight: bold;
	}

	.blue-text {
		color: blue;
		font-weight: bold;
	}

	/* Form Grid Layouts */
	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 15px;
		flex: 1;
		background-color: transparent;
		position: relative;
		z-index: 1;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.form-group.full-width {
		grid-column: 1 / -1;
	}

	.form-group label {
		font-size: 12px;
	}

	.form-input {
		padding: 8px;
		font-family: 'Courier New', monospace;
		font-size: 12px;
		border: 1px solid #ccc;
		background-color: white;
	}

	.form-textarea {
		resize: vertical;
		min-height: 60px;
	}

	.form-input:focus {
		outline: none;
		border-color: #0066cc;
		background-color: #f8f9fa;
	}

	.input-group {
		display: flex;
		gap: 5px;
	}

	.input-group input {
		flex: 1;
	}

	.weight-unit {
		width: 80px;
	}

	/* WHERE Tab Layout */
	.where-layout {
		display: flex;
		flex-direction: column;
		gap: 10px;
		height: 100%;
		background-color: transparent;
		position: relative;
		z-index: 1;
		contain: layout style; /* Contain layout and styling */
	}

	.row-box {
		display: flex;
		gap: 10px;
		padding: 8px;
		border: 1px solid #666;
		background-color: #f8f8f8;
		align-items: end;
		flex-shrink: 0;
	}

	.field-group {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.field-group label {
		font-size: 10px;
		color: blue;
		font-weight: bold;
	}

	.field-input {
		padding: 2px 4px;
		font-family: 'Courier New', monospace;
		font-size: 11px;
		border: 1px solid #999;
		background-color: white;
		height: 20px;
	}

	.commodity-field {
		width: 120px;
	}

	.small-field {
		width: 60px;
	}

	.service-field {
		width: 100px;
	}

	.shipper-consignee-row {
		display: flex;
		gap: 10px;
		flex: 1;
	}

	.location-column {
		flex: 1;
		border: 1px solid #666;
		background-color: #f8f8f8;
		display: flex;
		flex-direction: column;
		position: relative;
		z-index: 1;
		contain: layout style; /* Contain layout and styling */
		overflow: hidden; /* Prevent content overflow */
	}

	.location-header {
		background-color: #e0e0e0;
		padding: 4px 8px;
		border-bottom: 1px solid #666;
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-shrink: 0;
	}

	.location-header .red-text {
		font-size: 12px;
		font-weight: bold;
	}

	.date-time {
		font-size: 10px;
		color: red;
		font-family: 'Courier New', monospace;
	}

	.location-content {
		padding: 6px;
		display: flex;
		flex-direction: column;
		gap: 3px;
		flex: 1;
	}

	.location-input {
		padding: 2px 4px;
		font-family: 'Courier New', monospace;
		font-size: 11px;
		border: 1px solid #999;
		background-color: white;
		height: 18px;
	}

	.city-state-zip {
		display: flex;
		gap: 4px;
	}

	.city-input {
		flex: 2;
		padding: 2px 4px;
		font-family: 'Courier New', monospace;
		font-size: 11px;
		border: 1px solid #999;
		background-color: white;
		height: 18px;
	}

	.state-input {
		width: 40px;
		padding: 2px 4px;
		font-family: 'Courier New', monospace;
		font-size: 11px;
		border: 1px solid #999;
		background-color: white;
		height: 18px;
	}

	.zip-input {
		width: 70px;
		padding: 2px 4px;
		font-family: 'Courier New', monospace;
		font-size: 11px;
		border: 1px solid #999;
		background-color: white;
		height: 18px;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.form-grid {
			grid-template-columns: 1fr;
		}
		
		.row-box {
			flex-wrap: wrap;
			gap: 5px;
		}
		
		.shipper-consignee-row {
			flex-direction: column;
			gap: 5px;
		}
		
		.field-input {
			font-size: 10px;
		}
		
		.location-input {
			font-size: 10px;
		}
	}
</style> 