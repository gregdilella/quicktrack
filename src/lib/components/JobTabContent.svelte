<!-- Job Tab Content Component -->
<script lang="ts">
	import { supabase } from '$lib/supabase'
	import { createEventDispatcher } from 'svelte'
	
	export let activeTab: string = 'where'
	export let jobData: any = {}
	
	const dispatch = createEventDispatcher()
	
	// State for CRUD operations
	let saving = false
	let saveMessage = ''
	let saveError = ''
	
	function generateJobNumber(): string {
		const timestamp = Date.now().toString().slice(-6)
		const random = Math.random().toString(36).substring(2, 5).toUpperCase()
		return `${timestamp}${random}`
	}
	
	// Initialize job number if not provided
	if (!jobData.job_number) {
		jobData.job_number = generateJobNumber()
	}
	
	/**
	 * Auto-save customer information to database
	 * This function will be called whenever customer fields are updated
	 */
	async function saveCustomerInfo() {
		if (!jobData.customer_id && !jobData.customers?.id) {
			console.warn('No customer ID available for saving customer info')
			return
		}
		
		try {
			saving = true
			saveError = ''
			
			const customerId = jobData.customer_id || jobData.customers?.id
			
			// Update customer information in the customers table (proper normalization)
			const { data, error } = await supabase
				.from('customers')
				.update({
					name: jobData.customers?.name || jobData.customer_name || null,
					account_number: jobData.customers?.account_number || jobData.customer_account || null,
					contact_email: jobData.customers?.contact_email || jobData.customer_email || null,
					phone: jobData.customers?.phone || jobData.customer_phone || null
				})
				.eq('id', customerId)
				.select()
			
			if (error) {
				console.error('Error saving customer info:', error)
				saveError = `Failed to save: ${error.message}`
				return
			}
			
			// Success feedback
			saveMessage = 'Customer information saved successfully!'
			setTimeout(() => {
				saveMessage = ''
			}, 3000)
			
			// Update local jobData with the updated customer information
			if (data?.[0]) {
				jobData = {
					...jobData,
					customers: data[0],
					// Keep backward compatibility fields
					customer_name: data[0].name,
					customer_account: data[0].account_number,
					customer_email: data[0].contact_email,
					customer_phone: data[0].phone
				}
			}
			
			// Dispatch event to parent component
			dispatch('customerUpdated', { jobData, customerData: data?.[0] })
			
		} catch (err) {
			console.error('Error in saveCustomerInfo:', err)
			saveError = 'An unexpected error occurred while saving'
		} finally {
			saving = false
		}
	}
	
	/**
	 * Auto-save transportation/service information to database
	 * This function will be called whenever HOW tab fields are updated
	 */
	async function saveTransportationInfo() {
		if (!jobData.jobno && !jobData.jobnumber) {
			console.warn('No job number available for saving transportation info')
			return
		}
		
		try {
			saving = true
			saveError = ''
			
			const jobIdentifier = jobData.jobno || jobData.jobnumber
			
			// Update transportation information in the jobsfile table
			const { data, error } = await supabase
				.from('jobsfile')
				.update({
					service_type: jobData.service_type || null,
					transport_mode: jobData.transport_mode || null,
					equipment_type: jobData.equipment_type || null,
					service_level: jobData.service_level || 'standard',
					special_instructions: jobData.special_instructions || null,
					updated_at: new Date().toISOString()
				})
				.eq('jobno', jobIdentifier)
				.select()
			
			if (error) {
				console.error('Error saving transportation info:', error)
				saveError = `Failed to save: ${error.message}`
				return
			}
			
			// Success feedback
			saveMessage = 'Transportation information saved successfully!'
			setTimeout(() => {
				saveMessage = ''
			}, 3000)
			
			// Dispatch event to parent component
			dispatch('transportationUpdated', { jobData: data?.[0] })
			
		} catch (err) {
			console.error('Error in saveTransportationInfo:', err)
			saveError = 'An unexpected error occurred while saving'
		} finally {
			saving = false
		}
	}

	/**
	 * Debounced save function to avoid too many database calls
	 */
	let saveTimeout: ReturnType<typeof setTimeout>
	function debouncedSave() {
		clearTimeout(saveTimeout)
		saveTimeout = setTimeout(() => {
			saveCustomerInfo()
		}, 1000) // Wait 1 second after user stops typing
	}

	/**
	 * Auto-save commodity/cargo information to database
	 * This function will be called whenever WHAT tab fields are updated
	 */
	async function saveCommodityInfo() {
		if (!jobData.jobno && !jobData.jobnumber) {
			console.warn('No job number available for saving commodity info')
			return
		}
		
		try {
			saving = true
			saveError = ''
			
			const jobIdentifier = jobData.jobno || jobData.jobnumber
			
			// Update commodity information in the jobsfile table
			const { data, error } = await supabase
				.from('jobsfile')
				.update({
					commodity: jobData.commodity || null,
					commodity_code: jobData.commodity_code || null,
					pieces: jobData.pieces ? parseInt(jobData.pieces.toString()) : null,
					weight: jobData.weight ? parseFloat(jobData.weight.toString()) : null,
					weight_unit: jobData.weight_unit || 'lbs',
					dimensions: jobData.dimensions || null,
					declared_value: jobData.declared_value ? parseFloat(jobData.declared_value.toString()) : null,
					description: jobData.description || null,
					updated_at: new Date().toISOString()
				})
				.eq('jobno', jobIdentifier)
				.select()
			
			if (error) {
				console.error('Error saving commodity info:', error)
				saveError = `Failed to save: ${error.message}`
				return
			}
			
			// Success feedback
			saveMessage = 'Commodity information saved successfully!'
			setTimeout(() => {
				saveMessage = ''
			}, 3000)
			
			// Dispatch event to parent component
			dispatch('commodityUpdated', { jobData: data?.[0] })
			
		} catch (err) {
			console.error('Error in saveCommodityInfo:', err)
			saveError = 'An unexpected error occurred while saving'
		} finally {
			saving = false
		}
	}

	/**
	 * Debounced save function for transportation info
	 */
	let transportSaveTimeout: ReturnType<typeof setTimeout>
	function debouncedTransportSave() {
		clearTimeout(transportSaveTimeout)
		transportSaveTimeout = setTimeout(() => {
			saveTransportationInfo()
		}, 1000) // Wait 1 second after user stops typing
	}

	/**
	 * Auto-save timetable information to database
	 * This function will be called whenever WHEN tab fields are updated
	 */
	async function saveTimelineInfo() {
		if (!jobData.jobno && !jobData.jobnumber) {
			console.warn('No job number available for saving timeline info')
			return
		}
		
		try {
			saving = true
			saveError = ''
			
			const jobIdentifier = jobData.jobno || jobData.jobnumber
			
			// Check if timetable record exists for this job
			const { data: existingRecord } = await supabase
				.from('timetable')
				.select('id')
				.eq('jobnumber', jobIdentifier)
				.single()
			
			// Prepare the timeline data
			const timelineData = {
				jobnumber: jobIdentifier,
				jobcreated: jobData.jobcreated ? new Date(jobData.jobcreated).toISOString() : null,
				pdriver_dispatched: jobData.pdriver_dispatched ? new Date(jobData.pdriver_dispatched).toISOString() : null,
				pdriver_arrived: jobData.pdriver_arrived ? new Date(jobData.pdriver_arrived).toISOString() : null,
				pdriver_pickup: jobData.pdriver_pickup ? new Date(jobData.pdriver_pickup).toISOString() : null,
				airport_dropoff: jobData.airport_dropoff ? new Date(jobData.airport_dropoff).toISOString() : null,
				flight_tenured: jobData.flight_tenured ? new Date(jobData.flight_tenured).toISOString() : null,
				flight_recovered: jobData.flight_recovered ? new Date(jobData.flight_recovered).toISOString() : null,
				ddriver_dispatched: jobData.ddriver_dispatched ? new Date(jobData.ddriver_dispatched).toISOString() : null,
				ddriver_recovered: jobData.ddriver_recovered ? new Date(jobData.ddriver_recovered).toISOString() : null,
				ddriver_delivery: jobData.ddriver_delivery ? new Date(jobData.ddriver_delivery).toISOString() : null,
				pod: jobData.pod ? new Date(jobData.pod).toISOString() : null,
				updated_at: new Date().toISOString()
			}
			
			let data, error
			
			if (existingRecord) {
				// Update existing record
				({ data, error } = await supabase
					.from('timetable')
					.update(timelineData)
					.eq('jobnumber', jobIdentifier)
					.select())
			} else {
				// Insert new record
				({ data, error } = await supabase
					.from('timetable')
					.insert(timelineData)
					.select())
			}
			
			if (error) {
				console.error('Error saving timeline info:', error)
				saveError = `Failed to save: ${error.message}`
				return
			}
			
			// Success feedback
			saveMessage = 'Timeline information saved successfully!'
			setTimeout(() => {
				saveMessage = ''
			}, 3000)
			
			// Dispatch event to parent component
			dispatch('timelineUpdated', { timelineData: data?.[0] })
			
		} catch (err) {
			console.error('Error in saveTimelineInfo:', err)
			saveError = 'An unexpected error occurred while saving'
		} finally {
			saving = false
		}
	}

	/**
	 * Load timetable information from database
	 */
	async function loadTimelineInfo() {
		if (!jobData.jobno && !jobData.jobnumber) {
			return
		}
		
		try {
			const jobIdentifier = jobData.jobno || jobData.jobnumber
			
			const { data, error } = await supabase
				.from('timetable')
				.select('*')
				.eq('jobnumber', jobIdentifier)
				.single()
			
			if (error && error.code !== 'PGRST116') { // PGRST116 = not found
				console.error('Error loading timeline info:', error)
				return
			}
			
			// Update jobData with timeline information if found
			if (data) {
				jobData = {
					...jobData,
					jobcreated: data.jobcreated ? new Date(data.jobcreated).toISOString().slice(0, 16) : '',
					pdriver_dispatched: data.pdriver_dispatched ? new Date(data.pdriver_dispatched).toISOString().slice(0, 16) : '',
					pdriver_arrived: data.pdriver_arrived ? new Date(data.pdriver_arrived).toISOString().slice(0, 16) : '',
					pdriver_pickup: data.pdriver_pickup ? new Date(data.pdriver_pickup).toISOString().slice(0, 16) : '',
					airport_dropoff: data.airport_dropoff ? new Date(data.airport_dropoff).toISOString().slice(0, 16) : '',
					flight_tenured: data.flight_tenured ? new Date(data.flight_tenured).toISOString().slice(0, 16) : '',
					flight_recovered: data.flight_recovered ? new Date(data.flight_recovered).toISOString().slice(0, 16) : '',
					ddriver_dispatched: data.ddriver_dispatched ? new Date(data.ddriver_dispatched).toISOString().slice(0, 16) : '',
					ddriver_recovered: data.ddriver_recovered ? new Date(data.ddriver_recovered).toISOString().slice(0, 16) : '',
					ddriver_delivery: data.ddriver_delivery ? new Date(data.ddriver_delivery).toISOString().slice(0, 16) : '',
					pod: data.pod ? new Date(data.pod).toISOString().slice(0, 16) : ''
				}
			}
			
		} catch (err) {
			console.error('Error loading timeline info:', err)
		}
	}

	/**
	 * Debounced save function for commodity info
	 */
	let commoditySaveTimeout: ReturnType<typeof setTimeout>
	function debouncedCommoditySave() {
		clearTimeout(commoditySaveTimeout)
		commoditySaveTimeout = setTimeout(() => {
			saveCommodityInfo()
		}, 1000) // Wait 1 second after user stops typing
	}

	/**
	 * Debounced save function for timeline info
	 */
	let timelineSaveTimeout: ReturnType<typeof setTimeout>
	function debouncedTimelineSave() {
		clearTimeout(timelineSaveTimeout)
		timelineSaveTimeout = setTimeout(() => {
			saveTimelineInfo()
		}, 1000) // Wait 1 second after user stops typing
	}

	// Load timeline info when component mounts or job data changes
	$: if ((jobData.jobno || jobData.jobnumber) && activeTab === 'when') {
		loadTimelineInfo()
	}

	/**
	 * Save all job data across all tabs to the database
	 * This function is called by the parent when the Save & Return button is clicked
	 */
	export async function saveAllData() {
		try {
			saving = true
			saveError = ''
			
			// Save all data sections in parallel for efficiency
			const savePromises = [
				saveCustomerInfo(),
				saveCommodityInfo(),
				saveTransportationInfo(),
				saveTimelineInfo()
			]
			
			await Promise.all(savePromises)
			
			// Success message
			saveMessage = 'All job data saved successfully!'
			setTimeout(() => {
				saveMessage = ''
			}, 2000)
			
			return true
		} catch (err) {
			console.error('Error saving all data:', err)
			saveError = 'Failed to save job data. Please try again.'
			return false
		} finally {
			saving = false
		}
	}
</script>

<div class="tab-panel">
	<!-- WHO Tab - Customer Information -->
	{#if activeTab === 'who'}
		<div class="tab-content">
			<h3 class="blue-text">--- CUSTOMER/ACCOUNT INFORMATION ---</h3>
		
		<!-- Save Status Messages -->
		<div class="save-status">
			{#if saving}
				<div class="save-indicator saving">
					<span class="spinner"></span>
					Saving customer information...
				</div>
			{:else if saveMessage}
				<div class="save-indicator success">
					✅ {saveMessage}
				</div>
			{:else if saveError}
				<div class="save-indicator error">
					❌ {saveError}
				</div>
			{/if}
		</div>
		
		<div class="form-grid">
			<div class="form-group">
				<label class="blue-text">CUSTOMER ACCOUNT:</label>
				<input 
					type="text" 
					value={jobData.customers?.account_number || jobData.customer_account || ''}
					class="form-input customer-field" 
					on:input={(e) => {
						const target = e.target as HTMLInputElement
						if (jobData.customers) {
							jobData.customers.account_number = target.value
						} else {
							jobData.customer_account = target.value
						}
						debouncedSave()
					}}
					placeholder="Enter customer account number"
				/>
			</div>
			<div class="form-group">
				<label class="blue-text">CUSTOMER NAME:</label>
				<input 
					type="text" 
					value={jobData.customers?.name || jobData.customer_name || ''}
					required 
					class="form-input customer-field" 
					on:input={(e) => {
						const target = e.target as HTMLInputElement
						if (jobData.customers) {
							jobData.customers.name = target.value
						} else {
							jobData.customer_name = target.value
						}
						debouncedSave()
					}}
					placeholder="Enter customer company name"
				/>
			</div>
			<div class="form-group">
				<label class="blue-text">CONTACT PERSON:</label>
				<input 
					type="text" 
					bind:value={jobData.customer_contact} 
					class="form-input customer-field" 
					on:input={debouncedSave}
					placeholder="Enter contact person name (job-specific)"
				/>
			</div>
			<div class="form-group">
				<label class="blue-text">PHONE NUMBER:</label>
				<input 
					type="tel" 
					value={jobData.customers?.phone || jobData.customer_phone || ''}
					class="form-input customer-field" 
					on:input={(e) => {
						const target = e.target as HTMLInputElement
						if (jobData.customers) {
							jobData.customers.phone = target.value
						} else {
							jobData.customer_phone = target.value
						}
						debouncedSave()
					}}
					placeholder="Enter phone number"
				/>
			</div>
			<div class="form-group">
				<label class="blue-text">EMAIL ADDRESS:</label>
				<input 
					type="email" 
					value={jobData.customers?.contact_email || jobData.customer_email || ''}
					class="form-input customer-field" 
					on:input={(e) => {
						const target = e.target as HTMLInputElement
						if (jobData.customers) {
							jobData.customers.contact_email = target.value
						} else {
							jobData.customer_email = target.value
						}
						debouncedSave()
					}}
					placeholder="Enter email address"
				/>
			</div>
		</div>
		

		</div>
	{/if}

	<!-- WHAT Tab - Commodity Information -->
	{#if activeTab === 'what'}
		<div class="tab-content">
			<h3 class="blue-text">--- COMMODITY/CARGO INFORMATION ---</h3>
		
		<!-- Save Status Messages -->
		<div class="save-status">
			{#if saving}
				<div class="save-indicator saving">
					<span class="spinner"></span>
					Saving commodity information...
				</div>
			{:else if saveMessage}
				<div class="save-indicator success">
					✅ {saveMessage}
				</div>
			{:else if saveError}
				<div class="save-indicator error">
					❌ {saveError}
				</div>
			{/if}
		</div>
		
		<div class="form-grid">
			<div class="form-group">
				<label class="blue-text">COMMODITY:</label>
				<input 
					type="text" 
					bind:value={jobData.commodity} 
					required 
					class="form-input commodity-field" 
					on:input={debouncedCommoditySave}
					placeholder="Enter commodity type"
				/>
			</div>
			<div class="form-group">
				<label class="blue-text">COMMODITY CODE:</label>
				<input 
					type="text" 
					bind:value={jobData.commodity_code} 
					class="form-input commodity-field" 
					on:input={debouncedCommoditySave}
					placeholder="Enter commodity code"
				/>
			</div>
			<div class="form-group">
				<label class="blue-text">PIECES (PCS):</label>
				<input 
					type="number" 
					bind:value={jobData.pieces} 
					required 
					class="form-input commodity-field" 
					on:input={debouncedCommoditySave}
					placeholder="Number of pieces"
					min="1"
				/>
			</div>
			<div class="form-group">
				<label class="blue-text">WEIGHT:</label>
				<div class="input-group">
					<input 
						type="number" 
						bind:value={jobData.weight} 
						required 
						class="form-input commodity-field" 
						on:input={debouncedCommoditySave}
						placeholder="Weight"
						min="0"
						step="0.01"
					/>
					<select 
						bind:value={jobData.weight_unit} 
						class="form-input weight-unit commodity-field"
						on:change={debouncedCommoditySave}
					>
						<option value="lbs">LBS</option>
						<option value="kg">KG</option>
					</select>
				</div>
			</div>
			<div class="form-group">
				<label class="blue-text">DIMENSIONS:</label>
				<input 
					type="text" 
					bind:value={jobData.dimensions} 
					placeholder="L x W x H (inches)" 
					class="form-input commodity-field" 
					on:input={debouncedCommoditySave}
				/>
			</div>
			<div class="form-group">
				<label class="blue-text">DECLARED VALUE:</label>
				<input 
					type="number" 
					bind:value={jobData.declared_value} 
					class="form-input commodity-field" 
					on:input={debouncedCommoditySave}
					placeholder="Declared value ($)"
					min="0"
					step="0.01"
				/>
			</div>
			<div class="form-group full-width">
				<label class="blue-text">DESCRIPTION:</label>
				<textarea 
					bind:value={jobData.description} 
					class="form-input form-textarea commodity-field" 
					rows="3"
					on:input={debouncedCommoditySave}
					placeholder="Detailed description of the commodity..."
				></textarea>
			</div>
		</div>
		

		</div>
	{/if}

	<!-- WHERE Tab - Shipper/Consignee Information -->
	{#if activeTab === 'where'}
		<div class="tab-content">
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
		</div>
	{/if}

	<!-- HOW Tab - Service Type -->
	{#if activeTab === 'how'}
		<div class="tab-content">
			<h3 class="blue-text">--- SERVICE TYPE/TRANSPORTATION ---</h3>
		
		<!-- Save Status Messages -->
		<div class="save-status">
			{#if saving}
				<div class="save-indicator saving">
					<span class="spinner"></span>
					Saving transportation information...
				</div>
			{:else if saveMessage}
				<div class="save-indicator success">
					✅ {saveMessage}
				</div>
			{:else if saveError}
				<div class="save-indicator error">
					❌ {saveError}
				</div>
			{/if}
		</div>
		
		<div class="form-grid">
			<div class="form-group">
				<label class="blue-text">SERVICE TYPE:</label>
				<select 
					bind:value={jobData.service_type} 
					required 
					class="form-input transport-field"
					on:change={debouncedTransportSave}
				>
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
				<select 
					bind:value={jobData.transport_mode} 
					class="form-input transport-field"
					on:change={debouncedTransportSave}
				>
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
				<select 
					bind:value={jobData.equipment_type} 
					class="form-input transport-field"
					on:change={debouncedTransportSave}
				>
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
				<select 
					bind:value={jobData.service_level} 
					class="form-input transport-field"
					on:change={debouncedTransportSave}
				>
					<option value="standard">Standard</option>
					<option value="expedited">Expedited</option>
					<option value="priority">Priority</option>
					<option value="critical">Critical</option>
				</select>
			</div>
			<div class="form-group full-width">
				<label class="blue-text">SPECIAL INSTRUCTIONS:</label>
				<textarea 
					bind:value={jobData.special_instructions} 
					class="form-input form-textarea transport-field" 
					rows="3"
					on:input={debouncedTransportSave}
					placeholder="Enter any special handling instructions or requirements..."
				></textarea>
			</div>
		</div>
		

		</div>
	{/if}

	<!-- WHEN Tab - Timeline/Scheduling -->
	{#if activeTab === 'when'}
		<div class="tab-content">
			<h3 class="blue-text">--- TIMELINE INFORMATION ---</h3>
		
		<!-- Save Status Messages -->
		<div class="save-status">
			{#if saving}
				<div class="save-indicator saving">
					<span class="spinner"></span>
					Saving timeline information...
				</div>
			{:else if saveMessage}
				<div class="save-indicator success">
					✅ {saveMessage}
				</div>
			{:else if saveError}
				<div class="save-indicator error">
					❌ {saveError}
				</div>
			{/if}
		</div>
		
		<div class="timeline-grid">
			<!-- Basic Scheduling -->
			<div class="timeline-section">
				<h4 class="section-title">Basic Scheduling</h4>
				<div class="form-group">
					<label class="blue-text">READY DATE:</label>
					<input 
						type="date" 
						bind:value={jobData.ready_date} 
						class="form-input timeline-field"
						on:change={debouncedTimelineSave}
					/>
				</div>
				<div class="form-group">
					<label class="blue-text">READY TIME:</label>
					<input 
						type="time" 
						bind:value={jobData.ready_time} 
						class="form-input timeline-field"
						on:change={debouncedTimelineSave}
					/>
				</div>
				<div class="form-group">
					<label class="blue-text">JOB CREATED:</label>
					<input 
						type="datetime-local" 
						bind:value={jobData.jobcreated} 
						class="form-input timeline-field"
						on:change={debouncedTimelineSave}
					/>
				</div>
			</div>

			<!-- Pickup Process -->
			<div class="timeline-section">
				<h4 class="section-title">Pickup Process</h4>
				<div class="form-group">
					<label class="blue-text">PICKUP DRIVER DISPATCHED:</label>
					<input 
						type="datetime-local" 
						bind:value={jobData.pdriver_dispatched} 
						class="form-input timeline-field"
						on:change={debouncedTimelineSave}
					/>
				</div>
				<div class="form-group">
					<label class="blue-text">PICKUP DRIVER ARRIVED:</label>
					<input 
						type="datetime-local" 
						bind:value={jobData.pdriver_arrived} 
						class="form-input timeline-field"
						on:change={debouncedTimelineSave}
					/>
				</div>
				<div class="form-group">
					<label class="blue-text">PICKUP COMPLETED:</label>
					<input 
						type="datetime-local" 
						bind:value={jobData.pdriver_pickup} 
						class="form-input timeline-field"
						on:change={debouncedTimelineSave}
					/>
				</div>
			</div>

			<!-- Airport/Flight Process -->
			<div class="timeline-section">
				<h4 class="section-title">Airport & Flight</h4>
				<div class="form-group">
					<label class="blue-text">AIRPORT DROPOFF:</label>
					<input 
						type="datetime-local" 
						bind:value={jobData.airport_dropoff} 
						class="form-input timeline-field"
						on:change={debouncedTimelineSave}
					/>
				</div>
				<div class="form-group">
					<label class="blue-text">FLIGHT DEPARTURE:</label>
					<input 
						type="datetime-local" 
						bind:value={jobData.flight_tenured} 
						class="form-input timeline-field"
						on:change={debouncedTimelineSave}
					/>
				</div>
				<div class="form-group">
					<label class="blue-text">FLIGHT ARRIVAL:</label>
					<input 
						type="datetime-local" 
						bind:value={jobData.flight_recovered} 
						class="form-input timeline-field"
						on:change={debouncedTimelineSave}
					/>
				</div>
			</div>

			<!-- Delivery Process -->
			<div class="timeline-section">
				<h4 class="section-title">Delivery Process</h4>
				<div class="form-group">
					<label class="blue-text">DELIVERY DRIVER DISPATCHED:</label>
					<input 
						type="datetime-local" 
						bind:value={jobData.ddriver_dispatched} 
						class="form-input timeline-field"
						on:change={debouncedTimelineSave}
					/>
				</div>
				<div class="form-group">
					<label class="blue-text">DELIVERY DRIVER RECOVERED:</label>
					<input 
						type="datetime-local" 
						bind:value={jobData.ddriver_recovered} 
						class="form-input timeline-field"
						on:change={debouncedTimelineSave}
					/>
				</div>
				<div class="form-group">
					<label class="blue-text">DELIVERY COMPLETED:</label>
					<input 
						type="datetime-local" 
						bind:value={jobData.ddriver_delivery} 
						class="form-input timeline-field"
						on:change={debouncedTimelineSave}
					/>
				</div>
				<div class="form-group">
					<label class="blue-text">PROOF OF DELIVERY:</label>
					<input 
						type="datetime-local" 
						bind:value={jobData.pod} 
						class="form-input timeline-field"
						on:change={debouncedTimelineSave}
					/>
				</div>
			</div>
		</div>
		

		</div>
	{/if}
</div>

<style>
	.tab-panel {
		height: 100%;
		min-height: 400px;
		display: flex;
		flex-direction: column;
		background: transparent;
		position: relative;
		z-index: 2;
		overflow: hidden;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		padding: 2rem;
	}

	/* Tab Content Wrapper */
	.tab-content {
		flex: 1;
		overflow-y: auto;
	}

	.tab-panel h3 {
		margin: 0 0 2rem 0;
		text-align: center;
		flex-shrink: 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: #1f2937;
		text-transform: uppercase;
		letter-spacing: 1px;
		position: relative;
		padding-bottom: 1rem;
	}

	.tab-panel h3::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 60px;
		height: 3px;
		background: linear-gradient(135deg, #ea580c, #dc2626);
		border-radius: 2px;
	}

	.red-text {
		color: #dc2626;
		font-weight: 700;
	}

	.blue-text {
		color: #1d4ed8;
		font-weight: 600;
	}

	/* Form Grid Layouts */
	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		flex: 1;
		background-color: transparent;
		position: relative;
		z-index: 1;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.form-group.full-width {
		grid-column: 1 / -1;
	}

	.form-group label {
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.form-input {
		padding: 1rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-size: 0.95rem;
		border: 2px solid #e5e7eb;
		background: white;
		border-radius: 12px;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.form-textarea {
		resize: vertical;
		min-height: 120px;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		line-height: 1.6;
	}

	.form-input:focus {
		outline: none;
		border-color: #ea580c;
		background-color: #fffbf7;
		box-shadow: 0 0 0 4px rgba(234, 88, 12, 0.1), 0 4px 12px rgba(0, 0, 0, 0.15);
		transform: translateY(-1px);
	}

	.form-input:hover:not(:focus) {
		border-color: #d1d5db;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}
	
	/* Customer field specific styling */
	.customer-field {
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}
	
	.customer-field:hover {
		border-color: #ea580c;
		box-shadow: 0 2px 8px rgba(234, 88, 12, 0.1);
	}
	
	.customer-field:focus {
		box-shadow: 0 0 0 4px rgba(234, 88, 12, 0.15), 0 4px 16px rgba(234, 88, 12, 0.2);
		border-color: #ea580c;
	}
	
	/* Transportation field specific styling */
	.transport-field {
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}
	
	.transport-field:hover {
		border-color: #ea580c;
		box-shadow: 0 2px 8px rgba(234, 88, 12, 0.1);
	}
	
	.transport-field:focus {
		box-shadow: 0 0 0 4px rgba(234, 88, 12, 0.15), 0 4px 16px rgba(234, 88, 12, 0.2);
		border-color: #ea580c;
	}
	
	/* Commodity field specific styling */
	.commodity-field {
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}
	
	.commodity-field:hover {
		border-color: #ea580c;
		box-shadow: 0 2px 8px rgba(234, 88, 12, 0.1);
	}
	
	.commodity-field:focus {
		box-shadow: 0 0 0 4px rgba(234, 88, 12, 0.15), 0 4px 16px rgba(234, 88, 12, 0.2);
		border-color: #ea580c;
	}
	
	/* Timeline field specific styling */
	.timeline-field {
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}
	
	.timeline-field:hover {
		border-color: #ea580c;
		box-shadow: 0 2px 8px rgba(234, 88, 12, 0.1);
	}
	
	.timeline-field:focus {
		box-shadow: 0 0 0 4px rgba(234, 88, 12, 0.15), 0 4px 16px rgba(234, 88, 12, 0.2);
		border-color: #ea580c;
	}

	/* Timeline Grid Layout */
	.timeline-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		margin-bottom: 2rem;
	}

	.timeline-section {
		background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
		border: 2px solid #e5e7eb;
		border-radius: 16px;
		padding: 1.5rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
		transition: all 0.3s ease;
	}

	.timeline-section:hover {
		border-color: #ea580c;
		box-shadow: 0 8px 25px rgba(234, 88, 12, 0.1);
		transform: translateY(-1px);
	}

	.section-title {
		font-size: 1.1rem;
		font-weight: 700;
		color: #1f2937;
		margin: 0 0 1.5rem 0;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		border-bottom: 2px solid #ea580c;
		padding-bottom: 0.5rem;
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
		gap: 1.5rem;
		height: 100%;
		background-color: transparent;
		position: relative;
		z-index: 1;
		contain: layout style;
	}

	.row-box {
		display: flex;
		gap: 1.5rem;
		padding: 1.5rem;
		border: 2px solid #e5e7eb;
		background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
		align-items: end;
		flex-shrink: 0;
		border-radius: 16px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
		transition: all 0.3s ease;
	}

	.row-box:hover {
		border-color: #ea580c;
		box-shadow: 0 8px 25px rgba(234, 88, 12, 0.1);
		transform: translateY(-1px);
	}

	.field-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.field-group label {
		font-size: 0.75rem;
		color: #1d4ed8;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.field-input {
		padding: 0.75rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-size: 0.875rem;
		border: 2px solid #e5e7eb;
		background-color: white;
		border-radius: 8px;
		height: auto;
		min-height: 20px;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.field-input:focus {
		outline: none;
		border-color: #ea580c;
		background-color: #fffbf7;
		box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.1), 0 4px 12px rgba(0, 0, 0, 0.1);
		transform: translateY(-1px);
	}

	.field-input:hover:not(:focus) {
		border-color: #d1d5db;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
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
		gap: 2rem;
		flex: 1;
	}

	.location-column {
		flex: 1;
		border: 2px solid #e5e7eb;
		background: white;
		display: flex;
		flex-direction: column;
		position: relative;
		z-index: 1;
		contain: layout style;
		overflow: hidden;
		border-radius: 16px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
		transition: all 0.3s ease;
	}

	.location-column:hover {
		border-color: #ea580c;
		box-shadow: 0 8px 25px rgba(234, 88, 12, 0.1);
		transform: translateY(-2px);
	}

	.location-header {
		background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
		padding: 1rem 1.5rem;
		border-bottom: 2px solid #e5e7eb;
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-shrink: 0;
	}

	.location-header .red-text {
		font-size: 1rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.date-time {
		font-size: 0.75rem;
		color: #dc2626;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-weight: 600;
		background: rgba(220, 38, 38, 0.1);
		padding: 0.25rem 0.5rem;
		border-radius: 6px;
	}

	.location-content {
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		flex: 1;
		background: linear-gradient(135deg, #ffffff 0%, #fefefe 100%);
	}

	.location-input {
		padding: 0.75rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-size: 0.875rem;
		border: 2px solid #e5e7eb;
		background-color: white;
		border-radius: 8px;
		height: auto;
		min-height: 18px;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.location-input:focus {
		outline: none;
		border-color: #ea580c;
		background-color: #fffbf7;
		box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.1), 0 4px 12px rgba(0, 0, 0, 0.1);
		transform: translateY(-1px);
	}

	.location-input:hover:not(:focus) {
		border-color: #d1d5db;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
	}

	.city-state-zip {
		display: flex;
		gap: 1rem;
	}

	.city-input {
		flex: 2;
		padding: 0.75rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-size: 0.875rem;
		border: 2px solid #e5e7eb;
		background-color: white;
		border-radius: 8px;
		height: auto;
		min-height: 18px;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.city-input:focus {
		outline: none;
		border-color: #ea580c;
		background-color: #fffbf7;
		box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.1), 0 4px 12px rgba(0, 0, 0, 0.1);
		transform: translateY(-1px);
	}

	.state-input {
		width: 80px;
		padding: 0.75rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-size: 0.875rem;
		border: 2px solid #e5e7eb;
		background-color: white;
		border-radius: 8px;
		height: auto;
		min-height: 18px;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		text-align: center;
	}

	.state-input:focus {
		outline: none;
		border-color: #ea580c;
		background-color: #fffbf7;
		box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.1), 0 4px 12px rgba(0, 0, 0, 0.1);
		transform: translateY(-1px);
	}

	.zip-input {
		width: 120px;
		padding: 0.75rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-size: 0.875rem;
		border: 2px solid #e5e7eb;
		background-color: white;
		border-radius: 8px;
		height: auto;
		min-height: 18px;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.zip-input:focus {
		outline: none;
		border-color: #ea580c;
		background-color: #fffbf7;
		box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.1), 0 4px 12px rgba(0, 0, 0, 0.1);
		transform: translateY(-1px);
	}

	/* Save Status Styling */
	.save-status {
		margin-bottom: 1rem;
		min-height: 30px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.save-indicator {
		padding: 0.5rem 1rem;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		animation: slideIn 0.3s ease-out;
	}
	
	.save-indicator.saving {
		background-color: #e0f2fe;
		color: #0277bd;
		border: 1px solid #4fc3f7;
	}
	
	.save-indicator.success {
		background-color: #e8f5e8;
		color: #2e7d32;
		border: 1px solid #4caf50;
	}
	
	.save-indicator.error {
		background-color: #ffebee;
		color: #c62828;
		border: 1px solid #f44336;
	}
	
	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid #e3f2fd;
		border-top: 2px solid #0277bd;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
	
	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	


	/* Responsive Design */
	@media (max-width: 768px) {
		.tab-panel {
			min-height: 350px;
		}
		
		.tab-panel h3 {
			font-size: 1.25rem;
			margin-bottom: 1.5rem;
		}
		
		.form-grid {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}
		
		.form-input, .customer-field {
			padding: 0.875rem;
			font-size: 0.9rem;
		}
		
		.where-layout {
			gap: 1rem;
		}
		
		.row-box {
			flex-direction: column;
			gap: 1rem;
			padding: 1rem;
		}
		
		.shipper-consignee-row {
			flex-direction: column;
			gap: 1rem;
		}
		
		.location-header {
			padding: 0.75rem 1rem;
		}
		
		.location-header .red-text {
			font-size: 0.875rem;
		}
		
		.location-content {
			padding: 1rem;
			gap: 0.75rem;
		}
		
		.field-input, .location-input {
			font-size: 0.8rem;
			padding: 0.625rem;
		}
		
		.city-state-zip {
			gap: 0.5rem;
		}
		
		.state-input {
			width: 60px;
		}
		
		.zip-input {
			width: 100px;
		}
		

		
		.commodity-field {
			width: 100%;
		}
		
		.service-field {
			width: 100%;
		}
		
		.small-field {
			width: 100%;
		}
		
		.timeline-grid {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}
		
		.timeline-section {
			padding: 1rem;
		}
		
		.section-title {
			font-size: 1rem;
		}
		
		.timeline-field {
			font-size: 0.9rem;
			padding: 0.875rem;
		}

		.tab-panel {
			padding: 1rem;
		}
	}
</style> 