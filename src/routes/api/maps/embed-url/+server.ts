/**
 * Server-side Google Maps embed URL generation
 * This handles Google Maps Embed API calls server-side to keep API keys secure
 */

import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

// Google Maps API configuration
const GOOGLE_MAPS_API_KEY = env.GOOGLE_MAPS_API_KEY;

// Debug: Check if API key is loaded
if (!GOOGLE_MAPS_API_KEY) {
	console.error('❌ GOOGLE_MAPS_API_KEY environment variable is not set in maps embed API!');
} else {
	console.log(`✅ Google Maps API key loaded in embed API: ${GOOGLE_MAPS_API_KEY.substring(0, 10)}...`);
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Check if API key is available
		if (!GOOGLE_MAPS_API_KEY) {
			console.error('❌ Google Maps API key missing in embed API');
			return json({ 
				success: false,
				error: 'Google Maps API key not configured. Please set GOOGLE_MAPS_API_KEY in your .env file.'
			}, { status: 500 });
		}

		const { type, ...params } = await request.json();

		let embedUrl: string;

		switch (type) {
			case 'place':
				const { latitude, longitude, zoom: placeZoom = 15 } = params;
				if (!latitude || !longitude) {
					return json({ 
						success: false,
						error: 'Latitude and longitude are required for place embed' 
					}, { status: 400 });
				}
				embedUrl = `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${latitude},${longitude}&zoom=${placeZoom}`;
				break;

			case 'directions':
				const { 
					originLat, 
					originLng, 
					destinationLat, 
					destinationLng, 
					zoom: directionsZoom = 12,
					mode = 'driving'
				} = params;
				
				if (!originLat || !originLng || !destinationLat || !destinationLng) {
					return json({ 
						success: false,
						error: 'Origin and destination coordinates are required for directions embed' 
					}, { status: 400 });
				}
				
				const origin = `${originLat},${originLng}`;
				const destination = `${destinationLat},${destinationLng}`;
				embedUrl = `https://www.google.com/maps/embed/v1/directions?key=${GOOGLE_MAPS_API_KEY}&origin=${origin}&destination=${destination}&zoom=${directionsZoom}&mode=${mode}&units=metric`;
				break;

			case 'search':
				const { query, zoom: searchZoom = 15 } = params;
				if (!query) {
					return json({ 
						success: false,
						error: 'Query is required for search embed' 
					}, { status: 400 });
				}
				embedUrl = `https://www.google.com/maps/embed/v1/search?key=${GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(query)}&zoom=${searchZoom}`;
				break;

			default:
				return json({ 
					success: false,
					error: `Unsupported embed type: ${type}. Supported types: place, directions, search` 
				}, { status: 400 });
		}

		console.log(`[Maps Embed API] Generated ${type} embed URL`);
		
		return json({
			success: true,
			embedUrl
		});
		
	} catch (error) {
		console.error('[Maps Embed API] Error:', error);
		return json({ 
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred'
		}, { status: 500 });
	}
};
