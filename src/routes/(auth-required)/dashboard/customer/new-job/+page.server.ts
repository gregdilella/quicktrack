import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { saveFlightEstimatesToTimetable } from '$lib/services/timetableService';
import { updateAWBWithFlightMetadata } from '$lib/services/awbService';
import type { FlightRecommendation } from '$lib/flightalgo/flightSelection';

export const load = (async () => {
	return {};
}) satisfies PageServerLoad;

export const actions = {
	/**
	 * Server-side action to save flight estimates to timetable
	 * This can be called from the client after job creation if needed
	 */
	saveFlightEstimates: async ({ request }) => {
		try {
					const formData = await request.formData();
		const jobno = formData.get('jobno') as string;
		const flightRecommendationData = formData.get('flightRecommendation') as string;
		const originAirportCode = formData.get('originAirportCode') as string;
		const destinationAirportCode = formData.get('destinationAirportCode') as string;

		if (!jobno || !flightRecommendationData || !originAirportCode || !destinationAirportCode) {
			return fail(400, { 
				error: 'Missing required fields: jobno, flightRecommendation, originAirportCode, destinationAirportCode' 
			});
		}

			// Parse the flight recommendation JSON
			let flightRecommendation: FlightRecommendation;
			try {
				flightRecommendation = JSON.parse(flightRecommendationData);
			} catch (parseError) {
				return fail(400, { error: 'Invalid flight recommendation data' });
			}

					// Save flight timing estimates to timetable
		const timetableResult = await saveFlightEstimatesToTimetable(
			jobno,
			flightRecommendation
		);

			if (!timetableResult.success) {
				return fail(500, { error: timetableResult.error || 'Failed to save flight timing estimates' });
			}

			// Update AWB with flight metadata
			const awbResult = await updateAWBWithFlightMetadata(
							jobno,
			flightRecommendation,
			originAirportCode,
			destinationAirportCode
			);

			if (!awbResult.success) {
				return fail(500, { error: awbResult.error || 'Failed to update AWB with flight metadata' });
			}

			return { success: true };

		} catch (err) {
			console.error('Error in saveFlightEstimates action:', err);
			return fail(500, { error: 'Internal server error' });
		}
	}
} satisfies Actions;
