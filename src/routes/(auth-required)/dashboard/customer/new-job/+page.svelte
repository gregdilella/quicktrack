<svelte:head>
	<title>Create New Job - Certus Freight</title>
</svelte:head>

<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { createCustomerJob, getCurrentUserCustomer } from '$lib/services/customerService';
	import { customerJobSchema, type CustomerJobFormData } from '$lib/validation/schemas';
	import type { Customer } from '$lib/services/customerService';
	import { validateAddress, buildAddressString, findNearestAirportWithRoute, findMultipleAirportsWithRoutes, type ValidatedAddress, type AirportRouteInfo } from '$lib/services/googleMapsService';
	import AddressMap from '$lib/components/AddressMap.svelte';
	import { computeNetjetsQuote, buildNetjetsInputFromJobForm, type NetjetsQuoteBreakdown } from '$lib/Quoting/netjets';
	
	let customer = $state<Customer | null>(null);
	let loading = $state(false);
	let submitting = $state(false);
	let errors = $state<Record<string, string>>({});
	let successMessage = $state('');
	let errorMessage = $state('');

	// Address validation state
	let validatingShipperAddress = $state(false);
	let validatingConsigneeAddress = $state(false);
	let shipperValidatedAddress = $state<ValidatedAddress | null>(null);
	let consigneeValidatedAddress = $state<ValidatedAddress | null>(null);
	let addressValidationErrors = $state<Record<string, string>>({});
	let addressesValidated = $state(false);

	// Flight search state
	let searchingFlights = $state(false);
	let flightResults = $state<any>(null);
	let flightSearchError = $state('');
	let originAirport = $state(''); // Shipper's nearest airport
	let destinationAirport = $state(''); // Consignee's nearest airport
	let shipperAirportRoute = $state<AirportRouteInfo | null>(null);
	let consigneeAirportRoute = $state<AirportRouteInfo | null>(null);
	let earliestReadyToFlyISO = $state('');
	let recommendedFlightId = $state<string | null>(null);
	let estimatedDeliveryISO = $state<string | null>(null);

	// Address search helpers (Svelte 5 runes)
	let shipperSearchQuery = $state('');
	let consigneeSearchQuery = $state('');
	let searchingShipper = $state(false);
	let searchingConsignee = $state(false);

	async function applyValidatedToForm(validated: ValidatedAddress, type: 'shipper' | 'consignee') {
		const street = [
			validated.components.street_number,
			validated.components.route
		].filter(Boolean).join(' ');

		if (type === 'shipper') {
			formData.shipper_address1 = street || validated.formatted;
			formData.shipper_city = validated.components.locality || '';
			formData.shipper_state = validated.components.administrative_area_level_1 || '';
			formData.shipper_zip = validated.components.postal_code || '';
			shipperValidatedAddress = validated;
		} else {
			formData.consignee_address1 = street || validated.formatted;
			formData.consignee_city = validated.components.locality || '';
			formData.consignee_state = validated.components.administrative_area_level_1 || '';
			formData.consignee_zip = validated.components.postal_code || '';
			consigneeValidatedAddress = validated;
		}
	}

	async function searchAndFill(type: 'shipper' | 'consignee') {
		try {
			if (type === 'shipper') {
				if (!shipperSearchQuery.trim()) return;
				searchingShipper = true;
				const validated = await validateAddress(shipperSearchQuery.trim());
				if (validated) await applyValidatedToForm(validated, 'shipper');
			} else {
				if (!consigneeSearchQuery.trim()) return;
				searchingConsignee = true;
				const validated = await validateAddress(consigneeSearchQuery.trim());
				if (validated) await applyValidatedToForm(validated, 'consignee');
			}
		} finally {
			searchingShipper = false;
			searchingConsignee = false;
		}
	}

	// Form data with default values
	let formData = $state<Partial<CustomerJobFormData>>({
		commodity: '',
		description: '',
		pieces: 1,
		weight: 1,
		weight_unit: 'lbs',
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
		// shipper_address2 removed per request
		shipper_city: '',
		shipper_state: '',
		shipper_zip: '',
		consignee_name: '',
		consignee_contact: '',
		consignee_phone: '',
		consignee_address1: '',
		// consignee_address2 removed per request
		consignee_city: '',
		consignee_state: '',
		consignee_zip: '',
		po_number: '',
		special_instructions: ''
	});

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
				successMessage = `Job ${result.jobno || result.jobNumber} created successfully!`;
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



	/**
	 * Clears address validation for a specific type
	 */
	function clearAddressValidation(type: 'shipper' | 'consignee') {
		if (type === 'shipper') {
			shipperValidatedAddress = null;
			addressValidationErrors.shipper = '';
		} else {
			consigneeValidatedAddress = null;
			addressValidationErrors.consignee = '';
		}
		// Clear flight results when address changes
		flightResults = null;
		flightSearchError = '';
		originAirport = '';
		destinationAirport = '';
		shipperAirportRoute = null;
		consigneeAirportRoute = null;
		earliestReadyToFlyISO = '';
		recommendedFlightId = null;
		estimatedDeliveryISO = null;
		addressesValidated = false;
	}

	// --- Helpers for timing calculations ---
	function addMinutes(date: Date, minutes: number): Date {
		const d = new Date(date);
		d.setMinutes(d.getMinutes() + minutes);
		return d;
	}

	function combineDateAndTime(dateStr: string, timeStr: string): Date {
		return new Date(`${dateStr}T${timeStr || '00:00'}:00`);
	}

	function formatISO(dt: Date): string {
		return dt.toISOString();
	}

	function getHHmm(dt: Date): string {
		const hh = dt.getHours().toString().padStart(2, '0');
		const mm = dt.getMinutes().toString().padStart(2, '0');
		return `${hh}:${mm}`;
	}

	function nextNDates(startDate: string, n: number): string[] {
		const dates: string[] = [];
		const base = new Date(`${startDate}T00:00:00`);
		for (let i = 0; i < n; i++) {
			const d = new Date(base);
			d.setDate(base.getDate() + i);
			dates.push(d.toISOString().slice(0, 10));
		}
		return dates;
	}

	function filterOutRegionalAircraft(flights: any[]): any[] {
		return flights.filter((flight: any) => {
			const aircraft = flight.enhanced?.aircraft;
			if (!aircraft) return true;
			const aircraftList = aircraft.split(', ');
			return !aircraftList.some((plane: string) => {
				const cleanPlane = plane.trim().toUpperCase();
				return (
					cleanPlane.startsWith('E') ||
					cleanPlane.startsWith('CR') ||
					cleanPlane.includes('DE HAVILLAND') ||
					cleanPlane.includes('DASH') ||
					cleanPlane.startsWith('DH')
				);
			});
		});
	}

	async function searchFlightsForDates(origin: string, destination: string, baseDate: string, earliestISO: string | null) {
		const dates = nextNDates(baseDate, 2); // base day + next day
		const earliest = earliestISO ? new Date(earliestISO) : null;

		const fetches = dates.map((d, idx) => {
			const params = new URLSearchParams({
				origin,
				destination,
				departureDate: d,
				adults: '1',
				children: '0',
				infants: '0',
				nonStop: 'false',
				currency: 'USD',
				max: '50'
			});
			if (idx === 0 && earliest) {
				params.set('departureTime', getHHmm(earliest));
			}
			return fetch(`/api/flights/search?${params.toString()}`).then(async (r) => {
				const data = await r.json();
				return { ok: r.ok, data };
			});
		});

		const results = await Promise.all(fetches);

		const merged = {
			summary: { totalOffers: 0, directFlights: 0, connectingFlights: 0 },
			flights: { direct: [], connecting: [], all: [] } as any,
			byDate: [] as any[]
		};

		for (const { ok, data } of results) {
			if (!ok || !data?.flights) continue;
			data.flights.direct = filterOutRegionalAircraft(data.flights.direct || []);
			data.flights.connecting = filterOutRegionalAircraft(data.flights.connecting || []);
			data.flights.all = filterOutRegionalAircraft(data.flights.all || []);

			merged.flights.direct = [...merged.flights.direct, ...data.flights.direct];
			merged.flights.connecting = [...merged.flights.connecting, ...data.flights.connecting];
			merged.flights.all = [...merged.flights.all, ...data.flights.all];
			merged.summary.totalOffers += data.flights.all.length;
			merged.summary.directFlights += data.flights.direct.length;
			merged.summary.connectingFlights += data.flights.connecting.length;
			merged.byDate.push({ date: data.searchCriteria?.departureDate, flights: data.flights });
		}

		merged.flights.all.sort((a: any, b: any) => new Date(a.enhanced?.departureTime || 0).getTime() - new Date(b.enhanced?.departureTime || 0).getTime());
		merged.flights.direct.sort((a: any, b: any) => new Date(a.enhanced?.departureTime || 0).getTime() - new Date(b.enhanced?.departureTime || 0).getTime());
		merged.flights.connecting.sort((a: any, b: any) => new Date(a.enhanced?.departureTime || 0).getTime() - new Date(b.enhanced?.departureTime || 0).getTime());

		return merged;
	}

	function computeRecommendedFlightAndETA(mergedFlights: any, earliestISO: string, destDriveMins: number) {
		const earliest = new Date(earliestISO);
		const all = (mergedFlights?.flights?.all || []).filter((f: any) => {
			// Only consider flights on or after the ready date (same day or later)
			if (!f?.enhanced?.departureTime) return false;
			const dep = new Date(f.enhanced.departureTime);
			const readyDay = new Date(earliest);
			readyDay.setHours(0,0,0,0);
			const depDay = new Date(dep);
			depDay.setHours(0,0,0,0);
			return depDay.getTime() >= readyDay.getTime();
		});
		const candidate = all.find((f: any) => {
			if (!f?.enhanced?.departureTime) return false;
			return new Date(f.enhanced.departureTime) >= earliest;
		});
		if (!candidate) return { flightId: null, etaISO: null };
		const arrival = new Date(candidate.enhanced.arrivalTime);
		const eta = addMinutes(addMinutes(arrival, 90), destDriveMins || 0);
		return { flightId: candidate.id || null, etaISO: formatISO(eta) };
	}

	// --- Netjets Quote calculation ---
	function poundsFromForm(): number {
		const w = Number(formData.weight || 0);
		if (!w || isNaN(w)) return 0;
		return (formData.weight_unit === 'kg') ? w * 2.20462 : w;
	}

	// Compute Netjets quote reactively using $derived
	let netjetsQuote = $derived.by(() => {
		try {
			const quoteInput = {
				...buildNetjetsInputFromJobForm({
					...formData,
					shipper_miles: shipperAirportRoute?.distance_miles || 0,
					consignee_miles: consigneeAirportRoute?.distance_miles || 0,
					weight: poundsFromForm(),
					shipper_state: formData.shipper_state,
					consignee_state: formData.consignee_state,
					shipper_city: formData.shipper_city
				})
			};
			return computeNetjetsQuote(quoteInput);
		} catch (e) {
			return null;
		}
	});

	/**
	 * Validates both addresses and searches for flights between nearest airports
	 */
	async function validateAddressesAndSearchFlights() {
		// Check if both addresses are filled
		const shipperAddressString = buildAddressString(
			formData.shipper_address1 || '',
			'',
			formData.shipper_city || '',
			formData.shipper_state || '',
			formData.shipper_zip || ''
		);
		
		const consigneeAddressString = buildAddressString(
			formData.consignee_address1 || '',
			'',
			formData.consignee_city || '',
			formData.consignee_state || '',
			formData.consignee_zip || ''
		);

		if (!shipperAddressString.trim()) {
			flightSearchError = 'Please fill in the shipper address fields';
			return;
		}

		if (!consigneeAddressString.trim()) {
			flightSearchError = 'Please fill in the consignee address fields';
			return;
		}

		// Clear previous results
		validatingShipperAddress = true;
		validatingConsigneeAddress = true;
		searchingFlights = true;
		flightSearchError = '';
		flightResults = null;
		originAirport = '';
		destinationAirport = '';
		addressValidationErrors = {};
		addressesValidated = false;

		try {
			console.log('🔍 Validating both addresses and finding airports...');

			// Validate both addresses in parallel
			const [shipperValidated, consigneeValidated] = await Promise.all([
				validateAddress(shipperAddressString),
				validateAddress(consigneeAddressString)
			]);

			if (!shipperValidated) {
				throw new Error('Could not validate shipper address. Please check the details.');
			}

			if (!consigneeValidated) {
				throw new Error('Could not validate consignee address. Please check the details.');
			}

			// Update validated addresses
			shipperValidatedAddress = shipperValidated;
			consigneeValidatedAddress = consigneeValidated;

			// Update form fields with validated components
			if (shipperValidated.components.locality && !formData.shipper_city) {
				formData.shipper_city = shipperValidated.components.locality;
			}
			if (shipperValidated.components.administrative_area_level_1 && !formData.shipper_state) {
				formData.shipper_state = shipperValidated.components.administrative_area_level_1;
			}
			if (shipperValidated.components.postal_code && !formData.shipper_zip) {
				formData.shipper_zip = shipperValidated.components.postal_code;
			}

			if (consigneeValidated.components.locality && !formData.consignee_city) {
				formData.consignee_city = consigneeValidated.components.locality;
			}
			if (consigneeValidated.components.administrative_area_level_1 && !formData.consignee_state) {
				formData.consignee_state = consigneeValidated.components.administrative_area_level_1;
			}
			if (consigneeValidated.components.postal_code && !formData.consignee_zip) {
				formData.consignee_zip = consigneeValidated.components.postal_code;
			}

			console.log('✅ Both addresses validated, finding nearest airports...');

			// Find nearest airports for both addresses in parallel
			const [shipperAirportResult, consigneeAirportResult] = await Promise.all([
				findNearestAirportWithRoute(shipperValidated.latitude, shipperValidated.longitude),
				findNearestAirportWithRoute(consigneeValidated.latitude, consigneeValidated.longitude)
			]);

			if (!shipperAirportResult || !shipperAirportResult.airport) {
				throw new Error('No nearby airports found for shipper address');
			}

			if (!consigneeAirportResult || !consigneeAirportResult.airport) {
				throw new Error('No nearby airports found for consignee address');
			}

			originAirport = shipperAirportResult.airport.iata_code || '';
			destinationAirport = consigneeAirportResult.airport.iata_code || '';
			shipperAirportRoute = shipperAirportResult;
			consigneeAirportRoute = consigneeAirportResult;

			if (!originAirport) {
				throw new Error('Shipper airport found but no IATA code available');
			}

			if (!destinationAirport) {
				throw new Error('Consignee airport found but no IATA code available');
			}

			console.log(`✈️ Origin airport: ${originAirport}, Destination airport: ${destinationAirport}`);
			// Mark addresses as validated so maps section can render
			addressesValidated = true;

			// Check Ready Date
			const departureDate = formData.ready_date;
			if (!departureDate) {
				throw new Error('Please set a Ready Date first before searching flights');
			}
			
			const readyDate = new Date(departureDate);
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			
			if (readyDate < today) {
				throw new Error('Ready Date must be in the future. Please update the Ready Date.');
			}

			// Compute earliest feasible departure: ready + drive to origin + 90 min
			const baseReady = combineDateAndTime(formData.ready_date as string, formData.ready_time as string);
			const driveToOriginMins = shipperAirportRoute?.duration_minutes || 0;
			const earliest = addMinutes(addMinutes(baseReady, driveToOriginMins), 90);
			earliestReadyToFlyISO = earliest.toISOString();

			// Multi-day search (base day + next day), enforce earliest time on day 0
			console.log(`🛫 Searching flights (2 days): ${originAirport} → ${destinationAirport}`);
			const merged = await searchFlightsForDates(originAirport, destinationAirport, departureDate, earliestReadyToFlyISO);
			flightResults = {
				...merged,
				summary: {
					...merged.summary,
					searchTime: new Date().toISOString()
				}
			};

			console.log(`✅ Found ${flightResults.summary?.totalOffers || 0} flights over 2 days (after filtering)`);

			// Pick recommended flight and compute ETA at consignee
			const destDriveMins = consigneeAirportRoute?.duration_minutes || 0;
			const { flightId, etaISO } = computeRecommendedFlightAndETA(flightResults, earliestReadyToFlyISO, destDriveMins);
			recommendedFlightId = flightId;
			estimatedDeliveryISO = etaISO;

			// If still no flights, try alternative airports
			if ((flightResults.summary?.totalOffers || 0) === 0) {
				console.log('🔄 No flights found with primary airports (2-day search), trying alternatives for base date...');
				await tryAlternativeAirports(shipperValidated, consigneeValidated, departureDate);
			}

		} catch (error: any) {
			console.error('❌ Address validation or flight search failed:', error);
			flightSearchError = error.message || 'Failed to validate addresses or search flights';
		} finally {
			validatingShipperAddress = false;
			validatingConsigneeAddress = false;
			searchingFlights = false;
		}
	}

	/**
	 * Try alternative airports when no flights are found with primary airports
	 */
	async function tryAlternativeAirports(shipperValidated: ValidatedAddress, consigneeValidated: ValidatedAddress, departureDate: string) {
		try {
			console.log('🔍 Finding alternative airports for both locations...');
			
			// Get multiple airports for both locations
			const [shipperAirports, consigneeAirports] = await Promise.all([
				findMultipleAirportsWithRoutes(shipperValidated.latitude, shipperValidated.longitude, 3),
				findMultipleAirportsWithRoutes(consigneeValidated.latitude, consigneeValidated.longitude, 3)
			]);

			console.log(`📍 Found ${shipperAirports.length} shipper airports and ${consigneeAirports.length} consignee airports`);

			// Try different combinations of airports
			for (const shipperAirport of shipperAirports) {
				if (!shipperAirport.airport.iata_code) continue;
				
				for (const consigneeAirport of consigneeAirports) {
					if (!consigneeAirport.airport.iata_code) continue;
					
					const altOrigin = shipperAirport.airport.iata_code;
					const altDestination = consigneeAirport.airport.iata_code;
					
					// Skip if it's the same combination we already tried
					if (altOrigin === originAirport && altDestination === destinationAirport) {
						continue;
					}
					
					console.log(`🛫 Trying alternative route: ${altOrigin} → ${altDestination}`);
					
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
						});

						const response = await fetch(`/api/flights/search?${params.toString()}`);
						const altData = await response.json();

						if (response.ok && altData.flights) {
							// Filter out flights with small regional aircraft
							const filterFlights = (flights: any[]) => {
								return flights.filter((flight: any) => {
									const aircraft = flight.enhanced?.aircraft;
									if (!aircraft) return true;
									
									const aircraftList = aircraft.split(', ');
									return !aircraftList.some((plane: string) => {
										const cleanPlane = plane.trim().toUpperCase();
										return (
											cleanPlane.startsWith('E') ||      // Embraer (ERJ, E170, E190, etc.)
											cleanPlane.startsWith('CR') ||     // Bombardier CRJ series
											cleanPlane.includes('DE HAVILLAND') || // De Havilland aircraft
											cleanPlane.includes('DASH') ||     // Dash 8, etc.
											cleanPlane.startsWith('DH')        // De Havilland codes (DH4, etc.)
										);
									});
								});
							};

							altData.flights.direct = filterFlights(altData.flights.direct || []);
							altData.flights.connecting = filterFlights(altData.flights.connecting || []);
							altData.flights.all = filterFlights(altData.flights.all || []);
							
							altData.summary.directFlights = altData.flights.direct.length;
							altData.summary.connectingFlights = altData.flights.connecting.length;
							altData.summary.totalOffers = altData.flights.all.length;

							if (altData.summary?.totalOffers > 0) {
								console.log(`✅ Found ${altData.summary.totalOffers} flights with alternative route: ${altOrigin} → ${altDestination}`);
								
								// Update the airports and results
								originAirport = altOrigin;
								destinationAirport = altDestination;
								flightResults = altData;
								
								return; // Success! Exit the function
							}
						}
					} catch (altError) {
						console.warn(`Failed to search flights for ${altOrigin} → ${altDestination}:`, altError);
					}
				}
			}
			
			console.log('⚠️ No flights found even with alternative airports');
			flightSearchError = `No flights found between any nearby airports on ${departureDate} (after filtering out regional aircraft). Try a different date or check back later.`;
			
		} catch (error) {
			console.error('❌ Failed to try alternative airports:', error);
		}
	}

	// Format price
	function formatPrice(price: number, currency: string = 'USD'): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: currency
		}).format(price);
	}

	// Format date/time
	function formatDateTime(dateString?: string): string {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function selectFeaturedFlights(all: any[]) {
		if (!Array.isArray(all)) return { earliest: null, fastest: null, cheapest: null };
		// Same-day-or-later filter is already applied upstream for recommendation
		const sortedByDeparture = [...all].sort((a, b) => new Date(a.enhanced?.departureTime || 0).getTime() - new Date(b.enhanced?.departureTime || 0).getTime());
		const earliest = sortedByDeparture[0] || null;
		const fastest = [...all].sort((a, b) => (a.enhanced?.totalDurationMinutes || 1e9) - (b.enhanced?.totalDurationMinutes || 1e9))[0] || null;
		const cheapest = [...all].sort((a, b) => parseFloat(a.price?.total || '1e9') - parseFloat(b.price?.total || '1e9'))[0] || null;
		return { earliest, fastest, cheapest };
	}

	function filterFlightsFromReadyDate(all: any[], baseDate: string) {
		if (!Array.isArray(all) || !baseDate) return all || [];
		const readyDay = new Date(`${baseDate}T00:00:00`);
		readyDay.setHours(0, 0, 0, 0);
		return all
			.filter((f: any) => {
				const dep = new Date(f?.enhanced?.departureTime || 0);
				const depDay = new Date(dep);
				depDay.setHours(0, 0, 0, 0);
				return depDay.getTime() >= readyDay.getTime();
			})
			.sort((a: any, b: any) => new Date(a.enhanced?.departureTime || 0).getTime() - new Date(b.enhanced?.departureTime || 0).getTime());
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
		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="job-form">
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
							oninput={clearMessages}
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
							oninput={clearMessages}
							placeholder="Additional details about the shipment"
						/>
					</div>

					<div class="form-group full-width">
						<label for="special_instructions">Special Instructions</label>
						<textarea 
							id="special_instructions" 
							bind:value={formData.special_instructions}
							oninput={clearMessages}
							placeholder="Any special handling instructions or notes..."
							rows="4"
						></textarea>
					</div>

					<div class="form-group">
						<label for="pieces">Number of Pieces *</label>
						<input 
							type="number" 
							id="pieces" 
							bind:value={formData.pieces}
							oninput={clearMessages}
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
								oninput={clearMessages}
								class:error={errors.weight}
								min="1" 
								step="1"
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
							oninput={clearMessages}
							placeholder="e.g., 10 x 5 x 3 cm"
						/>
					</div>

					<div class="form-group">
						<label for="declared_value">Declared Value ($)</label>
						<input 
							type="number" 
							id="declared_value" 
							bind:value={formData.declared_value}
							oninput={clearMessages}
							min="0" 
							step="0.01"
							placeholder="0.00"
						/>
					</div>
				</div>
			</div>

			<!-- Service Information Section removed as requested -->

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
							oninput={clearMessages}
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
							oninput={clearMessages}
							class:error={errors.ready_time}
							required 
						/>
						{#if errors.ready_time}<span class="error-text">{errors.ready_time}</span>{/if}
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
									oninput={(e) => { shipperSearchQuery = (e.target as HTMLInputElement).value; clearMessages(); }}
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
							bind:value={formData.shipper_name}
							oninput={clearMessages}
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
							oninput={clearMessages}
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
							oninput={clearMessages}
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
							oninput={() => { clearMessages(); clearAddressValidation('shipper'); }}
							class:error={errors.shipper_address1}
							required 
						/>
						{#if errors.shipper_address1}<span class="error-text">{errors.shipper_address1}</span>{/if}
					</div>

	

					<div class="form-group">
						<label for="shipper_city">City *</label>
						<input 
							type="text" 
							id="shipper_city" 
							bind:value={formData.shipper_city}
							oninput={() => { clearMessages(); clearAddressValidation('shipper'); }}
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
							oninput={() => { clearMessages(); clearAddressValidation('shipper'); }}
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
							oninput={() => { clearMessages(); clearAddressValidation('shipper'); }}
							class:error={errors.shipper_zip}
							required 
						/>
						{#if errors.shipper_zip}<span class="error-text">{errors.shipper_zip}</span>{/if}
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
								placeholder="e.g., Heathrow Airport, London"
								value={consigneeSearchQuery}
								oninput={(e) => { consigneeSearchQuery = (e.target as HTMLInputElement).value; clearMessages(); }}
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
								bind:value={formData.consignee_name}
								oninput={clearMessages}
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
							oninput={clearMessages}
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
							oninput={clearMessages}
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
							oninput={() => { clearMessages(); clearAddressValidation('consignee'); }}
							class:error={errors.consignee_address1}
							required 
						/>
						{#if errors.consignee_address1}<span class="error-text">{errors.consignee_address1}</span>{/if}
					</div>

		

					<div class="form-group">
						<label for="consignee_city">City *</label>
						<input 
							type="text" 
							id="consignee_city" 
							bind:value={formData.consignee_city}
							oninput={() => { clearMessages(); clearAddressValidation('consignee'); }}
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
							oninput={() => { clearMessages(); clearAddressValidation('consignee'); }}
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
							oninput={() => { clearMessages(); clearAddressValidation('consignee'); }}
							class:error={errors.consignee_zip}
							required 
						/>
						{#if errors.consignee_zip}<span class="error-text">{errors.consignee_zip}</span>{/if}
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
					{#if !formData.ready_date}
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
							<p>Finding nearest airport and searching for flights to London Heathrow...</p>
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
									<span><strong>Departure Date:</strong> {formData.ready_date || 'Not set'}</span>
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
								<h4>🌟 Earliest Available Flights (starting {formData.ready_date})</h4>
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
													selectFeaturedFlights(filterFlightsFromReadyDate(flightResults.flights?.all || [], formData.ready_date || '')).earliest,
													selectFeaturedFlights(filterFlightsFromReadyDate(flightResults.flights?.all || [], formData.ready_date || '')).fastest,
													selectFeaturedFlights(filterFlightsFromReadyDate(flightResults.flights?.all || [], formData.ready_date || '')).cheapest
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
									<p>No flights found from {originAirport} to {destinationAirport} on {formData.ready_date} (after filtering out regional aircraft).</p>
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

			<!-- Additional Information Section removed as requested -->

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
										<td>{formData.pieces} pieces</td>
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
				<button type="button" class="btn secondary" onclick={() => goto('/dashboard/customer')}>
					Cancel
				</button>
				<button 
					type="submit" 
					class="btn primary" 
					disabled={submitting || !addressesValidated || !flightResults || !!flightSearchError || (flightResults?.summary?.totalOffers || 0) === 0}
				>
					{#if submitting}
						<div class="btn-spinner"></div>
						Creating Job...
					{:else}
						Create Job
					{/if}
				</button>
			</div>
			
			<!-- Button Status Message -->
			{#if !submitting && (!addressesValidated || !flightResults || !!flightSearchError || (flightResults?.summary?.totalOffers || 0) === 0)}
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
		color: #34547a;
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
		border-top: 4px solid #34547a;
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

	.form-group input:focus,
	.form-group select:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: #34547a;
		box-shadow: 0 0 0 3px rgba(52, 84, 122, 0.1);
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

	/* Earliest Available Flights Table */
	.earliest-flights {
		overflow-x: auto;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.earliest-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
		color: #374151;
	}

	.earliest-table th,
	.earliest-table td {
		padding: 0.75rem 1rem;
		text-align: left;
		border-bottom: 1px solid #e5e7eb;
	}

	.earliest-table th {
		background-color: #f9fafb;
		font-weight: 600;
		color: #1f2937;
	}

	.earliest-table tr:last-child td {
		border-bottom: none;
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

	.earliest-table tr.recommended-row {
		background-color: #f0f9eb; /* Light green background for recommended flights */
		font-weight: 600;
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