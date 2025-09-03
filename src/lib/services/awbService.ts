import { supabase } from '$lib/supabase';
import type { Database } from '$lib/types/supabase.types';

type AWBInsert = Database['public']['Tables']['awb']['Insert'];
type Airline = Database['public']['Tables']['airlines']['Row'];

/**
 * Flight data structure from flight search API
 */
export interface FlightData {
	id?: string;
	enhanced?: {
		departureTime?: string;
		arrivalTime?: string;
		airlines?: string[];
		aircraft?: string;
		totalDuration?: string;
		stops?: number;
	};
	price?: {
		total?: string;
		currency?: string;
	};
	segments?: Array<{
		departure?: {
			iataCode?: string;
			at?: string;
		};
		arrival?: {
			iataCode?: string;
			at?: string;
		};
		carrierCode?: string;
		number?: string;
		aircraft?: {
			code?: string;
		};
	}>;
}

/**
 * Job data for AWB creation
 */
export interface JobDataForAWB {
	jobnumber: string;
	pieces?: number;
	weight?: number;
	weight_unit?: string;
	dimensions?: string;
	created_by?: string | null;
}

/**
 * Generate a random 8-digit number for AWB suffix
 */
function generateRandomAWBSuffix(): string {
	// Generate 8 random digits
	let suffix = '';
	for (let i = 0; i < 8; i++) {
		suffix += Math.floor(Math.random() * 10).toString();
	}
	return suffix;
}

/**
 * Generate AWB number using airline IATA prefix + 8 random digits
 * Format: XXX-XXXXXXXX (e.g., 001-44445555)
 */
function generateAWBNumber(iataPrefix: string): string {
	const suffix = generateRandomAWBSuffix();
	return `${iataPrefix}-${suffix}`;
}

/**
 * Find airline by IATA code from flight data
 */
async function findAirlineByIATACode(iataCode: string): Promise<Airline | null> {
	try {
		const { data, error } = await supabase
			.from('airlines')
			.select('*')
			.eq('airline_code', iataCode)
			.single();

		if (error) {
			console.warn(`Airline not found for IATA code: ${iataCode}`, error);
			return null;
		}

		return data;
	} catch (error) {
		console.error('Error finding airline:', error);
		return null;
	}
}

/**
 * Find airline by airline name (fallback method)
 */
async function findAirlineByName(airlineName: string): Promise<Airline | null> {
	try {
		const { data, error } = await supabase
			.from('airlines')
			.select('*')
			.ilike('airline_name', `%${airlineName}%`)
			.limit(1)
			.single();

		if (error) {
			console.warn(`Airline not found for name: ${airlineName}`, error);
			return null;
		}

		return data;
	} catch (error) {
		console.error('Error finding airline by name:', error);
		return null;
	}
}

/**
 * Extract primary airline from flight data
 * Returns the main carrier (first segment or most prominent airline)
 */
function extractPrimaryAirline(flightData: FlightData): string | null {
	// Try to get from segments first (most accurate)
	if (flightData.segments && flightData.segments.length > 0) {
		const firstSegment = flightData.segments[0];
		if (firstSegment.carrierCode) {
			return firstSegment.carrierCode;
		}
	}

	// Fallback to enhanced airlines data
	if (flightData.enhanced?.airlines && flightData.enhanced.airlines.length > 0) {
		// Try to extract IATA code from airline name
		const airlineName = flightData.enhanced.airlines[0];
		// This is a simple extraction - you might need more sophisticated parsing
		// depending on how airline names are formatted in your flight data
		return airlineName;
	}

	return null;
}

/**
 * Extract flight number from flight data
 */
function extractFlightNumber(flightData: FlightData): string | null {
	if (flightData.segments && flightData.segments.length > 0) {
		const firstSegment = flightData.segments[0];
		if (firstSegment.carrierCode && firstSegment.number) {
			return `${firstSegment.carrierCode}${firstSegment.number}`;
		}
	}
	return null;
}

/**
 * Extract flight date from flight data
 */
function extractFlightDate(flightData: FlightData): string | null {
	if (flightData.enhanced?.departureTime) {
		return new Date(flightData.enhanced.departureTime).toISOString().split('T')[0];
	}
	
	if (flightData.segments && flightData.segments.length > 0) {
		const firstSegment = flightData.segments[0];
		if (firstSegment.departure?.at) {
			return new Date(firstSegment.departure.at).toISOString().split('T')[0];
		}
	}
	
	return null;
}

/**
 * Extract origin and destination airports from flight data
 */
function extractAirports(flightData: FlightData): { origin: string | null; destination: string | null } {
	if (flightData.segments && flightData.segments.length > 0) {
		const firstSegment = flightData.segments[0];
		const lastSegment = flightData.segments[flightData.segments.length - 1];
		
		return {
			origin: firstSegment.departure?.iataCode || null,
			destination: lastSegment.arrival?.iataCode || null
		};
	}
	
	return { origin: null, destination: null };
}

/**
 * Calculate estimated cost based on flight price and weight
 */
function calculateEstimatedCost(flightData: FlightData, weight?: number): { cost: number | null; currency: string } {
	if (flightData.price?.total) {
		// Parse the price (remove currency symbols if present)
		const priceStr = flightData.price.total.replace(/[^0-9.]/g, '');
		const basePrice = parseFloat(priceStr);
		
		if (!isNaN(basePrice)) {
			// Simple weight-based calculation (you can adjust this logic)
			const weightMultiplier = weight ? Math.max(1, weight / 100) : 1;
			const estimatedCost = basePrice * weightMultiplier;
			
			return {
				cost: Math.round(estimatedCost * 100) / 100, // Round to 2 decimal places
				currency: flightData.price.currency || 'USD'
			};
		}
	}
	
	return { cost: null, currency: 'USD' };
}

/**
 * Create AWB record automatically when a job is created
 * This function extracts airline info from flight data and generates AWB
 */
export async function createAWBFromFlightData(
	jobData: JobDataForAWB,
	flightData: FlightData | null,
	originAirport?: string,
	destinationAirport?: string
): Promise<{ success: boolean; awb?: any; awbNumber?: string; error?: string }> {
	try {
		console.log('🛫 Creating AWB from flight data:', { jobData, flightData, originAirport, destinationAirport });

		let airline: Airline | null = null;
		let awbNumber: string;

		if (flightData) {
			// Extract primary airline from flight data
			const primaryAirlineCode = extractPrimaryAirline(flightData);
			console.log('Primary airline code extracted:', primaryAirlineCode);

			if (primaryAirlineCode) {
				// Try to find airline by IATA code
				airline = await findAirlineByIATACode(primaryAirlineCode);
				
				// If not found by code, try by name (fallback)
				if (!airline && flightData.enhanced?.airlines && flightData.enhanced.airlines.length > 0) {
					airline = await findAirlineByName(flightData.enhanced.airlines[0]);
				}
			}
		}

		// If no airline found from flight data, use a default airline or create a generic AWB
		if (!airline) {
			console.warn('No airline found from flight data, using default airline');
			// Try to get the first available airline as fallback
			const { data: defaultAirline } = await supabase
				.from('airlines')
				.select('*')
				.limit(1)
				.single();
			
			if (defaultAirline) {
				airline = defaultAirline;
			} else {
				return { success: false, error: 'No airlines available in database' };
			}
		}

		// Generate AWB number using airline's IATA prefix
		if (airline.iata_prefix) {
			awbNumber = generateAWBNumber(airline.iata_prefix);
		} else {
			// Fallback: use airline code or generic prefix
			const fallbackPrefix = airline.airline_code?.substring(0, 3).padEnd(3, '0') || '999';
			awbNumber = generateAWBNumber(fallbackPrefix);
			console.warn(`Using fallback prefix for airline ${airline.airline_name}: ${fallbackPrefix}`);
		}

		// Extract flight information
		const flightNumber = flightData ? extractFlightNumber(flightData) : null;
		const flightDate = flightData ? extractFlightDate(flightData) : null;
		const airports = flightData ? extractAirports(flightData) : { origin: null, destination: null };
		const costInfo = flightData ? calculateEstimatedCost(flightData, jobData.weight) : { cost: null, currency: 'USD' };

		// Use provided airports or extracted ones
		const finalOriginAirport = originAirport || airports.origin;
		const finalDestinationAirport = destinationAirport || airports.destination;

		// Create AWB record
		const awbData: AWBInsert = {
			awb_number: awbNumber,
			airline_id: airline.id,
			jobnumber: jobData.jobnumber,
			pieces: jobData.pieces || null,
			weight: jobData.weight || null,
			weight_unit: jobData.weight_unit || 'kg',
			dimensions: jobData.dimensions || null,
			cost: costInfo.cost,
			currency: costInfo.currency,
			flight_number: flightNumber,
			flight_date: flightDate,
			origin_airport: finalOriginAirport,
			destination_airport: finalDestinationAirport,
			status: 'Created',
			notes: flightData ? `Auto-generated from flight ${flightNumber || 'N/A'}` : 'Auto-generated AWB',
			created_by: jobData.created_by || null
		};

		console.log('📋 Creating AWB record:', awbData);

		const { data: newAWB, error } = await supabase
			.from('awb')
			.insert(awbData)
			.select('*')
			.single();

		if (error) {
			console.error('Error creating AWB:', error);
			return { success: false, error: error.message };
		}

		console.log('✅ AWB created successfully:', newAWB);

		return { 
			success: true, 
			awb: newAWB, 
			awbNumber: awbNumber 
		};

	} catch (error) {
		console.error('Error in createAWBFromFlightData:', error);
		return { 
			success: false, 
			error: error instanceof Error ? error.message : 'Unknown error occurred' 
		};
	}
}

/**
 * Generate AWB number only (utility function)
 */
export async function generateAWBNumberForAirline(airlineId: number): Promise<string | null> {
	try {
		const { data: airline, error } = await supabase
			.from('airlines')
			.select('iata_prefix, airline_code, airline_name')
			.eq('id', airlineId)
			.single();

		if (error || !airline) {
			console.error('Error fetching airline for AWB generation:', error);
			return null;
		}

		if (airline.iata_prefix) {
			return generateAWBNumber(airline.iata_prefix);
		} else {
			// Fallback
			const fallbackPrefix = airline.airline_code?.substring(0, 3).padEnd(3, '0') || '999';
			return generateAWBNumber(fallbackPrefix);
		}
	} catch (error) {
		console.error('Error generating AWB number:', error);
		return null;
	}
}

/**
 * Check if AWB number already exists (for uniqueness validation)
 */
export async function isAWBNumberUnique(awbNumber: string): Promise<boolean> {
	try {
		const { data, error } = await supabase
			.from('awb')
			.select('awb_number')
			.eq('awb_number', awbNumber)
			.limit(1);

		if (error) {
			console.error('Error checking AWB uniqueness:', error);
			return false;
		}

		return data.length === 0;
	} catch (error) {
		console.error('Error in AWB uniqueness check:', error);
		return false;
	}
}
