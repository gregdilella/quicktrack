/**
 * Server-side geocoding API endpoint
 * This handles Google Maps Geocoding API calls server-side to keep API keys secure
 */

import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

// Google Maps API configuration
const GOOGLE_MAPS_API_KEY = env.GOOGLE_MAPS_API_KEY;

// Debug: Check if API key is loaded
if (!GOOGLE_MAPS_API_KEY) {
	console.error('❌ GOOGLE_MAPS_API_KEY environment variable is not set in geocoding API!');
} else {
	console.log(`✅ Google Maps API key loaded in geocoding API: ${GOOGLE_MAPS_API_KEY.substring(0, 10)}...`);
}

// Types for Google Maps API responses
interface AddressComponent {
	long_name: string;
	short_name: string;
	types: string[];
}

interface GeocodeResult {
	address_components: AddressComponent[];
	formatted_address: string;
	geometry: {
		location: {
			lat: number;
			lng: number;
		};
		location_type: string;
		viewport: {
			northeast: { lat: number; lng: number };
			southwest: { lat: number; lng: number };
		};
	};
	place_id: string;
	types: string[];
}

interface ValidatedAddress {
	original: string;
	formatted: string;
	latitude: number;
	longitude: number;
	components: {
		street_number?: string;
		route?: string;
		locality?: string; // city
		administrative_area_level_1?: string; // state
		postal_code?: string;
		country?: string;
	};
	place_id: string;
	confidence: 'high' | 'medium' | 'low';
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Check if API key is available
		if (!GOOGLE_MAPS_API_KEY) {
			console.error('❌ Google Maps API key missing in geocoding API');
			return json({ 
				success: false,
				error: 'Google Maps API key not configured. Please set GOOGLE_MAPS_API_KEY in your .env file.'
			}, { status: 500 });
		}

		const { address } = await request.json();

		if (!address) {
			return json({ 
				success: false,
				error: 'Address is required' 
			}, { status: 400 });
		}

		console.log(`[Geocoding API] Validating address: ${address}`);

		const encodedAddress = encodeURIComponent(address);
		const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}`;
		
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		
		const data = await response.json();
		
		if (data.status !== 'OK' || !data.results || data.results.length === 0) {
			console.warn('Address validation failed:', data.status, data.error_message);
			return json({
				success: false,
				error: `Address validation failed: ${data.status} - ${data.error_message || 'No results found'}`
			}, { status: 400 });
		}
		
		const result: GeocodeResult = data.results[0];
		
		// Extract address components
		const components: ValidatedAddress['components'] = {};
		result.address_components.forEach(component => {
			if (component.types.includes('street_number')) {
				components.street_number = component.long_name;
			} else if (component.types.includes('route')) {
				components.route = component.long_name;
			} else if (component.types.includes('locality')) {
				components.locality = component.long_name;
			} else if (component.types.includes('administrative_area_level_1')) {
				components.administrative_area_level_1 = component.short_name;
			} else if (component.types.includes('postal_code')) {
				components.postal_code = component.long_name;
			} else if (component.types.includes('country')) {
				components.country = component.long_name;
			}
		});
		
		// Determine confidence level based on location type
		let confidence: ValidatedAddress['confidence'] = 'medium';
		if (result.geometry.location_type === 'ROOFTOP') {
			confidence = 'high';
		} else if (result.geometry.location_type === 'APPROXIMATE') {
			confidence = 'low';
		}
		
		const validatedAddress: ValidatedAddress = {
			original: address,
			formatted: result.formatted_address,
			latitude: result.geometry.location.lat,
			longitude: result.geometry.location.lng,
			components,
			place_id: result.place_id,
			confidence
		};

		console.log(`[Geocoding API] Address validated successfully: ${validatedAddress.formatted}`);
		
		return json({
			success: true,
			result: validatedAddress
		});
		
	} catch (error) {
		console.error('[Geocoding API] Error:', error);
		return json({ 
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred'
		}, { status: 500 });
	}
};
