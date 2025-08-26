/**
 * API endpoint for finding nearby airports
 * This handles the Google Places API calls server-side to avoid CORS issues
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Google Maps API configuration
import { env } from '$env/dynamic/private';
const GOOGLE_MAPS_API_KEY = env.GOOGLE_MAPS_API_KEY;

// Debug: Check if API key is loaded
if (!GOOGLE_MAPS_API_KEY) {
	console.error('❌ GOOGLE_MAPS_API_KEY environment variable is not set!');
	console.error('Please add GOOGLE_MAPS_API_KEY to your .env file');
} else {
	console.log(`✅ Google Maps API key loaded: ${GOOGLE_MAPS_API_KEY.substring(0, 10)}...`);
}

interface AirportInfo {
	name: string;
	iata_code?: string;
	icao_code?: string;
	formatted_address: string;
	latitude: number;
	longitude: number;
	place_id: string;
	rating?: number;
	distance_miles?: number;
}

/**
 * Calculate distance between two points in miles using Haversine formula
 */
function calculateDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
	const R = 3959; // Earth's radius in miles
	const dLat = toRadians(lat2 - lat1);
	const dLon = toRadians(lon2 - lon1);
	
	const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
		Math.sin(dLon / 2) * Math.sin(dLon / 2);
	
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
	return degrees * (Math.PI / 180);
}

/**
 * Check if coordinates are near Montreal (rough bounds check)
 */
function isNearMontreal(lat: number, lng: number): boolean {
	// Montreal is roughly at 45.5017, -73.5673
	// Check if we're within ~100km of Montreal
	const montrealLat = 45.5017;
	const montrealLng = -73.5673;
	const distance = calculateDistanceMiles(lat, lng, montrealLat, montrealLng);
	return distance < 62; // 100km in miles
}

/**
 * Check if coordinates are in the United States
 */
function isInUSA(lat: number, lng: number): boolean {
	// Rough bounds for continental US + Alaska + Hawaii
	return (
		// Continental US
		(lat >= 24.0 && lat <= 49.0 && lng >= -125.0 && lng <= -66.0) ||
		// Alaska
		(lat >= 54.0 && lat <= 72.0 && lng >= -180.0 && lng <= -129.0) ||
		// Hawaii
		(lat >= 18.0 && lat <= 23.0 && lng >= -162.0 && lng <= -154.0)
	);
}

/**
 * Check if coordinates are in Canada
 */
function isInCanada(lat: number, lng: number): boolean {
	// Rough bounds for Canada
	return (
		lat >= 41.0 && lat <= 84.0 && lng >= -141.0 && lng <= -52.0
	);
}

/**
 * Check if coordinates are near major US metro areas
 */
function getNearbyUSMetroAirports(lat: number, lng: number): string[] {
	const metros = [
		// NYC area
		{ name: 'NYC', lat: 40.7, lng: -74.0, airports: ['JFK', 'LGA', 'EWR'], radius: 50 },
		// LA area
		{ name: 'LA', lat: 34.0, lng: -118.2, airports: ['LAX', 'BUR', 'LGB'], radius: 50 },
		// Chicago area
		{ name: 'Chicago', lat: 41.9, lng: -87.6, airports: ['ORD', 'MDW'], radius: 50 },
		// Miami area
		{ name: 'Miami', lat: 25.8, lng: -80.2, airports: ['MIA', 'FLL'], radius: 50 },
		// SF Bay area
		{ name: 'SF', lat: 37.8, lng: -122.4, airports: ['SFO', 'OAK', 'SJC'], radius: 50 },
		// DC area
		{ name: 'DC', lat: 38.9, lng: -77.0, airports: ['DCA', 'IAD', 'BWI'], radius: 50 },
		// Boston area
		{ name: 'Boston', lat: 42.4, lng: -71.0, airports: ['BOS'], radius: 50 },
		// Atlanta area
		{ name: 'Atlanta', lat: 33.6, lng: -84.4, airports: ['ATL'], radius: 50 },
		// Dallas area
		{ name: 'Dallas', lat: 32.9, lng: -96.8, airports: ['DFW', 'DAL'], radius: 50 },
		// Houston area
		{ name: 'Houston', lat: 29.8, lng: -95.4, airports: ['IAH', 'HOU'], radius: 50 },
		// Phoenix area
		{ name: 'Phoenix', lat: 33.4, lng: -112.1, airports: ['PHX'], radius: 50 },
		// Seattle area
		{ name: 'Seattle', lat: 47.4, lng: -122.3, airports: ['SEA'], radius: 50 }
	];

	for (const metro of metros) {
		const distance = calculateDistanceMiles(lat, lng, metro.lat, metro.lng);
		if (distance <= metro.radius) {
			console.log(`[Airport API] Location is near ${metro.name}, suggesting airports: ${metro.airports.join(', ')}`);
			return metro.airports;
		}
	}
	
	return [];
}

export const GET: RequestHandler = async ({ url }) => {
	try {
		// Check if API key is available
		if (!GOOGLE_MAPS_API_KEY) {
			console.error('❌ Google Maps API key missing');
			return json({ 
				success: false,
				error: 'Google Maps API key not configured. Please set GOOGLE_MAPS_API_KEY in your .env file.',
				airports: []
			}, { status: 500 });
		}

		const latitude = parseFloat(url.searchParams.get('lat') || '0');
		const longitude = parseFloat(url.searchParams.get('lng') || '0');
		const radiusMiles = parseFloat(url.searchParams.get('radius') || '50');

		if (!latitude || !longitude) {
			return json({ 
				success: false,
				error: 'Latitude and longitude are required',
				airports: []
			}, { status: 400 });
		}

		console.log('\n' + '='.repeat(80));
		console.log('🌍 AIRPORT SEARCH REQUEST');
		console.log('='.repeat(80));
		console.log(`📍 Location: ${latitude}, ${longitude}`);
		console.log(`📏 Search Radius: ${radiusMiles} miles`);

		// Check location country and get suggested airports
		const isUSLocation = isInUSA(latitude, longitude);
		const isCanadaLocation = isInCanada(latitude, longitude);
		const suggestedUSAirports = getNearbyUSMetroAirports(latitude, longitude);
		
		console.log(`🇺🇸 USA Location: ${isUSLocation}`);
		console.log(`🇨🇦 Canada Location: ${isCanadaLocation}`);
		if (suggestedUSAirports.length > 0) {
			console.log(`✈️  Suggested Major Airports: ${suggestedUSAirports.join(', ')}`);
		}
		console.log('='.repeat(80) + '\n');

		// Convert miles to meters for the API
		const radiusMeters = radiusMiles * 1609.34;
		
		// Try multiple search strategies with US-specific searches for US locations
		const searchStrategies = [
			// Strategy 1: Standard airport type
			`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radiusMeters}&type=airport&key=${GOOGLE_MAPS_API_KEY}`,
			// Strategy 2: Text search for "international airport"
			`https://maps.googleapis.com/maps/api/place/textsearch/json?query=international+airport&location=${latitude},${longitude}&radius=${radiusMeters}&key=${GOOGLE_MAPS_API_KEY}`,
			// Strategy 3: Text search for "airport" with more specific query
			`https://maps.googleapis.com/maps/api/place/textsearch/json?query=airport+-travel+-agency+-hotel&location=${latitude},${longitude}&radius=${radiusMeters}&key=${GOOGLE_MAPS_API_KEY}`,
			// Strategy 4: Search for specific airports based on location
			...(isUSLocation && suggestedUSAirports.length > 0 ? 
				suggestedUSAirports.map(code => 
					`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${code}+airport&location=${latitude},${longitude}&radius=${radiusMeters}&key=${GOOGLE_MAPS_API_KEY}`
				) : []
			),
			// Strategy 5: Canada-specific searches for Canadian locations
			...(isCanadaLocation ? [
				`https://maps.googleapis.com/maps/api/place/textsearch/json?query=YUL+Montreal+Trudeau+airport&location=${latitude},${longitude}&radius=${radiusMeters}&key=${GOOGLE_MAPS_API_KEY}`,
				`https://maps.googleapis.com/maps/api/place/textsearch/json?query=YYZ+Toronto+Pearson+airport&location=${latitude},${longitude}&radius=${radiusMeters}&key=${GOOGLE_MAPS_API_KEY}`,
				`https://maps.googleapis.com/maps/api/place/textsearch/json?query=YVR+Vancouver+airport&location=${latitude},${longitude}&radius=${radiusMeters}&key=${GOOGLE_MAPS_API_KEY}`,
				`https://maps.googleapis.com/maps/api/place/textsearch/json?query=Pierre+Elliott+Trudeau+airport&location=${latitude},${longitude}&radius=${radiusMeters}&key=${GOOGLE_MAPS_API_KEY}`
			] : []),
			// Strategy 6: Montreal-specific search (only if near Montreal)
			...(isNearMontreal(latitude, longitude) ? [
				`https://maps.googleapis.com/maps/api/place/textsearch/json?query=Montreal+international+airport&location=${latitude},${longitude}&radius=${radiusMeters}&key=${GOOGLE_MAPS_API_KEY}`
			] : []),
			// Strategy 7: Broader search with establishment type
			`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radiusMeters}&type=establishment&keyword=airport&key=${GOOGLE_MAPS_API_KEY}`
		];

		let allAirports: AirportInfo[] = [];

		// Try each search strategy
		for (let i = 0; i < searchStrategies.length; i++) {
			const url = searchStrategies[i];
			console.log(`\n🔍 SEARCH STRATEGY ${i + 1}`);
			console.log('-'.repeat(50));
			
			try {
				const response = await fetch(url);
				if (!response.ok) {
					console.warn(`❌ Strategy ${i + 1} HTTP error: ${response.status}`);
					continue;
				}
				
				const data = await response.json();
				console.log(`✅ Strategy ${i + 1} Status: ${data.status}`);
				console.log(`📊 Strategy ${i + 1} Results: ${data.results?.length || 0} found`);
				
				if (data.status === 'OK' && data.results && data.results.length > 0) {
					// Process results
					const airports: AirportInfo[] = data.results
											.filter((place: any) => {
						// ONLY MAJOR COMMERCIAL AIRPORTS - Filter out all small/regional airports
						const name = (place.name || '').toLowerCase();
						const types = place.types || [];
						
						console.log(`  🏢 Checking: ${place.name}`);
						console.log(`     Types: ${types.join(', ')}`);
						
						// Must have the official 'airport' type from Google
						const hasAirportType = types.includes('airport');
						
						// STRICT FILTER: Only allow major international/commercial airports
						const isMajorAirport = name.includes('international airport') ||
											   // Known major airports by name
											   name.includes('trudeau') ||
											   name.includes('pierre elliott') ||
											   name.includes('pearson') ||
											   name.includes('vancouver international') ||
											   name.includes('calgary international') ||
											   name.includes('ottawa international') ||
											   name.includes('halifax international') ||
											   name.includes('newark liberty') ||
											   name.includes('kennedy international') ||
											   name.includes('laguardia') ||
											   name.includes('los angeles international') ||
											   name.includes("o'hare") ||
											   name.includes('miami international') ||
											   name.includes('san francisco international') ||
											   name.includes('seattle tacoma') ||
											   name.includes('denver international') ||
											   name.includes('phoenix sky harbor') ||
											   name.includes('dallas fort worth') ||
											   name.includes('houston intercontinental') ||
											   name.includes('atlanta international') ||
											   name.includes('boston logan') ||
											   name.includes('baltimore washington') ||
											   name.includes('reagan national') ||
											   name.includes('dulles international');
						
						// Exclude ALL non-commercial facilities
						const isExcluded = types.includes('travel_agency') ||
										  types.includes('lodging') ||
										  types.includes('store') ||
										  types.includes('car_rental') ||
										  types.includes('parking') ||
										  types.includes('transit_station') ||
										  types.includes('train_station') ||
										  types.includes('subway_station') ||
										  types.includes('light_rail_station') ||
										  name.includes('travel') ||
										  name.includes('voyages') ||
										  name.includes('hotel') ||
										  name.includes('motel') ||
										  name.includes('inn') ||
										  name.includes('resort') ||
										  name.includes('rental') ||
										  name.includes('parking') ||
										  name.includes('taxi') ||
										  name.includes('shuttle') ||
										  name.includes('heliport') ||
										  name.includes('helipad') ||
										  name.includes('regional airport') ||
										  name.includes('municipal airport') ||
										  name.includes('county airport') ||
										  name.includes('field airport') ||
										  name.includes('airfield') ||
										  name.includes('airstrip') ||
										  name.includes('private') ||
										  name.includes('corporate') ||
										  name.includes('executive') ||
										  name.includes('fbo') ||
										  name.includes('cargo') ||
										  name.includes('freight');
						
						// Must be a major airport AND have airport type AND not be excluded
						const isValidAirport = hasAirportType && isMajorAirport && !isExcluded;
						
						const status = isValidAirport ? '✅' : '❌';
						console.log(`     ${status} Major Airport: hasType=${hasAirportType}, isMajor=${isMajorAirport}, excluded=${isExcluded}`);
						
						return isValidAirport;
					})
						.map((place: any) => {
							// Extract airport codes from the name if available
							const name = place.name || '';
							
							// ONLY assign IATA/ICAO codes through explicit name matching
							// NO regex extraction to prevent incorrect assignments
							let iataCode: string | undefined = undefined;
							let icaoCode: string | undefined = undefined;
							
							// Special handling for known airports
							const lowerName = name.toLowerCase();
							
							// Major US Airports
							if (lowerName.includes('newark') || lowerName.includes('ewr')) {
								iataCode = 'EWR';
								icaoCode = 'KEWR';
							}
							else if (lowerName.includes('kennedy') || lowerName.includes('jfk')) {
								iataCode = 'JFK';
								icaoCode = 'KJFK';
							}
							else if (lowerName.includes('laguardia') || lowerName.includes('lga')) {
								iataCode = 'LGA';
								icaoCode = 'KLGA';
							}
							else if (lowerName.includes('los angeles') && lowerName.includes('international') || lowerName.includes('lax')) {
								iataCode = 'LAX';
								icaoCode = 'KLAX';
							}
							else if (lowerName.includes("o'hare") || lowerName.includes('ord')) {
								iataCode = 'ORD';
								icaoCode = 'KORD';
							}
							else if (lowerName.includes('midway') || lowerName.includes('mdw')) {
								iataCode = 'MDW';
								icaoCode = 'KMDW';
							}
							else if (lowerName.includes('miami') && lowerName.includes('international') || lowerName.includes('mia')) {
								iataCode = 'MIA';
								icaoCode = 'KMIA';
							}
							else if (lowerName.includes('fort lauderdale') || lowerName.includes('fll')) {
								iataCode = 'FLL';
								icaoCode = 'KFLL';
							}
							else if (lowerName.includes('san francisco') && lowerName.includes('international') || lowerName.includes('sfo')) {
								iataCode = 'SFO';
								icaoCode = 'KSFO';
							}
							else if (lowerName.includes('oakland') && lowerName.includes('international') || lowerName.includes('oak')) {
								iataCode = 'OAK';
								icaoCode = 'KOAK';
							}
							else if (lowerName.includes('san jose') && lowerName.includes('international') || lowerName.includes('sjc')) {
								iataCode = 'SJC';
								icaoCode = 'KSJC';
							}
							else if (lowerName.includes('reagan') || lowerName.includes('national') && lowerName.includes('washington') || lowerName.includes('dca')) {
								iataCode = 'DCA';
								icaoCode = 'KDCA';
							}
							else if (lowerName.includes('dulles') || lowerName.includes('iad')) {
								iataCode = 'IAD';
								icaoCode = 'KIAD';
							}
							else if (lowerName.includes('baltimore') && lowerName.includes('washington') || lowerName.includes('bwi')) {
								iataCode = 'BWI';
								icaoCode = 'KBWI';
							}
							else if (lowerName.includes('logan') || lowerName.includes('boston') && lowerName.includes('international') || lowerName.includes('bos')) {
								iataCode = 'BOS';
								icaoCode = 'KBOS';
							}
							else if (lowerName.includes('atlanta') && lowerName.includes('international') || lowerName.includes('atl')) {
								iataCode = 'ATL';
								icaoCode = 'KATL';
							}
							else if (lowerName.includes('dallas') && lowerName.includes('fort worth') || lowerName.includes('dfw')) {
								iataCode = 'DFW';
								icaoCode = 'KDFW';
							}
							else if (lowerName.includes('love field') || lowerName.includes('dal')) {
								iataCode = 'DAL';
								icaoCode = 'KDAL';
							}
							else if (lowerName.includes('houston') && lowerName.includes('intercontinental') || lowerName.includes('iah')) {
								iataCode = 'IAH';
								icaoCode = 'KIAH';
							}
							else if (lowerName.includes('hobby') || lowerName.includes('hou')) {
								iataCode = 'HOU';
								icaoCode = 'KHOU';
							}
							else if (lowerName.includes('phoenix') && lowerName.includes('sky harbor') || lowerName.includes('phx')) {
								iataCode = 'PHX';
								icaoCode = 'KPHX';
							}
							else if (lowerName.includes('seattle') && lowerName.includes('tacoma') || lowerName.includes('sea')) {
								iataCode = 'SEA';
								icaoCode = 'KSEA';
							}
							// Canadian Airports - Montreal
							else if (lowerName.includes('trudeau') || 
								lowerName.includes('pierre elliott') ||
								lowerName.includes('montréal-trudeau') ||
								lowerName.includes('montreal-trudeau') ||
								lowerName.includes('montréal-pierre elliott trudeau') ||
								lowerName.includes('montreal-pierre elliott trudeau') ||
								lowerName.includes('yul')) {
								iataCode = 'YUL';
								icaoCode = 'CYUL';
							}
							// Toronto Pearson
							else if (lowerName.includes('pearson') || 
								lowerName.includes('toronto pearson') ||
								lowerName.includes('lester b. pearson') ||
								lowerName.includes('yyz')) {
								iataCode = 'YYZ';
								icaoCode = 'CYYZ';
							}
							// Vancouver International
							else if ((lowerName.includes('vancouver') && lowerName.includes('international')) || lowerName.includes('yvr')) {
								iataCode = 'YVR';
								icaoCode = 'CYVR';
							}
							// Calgary International
							else if ((lowerName.includes('calgary') && lowerName.includes('international')) || lowerName.includes('yyc')) {
								iataCode = 'YYC';
								icaoCode = 'CYYC';
							}
							// Ottawa International
							else if ((lowerName.includes('ottawa') && lowerName.includes('international')) || lowerName.includes('yow')) {
								iataCode = 'YOW';
								icaoCode = 'CYOW';
							}
							// Halifax International
							else if ((lowerName.includes('halifax') && lowerName.includes('international')) || lowerName.includes('yhz')) {
								iataCode = 'YHZ';
								icaoCode = 'CYHZ';
							}
							
							// Calculate distance from origin
							const airportLat = place.geometry.location.lat;
							const airportLng = place.geometry.location.lng;
							const distance = calculateDistanceMiles(latitude, longitude, airportLat, airportLng);
							
							console.log(`  ✈️  FOUND: ${name}`);
							console.log(`      📏 Distance: ${distance.toFixed(1)} miles`);
							console.log(`      🏷️  IATA: ${iataCode || 'N/A'} | ICAO: ${icaoCode || 'N/A'}`);
							
							return {
								name: place.name,
								iata_code: iataCode,
								icao_code: icaoCode,
								formatted_address: place.formatted_address || place.vicinity || '',
								latitude: airportLat,
								longitude: airportLng,
								place_id: place.place_id,
								rating: place.rating,
								distance_miles: distance
							};
						});
					
					allAirports = [...allAirports, ...airports];
				}
			} catch (error) {
				console.error(`❌ Strategy ${i + 1} failed:`, error);
			}
		}

		console.log(`\n📊 SEARCH SUMMARY`);
		console.log('-'.repeat(50));
		console.log(`🔍 Total airports found: ${allAirports.length}`);

		// Remove duplicates based on place_id
		const uniqueAirports = allAirports.filter((airport, index, self) =>
			index === self.findIndex(a => a.place_id === airport.place_id)
		);

		console.log(`🔄 Unique airports after deduplication: ${uniqueAirports.length}`);

		console.log(`\n🏆 AIRPORT SCORING`);
		console.log('='.repeat(80));

		// Score airports to heavily prioritize major commercial airports
		const scoredAirports = uniqueAirports.map(airport => {
			let score = 0;
			const name = airport.name.toLowerCase();
			const iata = airport.iata_code;
			
			// MASSIVE bonus for major hub airports
			const majorUSHubs = ['JFK', 'LAX', 'ORD', 'ATL', 'DFW', 'DEN', 'SFO', 'SEA', 'LAS', 'PHX', 'IAH', 'MIA', 'BOS', 'EWR', 'LGA', 'BWI', 'DCA', 'IAD'];
			const majorCanadianHubs = ['YUL', 'YYZ', 'YVR', 'YYC', 'YOW', 'YHZ'];
			
			if (iata && (majorUSHubs.includes(iata) || majorCanadianHubs.includes(iata))) {
				score += 2000; // Highest priority for major hubs
			}
			
			// High bonus for other major commercial airports with IATA codes
			else if (iata && name.includes('international')) {
				score += 1500; // Major international airports
			} else if (iata) {
				score += 1000; // Any airport with IATA code (commercial)
			} else if (name.includes('international')) {
				score += 300; // International airports without IATA
			}
			
			// Additional positive scoring
			if (airport.icao_code) score += 100;  // Has ICAO code
			if (name.includes('regional')) score += 50;
			if (name.includes('municipal')) score += 30;
			if (name.includes('airport')) score += 20;
			if (name.includes('airfield')) score += 15;
			if (name.includes('air base') || name.includes('airbase')) score += 15;
			
			// HEAVY penalties for non-commercial facilities
			if (name.includes('heliport')) score -= 500;
			if (name.includes('hq ') || name.includes('headquarters')) score -= 400; // Office buildings
			if (name.includes('metropolitan') && !iata) score -= 300; // Small private airports
			if (name.includes('travel')) score -= 300;
			if (name.includes('voyages')) score -= 300;
			if (name.includes('agency')) score -= 300;
			if (name.includes('rental')) score -= 200;
			if (name.includes('parking')) score -= 200;
			if (name.includes('hotel')) score -= 150;
			if (name.includes('motel')) score -= 150;
			if (name.includes('inn')) score -= 150;
			if (name.includes('cargo') && !iata) score -= 100; // Cargo facilities without IATA
			if (name.includes('fbo')) score -= 100; // Fixed Base Operators
			if (name.includes('private')) score -= 200;
			if (name.includes('club')) score -= 150;
			
			// Distance penalty - much smaller for major airports
			if (iata && (majorUSHubs.includes(iata) || majorCanadianHubs.includes(iata))) {
				score -= (airport.distance_miles || 0) * 0.05; // Tiny penalty for major hubs
			} else if (iata) {
				score -= (airport.distance_miles || 0) * 0.2; // Small penalty for IATA airports
			} else {
				score -= (airport.distance_miles || 0) * 2.0; // Large penalty for small airports
			}
			
			// MASSIVE country-specific bonuses and penalties
			if (isUSLocation && iata && iata.match(/^[A-Z]{3}$/) && !iata.startsWith('Y')) {
				score += 1000; // HUGE bonus for US airports in US locations
			} else if (isCanadaLocation && iata && iata.startsWith('Y')) {
				score += 1000; // HUGE bonus for Canadian airports in Canadian locations
			} else if (isUSLocation && iata && iata.startsWith('Y')) {
				score -= 1500; // MASSIVE penalty for Canadian airports in US locations
			} else if (isCanadaLocation && iata && iata.match(/^[A-Z]{3}$/) && !iata.startsWith('Y')) {
				score -= 1500; // MASSIVE penalty for US airports in Canadian locations
			}
			
			const scoreColor = score > 2000 ? '🟢' : score > 1000 ? '🟡' : score > 0 ? '🟠' : '🔴';
			console.log(`${scoreColor} ${airport.name}: ${score.toFixed(1)} points (IATA: ${iata || 'N/A'})`);
			
			return { ...airport, score };
		});

		// Sort by score (highest first), then by distance
		const sortedAirports = scoredAirports
			.sort((a, b) => {
				if (Math.abs(a.score - b.score) > 10) {
					return b.score - a.score; // Higher score wins
				}
				return (a.distance_miles || 0) - (b.distance_miles || 0); // Closer wins if scores are similar
			})
			.slice(0, 10);

		console.log(`\n🎯 FINAL RESULTS`);
		console.log('='.repeat(80));
		console.log(`✈️  Top ${sortedAirports.length} airports selected:`);
		sortedAirports.forEach((airport, index) => {
			const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
			console.log(`${medal} ${airport.name} (${airport.iata_code || 'No IATA'}) - ${airport.score.toFixed(1)} pts, ${airport.distance_miles?.toFixed(1)}mi`);
		});
		console.log('='.repeat(80) + '\n');
		
		return json({
			success: true,
			airports: sortedAirports,
			debug: {
				searchLocation: { latitude, longitude },
				radiusMiles,
				totalFound: allAirports.length,
				uniqueFound: uniqueAirports.length,
				returned: sortedAirports.length
			}
		});

	} catch (error) {
		console.error('[Airport API] Unexpected error:', error);
		return json({ 
			success: false,
			error: 'Failed to search for airports',
			details: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
};
