import { supabase } from '$lib/supabase';
import type { FlightRecommendation } from '$lib/flightalgo/flightSelection';

/**
 * Save estimated flight timing information to the timetable
 * This is called after job creation when flight selection is completed
 * Note: Only timing data goes to timetable, flight metadata goes to AWB table
 * Note: timetable table uses jobno field, not jobnumber (as per project convention)
 */
export async function saveFlightEstimatesToTimetable(
	jobno: string,
	flightRecommendation: FlightRecommendation
): Promise<{ success: boolean; error?: string }> {
	try {
		if (!flightRecommendation.flight || !flightRecommendation.flightDetails) {
			return { success: false, error: 'No flight details available to save' };
		}

		const flight = flightRecommendation.flight;
		const details = flightRecommendation.flightDetails;

		// Prepare the timing data (only timing estimates, no flight metadata)
		const timingData = {
			jobno,
			estimated_flight_departure: flight.enhanced.departureTime,
			estimated_flight_arrival: flight.enhanced.arrivalTime,
			estimated_airport_pickup: details.cargoReadyTimeISO,
			estimated_cargo_ready: details.cargoReadyTimeISO,
			estimated_delivery: flightRecommendation.etaISO,
			updated_at: new Date().toISOString()
		};

		console.log('📅 Saving flight timing estimates to timetable:', {
			jobno,
			departure: flight.enhanced.departureTime,
			arrival: flight.enhanced.arrivalTime,
			estimatedDelivery: flightRecommendation.etaISO
		});

		// Check if timetable entry already exists
		const { data: existingEntry, error: checkError } = await supabase
			.from('timetable')
			.select('id')
			.eq('jobno', jobno)
			.maybeSingle();

		if (checkError) {
			console.error('Error checking existing timetable entry:', checkError);
			return { success: false, error: checkError.message };
		}

		let result;
		if (existingEntry) {
			// Update existing timetable entry
			result = await supabase
				.from('timetable')
				.update(timingData)
				.eq('jobno', jobno)
				.select();
		} else {
			// Insert new timetable entry with timing estimates
			// The created_at field should be populated by database trigger
			result = await supabase
				.from('timetable')
				.insert(timingData)
				.select();
		}

		if (result.error) {
			console.error('Error saving flight timing estimates:', result.error);
			return { success: false, error: result.error.message };
		}

		console.log('✅ Flight timing estimates saved to timetable successfully');
		return { success: true };

	} catch (error) {
		console.error('Unexpected error saving flight timing estimates:', error);
		return { 
			success: false, 
			error: error instanceof Error ? error.message : 'Unknown error' 
		};
	}
}

/**
 * Update flight estimates in existing timetable entry
 * Used when flight selection is changed after job creation
 */
export async function updateFlightEstimates(
	jobno: string,
	flightRecommendation: FlightRecommendation
): Promise<{ success: boolean; error?: string }> {
	// Same logic as save, but ensures we're updating an existing entry
	return saveFlightEstimatesToTimetable(jobno, flightRecommendation);
}

/**
 * Get flight timing estimates from timetable for a job
 * Note: Flight metadata is now stored in AWB table, not timetable
 */
export async function getFlightEstimates(jobno: string): Promise<{
	success: boolean;
	estimates?: {
		estimated_flight_departure: string | null;
		estimated_flight_arrival: string | null;
		estimated_airport_pickup: string | null;
		estimated_cargo_ready: string | null;
		estimated_delivery: string | null;
	};
	error?: string;
}> {
	try {
		const { data, error } = await supabase
			.from('timetable')
			.select(`
				estimated_flight_departure,
				estimated_flight_arrival,
				estimated_airport_pickup,
				estimated_cargo_ready,
				estimated_delivery
			`)
			.eq('jobno', jobno)
			.maybeSingle();

		if (error) {
			return { success: false, error: error.message };
		}

		return { success: true, estimates: data };
	} catch (error) {
		return { 
			success: false, 
			error: error instanceof Error ? error.message : 'Unknown error' 
		};
	}
}
