<!-- Add New Job - Operations -->
<script lang="ts">
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { getCurrentUser, signOut } from '$lib/auth'
	import { getCurrentUserProfile } from '$lib/userService'
	import { supabase } from '$lib/supabase'
	import type { User } from '@supabase/supabase-js'
	import type { UserProfile } from '$lib/types'
	import { validateAddress, buildAddressString, findNearestAirportWithRoute, findMultipleAirportsWithRoutes, type ValidatedAddress, type AirportRouteInfo } from '$lib/services/googleMapsService'
	import { searchFlightsForJobCreation, computeRecommendedFlightAndETA, filterOutRegionalAircraft, type FlightRecommendation } from '$lib/flightalgo/flightSelection'
	import { saveFlightEstimatesToTimetable } from '$lib/services/timetableService'
	import { updateAWBWithFlightMetadata } from '$lib/services/awbService'
	import AddressMap from '$lib/components/AddressMap.svelte'
	import { computeNetjetsQuote, buildNetjetsInputFromJobForm, saveQuoteToDatabase, ensureJobHasQuote, type NetjetsQuoteBreakdown } from '$lib/Quoting/netjets'
	import { createAWBFromFlightData, type FlightData, type JobDataForAWB } from '$lib/services/awbService'
	
	let user: User | null = null
	let userProfile: UserProfile | null = null
	let loading = false
	let saving = false
	let customers: any[] = []
	let filteredCustomers: any[] = []
	let customerSearchQuery = ''
	let selectedCustomer: any = null
	let showCustomerDropdown = false
	let message = ''
	let success = false
	let validationErrors: Record<string, string> = {}

	// Address validation state
	let validatingShipperAddress = false
	let validatingConsigneeAddress = false
	let shipperValidatedAddress: ValidatedAddress | null = null
	let consigneeValidatedAddress: ValidatedAddress | null = null
	let addressValidationErrors: Record<string, string> = {}
	let addressesValidated = false

	// Flight search state
	let searchingFlights = false
	let flightResults: any = null
	let flightRecommendation: FlightRecommendation | null = null
	let flightSearchError = ''
	let originAirport = '' // Shipper's nearest airport
	let destinationAirport = '' // Consignee's nearest airport
	let shipperAirportRoute: AirportRouteInfo | null = null
	let consigneeAirportRoute: AirportRouteInfo | null = null
	let earliestReadyToFlyISO = ''
	let recommendedFlightId: string | null = null
	let estimatedDeliveryISO: string | null = null
	let selectedFlightData: FlightData | null = null

	// Address search helpers
	let shipperSearchQuery = ''
	let consigneeSearchQuery = ''
	let searchingShipper = false
	let searchingConsignee = false
	
	// Helper functions
	function getTodaysDate(): string {
		const today = new Date()
		return today.toISOString().split('T')[0]
	}
	
	function getCurrentTime(): string {
		const now = new Date()
		return now.toTimeString().slice(0, 5)
	}

	function generateJobno(jobNumber: string, jobType: string): string {
		if (!jobNumber) return ''
		const typeCode = jobType === 'call' ? 'C' : 'M'
		return jobNumber + typeCode
	}

	// Job data structure
	let jobData = {
		jobnumber: '',
		jobno: '',
		bol_number: '',
		po_number: '',
		commodity: '',
		pieces: 1,
		weight: 1,
		weight_unit: 'lbs',
		service_type: 'NFO',
		job_type: 'call',
		
		// Customer information (required)
		customer_id: '',
		customer_name: '',
		
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
		
		// Timing
		ready_date: getTodaysDate(),
		ready_time: getCurrentTime()
	}

	async function applyValidatedToForm(validated: ValidatedAddress, type: 'shipper' | 'consignee') {
		const street = [
			validated.components.street_number,
			validated.components.route
		].filter(Boolean).join(' ')

		if (type === 'shipper') {
			jobData.shipper_address1 = street || validated.formatted
			jobData.shipper_city = validated.components.locality || ''
			jobData.shipper_state = validated.components.administrative_area_level_1 || ''
			jobData.shipper_zip = validated.components.postal_code || ''
			shipperValidatedAddress = validated
		} else {
			jobData.consignee_address1 = street || validated.formatted
			jobData.consignee_city = validated.components.locality || ''
			jobData.consignee_state = validated.components.administrative_area_level_1 || ''
			jobData.consignee_zip = validated.components.postal_code || ''
			consigneeValidatedAddress = validated
		}
	}

	async function searchAndFill(type: 'shipper' | 'consignee') {
		try {
			if (type === 'shipper') {
				if (!shipperSearchQuery.trim()) return
				searchingShipper = true
				const validated = await validateAddress(shipperSearchQuery.trim())
				if (validated) await applyValidatedToForm(validated, 'shipper')
			} else {
				if (!consigneeSearchQuery.trim()) return
				searchingConsignee = true
				const validated = await validateAddress(consigneeSearchQuery.trim())
				if (validated) await applyValidatedToForm(validated, 'consignee')
			}
		} finally {
			searchingShipper = false
			searchingConsignee = false
		}
	}

	function clearAddressValidation(type: 'shipper' | 'consignee') {
		if (type === 'shipper') {
			shipperValidatedAddress = null
			addressValidationErrors.shipper = ''
		} else {
			consigneeValidatedAddress = null
			addressValidationErrors.consignee = ''
		}
		// Clear flight results when address changes
		flightResults = null
		flightSearchError = ''
		originAirport = ''
		destinationAirport = ''
		shipperAirportRoute = null
		consigneeAirportRoute = null
		earliestReadyToFlyISO = ''
		recommendedFlightId = null
		estimatedDeliveryISO = null
		addressesValidated = false
	}

	onMount(async () => {
		loading = true
		try {
			user = await getCurrentUser()
			if (!user) {
				goto('/')
				return
			}
			userProfile = await getCurrentUserProfile()
			await loadCustomers()
		} catch (error) {
			console.error('Error loading user data:', error)
			goto('/')
		} finally {
			loading = false
		}
	})

	async function loadCustomers() {
		try {
			const { data, error } = await supabase
				.from('customers')
				.select('id, name, contact_email, account_number')
				.order('name')
			
			if (error) {
				console.error('Error loading customers:', error)
				return
			}
			
			customers = data || []
			filteredCustomers = customers
		} catch (err) {
			console.error('Error in loadCustomers:', err)
		}
	}

	function handleCustomerSearch() {
		if (!customerSearchQuery.trim()) {
			filteredCustomers = customers
			showCustomerDropdown = customers.length > 0
			return
		}
		
		const query = customerSearchQuery.toLowerCase().trim()
		filteredCustomers = customers.filter(customer => 
			customer.name?.toLowerCase().includes(query) ||
			customer.contact_email?.toLowerCase().includes(query) ||
			customer.account_number?.toLowerCase().includes(query)
		)
		showCustomerDropdown = filteredCustomers.length > 0
	}

	function selectCustomer(customer: any) {
		selectedCustomer = customer
		jobData.customer_id = customer.id
		jobData.customer_name = customer.name
		customerSearchQuery = customer.name
		showCustomerDropdown = false
		validationErrors.customer_id = ''
	}

	function clearCustomerSelection() {
		selectedCustomer = null
		jobData.customer_id = ''
		jobData.customer_name = ''
		customerSearchQuery = ''
		showCustomerDropdown = false
	}

	// --- Helpers for timing calculations ---
	function addMinutes(date: Date, minutes: number): Date {
		const d = new Date(date)
		d.setMinutes(d.getMinutes() + minutes)
		return d
	}

	function combineDateAndTime(dateStr: string, timeStr: string): Date {
		return new Date(`${dateStr}T${timeStr || '00:00'}:00`)
	}

	function formatISO(dt: Date): string {
		return dt.toISOString()
	}

	function getHHmm(dt: Date): string {
		const hh = dt.getHours().toString().padStart(2, '0')
		const mm = dt.getMinutes().toString().padStart(2, '0')
		return `${hh}:${mm}`
	}

	function nextNDates(startDate: string, n: number): string[] {
		const dates: string[] = []
		const base = new Date(`${startDate}T00:00:00`)
		for (let i = 0; i < n; i++) {
			const d = new Date(base)
			d.setDate(base.getDate() + i)
			dates.push(d.toISOString().slice(0, 10))
		}
		return dates
	}

	// Removed: filterOutRegionalAircraft - now using centralized version from flightSelection.ts

	// Removed: searchFlightsForDates - now using centralized version from flightSelection.ts

	// Removed: computeRecommendedFlightAndETA - now using centralized version from flightSelection.ts

	// --- Netjets Quote calculation ---
	function poundsFromForm(): number {
		const w = Number(jobData.weight || 0)
		if (!w || isNaN(w)) return 0
		return (jobData.weight_unit === 'kg') ? w * 2.20462 : w
	}

	// Compute Netjets quote reactively
	$: netjetsQuote = (() => {
		try {
			const quoteInput = {
				...buildNetjetsInputFromJobForm({
					...jobData,
					shipper_miles: shipperAirportRoute?.distance_miles || 0,
					consignee_miles: consigneeAirportRoute?.distance_miles || 0,
					weight: poundsFromForm(),
					shipper_state: jobData.shipper_state,
					consignee_state: jobData.consignee_state,
					shipper_city: jobData.shipper_city
				})
			}
			return computeNetjetsQuote(quoteInput)
		} catch (e) {
			return null
		}
	})()

	async function generateJobNumber(): Promise<string> {
		try {
			const { data: { session } } = await supabase.auth.getSession()
			if (!session) {
				return '3000001'
			}
			
			const { data, error } = await supabase
				.from('jobsfile')
				.select('jobnumber')
				.like('jobnumber', '3%')
				.order('jobnumber', { ascending: false })
				.limit(1)
			
			if (error) {
				console.error('Error fetching job numbers:', error)
				return '3000001'
			}
			
			let nextNumber = 3000001
			
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

	/**
	 * Validates both addresses and searches for flights between nearest airports
	 */
	async function validateAddressesAndSearchFlights() {
		// Check if both addresses are filled
		const shipperAddressString = buildAddressString(
			jobData.shipper_address1 || '',
			'',
			jobData.shipper_city || '',
			jobData.shipper_state || '',
			jobData.shipper_zip || ''
		)
		
		const consigneeAddressString = buildAddressString(
			jobData.consignee_address1 || '',
			'',
			jobData.consignee_city || '',
			jobData.consignee_state || '',
			jobData.consignee_zip || ''
		)

		if (!shipperAddressString.trim()) {
			flightSearchError = 'Please fill in the shipper address fields'
			return
		}

		if (!consigneeAddressString.trim()) {
			flightSearchError = 'Please fill in the consignee address fields'
			return
		}

		// Clear previous results
		validatingShipperAddress = true
		validatingConsigneeAddress = true
		searchingFlights = true
		flightSearchError = ''
		flightResults = null
		originAirport = ''
		destinationAirport = ''
		addressValidationErrors = {}
		addressesValidated = false

		try {
			console.log('🔍 Validating both addresses and finding airports...')

			// Validate both addresses in parallel
			const [shipperValidated, consigneeValidated] = await Promise.all([
				validateAddress(shipperAddressString),
				validateAddress(consigneeAddressString)
			])

			if (!shipperValidated) {
				throw new Error('Could not validate shipper address. Please check the details.')
			}

			if (!consigneeValidated) {
				throw new Error('Could not validate consignee address. Please check the details.')
			}

			// Update validated addresses
			shipperValidatedAddress = shipperValidated
			consigneeValidatedAddress = consigneeValidated

			// Update form fields with validated components
			if (shipperValidated.components.locality && !jobData.shipper_city) {
				jobData.shipper_city = shipperValidated.components.locality
			}
			if (shipperValidated.components.administrative_area_level_1 && !jobData.shipper_state) {
				jobData.shipper_state = shipperValidated.components.administrative_area_level_1
			}
			if (shipperValidated.components.postal_code && !jobData.shipper_zip) {
				jobData.shipper_zip = shipperValidated.components.postal_code
			}

			if (consigneeValidated.components.locality && !jobData.consignee_city) {
				jobData.consignee_city = consigneeValidated.components.locality
			}
			if (consigneeValidated.components.administrative_area_level_1 && !jobData.consignee_state) {
				jobData.consignee_state = consigneeValidated.components.administrative_area_level_1
			}
			if (consigneeValidated.components.postal_code && !jobData.consignee_zip) {
				jobData.consignee_zip = consigneeValidated.components.postal_code
			}

			console.log('✅ Both addresses validated, finding nearest airports...')

			// Find nearest airports for both addresses in parallel
			const [shipperAirportResult, consigneeAirportResult] = await Promise.all([
				findNearestAirportWithRoute(shipperValidated.latitude, shipperValidated.longitude),
				findNearestAirportWithRoute(consigneeValidated.latitude, consigneeValidated.longitude)
			])

			if (!shipperAirportResult || !shipperAirportResult.airport) {
				throw new Error('No nearby airports found for shipper address')
			}

			if (!consigneeAirportResult || !consigneeAirportResult.airport) {
				throw new Error('No nearby airports found for consignee address')
			}

			originAirport = shipperAirportResult.airport.iata_code || ''
			destinationAirport = consigneeAirportResult.airport.iata_code || ''
			shipperAirportRoute = shipperAirportResult
			consigneeAirportRoute = consigneeAirportResult

			if (!originAirport) {
				throw new Error('Shipper airport found but no IATA code available')
			}

			if (!destinationAirport) {
				throw new Error('Consignee airport found but no IATA code available')
			}

			console.log(`✈️ Origin airport: ${originAirport}, Destination airport: ${destinationAirport}`)
			// Mark addresses as validated so maps section can render
			addressesValidated = true

			// Check Ready Date
			const departureDate = jobData.ready_date
			if (!departureDate) {
				throw new Error('Please set a Ready Date first before searching flights')
			}
			
			const readyDate = new Date(departureDate)
			const today = new Date()
			today.setHours(0, 0, 0, 0)
			
			if (readyDate < today) {
				throw new Error('Ready Date must be in the future. Please update the Ready Date.')
			}

			// Compute earliest feasible departure: ready + drive to origin + 90 min
			const baseReady = combineDateAndTime(jobData.ready_date as string, jobData.ready_time as string)
			const driveToOriginMins = shipperAirportRoute?.duration_minutes || 0
			const earliest = addMinutes(addMinutes(baseReady, driveToOriginMins), 90)
			earliestReadyToFlyISO = earliest.toISOString()

			// Multi-day search (base day + next day), enforce earliest time on day 0
			console.log(`🛫 Searching flights (2 days): ${originAirport} → ${destinationAirport}`)
			const merged = await searchFlightsForJobCreation(originAirport, destinationAirport, departureDate, earliestReadyToFlyISO)
			flightResults = merged

			console.log(`✅ Found ${flightResults.summary?.totalOffers || 0} flights over 2 days (after filtering)`)

			// Pick recommended flight and compute ETA at consignee using advanced algorithm
			const destDriveMins = consigneeAirportRoute?.duration_minutes || 0
			const readyDateTime = new Date(earliestReadyToFlyISO)
			
			// Use the advanced flight selection algorithm
			const { selectOptimalFlight } = await import('$lib/flightalgo/flightSelection')
			flightRecommendation = selectOptimalFlight(flightResults, readyDateTime, destDriveMins)
			
			// Extract data for backward compatibility
			recommendedFlightId = flightRecommendation.flightId
			estimatedDeliveryISO = flightRecommendation.etaISO

			// Store the selected flight data for AWB creation
			if (flightRecommendation.flight) {
				selectedFlightData = flightRecommendation.flight
				console.log('🛫 Selected flight data for AWB:', selectedFlightData)
				console.log('🎯 Flight recommendation details:', {
					reasonCode: flightRecommendation.reasonCode,
					explanation: flightRecommendation.explanation,
					flightDetails: flightRecommendation.flightDetails
				})
			}

			// If still no flights, try alternative airports
			if ((flightResults.summary?.totalOffers || 0) === 0) {
				console.log('🔄 No flights found with primary airports (2-day search), trying alternatives for base date...')
				await tryAlternativeAirports(shipperValidated, consigneeValidated, departureDate)
			}

		} catch (error: any) {
			console.error('❌ Address validation or flight search failed:', error)
			flightSearchError = error.message || 'Failed to validate addresses or search flights'
		} finally {
			validatingShipperAddress = false
			validatingConsigneeAddress = false
			searchingFlights = false
		}
	}

	/**
	 * Try alternative airports when no flights are found with primary airports
	 */
	async function tryAlternativeAirports(shipperValidated: ValidatedAddress, consigneeValidated: ValidatedAddress, departureDate: string) {
		try {
			console.log('🔍 Finding alternative airports for both locations...')
			
			// Get multiple airports for both locations
			const [shipperAirports, consigneeAirports] = await Promise.all([
				findMultipleAirportsWithRoutes(shipperValidated.latitude, shipperValidated.longitude, 3),
				findMultipleAirportsWithRoutes(consigneeValidated.latitude, consigneeValidated.longitude, 3)
			])

			console.log(`📍 Found ${shipperAirports.length} shipper airports and ${consigneeAirports.length} consignee airports`)

			// Try different combinations of airports
			for (const shipperAirport of shipperAirports) {
				if (!shipperAirport.airport.iata_code) continue
				
				for (const consigneeAirport of consigneeAirports) {
					if (!consigneeAirport.airport.iata_code) continue
					
					const altOrigin = shipperAirport.airport.iata_code
					const altDestination = consigneeAirport.airport.iata_code
					
					// Skip if it's the same combination we already tried
					if (altOrigin === originAirport && altDestination === destinationAirport) {
						continue
					}
					
					console.log(`🛫 Trying alternative route: ${altOrigin} → ${altDestination}`)
					
					try {
						const params = new URLSearchParams({
							origin: altOrigin,
							destination: altDestination,
							departureDate: departureDate,
							adults: '1',
							children: '0',
							infants: '0',
							nonStop: 'false',
							currency: 'USD',
							max: '20'
						})

						const response = await fetch(`/api/flights/search?${params.toString()}`)
						const altData = await response.json()

						if (response.ok && altData.flights) {
							// Use the centralized filtering from flightSelection.ts
							altData.flights.direct = filterOutRegionalAircraft(altData.flights.direct || [])
							altData.flights.connecting = filterOutRegionalAircraft(altData.flights.connecting || [])
							altData.flights.all = filterOutRegionalAircraft(altData.flights.all || [])
							
							altData.summary.directFlights = altData.flights.direct.length
							altData.summary.connectingFlights = altData.flights.connecting.length
							altData.summary.totalOffers = altData.flights.all.length

							if (altData.summary?.totalOffers > 0) {
								console.log(`✅ Found ${altData.summary.totalOffers} flights with alternative route: ${altOrigin} → ${altDestination}`)
								
								// Update the airports and results
								originAirport = altOrigin
								destinationAirport = altDestination
								flightResults = altData
								
								// Store flight data for AWB creation
								if (altData.flights?.all && altData.flights.all.length > 0) {
									selectedFlightData = altData.flights.all[0]
									console.log('🛫 Alternative flight selected for AWB:', selectedFlightData)
								}
								
								return // Success! Exit the function
							}
						}
					} catch (altError) {
						console.warn(`Failed to search flights for ${altOrigin} → ${altDestination}:`, altError)
					}
				}
			}
			
			console.log('⚠️ No flights found even with alternative airports')
			flightSearchError = `No flights found between any nearby airports on ${departureDate} (after filtering out regional aircraft). Try a different date or check back later.`
			
		} catch (error) {
			console.error('❌ Failed to try alternative airports:', error)
		}
	}

	// Format price
	function formatPrice(price: number, currency: string = 'USD'): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: currency
		}).format(price)
	}

	// Format date/time
	function formatDateTime(dateString?: string): string {
		if (!dateString) return 'N/A'
		return new Date(dateString).toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		})
	}

	function selectFeaturedFlights(all: any[]) {
		if (!Array.isArray(all)) return { earliest: null, fastest: null, cheapest: null }
		// Same-day-or-later filter is already applied upstream for recommendation
		const sortedByDeparture = [...all].sort((a, b) => new Date(a.enhanced?.departureTime || 0).getTime() - new Date(b.enhanced?.departureTime || 0).getTime())
		const earliest = sortedByDeparture[0] || null
		const fastest = [...all].sort((a, b) => (a.enhanced?.totalDurationMinutes || 1e9) - (b.enhanced?.totalDurationMinutes || 1e9))[0] || null
		const cheapest = [...all].sort((a, b) => parseFloat(a.price?.total || '1e9') - parseFloat(b.price?.total || '1e9'))[0] || null
		return { earliest, fastest, cheapest }
	}

	function filterFlightsFromReadyDate(all: any[], baseDate: string) {
		if (!Array.isArray(all) || !baseDate) return all || []
		const readyDay = new Date(`${baseDate}T00:00:00`)
		readyDay.setHours(0, 0, 0, 0)
		return all
			.filter((f: any) => {
				const dep = new Date(f?.enhanced?.departureTime || 0)
				const depDay = new Date(dep)
				depDay.setHours(0, 0, 0, 0)
				return depDay.getTime() >= readyDay.getTime()
			})
			.sort((a: any, b: any) => new Date(a.enhanced?.departureTime || 0).getTime() - new Date(b.enhanced?.departureTime || 0).getTime())
	}

	async function createNewJob() {
		saving = true
		message = ''
		success = false
		validationErrors = {}
		
		try {
			// Validation
			if (!jobData.customer_id) {
				validationErrors.customer_id = 'Customer selection is required'
			}
			if (!jobData.commodity.trim()) {
				validationErrors.commodity = 'Commodity is required'
			}
			if (!jobData.shipper_name.trim()) {
				validationErrors.shipper_name = 'Shipper name is required'
			}
			if (!jobData.consignee_name.trim()) {
				validationErrors.consignee_name = 'Consignee name is required'
			}

			if (Object.keys(validationErrors).length > 0) {
				message = 'Please fix the validation errors below'
				saving = false
				return
			}

			// Generate job number
		jobData.jobnumber = await generateJobNumber()
		jobData.jobno = generateJobno(jobData.jobnumber, jobData.job_type)

			// Get current user
			const { data: { user } } = await supabase.auth.getUser()
			
			// Insert job into database
			const { data, error } = await supabase
				.from('jobsfile')
				.insert([{
					jobnumber: jobData.jobnumber,
					jobno: jobData.jobno,
					bol_number: jobData.bol_number || null,
					po_number: jobData.po_number || null,
					commodity: jobData.commodity,
					pieces: jobData.pieces,
					weight: jobData.weight,
					service_type: jobData.service_type,
					job_type: jobData.job_type,
					
					customer_id: jobData.customer_id,
					customer_name: jobData.customer_name,
					account_number: selectedCustomer?.account_number || null,
					
					shipper_name: jobData.shipper_name,
					shipper_address1: jobData.shipper_address1 || null,
					shipper_address2: jobData.shipper_address2 || null,
					shipper_city: jobData.shipper_city || null,
					shipper_state: jobData.shipper_state || null,
					shipper_zip: jobData.shipper_zip || null,
					shipper_phone: jobData.shipper_phone || null,
					shipper_contact: jobData.shipper_contact || null,
					
					consignee_name: jobData.consignee_name,
					consignee_address1: jobData.consignee_address1 || null,
					consignee_address2: jobData.consignee_address2 || null,
					consignee_city: jobData.consignee_city || null,
					consignee_state: jobData.consignee_state || null,
					consignee_zip: jobData.consignee_zip || null,
					consignee_phone: jobData.consignee_phone || null,
					consignee_contact: jobData.consignee_contact || null,
					
					ready_date: jobData.ready_date,
					ready_time: jobData.ready_time,
					
					status: 'dispatch',
					created_by: user?.id || null,
					created_at: new Date().toISOString()
				}])
			
			if (error) {
				console.error('Error creating job:', error)
				message = 'Error creating job: ' + error.message
				saving = false
				return
			}
			
			console.log('✅ Job created successfully, now creating AWB...')
			
			// Create AWB automatically if we have flight data
			try {
				const jobDataForAWB: JobDataForAWB = {
					jobno: jobData.jobno,
					jobnumber: jobData.jobnumber, // Keep for backward compatibility
					pieces: jobData.pieces,
					weight: jobData.weight,
					weight_unit: jobData.weight_unit,
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
					message = `Job ${jobData.jobno} created successfully! AWB: ${awbResult.awbNumber}`
				} else {
					console.warn('⚠️ Job created but AWB creation failed:', awbResult.error)
					message = `Job ${jobData.jobno} created successfully! (AWB creation failed: ${awbResult.error})`
				}
			} catch (awbError) {
				console.error('Error creating AWB:', awbError)
				message = `Job ${jobData.jobno} created successfully! (AWB creation failed)`
			}
			
			// Save flight timing estimates to timetable and metadata to AWB
			try {
				if (flightRecommendation && originAirport && destinationAirport) {
					console.log('📅 Saving flight timing estimates to timetable...')
					const timetableResult = await saveFlightEstimatesToTimetable(
						jobData.jobno,
						flightRecommendation
					)
					if (timetableResult.success) {
						console.log('✅ Flight timing estimates saved to timetable successfully')
					} else {
						console.warn('⚠️ Flight timing estimates saving failed:', timetableResult.error)
					}

					console.log('🛫 Updating AWB with flight metadata...')
					const awbMetadataResult = await updateAWBWithFlightMetadata(
						jobData.jobno,
						flightRecommendation,
						originAirport,
						destinationAirport
					)
					if (awbMetadataResult.success) {
						console.log('✅ AWB updated with flight metadata successfully')
					} else {
						console.warn('⚠️ AWB flight metadata update failed:', awbMetadataResult.error)
					}
				}
			} catch (flightDataError) {
				console.error('Error saving flight data:', flightDataError)
			}

			// Ensure every job has a quote (detailed if available, basic otherwise)
			try {
				console.log('💰 Ensuring job has quote...')
				const quoteResult = await ensureJobHasQuote(supabase, jobData.jobnumber, jobData, netjetsQuote)
				if (quoteResult.success) {
					console.log(`✅ Quote saved successfully (${quoteResult.quoteType})`)
				} else {
					console.warn('⚠️ Quote creation failed:', quoteResult.error)
				}
			} catch (quoteError) {
				console.error('Error ensuring quote:', quoteError)
			}
			
			success = true
			
			// Navigate to job detail page
			setTimeout(() => {
				goto(`/dashboard/operations/jobs/${jobData.jobno}`)
			}, 1500)
			
		} catch (error) {
			console.error('Error creating job:', error)
			message = 'An unexpected error occurred'
		} finally {
			saving = false
		}
	}

	async function handleSignOut() {
		await signOut()
		goto('/')
	}

	// Reactive statements
	$: if (customerSearchQuery !== undefined) {
		handleCustomerSearch()
	}

	$: jobData.jobno = generateJobno(jobData.jobnumber, jobData.job_type)
</script>

<svelte:head>
	<title>Add New Job - Operations</title>
</svelte:head>

<div class="job-container">
	<div class="main-content">
		<!-- Header -->
		<div class="header-section">
			<div class="header-content">
				<h1 class="page-title">Add New Job</h1>
				<p class="page-subtitle">Create a new job with customer assignment</p>
			</div>
		</div>

		<!-- Navigation -->
		<div class="nav-section">
			<button class="nav-link" onclick={() => goto('/dashboard/operations')}>
				⬅ Back to Operations
			</button>
		</div>

		<!-- User Information -->
		{#if user && userProfile}
			<div class="user-info">
				<p class="status-text">Status: <span class="highlight">Operations Access</span></p>
				<p class="function-text">Function: Job Creation</p>
			</div>
		{/if}

		{#if loading}
			<div class="loading-state">
				<div class="loading-spinner"></div>
				<p>Loading...</p>
			</div>
		{:else}
			<!-- Job Creation Form -->
			<form onsubmit={(e) => { e.preventDefault(); createNewJob(); }} class="job-form">
					<!-- Customer Selection (Required) -->
				<div class="form-section">
					<h2>Customer Information</h2>
						<div class="customer-search-section">
						<label for="customer_search">Customer (Required) *</label>
							<div class="search-container">
								<input 
									type="text"
								id="customer_search"
									bind:value={customerSearchQuery}
									placeholder="Search customers by name, email, or account number..."
									class="search-input"
									class:error={validationErrors.customer_id}
								onfocus={() => showCustomerDropdown = filteredCustomers.length > 0}
								onblur={() => setTimeout(() => showCustomerDropdown = false, 200)}
								/>
								{#if selectedCustomer}
								<button type="button" class="clear-customer" onclick={clearCustomerSelection}>
										✕
									</button>
								{/if}
								
								{#if showCustomerDropdown && filteredCustomers.length > 0}
									<div class="customer-dropdown">
										{#each filteredCustomers as customer (customer.id)}
											<div 
												class="customer-option"
											onclick={() => selectCustomer(customer)}
											onkeydown={(e) => e.key === 'Enter' && selectCustomer(customer)}
												role="button"
												tabindex="0"
											>
												<div class="customer-name">{customer.name}</div>
												<div class="customer-details">
													{customer.contact_email}
													{#if customer.account_number}
														• #{customer.account_number}
													{/if}
												</div>
											</div>
										{/each}
									</div>
								{/if}
							</div>
							{#if validationErrors.customer_id}
								<span class="error-text">{validationErrors.customer_id}</span>
							{/if}
							{#if selectedCustomer}
								<div class="selected-customer">
									<span class="selected-label">Selected:</span>
									<span class="selected-name">{selectedCustomer.name}</span>
									{#if selectedCustomer.account_number}
										<span class="selected-account">#{selectedCustomer.account_number}</span>
									{/if}
								</div>
							{/if}
						</div>
					</div>

				<!-- Job Information Section -->
				<div class="form-section">
					<h2>Job Information</h2>
					<div class="form-grid">
						<div class="form-group">
							<label for="jobno">Job No</label>
							<input type="text" id="jobno" value={jobData.jobnumber || 'Auto-generated'} class="form-input" readonly />
						</div>

						<div class="form-group">
							<label for="bol_number">BOL Number</label>
							<input type="text" id="bol_number" bind:value={jobData.bol_number} class="form-input" />
						</div>

						<div class="form-group">
							<label for="po_number">PO Number</label>
							<input type="text" id="po_number" bind:value={jobData.po_number} class="form-input" />
					</div>

						<div class="form-group">
							<label for="commodity">Commodity *</label>
							<input 
								type="text" 
								id="commodity" 
								bind:value={jobData.commodity}
								class="form-input"
								class:error={validationErrors.commodity}
								placeholder="e.g., Electronics, Documents, Medical Supplies"
								required 
							/>
							{#if validationErrors.commodity}<span class="error-text">{validationErrors.commodity}</span>{/if}
						</div>

						<div class="form-group">
							<label for="pieces">Number of Pieces *</label>
							<input 
								type="number" 
								id="pieces" 
								bind:value={jobData.pieces}
								class="form-input"
								class:error={validationErrors.pieces}
								min="1" 
								max="9999"
								required 
							/>
							{#if validationErrors.pieces}<span class="error-text">{validationErrors.pieces}</span>{/if}
						</div>

						<div class="form-group">
							<label for="weight">Weight *</label>
							<div class="input-group">
								<input 
									type="number" 
									id="weight" 
									bind:value={jobData.weight}
									class="form-input"
									class:error={validationErrors.weight}
									min="1" 
									step="1"
									required 
								/>
								<select bind:value={jobData.weight_unit} class="form-input" class:error={validationErrors.weight_unit}>
									<option value="kg">kg</option>
									<option value="lbs">lbs</option>
								</select>
						</div>
							{#if validationErrors.weight}<span class="error-text">{validationErrors.weight}</span>{/if}
							{#if validationErrors.weight_unit}<span class="error-text">{validationErrors.weight_unit}</span>{/if}
						</div>

						<div class="form-group">
							<label for="service_type">Service Type</label>
							<select bind:value={jobData.service_type} id="service_type" class="form-input">
								<option value="NFO">NFO</option>
								<option value="NDO">NDO</option>
								<option value="OBC">OBC</option>
								<option value="CHAR">Charter</option>
							</select>
						</div>

						<div class="form-group">
							<label for="job_type">Job Type</label>
							<select bind:value={jobData.job_type} id="job_type" class="form-input">
								<option value="call">Call</option>
								<option value="email">Email</option>
								<option value="web">Web</option>
								<option value="placement">Placement</option>
								<option value="return">Return</option>
							</select>
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
								bind:value={jobData.ready_date}
								class="form-input"
								class:error={validationErrors.ready_date}
								required 
							/>
							{#if validationErrors.ready_date}<span class="error-text">{validationErrors.ready_date}</span>{/if}
						</div>

						<div class="form-group">
							<label for="ready_time">Ready Time *</label>
							<input 
								type="time" 
								id="ready_time" 
								bind:value={jobData.ready_time}
								class="form-input"
								class:error={validationErrors.ready_time}
								required 
							/>
							{#if validationErrors.ready_time}<span class="error-text">{validationErrors.ready_time}</span>{/if}
						</div>
						</div>
					</div>

				<!-- Shipper and Consignee Information Section -->
				<div class="form-section">
					<h2>Shipper & Consignee Information</h2>
					<div class="address-forms-container">
						<!-- Shipper Information -->
						<div class="address-form-column">
							<h3>📦 Shipper (From)</h3>
							<div class="form-grid">

							<div class="form-group full-width" style="margin-bottom: 1rem;">
								<label for="shipper_search">Search Address or Airport</label>
								<div class="input-group">
									<input 
										type="text" 
										id="shipper_search" 
										placeholder="e.g., JFK Airport, New York"
										value={shipperSearchQuery}
										oninput={(e) => { shipperSearchQuery = (e.target as HTMLInputElement).value; }}
										class="form-input"
									/>
									<button type="button" class="btn secondary" onclick={() => searchAndFill('shipper')} disabled={searchingShipper}>
										{searchingShipper ? 'Searching...' : 'Search & Fill'}
									</button>
								</div>
								</div>
								<div class="form-group">
							<label for="shipper_name">Company/Name *</label>
							<input 
								type="text" 
								id="shipper_name" 
								bind:value={jobData.shipper_name}
								class="form-input"
								class:error={validationErrors.shipper_name}
								required 
							/>
							{#if validationErrors.shipper_name}<span class="error-text">{validationErrors.shipper_name}</span>{/if}
								</div>

									<div class="form-group">
							<label for="shipper_contact">Contact Person *</label>
							<input 
								type="text" 
								id="shipper_contact" 
								bind:value={jobData.shipper_contact}
								class="form-input"
								class:error={validationErrors.shipper_contact}
								required 
							/>
							{#if validationErrors.shipper_contact}<span class="error-text">{validationErrors.shipper_contact}</span>{/if}
									</div>

									<div class="form-group">
							<label for="shipper_phone">Phone *</label>
							<input 
								type="tel" 
								id="shipper_phone" 
								bind:value={jobData.shipper_phone}
								class="form-input"
								class:error={validationErrors.shipper_phone}
								required 
							/>
							{#if validationErrors.shipper_phone}<span class="error-text">{validationErrors.shipper_phone}</span>{/if}
									</div>

						<div class="form-group full-width">
							<label for="shipper_address1">Address Line 1 *</label>
							<input 
								type="text" 
								id="shipper_address1" 
								bind:value={jobData.shipper_address1}
								oninput={() => clearAddressValidation('shipper')}
								class="form-input"
								class:error={validationErrors.shipper_address1}
								required 
							/>
							{#if validationErrors.shipper_address1}<span class="error-text">{validationErrors.shipper_address1}</span>{/if}
						</div>

									<div class="form-group">
							<label for="shipper_city">City *</label>
							<input 
								type="text" 
								id="shipper_city" 
								bind:value={jobData.shipper_city}
								oninput={() => clearAddressValidation('shipper')}
								class="form-input"
								class:error={validationErrors.shipper_city}
								required 
							/>
							{#if validationErrors.shipper_city}<span class="error-text">{validationErrors.shipper_city}</span>{/if}
									</div>

									<div class="form-group">
							<label for="shipper_state">State/Province *</label>
							<input 
								type="text" 
								id="shipper_state" 
								bind:value={jobData.shipper_state}
								oninput={() => clearAddressValidation('shipper')}
								class="form-input"
								class:error={validationErrors.shipper_state}
								required 
							/>
							{#if validationErrors.shipper_state}<span class="error-text">{validationErrors.shipper_state}</span>{/if}
									</div>

									<div class="form-group">
							<label for="shipper_zip">ZIP/Postal Code *</label>
							<input 
								type="text" 
								id="shipper_zip" 
								bind:value={jobData.shipper_zip}
								oninput={() => clearAddressValidation('shipper')}
								class="form-input"
								class:error={validationErrors.shipper_zip}
								required 
							/>
							{#if validationErrors.shipper_zip}<span class="error-text">{validationErrors.shipper_zip}</span>{/if}
								</div>
							</div>
						</div>

						<!-- Consignee Information -->
						<div class="address-form-column">
							<h3>📍 Consignee (To)</h3>
							<div class="form-grid">

							<!-- Address search for consignee -->
						<div class="form-group full-width" style="margin-bottom: 1rem;">
							<label for="consignee_search">Search Address or Airport</label>
							<div class="input-group">
								<input 
									type="text" 
									id="consignee_search" 
									placeholder="e.g., Los Angeles International Airport"
									value={consigneeSearchQuery}
									oninput={(e) => { consigneeSearchQuery = (e.target as HTMLInputElement).value; }}
									class="form-input"
								/>
								<button type="button" class="btn secondary" onclick={() => searchAndFill('consignee')} disabled={searchingConsignee}>
									{searchingConsignee ? 'Searching...' : 'Search & Fill'}
								</button>
							</div>
						</div>
								<div class="form-group">
								<label for="consignee_name">Company/Name *</label>
								<input 
									type="text" 
									id="consignee_name" 
									bind:value={jobData.consignee_name}
									class="form-input"
									class:error={validationErrors.consignee_name}
									required 
								/>
								{#if validationErrors.consignee_name}<span class="error-text">{validationErrors.consignee_name}</span>{/if}
								</div>

								<div class="form-group">
							<label for="consignee_contact">Contact Person *</label>
							<input 
								type="text" 
								id="consignee_contact" 
								bind:value={jobData.consignee_contact}
								class="form-input"
								class:error={validationErrors.consignee_contact}
								required 
							/>
							{#if validationErrors.consignee_contact}<span class="error-text">{validationErrors.consignee_contact}</span>{/if}
								</div>

								<div class="form-group">
							<label for="consignee_phone">Phone *</label>
							<input 
								type="tel" 
								id="consignee_phone" 
								bind:value={jobData.consignee_phone}
								class="form-input"
								class:error={validationErrors.consignee_phone}
								required 
							/>
							{#if validationErrors.consignee_phone}<span class="error-text">{validationErrors.consignee_phone}</span>{/if}
								</div>

						<div class="form-group full-width">
							<label for="consignee_address1">Address Line 1 *</label>
							<input 
								type="text" 
								id="consignee_address1" 
								bind:value={jobData.consignee_address1}
								oninput={() => clearAddressValidation('consignee')}
								class="form-input"
								class:error={validationErrors.consignee_address1}
								required 
							/>
							{#if validationErrors.consignee_address1}<span class="error-text">{validationErrors.consignee_address1}</span>{/if}
						</div>

									<div class="form-group">
							<label for="consignee_city">City *</label>
							<input 
								type="text" 
								id="consignee_city" 
								bind:value={jobData.consignee_city}
								oninput={() => clearAddressValidation('consignee')}
								class="form-input"
								class:error={validationErrors.consignee_city}
								required 
							/>
							{#if validationErrors.consignee_city}<span class="error-text">{validationErrors.consignee_city}</span>{/if}
									</div>

									<div class="form-group">
							<label for="consignee_state">State/Province *</label>
							<input 
								type="text" 
								id="consignee_state" 
								bind:value={jobData.consignee_state}
								oninput={() => clearAddressValidation('consignee')}
								class="form-input"
								class:error={validationErrors.consignee_state}
								required 
							/>
							{#if validationErrors.consignee_state}<span class="error-text">{validationErrors.consignee_state}</span>{/if}
									</div>

									<div class="form-group">
							<label for="consignee_zip">ZIP/Postal Code *</label>
							<input 
								type="text" 
								id="consignee_zip" 
								bind:value={jobData.consignee_zip}
								oninput={() => clearAddressValidation('consignee')}
								class="form-input"
								class:error={validationErrors.consignee_zip}
								required 
							/>
							{#if validationErrors.consignee_zip}<span class="error-text">{validationErrors.consignee_zip}</span>{/if}
									</div>
								</div>
									</div>
									</div>
								</div>
				
				<!-- Address Validation & Flight Search Section -->
				<div class="form-section">
					
					<div class="validation-button-container">
						<button 
							type="button" 
							class="btn danger validate-and-search-btn"
							onclick={validateAddressesAndSearchFlights}
							disabled={validatingShipperAddress || validatingConsigneeAddress || searchingFlights}
						>
							{#if validatingShipperAddress || validatingConsigneeAddress || searchingFlights}
								<div class="btn-spinner"></div>
								{#if validatingShipperAddress || validatingConsigneeAddress}
									Validating Addresses...
								{:else if searchingFlights}
									Searching Flights...
								{/if}
							{:else}
								<svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
								</svg>
								✈️ Validate Addresses & Find Flights
							{/if}
						</button>
						{#if flightSearchError}
							<div class="error-message">{flightSearchError}</div>
						{/if}
						{#if !jobData.ready_date}
							<div class="validation-hint">
								💡 <strong>Tip:</strong> Set the Ready Date above first to search for flights on that date
							</div>
						{/if}
						</div>
					</div>

				<!-- Address Locations Section -->
				{#if addressesValidated && (shipperValidatedAddress || consigneeValidatedAddress)}
					<div class="form-section">
						<h2>Address Locations</h2>
						<div class="maps-container">
							<h3>📍 Address Locations</h3>
							<div class="maps-grid">
								{#if shipperValidatedAddress}
									<div class="map-wrapper">
										<AddressMap 
											validatedAddress={shipperValidatedAddress} 
											title="Pickup Route (Shipper → Airport {originAirport})"
											height="300px"
											showDetails={true}
											showAirportRoute={true}
										/>
									</div>
								{/if}
								
								{#if consigneeValidatedAddress}
									<div class="map-wrapper">
										<AddressMap 
											validatedAddress={consigneeValidatedAddress} 
											title="Delivery Route (Airport {destinationAirport} → Consignee)"
											height="300px"
											showDetails={true}
											showAirportRoute={true}
										/>
									</div>
								{/if}
							</div>
						</div>
					</div>
				{/if}

				<!-- Flight Information Section -->
				{#if originAirport || destinationAirport || searchingFlights || flightResults || flightSearchError}
					<div class="form-section">
						<h2>Flight Options</h2>
						
						{#if searchingFlights}
							<div class="flight-loading">
								<div class="spinner"></div>
								<p>Finding nearest airports and searching for flights...</p>
							</div>
						{:else if flightSearchError}
							<div class="flight-error">
								<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
								</svg>
								<p>{flightSearchError}</p>
							</div>
						{:else if flightResults && originAirport && destinationAirport}
							<div class="flight-results">
								<div class="flight-summary">
									<h3>✈️ Flights from {originAirport} → {destinationAirport}</h3>
									<div class="flight-stats">
										<span><strong>Departure Date:</strong> {jobData.ready_date || 'Not set'}</span>
										<span><strong>Total Flights:</strong> {flightResults.summary?.totalOffers || 0}</span>
										<span><strong>Direct:</strong> {flightResults.summary?.directFlights || 0}</span>
										<span><strong>Connecting:</strong> {flightResults.summary?.connectingFlights || 0}</span>
										<span class="filter-note">*Regional aircraft filtered out</span>
									</div>
								</div>

								{#if shipperAirportRoute}
									<div class="flight-stats" style="margin-top: 0.5rem;">
										<span><strong>Drive to origin airport:</strong> {Math.round(shipperAirportRoute.duration_minutes)} min</span>
										{#if earliestReadyToFlyISO}
											<span class="earliest-box"><strong>Earliest ready to fly:</strong> {formatDateTime(earliestReadyToFlyISO)}</span>
										{/if}
										{#if estimatedDeliveryISO}
											<span><strong>Estimated delivery:</strong> {formatDateTime(estimatedDeliveryISO)}</span>
										{/if}
									</div>
								{/if}

								<!-- Earliest Available Flights Table -->
								<div class="flight-category">
									<h4>🌟 Earliest Available Flights (starting {jobData.ready_date})</h4>
									<div class="earliest-flights">
																	<table class="earliest-table">
									<thead>
										<tr>
											<th>Departs</th>
											<th>Arrives</th>
											<th>Airlines</th>
											<th>Stops</th>
										</tr>
									</thead>
											<tbody>
												{#key flightResults}
													{#each [
														selectFeaturedFlights(filterFlightsFromReadyDate(flightResults.flights?.all || [], jobData.ready_date || '')).earliest,
														selectFeaturedFlights(filterFlightsFromReadyDate(flightResults.flights?.all || [], jobData.ready_date || '')).fastest,
														selectFeaturedFlights(filterFlightsFromReadyDate(flightResults.flights?.all || [], jobData.ready_date || '')).cheapest
													] as f}
														{#if f}
															<tr class="{recommendedFlightId && f.id === recommendedFlightId ? 'recommended-row' : ''}">
																<td>{formatDateTime(f.enhanced?.departureTime)}</td>
																<td>{formatDateTime(f.enhanced?.arrivalTime)}</td>
																<td>{(f.enhanced?.airlines || []).join(', ')}</td>
																<td>{f.enhanced?.stops || 0}</td>
															</tr>
														{/if}
													{/each}
												{/key}
											</tbody>
										</table>
									</div>
								</div>

								<!-- Direct Flights -->
								{#if flightResults.flights?.direct?.length > 0}
									<div class="flight-category">
										<h4>🛫 Direct Flights ({flightResults.flights.direct.length})</h4>
										<div class="flights-grid">
											{#each flightResults.flights.direct.slice(0, 3) as flight}
												<div class="flight-card direct-flight {recommendedFlightId && flight.id === recommendedFlightId ? 'recommended' : ''}">
													<div class="flight-header">
														<span class="flight-type">Direct</span>
													</div>
													<div class="flight-details">
														<div class="flight-time">
															<strong>Departure:</strong> {formatDateTime(flight.enhanced?.departureTime)}
														</div>
														<div class="flight-time">
															<strong>Arrival:</strong> {formatDateTime(flight.enhanced?.arrivalTime)}
														</div>
														<div class="flight-duration">
															<strong>Duration:</strong> {flight.enhanced?.totalDuration || 'N/A'}
														</div>
														<div class="flight-airline">
															<strong>Airlines:</strong> {flight.enhanced?.airlines?.join(', ') || 'N/A'}
														</div>
														{#if flight.enhanced?.aircraft}
															<div class="flight-aircraft">
																<strong>Aircraft:</strong> {flight.enhanced.aircraft}
															</div>
														{/if}
													</div>
												</div>
											{/each}
										</div>
									</div>
								{/if}

								<!-- Connecting Flights -->
								{#if flightResults.flights?.connecting?.length > 0}
									<div class="flight-category">
										<h4>🔄 Connecting Flights ({flightResults.flights.connecting.length})</h4>
										<div class="flights-grid">
											{#each flightResults.flights.connecting.slice(0, 3) as flight}
												<div class="flight-card connecting-flight {recommendedFlightId && flight.id === recommendedFlightId ? 'recommended' : ''}">
													<div class="flight-header">
														<span class="flight-type">{flight.enhanced?.stops || 1} Stop(s)</span>
													</div>
													<div class="flight-details">
														<div class="flight-time">
															<strong>Departure:</strong> {formatDateTime(flight.enhanced?.departureTime)}
														</div>
														<div class="flight-time">
															<strong>Arrival:</strong> {formatDateTime(flight.enhanced?.arrivalTime)}
														</div>
														<div class="flight-duration">
															<strong>Duration:</strong> {flight.enhanced?.totalDuration || 'N/A'}
														</div>
														<div class="flight-airline">
															<strong>Airlines:</strong> {flight.enhanced?.airlines?.join(', ') || 'N/A'}
														</div>
														{#if flight.enhanced?.aircraft}
															<div class="flight-aircraft">
																<strong>Aircraft:</strong> {flight.enhanced.aircraft}
															</div>
														{/if}
													</div>
												</div>
											{/each}
										</div>
									</div>
								{/if}

								{#if flightResults.summary?.totalOffers === 0}
									<div class="no-flights">
										<p>No flights found from {originAirport} to {destinationAirport} on {jobData.ready_date} (after filtering out regional aircraft).</p>
										<p>Try changing the Ready Date, using different addresses, or check again later.</p>
									</div>
								{/if}

								{#if estimatedDeliveryISO}
									<div class="flight-category">
										<h4>📦 Estimated Delivery</h4>
										<p><strong>Estimated delivery time:</strong> {formatDateTime(estimatedDeliveryISO)}</p>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				{/if}

				<!-- Quote Section -->
				{#if netjetsQuote && (shipperAirportRoute || consigneeAirportRoute)}
					<div class="form-section">
						<h2>Quote</h2>
						<div class="flight-results">
							<table class="earliest-table">
								<thead>
									<tr>
										<th>Item</th>
										<th>Calculation</th>
										<th>Amount</th>
									</tr>
								</thead>
								<tbody>
									{#if netjetsQuote.NF > 0}
										<tr>
											<td>Network Fee (NF)</td>
											<td>Weight-based: {poundsFromForm().toFixed(1)} lbs</td>
											<td>{formatPrice(netjetsQuote.NF)}</td>
										</tr>
									{/if}
									{#if netjetsQuote.MP > 0}
										<tr>
											<td>Pickup Mileage (MP)</td>
											<td>{Math.round(shipperAirportRoute?.distance_miles || 0)} mi</td>
											<td>{formatPrice(netjetsQuote.MP)}</td>
										</tr>
									{/if}
									{#if netjetsQuote.MD > 0}
										<tr>
											<td>Delivery Mileage (MD)</td>
											<td>{Math.round(consigneeAirportRoute?.distance_miles || 0)} mi</td>
											<td>{formatPrice(netjetsQuote.MD)}</td>
										</tr>
									{/if}
									{#if netjetsQuote.PP > 0}
										<tr>
											<td>Per Piece (PP)</td>
											<td>{jobData.pieces} pieces</td>
											<td>{formatPrice(netjetsQuote.PP)}</td>
										</tr>
									{/if}
									{#if netjetsQuote.NCUS > 0}
										<tr>
											<td>Non-Continental US (NCUS)</td>
											<td>AK/HI/PR surcharge</td>
											<td>{formatPrice(netjetsQuote.NCUS)}</td>
										</tr>
									{/if}
									{#if netjetsQuote.AH > 0}
										<tr>
											<td>After Hours (AH)</td>
											<td>Outside 8 AM - 6 PM</td>
											<td>{formatPrice(netjetsQuote.AH)}</td>
										</tr>
									{/if}
									{#if netjetsQuote.NFT > 0}
										<tr>
											<td>Network Freight Transfer (NFT)</td>
											<td>Multiple MAWBs</td>
											<td>{formatPrice(netjetsQuote.NFT)}</td>
										</tr>
									{/if}
									{#if netjetsQuote.DG > 0}
										<tr>
											<td>Dangerous Goods (DG)</td>
											<td>Hazmat surcharge</td>
											<td>{formatPrice(netjetsQuote.DG)}</td>
										</tr>
									{/if}
									{#if netjetsQuote.TFM > 0}
										<tr>
											<td>Transport Fee Mileage (TFM)</td>
											<td>ATD mileage</td>
											<td>{formatPrice(netjetsQuote.TFM)}</td>
										</tr>
									{/if}
									{#if netjetsQuote.SSC > 0}
										<tr>
											<td>Security Surcharge (SSC)</td>
											<td>6% of base</td>
											<td>{formatPrice(netjetsQuote.SSC)}</td>
										</tr>
									{/if}
									{#if netjetsQuote.FS > 0}
										<tr>
											<td>Fuel Surcharge (FS)</td>
											<td>10% of base</td>
											<td>{formatPrice(netjetsQuote.FS)}</td>
										</tr>
									{/if}
									<tr>
										<td colspan="2" style="text-align:right; font-weight:700;">Total</td>
										<td style="font-weight:700;">{formatPrice(netjetsQuote.total)}</td>
									</tr>
								</tbody>
							</table>
							<div class="quote-disclaimer">
								*These are transport costs and may not include incidentals like driver waiting time.
							</div>
						</div>
					</div>
				{/if}

				<!-- Form Actions -->
					<div class="form-actions">
					<button type="button" class="btn secondary" onclick={() => goto('/dashboard/operations')}>
							Cancel
						</button>
					<button 
						type="submit" 
						class="btn primary" 
						disabled={saving || !addressesValidated || !flightResults || !!flightSearchError || (flightResults?.summary?.totalOffers || 0) === 0}
					>
						{#if saving}
							<div class="btn-spinner"></div>
							Creating Job...
						{:else}
							Create Job
						{/if}
					</button>
					</div>
				
				<!-- Button Status Message -->
				{#if !saving && (!addressesValidated || !flightResults || !!flightSearchError || (flightResults?.summary?.totalOffers || 0) === 0)}
					<div class="button-status-message">
						{#if !addressesValidated}
							💡 Please validate addresses and search for flights first
						{:else if flightSearchError}
							⚠️ Flight search error - please try again
						{:else if !flightResults}
							✈️ Flight search required before creating job
						{:else if (flightResults?.summary?.totalOffers || 0) === 0}
							❌ No flights found - try different dates or airports
						{/if}
					</div>
				{/if}

					<!-- Message Display -->
					{#if message}
						<div class="message" class:success class:error={!success}>
							{message}
						</div>
					{/if}
				</form>
		{/if}

		<!-- Logout Button -->
		<div class="logout-section">
			<button onclick={handleSignOut} disabled={loading} class="logout-button">
				{loading ? 'Signing Out...' : 'Logout'}
			</button>
		</div>
	</div>
</div>

<style>
	.job-container {
		background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		min-height: 100vh;
		padding: 2rem;
	}

	.main-content {
		max-width: 1200px;
		margin: 0 auto;
	}

	.header-section {
		background: white;
		padding: 2rem;
		border-radius: 16px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
		margin-bottom: 2rem;
	}

	.header-content {
		text-align: center;
	}

	.page-title {
		font-size: 2.5rem;
		font-weight: 700;
		color: #34547a;
		margin: 0 0 0.5rem 0;
	}

	.page-subtitle {
		font-size: 1.1rem;
		color: #6b7280;
		margin: 0;
	}

	.nav-section {
		margin-bottom: 2rem;
		text-align: center;
	}

	.nav-link {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #ea580c, #dc2626);
		color: white;
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 600;
		border-radius: 12px;
		transition: all 0.3s ease;
		box-shadow: 0 4px 15px rgba(234, 88, 12, 0.3);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		border: none;
		cursor: pointer;
	}

	.nav-link:hover {
		background: linear-gradient(135deg, #dc2626, #b91c1c);
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(234, 88, 12, 0.4);
	}

	.user-info {
		background: white;
		padding: 1.5rem;
		border-radius: 16px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
		margin-bottom: 2rem;
	}

	.status-text, .function-text {
		margin: 0.25rem 0;
		font-size: 0.95rem;
		color: #374151;
	}

	.highlight {
		color: #ea580c;
		font-weight: 600;
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
		background: white;
		border-radius: 16px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
	}

	.loading-spinner, .spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #f3f4f6;
		border-top: 4px solid #34547a;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
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
		border-bottom: 2px solid #34547a;
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

	.form-input {
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 0.875rem;
		transition: all 0.2s ease;
		background: white;
	}

	.form-input:focus,
	.form-group input:focus,
	.form-group select:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: #34547a;
		box-shadow: 0 0 0 3px rgba(52, 84, 122, 0.1);
	}

	.form-input.error,
	.form-group input.error,
	.form-group select.error {
		border-color: #ef4444;
		background: #fef2f2;
	}

	.form-input:read-only {
		background-color: #f9fafb;
		color: #6b7280;
		cursor: not-allowed;
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

	/* Customer search styles */
	.customer-search-section {
		margin-bottom: 2rem;
	}

	.search-container {
		position: relative;
	}

	.search-input {
		width: 100%;
		padding: 1rem 3rem 1rem 1rem;
		border: 2px solid #e5e7eb;
		border-radius: 12px;
		font-size: 1rem;
		transition: all 0.3s ease;
		background: white;
	}

	.search-input:focus {
		outline: none;
		border-color: #34547a;
		box-shadow: 0 0 0 4px rgba(52, 84, 122, 0.1);
	}

	.clear-customer {
		position: absolute;
		right: 1rem;
		top: 50%;
		transform: translateY(-50%);
		background: #6b7280;
		color: white;
		border: none;
		border-radius: 50%;
		width: 24px;
		height: 24px;
		cursor: pointer;
		font-size: 0.75rem;
		transition: all 0.3s ease;
	}

	.clear-customer:hover {
		background: #374151;
	}

	.customer-dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: 12px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
		z-index: 1000;
		max-height: 200px;
		overflow-y: auto;
	}

	.customer-option {
		padding: 1rem;
		cursor: pointer;
		border-bottom: 1px solid #f3f4f6;
		transition: all 0.3s ease;
	}

	.customer-option:hover {
		background: #f8fafc;
	}

	.customer-option:last-child {
		border-bottom: none;
	}

	.customer-name {
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 0.25rem;
	}

	.customer-details {
		font-size: 0.875rem;
		color: #6b7280;
	}

	.selected-customer {
		margin-top: 0.75rem;
		padding: 0.75rem;
		background: linear-gradient(135deg, #dcfce7, #bbf7d0);
		border-radius: 8px;
		border: 1px solid #22c55e;
	}

	.selected-label {
		font-size: 0.75rem;
		color: #166534;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.selected-name {
		font-weight: 600;
		color: #166534;
		margin-left: 0.5rem;
	}

	.selected-account {
		background: #16a34a;
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		margin-left: 0.5rem;
	}

	/* Side-by-side Address Forms */
	.address-forms-container {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		margin-bottom: 2rem;
	}

	.address-form-column {
		background: #f8fafc;
		border-radius: 12px;
		padding: 1.5rem;
		border: 1px solid #e2e8f0;
	}

	.address-form-column h3 {
		margin: 0 0 1.5rem 0;
		color: #1e40af;
		font-size: 1.1rem;
		font-weight: 600;
		padding-bottom: 0.75rem;
		border-bottom: 2px solid #3b82f6;
	}

	/* Button styles */
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
		background: #34547a;
		color: white;
	}

	.btn.primary:hover:not(:disabled) {
		background: #5a7fb8;
		transform: translateY(-1px);
		box-shadow: 0 4px 15px rgba(52, 84, 122, 0.3);
	}

	.btn.secondary {
		background: #f3f4f6;
		color: #374151;
		border: 1px solid #d1d5db;
	}

	.btn.secondary:hover {
		background: #e5e7eb;
	}

	.btn.danger {
		background: #dc2626;
		color: white;
	}

	.btn.danger:hover:not(:disabled) {
		background: #b91c1c;
		transform: translateY(-1px);
		box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);
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

	.btn-icon {
		width: 18px;
		height: 18px;
		flex-shrink: 0;
	}

	/* Validation Button Container */
	.validation-button-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		margin: 2rem 0;
		padding: 2rem;
		background: #fafafa;
		border-radius: 12px;
		border: 2px dashed #e5e7eb;
	}

	.validate-and-search-btn {
		font-size: 1.1rem;
		font-weight: 600;
		padding: 1rem 2rem;
		min-width: 280px;
		box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
		transition: all 0.2s ease;
	}

	.validate-and-search-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(220, 38, 38, 0.3);
	}

	.validate-and-search-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
		transform: none;
		box-shadow: 0 2px 6px rgba(220, 38, 38, 0.1);
	}

	.error-message {
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 8px;
		padding: 1rem;
		color: #dc2626;
		font-weight: 500;
		text-align: center;
		max-width: 500px;
	}

	.validation-hint {
		background: #eff6ff;
		border: 1px solid #bfdbfe;
		border-radius: 8px;
		padding: 1rem;
		font-size: 0.875rem;
		color: #1e40af;
		text-align: center;
		max-width: 500px;
	}

	/* Maps Container */
	.maps-container {
		margin-top: 2rem;
		padding-top: 2rem;
		border-top: 1px solid #e5e7eb;
	}

	.maps-container h3 {
		margin: 0 0 1.5rem 0;
		color: #374151;
		font-size: 1.2rem;
		font-weight: 600;
	}

	.maps-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
	}

	.map-wrapper {
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	/* Flight Results Styles */
	.flight-loading {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 2rem;
		background: #f8fafc;
		border-radius: 8px;
		border: 1px solid #e2e8f0;
	}

	.flight-loading p {
		margin: 0;
		color: #64748b;
		font-weight: 500;
	}

	.flight-error {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 8px;
		color: #dc2626;
	}

	.flight-error svg {
		width: 20px;
		height: 20px;
		flex-shrink: 0;
	}

	.flight-error p {
		margin: 0;
		font-weight: 500;
	}

	.flight-results {
		background: #f8fafc;
		border-radius: 12px;
		padding: 1.5rem;
		border: 1px solid #e2e8f0;
	}

	.flight-summary {
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.flight-summary h3 {
		margin: 0 0 1rem 0;
		color: #1e40af;
		font-size: 1.25rem;
	}

	.flight-stats {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem;
		font-size: 0.875rem;
	}

	.flight-stats span {
		color: #374151;
	}

	.filter-note {
		color: #6b7280 !important;
		font-style: italic;
	}

	.flight-category {
		margin-bottom: 1.5rem;
	}

	.flight-category h4 {
		margin: 0 0 1rem 0;
		color: #374151;
		font-size: 1.1rem;
		font-weight: 600;
	}

	.flights-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1rem;
	}

	.flight-card {
		background: white;
		border-radius: 8px;
		padding: 1rem;
		border: 1px solid #e5e7eb;
		transition: all 0.2s ease;
	}

	.flight-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		transform: translateY(-2px);
	}

	.direct-flight {
		border-left: 4px solid #10b981;
	}

	.connecting-flight {
		border-left: 4px solid #f59e0b;
	}

	.flight-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #f3f4f6;
	}

	.flight-type {
		font-weight: 600;
		color: #374151;
		font-size: 0.875rem;
	}

	.flight-details {
		font-size: 0.8rem;
		line-height: 1.4;
	}

	.flight-details > div {
		margin-bottom: 0.5rem;
		color: #4b5563;
	}

	.flight-aircraft {
		color: #6366f1 !important;
		font-weight: 500;
	}

	.no-flights {
		text-align: center;
		padding: 2rem;
		background: #fef3c7;
		border: 1px solid #fbbf24;
		border-radius: 8px;
		color: #92400e;
	}

	.no-flights p {
		margin: 0.5rem 0;
	}

	/* Earliest table + highlight */
	.earliest-table {
		width: 100%;
		border-collapse: collapse;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		overflow: hidden;
	}

	.earliest-table th,
	.earliest-table td {
		padding: 0.75rem;
		border-bottom: 1px solid #f3f4f6;
		font-size: 0.875rem;
		color: #374151;
	}

	.earliest-table thead th {
		background: #f8fafc;
		font-weight: 600;
	}

	.recommended-row {
		outline: 2px solid #3b82f6;
		outline-offset: -2px;
		background: #eff6ff;
	}

	.earliest-box {
		padding: 0.25rem 0.5rem;
		border: 2px solid #3b82f6;
		border-radius: 6px;
		color: #1e3a8a;
		background: #eff6ff;
	}

	/* Highlight recommended flight cards */
	.flight-card.recommended {
		box-shadow: 0 0 0 2px #3b82f6 inset;
		background: #eff6ff;
	}

	.quote-disclaimer {
		margin-top: 1rem;
		padding: 0.75rem;
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		font-size: 0.875rem;
		color: #6b7280;
		font-style: italic;
		text-align: center;
	}

	.form-actions {
		padding: 2rem;
		background: #f9fafb;
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
	}

	.button-status-message {
		background: #fef3c7;
		border: 1px solid #fbbf24;
		border-radius: 8px;
		padding: 0.75rem 1rem;
		font-size: 0.875rem;
		color: #92400e;
		text-align: center;
		margin-top: 0.75rem;
		font-weight: 500;
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

	.logout-section {
		text-align: center;
		margin-top: 2rem;
	}

	.logout-button {
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #dc2626, #b91c1c);
		color: white;
		border: none;
		border-radius: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);
	}

	.logout-button:hover:not(:disabled) {
		background: linear-gradient(135deg, #b91c1c, #991b1b);
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(220, 38, 38, 0.4);
	}

	.logout-button:disabled {
		opacity: 0.7;
		cursor: not-allowed;
		transform: none;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.job-container {
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

		.flights-grid {
			grid-template-columns: 1fr;
		}
		
		.flight-stats {
			flex-direction: column;
			gap: 0.5rem;
		}

		.validation-button-container {
			margin: 1.5rem 0;
			padding: 1.5rem;
		}

		.validate-and-search-btn {
			font-size: 1rem;
			padding: 0.875rem 1.5rem;
			min-width: 240px;
		}

		/* Mobile responsive for address forms */
		.address-forms-container {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}

		.maps-grid {
			grid-template-columns: 1fr;
			gap: 1rem;
		}
	}
</style> 