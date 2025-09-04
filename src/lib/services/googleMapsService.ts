/**
 * Google Maps API Service for address validation and geocoding
 * 
 * This service handles:
 * - Address geocoding and validation
 * - Distance and route calculations
 * - Toll information retrieval
 */

// Google Maps API configuration
// Note: API key is handled server-side for security

// Types for Google Maps API responses
export interface AddressComponent {
	long_name: string;
	short_name: string;
	types: string[];
}

export interface GeocodeResult {
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

export interface ValidatedAddress {
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

export interface RouteInfo {
	distance_miles: number;
	distance_unit?: string; // 'km' or 'mi'
	duration_minutes: number;
	toll_info?: {
		estimated_price: number;
		currency: string;
	};
	has_tolls: boolean;
}

export interface AirportInfo {
	name: string;
	iata_code?: string;
	icao_code?: string;
	formatted_address: string;
	latitude: number;
	longitude: number;
	place_id: string;
	rating?: number;
	distance_miles?: number;
	drive_time_minutes?: number;
}

export interface AirportRouteInfo extends RouteInfo {
	airport: AirportInfo;
	origin: {
		latitude: number;
		longitude: number;
	};
	alternativeAirports?: AirportInfo[]; // For fallback options
}

/**
 * Validates and geocodes an address using our server-side API
 */
export async function validateAddress(address: string): Promise<ValidatedAddress | null> {
	try {
		console.log(`[Client] Validating address: ${address}`);
		
		const response = await fetch('/api/geocode/validate', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ address })
		});
		
		if (!response.ok) {
			throw new Error(`Geocoding API error! status: ${response.status}`);
		}
		
		const data = await response.json();
		
		if (!data.success) {
			console.warn('Address validation failed:', data.error);
			return null;
		}
		
		console.log('[Client] Address validated successfully:', data.result.formatted);
		return data.result;
		
	} catch (error) {
		console.error('Error validating address:', error);
		return null;
	}
}

/**
 * Calculates route information between two addresses including tolls
 * @param origin Starting address or coordinates
 * @param destination Ending address or coordinates  
 * @param departureTime Optional departure time (ISO string, Unix timestamp, or 'now')
 */
export async function calculateRoute(
	origin: string, 
	destination: string, 
	departureTime?: string | number
): Promise<RouteInfo | null> {
	try {
		console.log(`[Client] Calculating route from ${origin} to ${destination}`);
		if (departureTime) {
			console.log(`[Client] Using departure time: ${departureTime}`);
		}
		
		const requestBody: any = { origin, destination };
		if (departureTime) {
			requestBody.departureTime = departureTime;
		}
		
		const response = await fetch('/api/routes/calculate', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(requestBody)
		});
		
		if (!response.ok) {
			throw new Error(`Route API error! status: ${response.status}`);
		}
		
		const data = await response.json();
		
		if (!data.success) {
			console.warn('Route calculation failed:', data.error);
			return null;
		}
		
		console.log('[Client] Route calculated successfully:', data.route);
		return data.route;
		
	} catch (error) {
		console.error('Error calculating route:', error);
		return null;
	}
}

/**
 * Builds a complete address string from form components
 */
export function buildAddressString(
	address1: string,
	address2: string,
	city: string,
	state: string,
	zip: string
): string {
	const parts = [
		address1.trim(),
		address2?.trim(),
		city.trim(),
		state.trim(),
		zip.trim()
	].filter(Boolean);
	
	return parts.join(', ');
}

/**
 * Generates a Google Maps embed URL for displaying a location using server-side API
 */
export async function getMapEmbedUrl(latitude: number, longitude: number, zoom: number = 15): Promise<string> {
	try {
		console.log(`[Client] Generating place embed URL for: ${latitude}, ${longitude}`);
		
		const response = await fetch('/api/maps/embed-url', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ 
				type: 'place',
				latitude,
				longitude,
				zoom
			})
		});
		
		if (!response.ok) {
			throw new Error(`Maps embed API error! status: ${response.status}`);
		}
		
		const data = await response.json();
		
		if (!data.success) {
			console.warn('Map embed URL generation failed:', data.error);
			// Fallback to regular Google Maps URL
			return `https://www.google.com/maps?q=${latitude},${longitude}&z=${zoom}`;
		}
		
		console.log('[Client] Map embed URL generated successfully');
		return data.embedUrl;
		
	} catch (error) {
		console.error('Error generating map embed URL:', error);
		// Fallback to regular Google Maps URL
		return `https://www.google.com/maps?q=${latitude},${longitude}&z=${zoom}`;
	}
}

/**
 * Generates a Google Maps embed URL with directions using server-side API
 */
export async function getMapEmbedUrlWithDirections(
	originLat: number, 
	originLng: number, 
	destinationLat: number, 
	destinationLng: number,
	zoom: number = 12
): Promise<string> {
	try {
		console.log(`[Client] Generating directions embed URL: ${originLat},${originLng} → ${destinationLat},${destinationLng}`);
		
		const response = await fetch('/api/maps/embed-url', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ 
				type: 'directions',
				originLat,
				originLng,
				destinationLat,
				destinationLng,
				zoom,
				mode: 'driving'
			})
		});
		
		if (!response.ok) {
			throw new Error(`Maps embed API error! status: ${response.status}`);
		}
		
		const data = await response.json();
		
		if (!data.success) {
			console.warn('Directions embed URL generation failed:', data.error);
			// Fallback to regular Google Maps URL
			return `https://www.google.com/maps/dir/${originLat},${originLng}/${destinationLat},${destinationLng}`;
		}
		
		console.log('[Client] Directions embed URL generated successfully');
		return data.embedUrl;
		
	} catch (error) {
		console.error('Error generating directions embed URL:', error);
		// Fallback to regular Google Maps URL
		return `https://www.google.com/maps/dir/${originLat},${originLng}/${destinationLat},${destinationLng}`;
	}
}

/**
 * Alternative: Generate a regular Google Maps URL that can be embedded
 * This is a fallback if the Embed API doesn't work
 */
export function getMapDirectionsUrlFallback(
	originLat: number, 
	originLng: number, 
	destinationLat: number, 
	destinationLng: number
): string {
	const origin = `${originLat},${originLng}`;
	const destination = `${destinationLat},${destinationLng}`;
	
	// This creates a URL that opens Google Maps with directions
	return `https://www.google.com/maps/dir/${origin}/${destination}`;
}

/**
 * Generates a Google Maps static image URL for a location
 * Note: This requires server-side API key handling for security
 */
export function getStaticMapUrl(
	latitude: number, 
	longitude: number, 
	width: number = 400, 
	height: number = 300, 
	zoom: number = 15
): string {
	// For now, return a placeholder or regular Google Maps URL
	// TODO: Implement server-side static map generation if needed
	return `https://www.google.com/maps?q=${latitude},${longitude}&z=${zoom}`;
}

/**
 * Finds nearby airports using our API endpoint
 */
export async function findNearbyAirports(
	latitude: number, 
	longitude: number, 
	radiusMiles: number = 50
): Promise<AirportInfo[]> {
	try {
		console.log(`[Client] Searching for airports near ${latitude}, ${longitude} within ${radiusMiles} miles`);
		
		const url = `/api/airports/nearby?lat=${latitude}&lng=${longitude}&radius=${radiusMiles}`;
		
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Airport API error! status: ${response.status}`);
		}
		
		const data = await response.json();
		
		if (!data.success) {
			console.warn('Airport search failed:', data.error);
			return [];
		}
		
		console.log(`[Client] Found ${data.airports?.length || 0} airports`);
		console.log('[Client] Debug info:', data.debug);
		
		return data.airports || [];
		
	} catch (error) {
		console.error('Error finding nearby airports:', error);
		return [];
	}
}

/**
 * Finds the nearest airport and calculates route with tolls
 */
export async function findNearestAirportWithRoute(
	latitude: number, 
	longitude: number
): Promise<AirportRouteInfo | null> {
	try {
		console.log(`[Client] Finding nearest airport with route for ${latitude}, ${longitude}`);
		
		// Find nearby airports with a generous radius
		const airports = await findNearbyAirports(latitude, longitude, 150); // 150 mile radius
		
		if (airports.length === 0) {
			console.warn(`[Client] No airports found within 150 miles of ${latitude}, ${longitude}`);
			return null;
		}
		
		console.log(`[Client] Found ${airports.length} airports, using the highest-scored airport (should be major international)`);
		airports.forEach((airport, index) => {
			console.log(`[Client] Airport ${index + 1}: ${airport.name} (${airport.distance_miles?.toFixed(1)} miles) - IATA: ${airport.iata_code || 'N/A'}`);
		});
		
		// Use the first airport (highest scored - should be major international airport)
		const primaryAirport = airports[0];
		console.log(`[Client] Using primary airport: ${primaryAirport.name} (${primaryAirport.iata_code || 'No IATA'})`);
		
		const origin = `${latitude},${longitude}`;
		const destination = `${primaryAirport.latitude},${primaryAirport.longitude}`;
		const routeInfo = await calculateRoute(origin, destination);
		
		if (!routeInfo) {
			console.warn(`[Client] Failed to calculate route to ${primaryAirport.name}`);
			return null;
		}
		
		return {
			...routeInfo,
			airport: {
				...primaryAirport,
				drive_time_minutes: routeInfo.duration_minutes
			},
			origin: {
				latitude,
				longitude
			},
			// Include all airports for fallback
			alternativeAirports: airports.slice(1, 5) // Include up to 4 alternative airports
		} as AirportRouteInfo;
		
	} catch (error) {
		console.error('Error finding nearest airport with route:', error);
		return null;
	}
}

/**
 * Finds multiple airports with routes for fallback options
 */
export async function findMultipleAirportsWithRoutes(
	latitude: number, 
	longitude: number,
	maxAirports: number = 5
): Promise<AirportRouteInfo[]> {
	try {
		console.log(`[Client] Finding multiple airports with routes for ${latitude}, ${longitude}`);
		
		// Find nearby airports with a generous radius
		const airports = await findNearbyAirports(latitude, longitude, 150); // 150 mile radius
		
		if (airports.length === 0) {
			console.warn(`[Client] No airports found within 150 miles of ${latitude}, ${longitude}`);
			return [];
		}
		
		console.log(`[Client] Found ${airports.length} airports, calculating routes for top ${Math.min(maxAirports, airports.length)}`);
		
		// Calculate routes for the top airports
		const airportsWithRoutes: AirportRouteInfo[] = [];
		const origin = `${latitude},${longitude}`;
		
		for (let i = 0; i < Math.min(maxAirports, airports.length); i++) {
			const airport = airports[i];
			console.log(`[Client] Calculating route to airport ${i + 1}: ${airport.name} (${airport.iata_code || 'No IATA'})`);
			
			const destination = `${airport.latitude},${airport.longitude}`;
			const routeInfo = await calculateRoute(origin, destination);
			
			if (routeInfo) {
				airportsWithRoutes.push({
					...routeInfo,
					airport: {
						...airport,
						drive_time_minutes: routeInfo.duration_minutes
					},
					origin: {
						latitude,
						longitude
					}
				} as AirportRouteInfo);
			} else {
				console.warn(`[Client] Failed to calculate route to ${airport.name}`);
			}
		}
		
		console.log(`[Client] Successfully calculated routes to ${airportsWithRoutes.length} airports`);
		return airportsWithRoutes;
		
	} catch (error) {
		console.error('Error finding multiple airports with routes:', error);
		return [];
	}
}

/**
 * Calculate route with specific departure time for accurate delivery ETA
 * This is used for calculating the final delivery route from airport to destination
 * @param origin Starting address or coordinates
 * @param destination Ending address or coordinates
 * @param departureTime Departure time as ISO string or Unix timestamp
 */
export async function calculateRouteWithTime(
	origin: string, 
	destination: string, 
	departureTime: string | number
): Promise<RouteInfo | null> {
	return calculateRoute(origin, destination, departureTime);
}



/**
 * Generates a route map URL showing both the address and nearest airport
 * Note: Returns a regular Google Maps URL since static maps require server-side API key
 */
export function getRouteMapUrl(
	originLat: number,
	originLng: number,
	destLat: number,
	destLng: number,
	width: number = 400,
	height: number = 300
): string {
	// Return a regular Google Maps directions URL
	return `https://www.google.com/maps/dir/${originLat},${originLng}/${destLat},${destLng}`;
}
