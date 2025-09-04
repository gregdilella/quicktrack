<!-- Create New Job Component -->
<script lang="ts">
	import { supabase } from '$lib/supabase'
	import { goto } from '$app/navigation'
	import { getCurrentUser, requireAuth } from '$lib/auth'
	import { jobSchema, type JobFormData, validateForm } from '$lib/validation/schemas'
	import { computeNetjetsQuote, buildNetjetsInputFromJobForm, saveQuoteToDatabase } from '$lib/Quoting/netjets'
	import { createAWBFromFlightData, type FlightData, type JobDataForAWB } from '$lib/services/awbService'
	
	let loading = false
	let message = ''
	let success = false
	let validationErrors: Record<string, string> = {}

	// Quote preview state
	let quotePreview: ReturnType<typeof computeNetjetsQuote> | null = null
	
	// Props for flight data (can be passed from parent components)
	export let selectedFlightData: FlightData | null = null
	export let originAirport: string = ''
	export let destinationAirport: string = ''
	
	// Helper function to get today's date in YYYY-MM-DD format
	function getTodaysDate(): string {
		const today = new Date()
		return today.toISOString().split('T')[0]
	}
	
	// Helper function to get current time in HH:MM format
	function getCurrentTime(): string {
		const now = new Date()
		return now.toTimeString().slice(0, 5)
	}

	// Helper function to generate jobno from job_number and job_type
	function generateJobno(jobNumber: string, jobType: string): string {
		if (!jobNumber) return ''
		
		const typeCode = jobType === 'call' ? 'C' : 'M' // Email and Web both use 'M'
		return jobNumber + typeCode
	}

	// Job data structure
	let jobData = {
		jobnumber: '',
		jobno: '',
		bol_number: '',
		po_number: '',
		commodity: '',
		pieces: '1',
		weight: '1',
		service_type: 'NFO',
		job_type: 'call',
		
		// Shipper information
		shipper_name: '',
		shipper_address1: '',
		shipper_address2: '',
		shipper_city: '',
		shipper_state: '',
		shipper_zip: '',
		shipper_phone: '',
		shipper_contact: '',
		
		// Consignee information
		consignee_name: '',
		consignee_address1: '',
		consignee_address2: '',
		consignee_city: '',
		consignee_state: '',
		consignee_zip: '',
		consignee_phone: '',
		consignee_contact: '',
		
		// New fields with defaults
		ready_date: getTodaysDate(),
		ready_time: getCurrentTime()
	}
	
	// Generate sequential job number starting with 3 and 7 digits total
	async function generateJobNumber(): Promise<string> {
		try {
			// Create an authenticated Supabase client
			const { data: { session } } = await supabase.auth.getSession()
			if (!session) {
				console.warn('No session found, using default job number')
				return '3000001'
			}
			
					// Get the highest existing job number
		const { data, error } = await supabase
			.from('jobsfile')
			.select('jobnumber')
			.like('jobnumber', '3%')
			.order('jobnumber', { ascending: false })
			.limit(1)
			
			if (error) {
				console.error('Error fetching job numbers:', error)
				return '3000001' // Default starting number
			}
			
			let nextNumber = 3000001 // Starting number
			
					if (data && data.length > 0) {
			const lastJobNumber = data[0].jobnumber
			const lastNumber = parseInt(lastJobNumber)
			if (!isNaN(lastNumber)) {
				nextNumber = lastNumber + 1
			}
		}
			
			return nextNumber.toString().padStart(7, '0')
		} catch (error) {
			console.error('Error generating job number:', error)
			return '3000001'
		}
	}
	
	// Fallback job number generation (if database is not accessible)
	function generateFallbackJobNumber(): string {
		// Use timestamp to create a unique job number
		const timestamp = Date.now().toString()
		const lastSix = timestamp.slice(-6)
		return '3' + lastSix.padStart(6, '0')
	}
	
	// Reactive statement to update jobno whenever jobnumber or job_type changes
	$: jobData.jobno = generateJobno(jobData.jobnumber, jobData.job_type)

	// Reactive: compute quote preview as the user fills the form (Netjets only for now)
	$: {
		try {
			const input = buildNetjetsInputFromJobForm(jobData)
			quotePreview = computeNetjetsQuote(input)
		} catch (e) {
			quotePreview = null
		}
	}
	
	// Helper function to clean up job data for database insertion
	function cleanJobDataForDB(data: JobFormData) {
		const cleaned = { ...data }
		
		// Convert empty strings to null for optional database fields
		Object.keys(cleaned).forEach(key => {
			if (cleaned[key as keyof JobFormData] === '') {
				(cleaned as any)[key] = null
			}
		})
		
		return cleaned
	}
	
	// Create new job
	async function createNewJob() {
		loading = true
		message = ''
		success = false
		
		try {
			// Check authentication first
			const isAuth = await requireAuth()
			if (!isAuth) {
				message = 'Authentication error. Please log in again.'
				loading = false
				return
			}
			
			const currentUser = await getCurrentUser()
			console.log('Current user:', currentUser?.email)
			
			// Generate job number only when creating the job
			try {
				jobData.jobnumber = await generateJobNumber()
				console.log('Generated job number:', jobData.jobnumber)
			} catch (error) {
				console.warn('Failed to generate job number from database, using fallback')
				jobData.jobnumber = generateFallbackJobNumber()
				console.log('Fallback job number:', jobData.jobnumber)
			}
			
			// Validate form data using Zod
			const validation = validateForm(jobSchema, jobData)
			if (!validation.success) {
				validationErrors = validation.errors || {}
				message = 'Please fix the validation errors below'
				loading = false
				return
			}
			
			// Clear any previous validation errors
			validationErrors = {}
			
			// Get current user for created_by field
			const { data: { user } } = await supabase.auth.getUser()
			console.log('Supabase user:', user?.email || 'No user')
			
			// Check if we have a valid session
			const { data: { session } } = await supabase.auth.getSession()
			if (!session) {
				message = 'Authentication session expired. Please log in again.'
				loading = false
				goto('/')
				return
			}
			
			// Clean the validated data for database insertion
			const cleanedData = cleanJobDataForDB(validation.data!)
			
			// Debug: Log the data being inserted
			console.log('Data being inserted:', {
				jobnumber: cleanedData.jobnumber,
				jobno: cleanedData.jobno,
				commodity: cleanedData.commodity,
				shipper_name: cleanedData.shipper_name,
				consignee_name: cleanedData.consignee_name
			})
			
					// Insert job into database
		const { data, error } = await supabase
			.from('jobsfile')
			.insert([{
					jobnumber: cleanedData.jobnumber,  // Primary field for database relationships
					jobno: cleanedData.jobno,
					bol_number: cleanedData.bol_number,
					po_number: cleanedData.po_number,
					commodity: cleanedData.commodity,
					pieces: cleanedData.pieces,
					weight: cleanedData.weight,
					service_type: cleanedData.service_type,
					job_type: cleanedData.job_type,
					
					shipper_name: cleanedData.shipper_name,
					shipper_address1: cleanedData.shipper_address1,
					shipper_address2: cleanedData.shipper_address2,
					shipper_city: cleanedData.shipper_city,
					shipper_state: cleanedData.shipper_state,
					shipper_zip: cleanedData.shipper_zip,
					shipper_phone: cleanedData.shipper_phone,
					shipper_contact: cleanedData.shipper_contact,
					
					consignee_name: cleanedData.consignee_name,
					consignee_address1: cleanedData.consignee_address1,
					consignee_address2: cleanedData.consignee_address2,
					consignee_city: cleanedData.consignee_city,
					consignee_state: cleanedData.consignee_state,
					consignee_zip: cleanedData.consignee_zip,
					consignee_phone: cleanedData.consignee_phone,
					consignee_contact: cleanedData.consignee_contact,
					
					ready_date: cleanedData.ready_date,
					ready_time: cleanedData.ready_time,
					
					status: 'dispatch',
					created_by: user?.id || null,
					created_at: new Date().toISOString()
				}])
			
			if (error) {
				console.error('Error creating job:', error)
				console.error('Error details:', {
					message: error.message,
					details: error.details,
					hint: error.hint,
					code: error.code
				})
				
				// More helpful error messages
				if (error.message.includes('permission denied')) {
					message = 'Database permission error. The jobsfile table may not be set up correctly. Please contact your administrator.'
				} else if (error.message.includes('duplicate key')) {
					message = 'Job number already exists. Please try again.'
				} else if (error.message.includes('relation "jobsfile" does not exist')) {
					message = 'Jobsfile table does not exist. Please run the database setup script first.'
				} else if (error.message.includes('null value in column')) {
					message = 'Database constraint error: ' + error.message + '. Check that all required fields are filled.'
				} else {
					message = 'Error creating job: ' + error.message
				}
				
				loading = false
				return
			}
			
			console.log('✅ Job created successfully, now creating AWB...')
			
			// Create AWB automatically if we have flight data
			try {
				const jobDataForAWB: JobDataForAWB = {
					jobno: jobData.jobno,
					jobnumber: jobData.jobnumber, // Keep for backward compatibility
					pieces: parseInt(jobData.pieces.toString()),
					weight: parseFloat(jobData.weight.toString()),
					weight_unit: 'lbs', // Default for CreateNewJob component
					created_by: user?.id || undefined
				}

				const awbResult = await createAWBFromFlightData(
					jobDataForAWB,
					selectedFlightData,
					originAirport,
					destinationAirport
				)

				if (awbResult.success) {
					console.log('✅ AWB created successfully:', awbResult.awbNumber)
					message = `Job ${jobData.jobno || jobData.jobnumber} created successfully! AWB: ${awbResult.awbNumber}`
				} else {
					console.warn('⚠️ Job created but AWB creation failed:', awbResult.error)
					message = `Job ${jobData.jobno || jobData.jobnumber} created successfully! (AWB creation failed: ${awbResult.error})`
				}
			} catch (awbError) {
				console.error('Error creating AWB:', awbError)
				message = `Job ${jobData.jobno || jobData.jobnumber} created successfully! (AWB creation failed)`
			}
			
			// Save quote to database if we have one
			try {
				if (quotePreview && jobData.jobnumber) {
					console.log('💰 Saving quote to database...')
					const quoteResult = await saveQuoteToDatabase(supabase, jobData.jobnumber, quotePreview)
					if (quoteResult.success) {
						console.log('✅ Quote saved successfully')
					} else {
						console.warn('⚠️ Quote saving failed:', quoteResult.error)
					}
				}
			} catch (quoteError) {
				console.error('Error saving quote:', quoteError)
			}
			
			success = true
			
			// Navigate to the job detail page after a brief delay
			setTimeout(() => {
				goto(`/dashboard/operations/jobs/${jobData.jobno}`)
			}, 1500)
			
		} catch (error) {
			console.error('Error creating job:', error)
			message = 'An unexpected error occurred'
		} finally {
			loading = false
		}
	}
</script>

<div class="create-job-container">
	<div class="where-layout">
		<!-- Row 1: Job Info (Job, BOL, PO#) -->
		<div class="row-box">
			<div class="field-group">
				<label for="job-number" class="blue-text">Job</label>
				<input id="job-number" type="text" value={jobData.jobnumber || 'Will be generated on submission'} class="field-input job-number-display" readonly />
			</div>
			<div class="field-group">
				<label for="bol-number" class="blue-text">BOL</label>
				<input id="bol-number" type="text" bind:value={jobData.bol_number} class="field-input" />
			</div>
			<div class="field-group">
				<label for="po-number" class="blue-text">PO#</label>
				<input id="po-number" type="text" bind:value={jobData.po_number} class="field-input" />
			</div>
		</div>

		<!-- Row 2: Commodity Info (Commodity, #Pcs, Weight, Type of Service, Job Type) -->
		<div class="row-box">
			<div class="field-group">
				<label for="commodity" class="blue-text">Commodity *</label>
				<input id="commodity" type="text" bind:value={jobData.commodity} class="field-input commodity-field" class:error={validationErrors.commodity} required />
				{#if validationErrors.commodity}
					<span class="error-text">{validationErrors.commodity}</span>
				{/if}
			</div>
			<div class="field-group">
				<label for="pieces" class="blue-text">#Pcs</label>
				<input id="pieces" type="number" bind:value={jobData.pieces} class="field-input small-field" class:error={validationErrors.pieces} />
				{#if validationErrors.pieces}
					<span class="error-text">{validationErrors.pieces}</span>
				{/if}
			</div>
			<div class="field-group">
				<label for="weight" class="blue-text">Weight</label>
				<input id="weight" type="number" bind:value={jobData.weight} class="field-input small-field" class:error={validationErrors.weight} />
				{#if validationErrors.weight}
					<span class="error-text">{validationErrors.weight}</span>
				{/if}
			</div>
			<div class="field-group">
				<label for="service-type" class="blue-text">Type of Service</label>
				<select id="service-type" bind:value={jobData.service_type} class="field-input service-field">
					<option value="NFO">NFO</option>
					<option value="NDO">NDO</option>
					<option value="OBC">OBC</option>
					<option value="CHAR">Charter</option>
				</select>
			</div>
			<div class="field-group">
				<label for="job-type" class="blue-text">Job Type</label>
				<select id="job-type" bind:value={jobData.job_type} class="field-input service-field">
					<option value="call">Call</option>
					<option value="email">Email</option>
					<option value="web">Web</option>
					<option value="placement">Placement</option>
					<option value="return">Return</option>
				</select>
			</div>
		</div>

		<!-- Row 3: Ready Date and Time -->
		<div class="row-box">
			<div class="field-group">
				<label for="ready-date" class="blue-text">Ready Date</label>
				<input id="ready-date" type="date" bind:value={jobData.ready_date} class="field-input" class:error={validationErrors.ready_date} />
				{#if validationErrors.ready_date}
					<span class="error-text">{validationErrors.ready_date}</span>
				{/if}
			</div>
			<div class="field-group">
				<label for="ready-time" class="blue-text">Ready Time</label>
				<input id="ready-time" type="time" bind:value={jobData.ready_time} class="field-input" class:error={validationErrors.ready_time} />
				{#if validationErrors.ready_time}
					<span class="error-text">{validationErrors.ready_time}</span>
				{/if}
			</div>
		</div>

		<!-- Row 4: Shipper/Consignee (Two Columns) -->
		<div class="shipper-consignee-row">
			<!-- Shipper Column -->
			<div class="location-column">
				<div class="location-header">
					<span class="red-text">Shipper</span>
					<span class="date-time">{new Date().toLocaleDateString('en-US', { year: '2-digit', month: '2-digit', day: '2-digit' })} {new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}</span>
				</div>
				<div class="location-content">
					<input type="text" bind:value={jobData.shipper_name} placeholder="Company Name *" class="location-input" class:error={validationErrors.shipper_name} required />
					{#if validationErrors.shipper_name}
						<span class="error-text">{validationErrors.shipper_name}</span>
					{/if}
					<input type="text" bind:value={jobData.shipper_address1} placeholder="Address 1" class="location-input" class:error={validationErrors.shipper_address1} />
					{#if validationErrors.shipper_address1}
						<span class="error-text">{validationErrors.shipper_address1}</span>
					{/if}
					<input type="text" bind:value={jobData.shipper_address2} placeholder="Address 2" class="location-input" class:error={validationErrors.shipper_address2} />
					{#if validationErrors.shipper_address2}
						<span class="error-text">{validationErrors.shipper_address2}</span>
					{/if}
					<div class="city-state-zip">
						<input type="text" bind:value={jobData.shipper_city} placeholder="City" class="city-input" class:error={validationErrors.shipper_city} />
						<input type="text" bind:value={jobData.shipper_state} placeholder="ST" class="state-input" class:error={validationErrors.shipper_state} />
						<input type="text" bind:value={jobData.shipper_zip} placeholder="ZIP" class="zip-input" class:error={validationErrors.shipper_zip} />
					</div>
					{#if validationErrors.shipper_city}
						<span class="error-text">{validationErrors.shipper_city}</span>
					{/if}
					{#if validationErrors.shipper_state}
						<span class="error-text">{validationErrors.shipper_state}</span>
					{/if}
					{#if validationErrors.shipper_zip}
						<span class="error-text">{validationErrors.shipper_zip}</span>
					{/if}
					<input type="tel" bind:value={jobData.shipper_phone} placeholder="Phone" class="location-input" class:error={validationErrors.shipper_phone} />
					{#if validationErrors.shipper_phone}
						<span class="error-text">{validationErrors.shipper_phone}</span>
					{/if}
					<input type="text" bind:value={jobData.shipper_contact} placeholder="Contact" class="location-input" class:error={validationErrors.shipper_contact} />
					{#if validationErrors.shipper_contact}
						<span class="error-text">{validationErrors.shipper_contact}</span>
					{/if}
				</div>
			</div>

			<!-- Consignee Column -->
			<div class="location-column">
				<div class="location-header">
					<span class="red-text">Consignee</span>
					<span class="date-time">{new Date().toLocaleDateString('en-US', { year: '2-digit', month: '2-digit', day: '2-digit' })} {new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}</span>
				</div>
				<div class="location-content">
					<input type="text" bind:value={jobData.consignee_name} placeholder="Company Name *" class="location-input" class:error={validationErrors.consignee_name} required />
					{#if validationErrors.consignee_name}
						<span class="error-text">{validationErrors.consignee_name}</span>
					{/if}
					<input type="text" bind:value={jobData.consignee_address1} placeholder="Address 1" class="location-input" class:error={validationErrors.consignee_address1} />
					{#if validationErrors.consignee_address1}
						<span class="error-text">{validationErrors.consignee_address1}</span>
					{/if}
					<input type="text" bind:value={jobData.consignee_address2} placeholder="Address 2" class="location-input" class:error={validationErrors.consignee_address2} />
					{#if validationErrors.consignee_address2}
						<span class="error-text">{validationErrors.consignee_address2}</span>
					{/if}
					<div class="city-state-zip">
						<input type="text" bind:value={jobData.consignee_city} placeholder="City" class="city-input" class:error={validationErrors.consignee_city} />
						<input type="text" bind:value={jobData.consignee_state} placeholder="ST" class="state-input" class:error={validationErrors.consignee_state} />
						<input type="text" bind:value={jobData.consignee_zip} placeholder="ZIP" class="zip-input" class:error={validationErrors.consignee_zip} />
					</div>
					{#if validationErrors.consignee_city}
						<span class="error-text">{validationErrors.consignee_city}</span>
					{/if}
					{#if validationErrors.consignee_state}
						<span class="error-text">{validationErrors.consignee_state}</span>
					{/if}
					{#if validationErrors.consignee_zip}
						<span class="error-text">{validationErrors.consignee_zip}</span>
					{/if}
					<input type="tel" bind:value={jobData.consignee_phone} placeholder="Phone" class="location-input" class:error={validationErrors.consignee_phone} />
					{#if validationErrors.consignee_phone}
						<span class="error-text">{validationErrors.consignee_phone}</span>
					{/if}
					<input type="text" bind:value={jobData.consignee_contact} placeholder="Contact" class="location-input" class:error={validationErrors.consignee_contact} />
					{#if validationErrors.consignee_contact}
						<span class="error-text">{validationErrors.consignee_contact}</span>
					{/if}
				</div>
			</div>
		</div>

		<!-- Quote Preview (Netjets) -->
		<div class="row-box">
			<div class="field-group" style="min-width:280px;">
				<label for="quote-preview" class="blue-text">Quote Preview (Netjets)</label>
				{#if quotePreview}
					<div id="quote-preview" class="quote-grid">
						<div>NF: ${quotePreview.NF.toFixed(2)}</div>
						<div>PP: ${quotePreview.PP.toFixed(2)}</div>
						<div>NCUS: ${quotePreview.NCUS.toFixed(2)}</div>
						<div>MP: ${quotePreview.MP.toFixed(2)}</div>
						<div>WT: ${quotePreview.WT.toFixed(2)}</div>
						<div>MD: ${quotePreview.MD.toFixed(2)}</div>
						<div>AH: ${quotePreview.AH.toFixed(2)}</div>
						<div>NFT: ${quotePreview.NFT.toFixed(2)}</div>
						<div>DG: ${quotePreview.DG.toFixed(2)}</div>
						<div>TFM: ${quotePreview.TFM.toFixed(2)}</div>
						<div>SSC: ${quotePreview.SSC.toFixed(2)}</div>
						<div>FS: ${quotePreview.FS.toFixed(2)}</div>
						<div class="quote-total">Subtotal: ${quotePreview.subtotal.toFixed(2)}</div>
						<div class="quote-total">Total: ${quotePreview.total.toFixed(2)}</div>
					</div>
					<div class="quote-disclaimer">
						*These are transport costs and may not include incidentals like driver waiting time.
					</div>
				{:else}
					<div id="quote-preview" class="quote-grid">Fill the form to preview</div>
				{/if}
			</div>
		</div>

		<!-- Create Job Button -->
		<div class="action-row">
			<button class="create-job-btn" on:click={createNewJob} disabled={loading}>
				{loading ? 'Creating Job...' : 'Create New Job'}
			</button>
		</div>

		<!-- Message Display -->
		{#if message}
			<div class="message" class:success class:error={!success}>
				{message}
			</div>
		{/if}
	</div>
</div>

<style>
	.create-job-container {
		padding: 20px;
		background-color: #f5f5f5;
		border-radius: 8px;
		max-width: 1200px;
		margin: 0 auto;
	}

	/* Copy all the WHERE tab styles from JobTabContent */
	.where-layout {
		display: flex;
		flex-direction: column;
		gap: 10px;
		height: 100%;
		background-color: transparent;
		position: relative;
		z-index: 1;
		contain: layout style;
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

	.blue-text {
		color: blue;
	}

	.red-text {
		color: red;
	}

	.field-input {
		padding: 2px 4px;
		font-family: 'Courier New', monospace;
		font-size: 11px;
		border: 1px solid #999;
		background-color: white;
		height: 20px;
	}

	.job-number-display {
		font-style: italic;
		color: #666;
	}

	/* When job number is actually generated, show it normally */
	.job-number-display[value]:not([value=""]):not([value="Will be generated on submission"]) {
		font-style: normal;
		color: #000;
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
		contain: layout style;
		overflow: hidden;
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

	.action-row {
		display: flex;
		justify-content: center;
		padding: 20px 0;
	}

	.create-job-btn {
		background-color: #dc2626;
		color: white;
		border: none;
		padding: 12px 24px;
		font-size: 14px;
		font-weight: bold;
		border-radius: 4px;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.create-job-btn:hover:not(:disabled) {
		background-color: #b91c1c;
	}

	.create-job-btn:disabled {
		background-color: #9ca3af;
		cursor: not-allowed;
	}

	.message {
		padding: 10px;
		margin: 10px 0;
		border-radius: 4px;
		text-align: center;
		font-weight: bold;
	}

	.message.success {
		background-color: #dcfce7;
		color: #166534;
		border: 1px solid #bbf7d0;
	}

	.message.error {
		background-color: #fef2f2;
		color: #dc2626;
		border: 1px solid #fecaca;
	}

	/* Error styling for form inputs */
	.field-input.error,
	.location-input.error,
	.city-input.error,
	.state-input.error,
	.zip-input.error {
		border-color: #dc2626;
		background-color: #fef2f2;
	}

	.error-text {
		color: #dc2626;
		font-size: 10px;
		margin-top: 2px;
		display: block;
	}

	/* Quote Preview Styles */
	.quote-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 4px;
		font-size: 10px;
		font-family: 'Courier New', monospace;
		background: white;
		border: 1px solid #ccc;
		padding: 8px;
		border-radius: 4px;
		max-height: 150px;
		overflow-y: auto;
	}

	.quote-total {
		font-weight: bold;
		color: #dc2626;
		grid-column: 1 / -1;
		text-align: center;
		border-top: 1px solid #ccc;
		padding-top: 4px;
		margin-top: 4px;
	}

	.quote-disclaimer {
		font-size: 9px;
		color: #666;
		font-style: italic;
		margin-top: 6px;
		text-align: center;
		line-height: 1.2;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
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
		
		.quote-grid {
			grid-template-columns: 1fr;
			font-size: 9px;
		}
	}
</style> 