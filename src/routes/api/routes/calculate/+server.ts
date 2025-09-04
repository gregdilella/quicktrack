/**
 * API endpoint for calculating routes with toll information
 * This handles the Google Maps APIs server-side to avoid CORS issues
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Google Maps API configuration
import { env } from '$env/dynamic/private';
const GOOGLE_MAPS_API_KEY = env.GOOGLE_MAPS_API_KEY;

// Debug: Check if API key is loaded
if (!GOOGLE_MAPS_API_KEY) {
	console.error('❌ GOOGLE_MAPS_API_KEY environment variable is not set in routes API!');
} else {
	console.log(`✅ Google Maps API key loaded in routes API: ${GOOGLE_MAPS_API_KEY.substring(0, 10)}...`);
}

interface RouteInfo {
	distance_miles: number;
	duration_minutes: number;
	toll_info?: {
		estimated_price: number;
		currency: string;
	};
	has_tolls: boolean;
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Check if API key is available
		if (!GOOGLE_MAPS_API_KEY) {
			console.error('❌ Google Maps API key missing in routes API');
			return json({ 
				success: false,
				error: 'Google Maps API key not configured. Please set GOOGLE_MAPS_API_KEY in your .env file.'
			}, { status: 500 });
		}

			const { origin, destination, departureTime } = await request.json();

	if (!origin || !destination) {
		return json({ 
			success: false,
			error: 'Origin and destination are required' 
		}, { status: 400 });
	}

			console.log(`[Route API] Calculating route from ${origin} to ${destination}`);
	if (departureTime) {
		console.log(`[Route API] Using departure time: ${departureTime}`);
	}

	// First, get directions using the standard Directions API
	// Use metric units to match what Google Maps embed shows, and include traffic
	// Support both "now" and specific departure times (as Unix timestamp)
	let departureTimeParam = 'now';
	if (departureTime && departureTime !== 'now') {
		// Convert ISO string to Unix timestamp if needed
		if (typeof departureTime === 'string' && departureTime.includes('T')) {
			departureTimeParam = Math.floor(new Date(departureTime).getTime() / 1000).toString();
		} else {
			departureTimeParam = departureTime.toString();
		}
		console.log(`[Route API] Using departure timestamp: ${departureTimeParam}`);
	}
	
	const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&units=metric&avoid=ferries&departure_time=${departureTimeParam}&key=${GOOGLE_MAPS_API_KEY}`;
		
		const directionsResponse = await fetch(directionsUrl);
		if (!directionsResponse.ok) {
			throw new Error(`Directions API error! status: ${directionsResponse.status}`);
		}
		
		const directionsData = await directionsResponse.json();
		
		if (directionsData.status !== 'OK' || !directionsData.routes || directionsData.routes.length === 0) {
			console.warn('[Route API] Route calculation failed:', directionsData.status);
			return json({ 
				success: false, 
				error: 'Route calculation failed',
				details: directionsData.error_message || 'No routes found'
			}, { status: 404 });
		}
		
		const route = directionsData.routes[0];
		const leg = route.legs[0];
		
		// Extract basic route information
		const distanceText = leg.distance.text;
		
		// Get traffic-aware duration (duration_in_traffic takes precedence over duration)
		let durationMinutes: number;
		let durationSource: string;
		
		if (leg.duration_in_traffic && leg.duration_in_traffic.value) {
			// Use traffic-aware duration
			durationMinutes = Math.round(leg.duration_in_traffic.value / 60);
			durationSource = `${leg.duration_in_traffic.text} (with traffic)`;
		} else {
			// Fallback to regular duration
			durationMinutes = Math.round(leg.duration.value / 60);
			durationSource = `${leg.duration.text} (no traffic data)`;
		}
		
		// Parse distance and keep original units to match the map
		let distance: number;
		let distanceUnit: string;
		const distanceValue = parseFloat(distanceText.replace(/[^\d.]/g, ''));
		
		if (distanceText.toLowerCase().includes('km')) {
			// Distance is in kilometers - keep as is
			distance = distanceValue;
			distanceUnit = 'km';
		} else if (distanceText.toLowerCase().includes('mi')) {
			// Distance is in miles - keep as is
			distance = distanceValue;
			distanceUnit = 'mi';
		} else {
			// If no unit specified, use the raw value from API (meters) and convert to km
			distance = leg.distance.value / 1000; // Convert meters to kilometers
			distanceUnit = 'km';
		}
		
		console.log(`[Route API] Route from Google:`);
		console.log(`  - Distance text: "${distanceText}"`);
		console.log(`  - Distance value (meters): ${leg.distance.value}`);
		console.log(`  - Duration text: "${leg.duration.text}"`);
		console.log(`  - Duration value (seconds): ${leg.duration.value}`);
		if (leg.duration_in_traffic) {
			console.log(`  - Traffic duration text: "${leg.duration_in_traffic.text}"`);
			console.log(`  - Traffic duration value (seconds): ${leg.duration_in_traffic.value}`);
		}
		console.log(`[Route API] Final result:`);
		console.log(`  - Distance: ${distance.toFixed(1)} ${distanceUnit}`);
		console.log(`  - Duration: ${durationMinutes} minutes`);
		console.log(`  - Duration source: ${durationSource}`);
		console.log(`  - Using traffic data: ${leg.duration_in_traffic ? 'YES' : 'NO'}`);
		
		// Check for tolls in route steps (basic check)
		let hasBasicTolls = false;
		for (const step of leg.steps) {
			if (step.html_instructions && step.html_instructions.toLowerCase().includes('toll')) {
				hasBasicTolls = true;
				break;
			}
		}
		
		// Get coordinates for advanced toll calculation
		const originLat = leg.start_location.lat;
		const originLng = leg.start_location.lng;
		const destLat = leg.end_location.lat;
		const destLng = leg.end_location.lng;
		
		// Use Routes API for detailed toll information
		const routesApiUrl = 'https://routes.googleapis.com/directions/v2:computeRoutes';
		const payload = {
			origin: {
				location: {
					latLng: {
						latitude: originLat,
						longitude: originLng
					}
				}
			},
			destination: {
				location: {
					latLng: {
						latitude: destLat,
						longitude: destLng
					}
				}
			},
			travelMode: 'DRIVE',
			extraComputations: ['TOLLS'],
			routeModifiers: {
				vehicleInfo: {
					emissionType: 'GASOLINE'
				}
			}
		};
		
		let tollInfo: { estimated_price: number; currency: string } | undefined = undefined;
		let hasTolls = hasBasicTolls;
		
		try {
			const routesResponse = await fetch(routesApiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
					'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.travelAdvisory.tollInfo,routes.legs.travelAdvisory.tollInfo'
				},
				body: JSON.stringify(payload)
			});
			
			if (routesResponse.ok) {
				const routesData = await routesResponse.json();
				
				if (routesData.routes && routesData.routes.length > 0) {
					const routeWithTolls = routesData.routes[0];
					
					// Check for toll information
					if (routeWithTolls.legs && routeWithTolls.legs.length > 0) {
						const legWithTolls = routeWithTolls.legs[0];
						if (legWithTolls.travelAdvisory && legWithTolls.travelAdvisory.tollInfo) {
							const tollData = legWithTolls.travelAdvisory.tollInfo;
							if (tollData.estimatedPrice && tollData.estimatedPrice.length > 0) {
								const price = tollData.estimatedPrice[0];
								tollInfo = {
									estimated_price: parseFloat(price.units || '0') + parseFloat(price.nanos || '0') / 1e9,
									currency: price.currencyCode || 'USD'
								};
								hasTolls = true;
								console.log(`[Route API] Found tolls: $${tollInfo.estimated_price}`);
							}
						}
					}
				}
			} else {
				console.warn('[Route API] Routes API failed:', routesResponse.status);
			}
		} catch (tollError) {
			console.warn('[Route API] Toll calculation failed:', tollError);
			// Continue without toll info
		}
		
		const result = {
			distance_miles: distance, // Keep the field name for compatibility but now contains the actual distance value
			distance_unit: distanceUnit, // Add the unit information
			duration_minutes: durationMinutes,
			toll_info: tollInfo,
			has_tolls: hasTolls
		};
		
		console.log(`[Route API] Final result:`, result);
		
		return json({
			success: true,
			route: result
		});
		
	} catch (error) {
		console.error('[Route API] Unexpected error:', error);
		return json({ 
			success: false,
			error: 'Failed to calculate route',
			details: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
};
