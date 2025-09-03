<!-- Job Tab Content Component -->
<script lang="ts">
	import { supabase } from '$lib/supabase'
	import { createEventDispatcher } from 'svelte'
	import { onMount } from 'svelte'
		import { 
		getAirlines, 
		getLSPs, 
		getJobAWBs, 
		getJobLSPs, 
		createAWB, 
		assignLSPToJob,
		updateAWBStatus,
		updateLSPStatus,
		removeAWB,
		removeLSPFromJob,
		getLSPCosts,
		addLSPCost,
		deleteLSPCost
	} from '$lib/services/operationsService'
	import type { 
		AWBWithAirline, 
		LSPLevelWithLSP, 
		Airline, 
		LSP 
	} from '$lib/services/operationsService'
	import type {
		LSPCost,
		LSPCostFormData
	} from '$lib/types/operations.types'
	
	export let activeTab: string = 'where'
	export let jobData: any = {}
	
	const dispatch = createEventDispatcher()
	
	// State for CRUD operations
	let saving = false
	let saveMessage = ''
	let saveError = ''
	
	// LSP and AWB Management State
	let availableLSPs: LSP[] = []
	let availableAirlines: Airline[] = []
	let jobLSPs: LSPLevelWithLSP[] = []
	let jobAWBs: AWBWithAirline[] = []
	
	// Test box state
	let testLSPData: any[] = []
	let testQueryRan = false
	
	// LSP Costs state
	let lspCosts: { [lspLevelId: string]: LSPCost[] } = {}
	let newCost = {
		cost: 0,
		description: '',
		ledgercode: ''
	}
	
	// Form state for new assignments (simplified)
	let newLSP = {
		lsp_id: '',
		function: '' as 'Pickup' | 'Delivery' | 'Transport' | 'Customs' | ''
	}
	
	let newAWB = {
		awb_number: '',
		airline_id: '',
		flight_number: '',
		flight_date: '',
		pieces: undefined as number | undefined,
		weight: undefined as number | undefined,
		weight_unit: 'kg' as 'kg' | 'lbs',
		origin_airport: '',
		destination_airport: '',
		notes: ''
	}

	// Packaging state
	let availablePackaging: { id: string; name: string; type?: string | null; temperature?: string | null }[] = []
	let selectedPackagingId: string = ''

	// Quote state
	let quoteItems: { id: number; chargecode: string; charge: number; created_at: string }[] = []
	let loadingQuote = false

	async function loadPackaging() {
		try {
			const { data, error } = await supabase
				.from('packaging')
				.select('id, name, type, temperature')
				.order('name', { ascending: true })
			if (error) {
				console.error('Error loading packaging:', error)
				return
			}
			availablePackaging = data || []
			// initialize from jobData if present
			selectedPackagingId = jobData.packaging_id || ''
		} catch (err) {
			console.error('Error in loadPackaging:', err)
		}
	}

	async function savePackagingSelection() {
		if (!jobData.jobno && !jobData.jobnumber) return
		try {
			saving = true
			saveError = ''
			const jobIdentifier = jobData.jobno || jobData.jobnumber
			const { data, error } = await supabase
				.from('jobsfile')
				.update({ packaging_id: selectedPackagingId || null, updated_at: new Date().toISOString() })
				.eq('jobno', jobIdentifier)
				.select()
			if (error) {
				console.error('Error saving packaging selection:', error)
				saveError = `Failed to save: ${error.message}`
				return
			}
			jobData.packaging_id = selectedPackagingId || null
			saveMessage = 'Packaging selection saved!'
			setTimeout(() => { saveMessage = '' }, 2000)
		} catch (err) {
			console.error('Error in savePackagingSelection:', err)
			saveError = 'An unexpected error occurred while saving'
		} finally {
			saving = false
		}
	}

	// Salesman (derived from customer.salesman_id)
	let whoSalesman: { salesman_id: string; name: string; fin_cono?: string | null } | null = null

	async function loadWhoSalesman() {
		try {
			const salesId = jobData?.customers?.salesman_id
			console.log('Loading salesman for sales ID:', salesId)
			if (!salesId) { whoSalesman = null; return }
			const { data, error } = await supabase
				.from('salesman')
				.select('id, salesman_id, name, fin_cono')
				.eq('id', salesId)  // Query by 'id' since that's what the foreign key references
				.single()
			console.log('Salesman query result:', { data, error })
			if (!error && data) {
				whoSalesman = { salesman_id: data.salesman_id || data.id, name: data.name, fin_cono: data.fin_cono }
			}
		} catch (err) {
			console.error('Error loading salesman for WHO tab:', err)
		}
	}

	async function loadQuoteItems() {
		if (!jobData.jobno && !jobData.jobnumber) return
		try {
			loadingQuote = true
			const jobIdentifier = jobData.jobno || jobData.jobnumber
			const { data, error } = await supabase
				.from('quotes')
				.select('id, chargecode, charge, created_at')
				.eq('jobnumber', jobIdentifier)
				.order('chargecode', { ascending: true })
			
			if (error) {
				console.error('Error loading quote items:', error)
				return
			}
			
			quoteItems = data || []
		} catch (err) {
			console.error('Error in loadQuoteItems:', err)
		} finally {
			loadingQuote = false
		}
	}
	
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
					vehicle_type: jobData.vehicle_type || null,
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
			
			// Use jobno for the foreign key constraint (this matches the database reference)
			const jobIdentifier = jobData.jobno || jobData.jobnumber
			
			console.log('Saving timeline for job:', { 
				jobno: jobData.jobno, 
				jobnumber: jobData.jobnumber, 
				using: jobIdentifier 
			})
			
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
			
			// Also trigger a browser event for the operations table to listen to
			window.dispatchEvent(new CustomEvent('jobTimelineUpdated', {
				detail: { jobno: jobIdentifier, timelineData: data?.[0] }
			}))
			
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

	// ===========================
	// LSP AND AWB MANAGEMENT FUNCTIONS
	// ===========================

	/**
	 * Load LSPs, Airlines, and existing assignments when component mounts
	 */
	onMount(async () => {
		await loadLSPsAndAirlines()
		if (jobData.jobnumber) {
			await loadJobAssignments()
		}
		await loadPackaging()
	})

	/**
	 * Load available LSPs and Airlines for dropdowns
	 */
	async function loadLSPsAndAirlines() {
		try {
			console.log('Loading LSPs and Airlines...');
			const [lspsResult, airlinesResult] = await Promise.all([
				getLSPs(),
				getAirlines()
			]);
			
			console.log('LSPs loaded:', lspsResult.length, lspsResult);
			console.log('Airlines loaded:', airlinesResult.length, airlinesResult);
			
			availableLSPs = lspsResult;
			availableAirlines = airlinesResult;
			
			// Additional debugging
			if (lspsResult.length === 0) {
				console.warn('No LSPs found - check database or RLS policies');
				saveError = 'No LSPs available. Please add LSPs to the database first.';
			}
		} catch (error) {
			console.error('Error loading LSPs and Airlines:', error);
			saveError = 'Failed to load LSPs and Airlines from database';
		}
	}

	/**
	 * Load existing LSP assignments and AWBs for the job
	 */
	async function loadJobAssignments() {
		const jobId = jobData.jobnumber || jobData.jobno || jobData.job_number;
		
		if (!jobId) {
			console.warn('No job identifier available for loading assignments', {
				jobnumber: jobData.jobnumber,
				jobno: jobData.jobno,
				job_number: jobData.job_number
			});
			return;
		}
		
		try {
			console.log('Loading job assignments for job ID:', jobId);
			console.log('Available job identifiers:', {
				jobnumber: jobData.jobnumber,
				jobno: jobData.jobno,
				job_number: jobData.job_number
			});
			
			const [lspsResult, awbsResult] = await Promise.all([
				getJobLSPs(jobId),
				getJobAWBs(jobId)
			]);
			
			console.log('Job LSPs loaded:', lspsResult.length, lspsResult);
			console.log('Job AWBs loaded:', awbsResult.length, awbsResult);
			
			// Force reactivity by creating new arrays
			jobLSPs = [...lspsResult];
			jobAWBs = [...awbsResult];
			
			console.log('Updated jobLSPs array:', jobLSPs);
		} catch (error) {
			console.error('Error loading job assignments:', error);
		}
	}

	/**
	 * Add LSP to job
	 */
	async function addLSPToJob() {
		const jobId = jobData.jobnumber || jobData.jobno || jobData.job_number;
		
		console.log('Add LSP button clicked', { 
			lsp_id: newLSP.lsp_id, 
			function: newLSP.function, 
			jobId: jobId,
			allJobFields: {
				jobnumber: jobData.jobnumber,
				jobno: jobData.jobno,
				job_number: jobData.job_number
			}
		});
		
		if (!newLSP.lsp_id || !newLSP.function) {
			console.warn('Missing required fields:', { lsp_id: newLSP.lsp_id, function: newLSP.function });
			saveError = 'Please select both LSP and function';
			return;
		}
		
		if (!jobId) {
			console.error('No job identifier available');
			saveError = 'Job identifier is required';
			return;
		}
		
		try {
			saving = true
			saveError = '';
			console.log('Calling assignLSPToJob with:', {
				jobnumber: jobId,
				lspData: {
					lsp_id: newLSP.lsp_id,
					function: newLSP.function
				}
			});
			
			const result = await assignLSPToJob(jobId, {
				lsp_id: newLSP.lsp_id,
				function: newLSP.function as 'Pickup' | 'Delivery' | 'Transport' | 'Customs'
			});
			
			console.log('assignLSPToJob result:', result);
			
			if (result.success) {
				console.log('LSP assignment successful');
				
				// Reset form
				newLSP = {
					lsp_id: '',
					function: '' as 'Pickup' | 'Delivery' | 'Transport' | 'Customs' | ''
				}
				
				// Reload the LSP data
				await loadLSPLevelRows();
				
				saveMessage = 'LSP assigned successfully!'
				setTimeout(() => saveMessage = '', 2000)
			} else {
				saveError = result.error || 'Failed to assign LSP'
			}
		} catch (error) {
			console.error('Error adding LSP:', error)
			saveError = 'Failed to assign LSP'
		} finally {
			saving = false
		}
	}

	/**
	 * Add AWB to job
	 */
	async function addAWBToJob() {
		if (!newAWB.awb_number || !newAWB.airline_id) return
		
		try {
			saving = true
			const result = await createAWB(jobData.jobnumber, {
				awb_number: newAWB.awb_number,
				airline_id: parseInt(newAWB.airline_id),
				flight_number: newAWB.flight_number,
				flight_date: newAWB.flight_date,
				pieces: newAWB.pieces,
				weight: newAWB.weight,
				weight_unit: newAWB.weight_unit,
				origin_airport: newAWB.origin_airport,
				destination_airport: newAWB.destination_airport,
				notes: newAWB.notes
			})
			
			if (result.success) {
				// Reset form and reload assignments
				newAWB = {
					awb_number: '',
					airline_id: '',
					flight_number: '',
					flight_date: '',
					pieces: undefined,
					weight: undefined,
					weight_unit: 'kg',
					origin_airport: '',
					destination_airport: '',
					notes: ''
				}
				await loadJobAssignments()
				saveMessage = 'AWB created successfully!'
				setTimeout(() => saveMessage = '', 2000)
			} else {
				saveError = result.error || 'Failed to create AWB'
			}
		} catch (error) {
			console.error('Error adding AWB:', error)
			saveError = 'Failed to create AWB'
		} finally {
			saving = false
		}
	}

	/**
	 * Update LSP assignment status
	 */
	async function updateLSPAssignmentStatus(assignmentId: string, status: string) {
		try {
			const result = await updateLSPStatus(assignmentId, { status })
			if (result.success) {
				await loadJobAssignments()
				saveMessage = `LSP status updated to ${status}`
				setTimeout(() => saveMessage = '', 2000)
			} else {
				saveError = result.error || 'Failed to update LSP status'
			}
		} catch (error) {
			console.error('Error updating LSP status:', error)
			saveError = 'Failed to update LSP status'
		}
	}

	/**
	 * Remove LSP assignment
	 */
	async function removeLSPAssignment(assignmentId: string) {
		if (!confirm('Are you sure you want to remove this LSP assignment?')) return
		
		try {
			const result = await removeLSPFromJob(assignmentId)
			if (result.success) {
				await loadJobAssignments()
				saveMessage = 'LSP assignment removed'
				setTimeout(() => saveMessage = '', 2000)
			} else {
				saveError = result.error || 'Failed to remove LSP assignment'
			}
		} catch (error) {
			console.error('Error removing LSP assignment:', error)
			saveError = 'Failed to remove LSP assignment'
		}
	}

	/**
	 * Update AWB status
	 */
	async function updateAWBStatusHandler(awbId: string, status: string) {
		try {
			const result = await updateAWBStatus(awbId, { status })
			if (result.success) {
				await loadJobAssignments()
				saveMessage = `AWB status updated to ${status}`
				setTimeout(() => saveMessage = '', 2000)
			} else {
				saveError = result.error || 'Failed to update AWB status'
			}
		} catch (error) {
			console.error('Error updating AWB status:', error)
			saveError = 'Failed to update AWB status'
		}
	}

	/**
	 * Remove AWB
	 */
	async function removeAWBHandler(awbId: string) {
		if (!confirm('Are you sure you want to remove this Air Waybill?')) return
		
		try {
			const result = await removeAWB(awbId)
			if (result.success) {
				await loadJobAssignments()
				saveMessage = 'AWB removed'
				setTimeout(() => saveMessage = '', 2000)
			} else {
				saveError = result.error || 'Failed to remove AWB'
			}
		} catch (error) {
			console.error('Error removing AWB:', error)
			saveError = 'Failed to remove AWB'
		}
	}

	/**
	 * Format date for display
	 */
	function formatDate(dateString: string | null): string {
		if (!dateString) return 'N/A'
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		})
	}

	/**
	 * Format date and time for display
	 */
	function formatDateTime(dateString: string | null): string {
		if (!dateString) return 'N/A'
		return new Date(dateString).toLocaleString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		})
	}

	// Watch for jobData changes to reload assignments
	$: {
		const jobId = jobData.jobnumber || jobData.jobno || jobData.job_number;
		if (jobId && (activeTab === 'how')) {
			console.log('Reactive statement triggered for job ID:', jobId);
			loadLSPLevelRows();
		}
	}
	
	// Manual refresh function for debugging
	async function refreshAssignments() {
		console.log('Manual refresh triggered');
		await loadLSPLevelRows();
	}

	// Load LSP assignments from lsp_level table for this job
	async function loadLSPLevelRows() {
		const jobId = jobData.jobnumber || jobData.jobno || jobData.job_number;
		
		try {
			testQueryRan = true;
			console.log('Loading LSP_LEVEL rows for job:', jobId);
			
			// First get the lsp_level rows for this job
			const { data: lspLevelRows, error: lspLevelError } = await supabase
				.from('lsp_level')
				.select('*')
				.eq('jobnumber', jobId);
			
			console.log('LSP Level rows:', { lspLevelRows, lspLevelError, jobId });
			
			if (lspLevelError) {
				console.error('Error querying lsp_level table:', lspLevelError);
				saveError = `Query failed: ${lspLevelError.message}`;
				testLSPData = [];
				return;
			}
			
			// Now get LSP names for each row
			if (lspLevelRows && lspLevelRows.length > 0) {
				const lspIds = lspLevelRows.map(row => row.lsp_id).filter(Boolean);
				
				// Get LSP details
				const { data: lspDetails, error: lspDetailsError } = await supabase
					.from('lsps')
					.select('id, vendor_name')
					.in('id', lspIds);
				
				if (lspDetailsError) {
					console.error('Error loading LSP details:', lspDetailsError);
				}
				
				// Combine the data
				testLSPData = lspLevelRows.map(row => {
					const lsp = lspDetails?.find(l => l.id === row.lsp_id);
					return {
						...row,
						lsp_name: lsp?.vendor_name || 'Unknown LSP'
					};
				});
			} else {
				testLSPData = [];
			}
			
			console.log('Final LSP data loaded:', testLSPData.length, testLSPData);
			
			// Load costs for each LSP assignment
			await loadAllLSPCosts();
			
		} catch (error) {
			console.error('Error in loadLSPLevelRows:', error);
			testLSPData = [];
		}
	}

	// Load costs for all LSP assignments
	async function loadAllLSPCosts() {
		if (testLSPData.length === 0) return;
		
		try {
			console.log('Loading costs for all LSP assignments...');
			const costsPromises = testLSPData.map(async (lspRow) => {
				const costs = await getLSPCosts(lspRow.id);
				return { lspLevelId: lspRow.id, costs };
			});
			
			const costsResults = await Promise.all(costsPromises);
			
			// Build costs object
			lspCosts = {};
			costsResults.forEach(({ lspLevelId, costs }) => {
				lspCosts[lspLevelId] = costs;
			});
			
			console.log('LSP costs loaded:', lspCosts);
		} catch (error) {
			console.error('Error loading LSP costs:', error);
		}
	}

	// Add cost to specific LSP assignment
	async function addCostToLSP(lspRow: any) {
		if (!newCost.cost || !newCost.description || !newCost.ledgercode) {
			saveError = 'Please fill in all cost fields';
			return;
		}
		
		try {
			console.log('Adding cost to LSP:', lspRow.id, newCost);
			
			const result = await addLSPCost(
				lspRow.id, 
				lspRow.jobnumber, 
				lspRow.vendorcode, 
				newCost
			);
			
			if (result.success) {
				// Reload costs for this specific LSP
				const updatedCosts = await getLSPCosts(lspRow.id);
				lspCosts[lspRow.id] = updatedCosts;
				lspCosts = { ...lspCosts }; // Force reactivity
				
				// Reset form
				newCost = { cost: 0, description: '', ledgercode: '' };
				saveMessage = 'Cost added successfully!';
				setTimeout(() => saveMessage = '', 2000);
			} else {
				saveError = result.error || 'Failed to add cost';
			}
		} catch (error) {
			console.error('Error adding cost:', error);
			saveError = 'Failed to add cost';
		}
	}

	// Remove cost from LSP assignment
	async function removeCostFromLSP(costId: string, lspLevelId: string) {
		try {
			const result = await deleteLSPCost(costId);
			
			if (result.success) {
				// Reload costs for this specific LSP
				const updatedCosts = await getLSPCosts(lspLevelId);
				lspCosts[lspLevelId] = updatedCosts;
				lspCosts = { ...lspCosts }; // Force reactivity
				
				saveMessage = 'Cost removed successfully!';
				setTimeout(() => saveMessage = '', 2000);
			} else {
				saveError = result.error || 'Failed to remove cost';
			}
		} catch (error) {
			console.error('Error removing cost:', error);
			saveError = 'Failed to remove cost';
		}
	}

	$: if (activeTab === 'who') {
		loadWhoSalesman()
	}

	$: if (activeTab === 'quote') {
		loadQuoteItems()
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
			<div class="form-group">
				<label class="blue-text">SALESMAN (derived):</label>
				<div class="form-input" style="display:flex; align-items:center; gap:8px;">
					<span>{whoSalesman?.name || 'None'}</span>
					{#if whoSalesman?.fin_cono}
						<span class="text-gray-500" style="font-size:0.85rem;">FIN CONO: {whoSalesman.fin_cono}</span>
					{/if}
				</div>
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
					<label class="blue-text">Job No</label>
					<input type="text" bind:value={jobData.jobno} class="field-input" readonly />
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
						<option value="NFO">NFO</option>
						<option value="NDO">NDO</option>
						<option value="OBC">OBC</option>
						<option value="CHAR">CHAR</option>
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
						<div class="field-group">
							<label class="blue-text">Company Name</label>
							<input type="text" bind:value={jobData.shipper_name} class="location-input" />
						</div>
						<div class="field-group">
							<label class="blue-text">Address 1</label>
							<input type="text" bind:value={jobData.shipper_address1} class="location-input" />
						</div>
						<div class="field-group">
							<label class="blue-text">Address 2</label>
							<input type="text" bind:value={jobData.shipper_address2} class="location-input" />
						</div>
						<div class="city-state-zip">
							<div class="field-group">
								<label class="blue-text">City</label>
								<input type="text" bind:value={jobData.shipper_city} class="city-input" />
							</div>
							<div class="field-group">
								<label class="blue-text">State</label>
								<input type="text" bind:value={jobData.shipper_state} class="state-input" />
							</div>
							<div class="field-group">
								<label class="blue-text">ZIP</label>
								<input type="text" bind:value={jobData.shipper_zip} class="zip-input" />
							</div>
						</div>
						<div class="field-group">
							<label class="blue-text">Phone</label>
							<input type="tel" bind:value={jobData.shipper_phone} class="location-input" />
						</div>
						<div class="field-group">
							<label class="blue-text">Contact</label>
							<input type="text" bind:value={jobData.shipper_contact} class="location-input" />
						</div>
					</div>
				</div>

				<!-- Consignee Column -->
				<div class="location-column">
					<div class="location-header">
						<span class="red-text">Consignee</span>
						<span class="date-time">{new Date().toLocaleDateString('en-US', { year: '2-digit', month: '2-digit', day: '2-digit' })} {new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}</span>
					</div>
					<div class="location-content">
						<div class="field-group">
							<label class="blue-text">Company Name</label>
							<input type="text" bind:value={jobData.consignee_name} class="location-input" />
						</div>
						<div class="field-group">
							<label class="blue-text">Address 1</label>
							<input type="text" bind:value={jobData.consignee_address1} class="location-input" />
						</div>
						<div class="field-group">
							<label class="blue-text">Address 2</label>
							<input type="text" bind:value={jobData.consignee_address2} class="location-input" />
						</div>
						<div class="city-state-zip">
							<div class="field-group">
								<label class="blue-text">City</label>
								<input type="text" bind:value={jobData.consignee_city} class="city-input" />
							</div>
							<div class="field-group">
								<label class="blue-text">State</label>
								<input type="text" bind:value={jobData.consignee_state} class="state-input" />
							</div>
							<div class="field-group">
								<label class="blue-text">ZIP</label>
								<input type="text" bind:value={jobData.consignee_zip} class="zip-input" />
							</div>
						</div>
						<div class="field-group">
							<label class="blue-text">Phone</label>
							<input type="tel" bind:value={jobData.consignee_phone} class="location-input" />
						</div>
						<div class="field-group">
							<label class="blue-text">Contact</label>
							<input type="text" bind:value={jobData.consignee_contact} class="location-input" />
						</div>
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
				<label class="blue-text">VEHICLE TYPE:</label>
				<select 
					bind:value={jobData.vehicle_type} 
					class="form-input transport-field"
					on:change={debouncedTransportSave}
				>
					<option value="">Select Vehicle</option>
					<option value="car">Car</option>
					<option value="van">Van</option>
					<option value="boxtruck">Box Truck</option>
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

		<!-- LSP Management Section -->
		<div class="management-section">
			<div class="section-header">
				<h4 class="blue-text">--- LSP ASSIGNMENTS ---</h4>
				<button on:click={refreshAssignments} class="refresh-button">
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
					</svg>
					Refresh
				</button>
			</div>
			
			<!-- Add LSP Form (Simplified) -->
			<div class="add-form">
				<div class="form-row">
					<div class="form-field">
						<label class="field-label">LSP Company</label>
						<select bind:value={newLSP.lsp_id} class="form-input">
							<option value="">Select LSP</option>
							{#each availableLSPs as lsp}
								<option value={lsp.id}>{lsp.vendor_name} ({lsp.vendor_code})</option>
							{/each}
						</select>
					</div>
					
					<div class="form-field">
						<label class="field-label">Function</label>
						<select bind:value={newLSP.function} class="form-input">
							<option value="">Select Function</option>
							<option value="Pickup">Pickup Service</option>
							<option value="Delivery">Delivery Service</option>
							<option value="Transport">Transportation</option>
							<option value="Customs">Customs Clearance</option>
						</select>
					</div>
					
					<div class="form-field">
						<label class="field-label">&nbsp;</label>
						<button 
							on:click={addLSPToJob} 
							disabled={!newLSP.lsp_id || !newLSP.function}
							class="add-button"
						>
							Add LSP
						</button>
					</div>
				</div>
			</div>
			
			<!-- LSP Assignments with Costs -->
			<div class="assignments-list">
				{#each testLSPData as row}
					<div class="assignment-card-with-costs" style="display: flex; gap: 20px; min-height: 200px; border: 2px solid red;">
						<!-- Left Side: LSP Assignment Info -->
						<div class="assignment-info">
							<div class="assignment-header">
								<strong>{row.lsp_name || 'LSP ID: ' + row.lsp_id}</strong>
								<span class="function-badge {row.function?.toLowerCase()}">{row.function}</span>
								<span class="status-badge {row.status?.toLowerCase()}">{row.status}</span>
							</div>
							<div class="assignment-details">
								<p><strong>Vendor Code:</strong> {row.vendorcode || 'N/A'}</p>
								<p><strong>Job Number:</strong> {row.jobnumber}</p>
								<p><strong>Assigned:</strong> {formatDateTime(row.assigned_date || null)}</p>
								{#if row.vehicle_type}
									<p><strong>Vehicle Type:</strong> {row.vehicle_type}</p>
								{/if}
								{#if row.waiting_time}
									<p><strong>Waiting Time:</strong> {row.waiting_time} minutes</p>
								{/if}
							</div>
							<div class="assignment-actions">
								<button on:click={() => updateLSPAssignmentStatus(row.id, 'Completed')} class="action-btn complete">Complete</button>
								<button on:click={() => removeLSPAssignment(row.id)} class="action-btn remove">Remove</button>
							</div>
						</div>
						
						<!-- Right Side: Costs Management -->
						<div class="costs-section">
							<h4>Costs</h4>
							
							<!-- Add New Cost Form -->
							<div class="add-cost-form">
								<input 
									type="number" 
									bind:value={newCost.cost} 
									placeholder="Amount"
									min="0"
									step="0.01"
									class="cost-input"
								/>
								<input 
									type="text" 
									bind:value={newCost.description} 
									placeholder="Description"
									class="cost-input"
								/>
								<input 
									type="text" 
									bind:value={newCost.ledgercode} 
									placeholder="Ledger Code"
									class="cost-input"
								/>
								<button 
									on:click={() => addCostToLSP(row)} 
									class="add-cost-btn"
									disabled={!newCost.cost || !newCost.description || !newCost.ledgercode}
								>
									Add Cost
								</button>
							</div>
							
							<!-- Existing Costs List -->
							<div class="costs-list">
								{#if lspCosts[row.id] && lspCosts[row.id].length > 0}
									{#each lspCosts[row.id] as cost}
										<div class="cost-item">
											<div class="cost-details">
												<strong>${cost.cost}</strong>
												<span class="cost-description">{cost.description}</span>
												<small class="cost-ledger">Ledger: {cost.ledgercode}</small>
											</div>
											<button 
												on:click={() => removeCostFromLSP(cost.id, row.id)} 
												class="remove-cost-btn"
											>
												×
											</button>
										</div>
									{/each}
								{:else}
									<p class="no-costs">No costs added</p>
								{/if}
							</div>
						</div>
					</div>
				{/each}
				
				{#if testLSPData.length === 0}
					<div class="empty-state">
						<p>No LSPs assigned to this job</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- AWB Management Section -->
		<div class="management-section">
			<div class="section-header">
				<h4 class="blue-text">--- AIR WAYBILL MANAGEMENT ---</h4>
			</div>
			
			<!-- Add AWB Form (Reorganized) -->
			<div class="add-form">
				<div class="form-row">
					<div class="form-field">
						<label class="field-label">AWB Number</label>
						<input 
							type="text" 
							bind:value={newAWB.awb_number} 
							placeholder="e.g., 020-12345678"
							class="form-input"
						/>
					</div>
					
					<div class="form-field">
						<label class="field-label">Airline</label>
						<select bind:value={newAWB.airline_id} class="form-input">
							<option value="">Select Airline</option>
							{#each availableAirlines as airline}
								<option value={airline.id}>{airline.airline_name} ({airline.airline_code})</option>
							{/each}
						</select>
					</div>
					
					<div class="form-field">
						<label class="field-label">Flight Number</label>
						<input 
							type="text" 
							bind:value={newAWB.flight_number} 
							placeholder="e.g., AA123"
							class="form-input"
						/>
					</div>
					
					<div class="form-field">
						<label class="field-label">Flight Date</label>
						<input 
							type="date" 
							bind:value={newAWB.flight_date} 
							class="form-input"
						/>
					</div>
					
					<div class="form-field">
						<label class="field-label">&nbsp;</label>
						<button 
							on:click={addAWBToJob} 
							disabled={!newAWB.awb_number || !newAWB.airline_id}
							class="add-button"
						>
							Add AWB
						</button>
					</div>
				</div>
				
				<div class="form-row">
					<div class="form-field small">
						<label class="field-label">Pieces</label>
						<input 
							type="number" 
							bind:value={newAWB.pieces} 
							placeholder="0"
							class="form-input"
						/>
					</div>
					
					<div class="form-field small">
						<label class="field-label">Weight</label>
						<input 
							type="number" 
							bind:value={newAWB.weight} 
							placeholder="0"
							class="form-input"
							step="0.1"
						/>
					</div>
					
					<div class="form-field small">
						<label class="field-label">Unit</label>
						<select bind:value={newAWB.weight_unit} class="form-input">
							<option value="kg">kg</option>
							<option value="lbs">lbs</option>
						</select>
					</div>
					
					<div class="form-field">
						<label class="field-label">Origin Airport</label>
						<input 
							type="text" 
							bind:value={newAWB.origin_airport} 
							placeholder="e.g., JFK"
							class="form-input"
						/>
					</div>
					
					<div class="form-field">
						<label class="field-label">Destination Airport</label>
						<input 
							type="text" 
							bind:value={newAWB.destination_airport} 
							placeholder="e.g., LAX"
							class="form-input"
						/>
					</div>
				</div>
			</div>
			
			<!-- AWB List -->
			<div class="assignments-list">
				{#each jobAWBs as awb}
					<div class="assignment-card">
						<div class="assignment-header">
							<strong>AWB: {awb.awb_number}</strong>
							<span class="airline-badge">{awb.airlines?.airline_name} ({awb.airlines?.airline_code})</span>
							<span class="status-badge {awb.status?.toLowerCase()}">{awb.status}</span>
						</div>
						<div class="assignment-details">
							<div class="detail-row">
								<p><strong>Flight:</strong> {awb.flight_number || 'N/A'}</p>
								<p><strong>Date:</strong> {formatDate(awb.flight_date || null)}</p>
							</div>
							<div class="detail-row">
								<p><strong>Route:</strong> {awb.origin_airport || 'N/A'} → {awb.destination_airport || 'N/A'}</p>
								{#if awb.pieces || awb.weight}
									<p><strong>Cargo:</strong> {awb.pieces || 0} pcs, {awb.weight || 0} {awb.weight_unit || 'kg'}</p>
								{/if}
							</div>
							{#if awb.notes}
								<p><strong>Notes:</strong> {awb.notes}</p>
							{/if}
						</div>
						<div class="assignment-actions">
							<button on:click={() => updateAWBStatusHandler(awb.id, 'In Transit')} class="action-btn transit">In Transit</button>
							<button on:click={() => updateAWBStatusHandler(awb.id, 'Delivered')} class="action-btn complete">Delivered</button>
							<button on:click={() => removeAWBHandler(awb.id)} class="action-btn remove">Remove</button>
						</div>
					</div>
				{/each}
				
				{#if jobAWBs.length === 0}
					<div class="empty-state">
						<p>No Air Waybills created for this job</p>
					</div>
				{/if}
			</div>
		</div>

		</div>
	{/if}

	<!-- PACKAGING Tab - Packaging Selection -->
	{#if activeTab === 'packaging'}
		<div class="tab-content">
			<h3 class="blue-text">--- PACKAGING ---</h3>
			<div class="save-status">
				{#if saving}
					<div class="save-indicator saving">
						<span class="spinner"></span>
						Saving packaging selection...
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
					<label class="blue-text">SELECT PACKAGING (optional)</label>
					<select bind:value={selectedPackagingId} class="form-input" on:change={savePackagingSelection}>
						<option value="">None</option>
						{#each availablePackaging as p}
							<option value={p.id}>{p.name}{p.type ? ` - ${p.type}` : ''}{p.temperature ? ` (${p.temperature})` : ''}</option>
						{/each}
					</select>
				</div>
			</div>
		</div>
	{/if}

	<!-- QUOTE Tab - Quote Breakdown -->
	{#if activeTab === 'quote'}
		<div class="tab-content">
			<h3 class="blue-text">--- QUOTE BREAKDOWN ---</h3>
			
			{#if loadingQuote}
				<div class="loading-state">
					<div class="loading-spinner"></div>
					<p>Loading quote...</p>
				</div>
			{:else if quoteItems.length === 0}
				<div class="empty-state">
					<div class="empty-icon">💰</div>
					<h3>No quote available</h3>
					<p>This job doesn't have a saved quote yet</p>
				</div>
			{:else}
				<div class="quote-breakdown">
					<div class="quote-header">
						<h4>Cost Breakdown</h4>
						<p class="quote-date">Generated: {new Date(quoteItems[0]?.created_at || '').toLocaleDateString()}</p>
					</div>
					
					<div class="quote-items">
						{#each quoteItems as item}
							<div class="quote-item" class:total={item.chargecode === 'TOTAL'}>
								<span class="charge-code">{item.chargecode}</span>
								<span class="charge-amount">${item.charge.toFixed(2)}</span>
							</div>
						{/each}
					</div>
					
					<div class="quote-disclaimer">
						*Transport costs may not include incidentals like driver waiting time
					</div>
				</div>
			{/if}
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
		color: #1d4ed8 !important;
		font-weight: 600 !important;
		display: inline-block;
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
		color: #1d4ed8 !important;
		font-weight: 700 !important;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 0.25rem;
		display: block;
		line-height: 1.2;
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

	/* ===========================
	   LSP AND AWB MANAGEMENT STYLES
	   =========================== */

	.management-section {
		margin-top: 2rem;
		background: white;
		border-radius: 12px;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
		overflow: hidden;
	}

	.section-header {
		background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
		padding: 1rem 1.5rem;
		border-bottom: 2px solid #e5e7eb;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.section-header h4 {
		margin: 0;
		font-size: 1rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.refresh-button {
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 6px;
		padding: 0.5rem 1rem;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.refresh-button:hover {
		background: #2563eb;
		transform: translateY(-1px);
	}

	.refresh-button svg {
		width: 14px;
		height: 14px;
	}

	.debug-info {
		background: #f0f9ff;
		border: 1px solid #bae6fd;
		border-radius: 6px;
		padding: 1rem;
		margin: 1rem 1.5rem;
		font-size: 0.875rem;
	}

	.debug-info p {
		margin: 0.25rem 0;
		color: #0369a1;
	}

	.test-box {
		background: #fffbeb;
		border: 1px solid #fbbf24;
		border-radius: 6px;
		padding: 1rem;
		margin: 1rem 1.5rem;
		font-size: 0.875rem;
	}

	.test-box h5 {
		margin: 0 0 1rem 0;
		color: #92400e;
		font-size: 1rem;
		font-weight: 600;
	}

	.test-button {
		background: #f59e0b;
		color: white;
		border: none;
		border-radius: 6px;
		padding: 0.5rem 1rem;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		margin-bottom: 1rem;
	}

	.test-button:hover {
		background: #d97706;
		transform: translateY(-1px);
	}

	.test-results {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
		padding: 1rem;
		max-height: 200px;
		overflow-y: auto;
	}

	.test-row {
		display: flex;
		gap: 1rem;
		padding: 0.5rem 0;
		border-bottom: 1px solid #f3f4f6;
		flex-wrap: wrap;
	}

	.test-row:last-child {
		border-bottom: none;
	}

	.test-row span {
		font-size: 0.75rem;
		color: #374151;
	}

	.test-empty {
		color: #6b7280;
		font-style: italic;
		margin: 0.5rem 0;
	}

	/* LSP Table Styles */
	.lsp-table-container {
		padding: 1.5rem;
		overflow-x: auto;
	}

	.lsp-table {
		width: 100%;
		border-collapse: collapse;
		background: white;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	}

	.lsp-table th {
		background: #f8fafc;
		padding: 0.75rem;
		text-align: left;
		font-size: 0.75rem;
		font-weight: 600;
		color: #374151;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border-bottom: 2px solid #e5e7eb;
	}

	.lsp-table td {
		padding: 0.75rem;
		border-bottom: 1px solid #f3f4f6;
		font-size: 0.875rem;
		color: #1f2937;
	}

	.lsp-row:hover {
		background: #f9fafb;
	}

	.table-input {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #d1d5db;
		border-radius: 4px;
		font-size: 0.875rem;
	}

	.table-input:focus {
		outline: none;
		border-color: #dc2626;
		box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.1);
	}

	.actions-cell {
		white-space: nowrap;
	}

	.actions-cell .action-btn {
		margin-right: 0.5rem;
		padding: 0.25rem 0.75rem;
		font-size: 0.75rem;
	}

	.action-btn.edit {
		background: #dbeafe;
		color: #1d4ed8;
	}

	.action-btn.edit:hover {
		background: #bfdbfe;
	}

	.action-btn.save {
		background: #dcfce7;
		color: #16a34a;
	}

	.action-btn.save:hover {
		background: #bbf7d0;
	}

	.action-btn.cancel {
		background: #f3f4f6;
		color: #374151;
	}

	.action-btn.cancel:hover {
		background: #e5e7eb;
	}

	.empty-row {
		text-align: center;
		color: #6b7280;
		font-style: italic;
		padding: 2rem;
	}

	.add-form {
		padding: 1.5rem;
		background: #f9fafb;
		border-bottom: 1px solid #e5e7eb;
	}

	.form-row {
		display: flex;
		gap: 1rem;
		align-items: end;
		flex-wrap: wrap;
	}

	.form-field {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 150px;
	}

	.form-field.small {
		flex: 0 0 120px;
		min-width: 120px;
	}

	.field-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: #374151;
		margin-bottom: 0.5rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.form-row .form-input {
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 0.875rem;
		transition: all 0.2s ease;
		width: 100%;
	}

	.form-row .form-input.small {
		flex: 0 0 100px;
		min-width: 100px;
	}

	.form-row .form-input:focus {
		outline: none;
		border-color: #dc2626;
		box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
	}

	.add-button {
		background: #dc2626;
		color: white;
		border: none;
		border-radius: 8px;
		padding: 0.75rem 1.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.add-button:hover:not(:disabled) {
		background: #b91c1c;
		transform: translateY(-1px);
		box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);
	}

	.add-button:disabled {
		background: #9ca3af;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}

	.assignments-list {
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.assignment-card {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 1.5rem;
		transition: all 0.2s ease;
	}

	.assignment-card:hover {
		border-color: #dc2626;
		box-shadow: 0 4px 15px rgba(220, 38, 38, 0.1);
		transform: translateY(-1px);
	}

	.assignment-card-with-costs {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 1.5rem;
		transition: all 0.2s ease;
		display: flex;
		gap: 20px;
		min-height: 200px;
	}

	.assignment-card-with-costs:hover {
		border-color: #dc2626;
		box-shadow: 0 4px 15px rgba(220, 38, 38, 0.1);
		transform: translateY(-1px);
	}

	.assignment-info {
		flex: 1;
		min-width: 0;
	}

	.costs-section {
		flex: 1;
		border-left: 1px solid #e5e7eb;
		padding-left: 20px;
		min-width: 300px;
	}

	.costs-section h4 {
		margin: 0 0 12px 0;
		color: #374151;
		font-size: 14px;
		font-weight: 600;
	}

	.add-cost-form {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-bottom: 16px;
		padding: 12px;
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
	}

	.cost-input {
		padding: 6px 8px;
		border: 1px solid #d1d5db;
		border-radius: 4px;
		font-size: 12px;
		transition: border-color 0.2s ease;
	}

	.cost-input:focus {
		outline: none;
		border-color: #dc2626;
		box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
	}

	.add-cost-btn {
		padding: 6px 12px;
		background: #dc2626;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.add-cost-btn:hover:not(:disabled) {
		background: #b91c1c;
	}

	.add-cost-btn:disabled {
		background: #9ca3af;
		cursor: not-allowed;
	}

	.costs-list {
		max-height: 120px;
		overflow-y: auto;
	}

	.cost-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px;
		background: #ffffff;
		border: 1px solid #e5e7eb;
		border-radius: 4px;
		margin-bottom: 6px;
	}

	.cost-details {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.cost-details strong {
		color: #059669;
		font-weight: 600;
	}

	.cost-description {
		font-size: 12px;
		color: #374151;
	}

	.cost-ledger {
		font-size: 10px;
		color: #6b7280;
	}

	.remove-cost-btn {
		background: #dc3545;
		color: white;
		border: none;
		border-radius: 50%;
		width: 20px;
		height: 20px;
		font-size: 12px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color 0.2s ease;
	}

	.remove-cost-btn:hover {
		background: #c82333;
	}

	.no-costs {
		font-size: 12px;
		color: #6b7280;
		font-style: italic;
		margin: 0;
		text-align: center;
		padding: 12px;
	}

	.assignment-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}

	.assignment-header strong {
		font-size: 1.1rem;
		color: #1f2937;
	}

	.function-badge,
	.status-badge,
	.airline-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.function-badge.pickup { background: #dbeafe; color: #1d4ed8; }
	.function-badge.delivery { background: #dcfce7; color: #16a34a; }
	.function-badge.transport { background: #fef3c7; color: #d97706; }
	.function-badge.customs { background: #f3e8ff; color: #7c3aed; }

	.status-badge.assigned { background: #e0e7ff; color: #3730a3; }
	.status-badge.dispatched { background: #fef3c7; color: #d97706; }
	.status-badge.completed { background: #dcfce7; color: #16a34a; }
	.status-badge.cancelled { background: #fee2e2; color: #dc2626; }
	.status-badge.created { background: #e0e7ff; color: #3730a3; }
	.status-badge.confirmed { background: #dbeafe; color: #1d4ed8; }
	.status-badge.transit { background: #fef3c7; color: #d97706; }
	.status-badge.delivered { background: #dcfce7; color: #16a34a; }

	.airline-badge {
		background: #f0f9ff;
		color: #0369a1;
	}

	.assignment-details {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.assignment-details p {
		margin: 0;
		font-size: 0.875rem;
		color: #4b5563;
	}

	.detail-row {
		display: flex;
		gap: 2rem;
		flex-wrap: wrap;
	}

	.detail-row p {
		flex: 1;
		min-width: 200px;
	}

	.assignment-actions {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.action-btn {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		text-transform: uppercase;
	}

	.action-btn.complete {
		background: #dcfce7;
		color: #16a34a;
	}

	.action-btn.complete:hover {
		background: #bbf7d0;
		transform: translateY(-1px);
	}

	.action-btn.transit {
		background: #fef3c7;
		color: #d97706;
	}

	.action-btn.transit:hover {
		background: #fde68a;
		transform: translateY(-1px);
	}

	.action-btn.remove {
		background: #fee2e2;
		color: #dc2626;
	}

	.action-btn.remove:hover {
		background: #fecaca;
		transform: translateY(-1px);
	}

	.empty-state {
		text-align: center;
		padding: 2rem;
		color: #6b7280;
		font-style: italic;
	}

	/* Quote Breakdown Styles */
	.quote-breakdown {
		background: white;
		border-radius: 16px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
		overflow: hidden;
	}

	.quote-header {
		background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
		padding: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.quote-header h4 {
		margin: 0;
		font-size: 1.25rem;
		color: #1f2937;
		font-weight: 600;
	}

	.quote-date {
		font-size: 0.875rem;
		color: #6b7280;
		margin: 0;
	}

	.quote-items {
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.quote-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		background: linear-gradient(135deg, #ffffff, #f8fafc);
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		transition: all 0.2s ease;
	}

	.quote-item:hover {
		border-color: #ea580c;
		box-shadow: 0 2px 8px rgba(234, 88, 12, 0.1);
	}

	.quote-item.total {
		background: linear-gradient(135deg, #ea580c, #dc2626);
		color: white;
		font-weight: 700;
		border-color: #ea580c;
		margin-top: 0.5rem;
		box-shadow: 0 4px 15px rgba(234, 88, 12, 0.3);
	}

	.charge-code {
		font-weight: 600;
		font-size: 0.875rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.charge-amount {
		font-weight: 700;
		font-size: 1rem;
		font-family: 'Courier New', monospace;
	}

	.quote-disclaimer {
		padding: 1rem 1.5rem;
		background: #f9fafb;
		border-top: 1px solid #e5e7eb;
		font-size: 0.75rem;
		color: #6b7280;
		font-style: italic;
		text-align: center;
	}

	.loading-state, .empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.empty-state h3 {
		color: #1f2937;
		margin: 0 0 0.5rem 0;
		font-size: 1.5rem;
	}

	.empty-state p {
		color: #6b7280;
		margin: 0;
	}

	/* Mobile responsiveness for management sections */
	@media (max-width: 768px) {
		.form-row {
			flex-direction: column;
			align-items: stretch;
		}

		.form-row .form-input {
			min-width: auto;
		}

		.assignment-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.detail-row {
			flex-direction: column;
			gap: 0.5rem;
		}

		.detail-row p {
			min-width: auto;
		}

		.assignment-actions {
			justify-content: center;
		}

		.quote-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}
	}
</style> 