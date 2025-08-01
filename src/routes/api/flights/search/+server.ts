import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

// Amadeus API configuration for Flight Offers Search
const AMADEUS_BASE_URL = 'https://test.api.amadeus.com'; // Use 'https://api.amadeus.com' for production
const TOKEN_ENDPOINT = '/v1/security/oauth2/token';
const FLIGHT_OFFERS_ENDPOINT = '/v2/shopping/flight-offers';

// Cache for access token (shared with other Amadeus endpoints)
let accessTokenCache: {
  token: string | null;
  expiresAt: number;
} = {
  token: null,
  expiresAt: 0
};

/**
 * Get Amadeus access token using OAuth2
 */
async function getAmadeusAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  const now = Date.now();
  if (accessTokenCache.token && accessTokenCache.expiresAt > now) {
    return accessTokenCache.token;
  }

  console.log('Requesting new Amadeus access token for flight search...');

  const clientId = env.AMADEUS_CLIENT_ID;
  const clientSecret = env.AMADEUS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Amadeus API credentials not configured. Please set AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET environment variables.');
  }

  try {
    const response = await fetch(`${AMADEUS_BASE_URL}${TOKEN_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Amadeus token error:', response.status, errorData);
      throw new Error(`Failed to get Amadeus access token: ${response.status} ${response.statusText}`);
    }

    const tokenData = await response.json();
    
    // Cache the token (expires in 30 minutes, we'll refresh 5 minutes early)
    const expiresIn = tokenData.expires_in * 1000; // Convert to milliseconds
    accessTokenCache = {
      token: tokenData.access_token,
      expiresAt: now + expiresIn - (5 * 60 * 1000), // 5 minutes buffer
    };

    console.log('Amadeus access token obtained successfully');
    return tokenData.access_token;

  } catch (err: any) {
    console.error('Error getting Amadeus access token:', err);
    throw new Error(`Authentication failed: ${err.message}`);
  }
}

/**
 * Search for specific flight offers between two airports
 */
async function searchFlightOffers(params: {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  departureTime?: string;
  adults: number;
  children?: number;
  infants?: number;
  travelClass?: string;
  nonStop?: boolean;
  currencyCode?: string;
  max?: number;
}) {
  const accessToken = await getAmadeusAccessToken();

  // Build query parameters for Amadeus Flight Offers Search API
  const searchParams = new URLSearchParams({
    originLocationCode: params.originLocationCode,
    destinationLocationCode: params.destinationLocationCode,
    departureDate: params.departureDate,
    adults: params.adults.toString(),
  });

  // Add optional parameters
  if (params.departureTime) {
    // Combine date and time for departure
    const departureDateTime = `${params.departureDate}T${params.departureTime}:00`;
    searchParams.set('departureDate', departureDateTime);
  }

  if (params.children && params.children > 0) {
    searchParams.append('children', params.children.toString());
  }

  if (params.infants && params.infants > 0) {
    searchParams.append('infants', params.infants.toString());
  }

  if (params.travelClass) {
    searchParams.append('travelClass', params.travelClass);
  }

  if (params.nonStop !== undefined) {
    searchParams.append('nonStop', params.nonStop.toString());
  }

  if (params.currencyCode) {
    searchParams.append('currencyCode', params.currencyCode);
  }

  if (params.max) {
    searchParams.append('max', params.max.toString());
  }

  console.log(`Searching Amadeus Flight Offers from ${params.originLocationCode} to ${params.destinationLocationCode} on ${params.departureDate}`);
  console.log('Search parameters:', searchParams.toString());

  try {
    const response = await fetch(
      `${AMADEUS_BASE_URL}${FLIGHT_OFFERS_ENDPOINT}?${searchParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Amadeus Flight Offers API error:', response.status, errorData);
      
      let errorMessage = `Amadeus Flight Search Error: ${response.status} ${response.statusText}`;
      
      try {
        const errorJson = JSON.parse(errorData);
        if (errorJson.errors && errorJson.errors.length > 0) {
          errorMessage = errorJson.errors[0].title || errorJson.errors[0].detail || errorMessage;
        }
      } catch (parseError) {
        // Use default error message
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log(`Found ${data.data?.length || 0} flight offers`);
    
    return data;

  } catch (err: any) {
    console.error('Error calling Amadeus Flight Offers API:', err);
    throw err;
  }
}

/**
 * Helper function to format flight duration
 */
function formatDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 'Unknown';
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

/**
 * Helper function to process and enhance flight offers
 */
function processFlightOffers(flightData: any) {
  if (!flightData.data || !Array.isArray(flightData.data)) {
    return flightData;
  }

  // Sort by total duration (fastest first), then by price
  const sortedOffers = flightData.data.sort((a: any, b: any) => {
    const aDuration = a.itineraries[0].duration;
    const bDuration = b.itineraries[0].duration;
    
    // Parse durations for comparison
    const aDurationMinutes = parseDurationToMinutes(aDuration);
    const bDurationMinutes = parseDurationToMinutes(bDuration);
    
    if (aDurationMinutes !== bDurationMinutes) {
      return aDurationMinutes - bDurationMinutes;
    }
    
    // If same duration, sort by price
    return parseFloat(a.price.total) - parseFloat(b.price.total);
  });

  // Add processing metadata to each offer
  const enhancedOffers = sortedOffers.map((offer: any) => {
    const itinerary = offer.itineraries[0];
    const segments = itinerary.segments;
    
    return {
      ...offer,
      enhanced: {
        isDirect: segments.length === 1,
        totalDuration: formatDuration(itinerary.duration),
        totalDurationMinutes: parseDurationToMinutes(itinerary.duration),
        stops: segments.length - 1,
        airlines: [...new Set(segments.map((seg: any) => seg.carrierCode))],
        departureTime: segments[0].departure.at,
        arrivalTime: segments[segments.length - 1].arrival.at,
        route: segments.map((seg: any) => `${seg.departure.iataCode}-${seg.arrival.iataCode}`).join(' → ')
      }
    };
  });

  return {
    ...flightData,
    data: enhancedOffers
  };
}

function parseDurationToMinutes(isoDuration: string): number {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  
  return hours * 60 + minutes;
}

export const GET: RequestHandler = async ({ url }) => {
  try {
    // Get query parameters
    const originLocationCode = url.searchParams.get('origin') || 'YUL';
    const destinationLocationCode = url.searchParams.get('destination') || 'BNA';
    const departureDate = url.searchParams.get('departureDate');
    const departureTime = url.searchParams.get('departureTime');
    const adults = parseInt(url.searchParams.get('adults') || '1');
    const children = parseInt(url.searchParams.get('children') || '0');
    const infants = parseInt(url.searchParams.get('infants') || '0');
    const travelClass = url.searchParams.get('travelClass') || 'ECONOMY';
    const nonStop = url.searchParams.get('nonStop') === 'true';
    const currencyCode = url.searchParams.get('currency') || 'USD';
    const max = parseInt(url.searchParams.get('max') || '50');

    // Validate required parameters
    if (!departureDate) {
      throw error(400, 'Departure date is required');
    }

    // Validate date format (should be YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(departureDate)) {
      throw error(400, 'Departure date must be in YYYY-MM-DD format');
    }

    // Validate departure date is not in the past
    const depDate = new Date(departureDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (depDate < today) {
      throw error(400, 'Departure date cannot be in the past');
    }

    // Validate passenger counts
    if (adults < 1 || adults > 9) {
      throw error(400, 'Adults must be between 1 and 9');
    }

    console.log('Flight search request parameters:', {
      originLocationCode,
      destinationLocationCode,
      departureDate,
      departureTime,
      adults,
      children,
      infants,
      travelClass,
      nonStop,
      currencyCode,
      max
    });

    // Call Amadeus Flight Offers Search API
    const flightData = await searchFlightOffers({
      originLocationCode,
      destinationLocationCode,
      departureDate,
      departureTime: departureTime || undefined,
      adults,
      children: children > 0 ? children : undefined,
      infants: infants > 0 ? infants : undefined,
      travelClass,
      nonStop,
      currencyCode,
      max,
    });

    // Process and enhance the flight offers
    const processedData = processFlightOffers(flightData);

    // Separate direct and connecting flights
    const directFlights = processedData.data?.filter((offer: any) => offer.enhanced.isDirect) || [];
    const connectingFlights = processedData.data?.filter((offer: any) => !offer.enhanced.isDirect) || [];

    // Return formatted response
    return json({
      success: true,
      searchCriteria: {
        origin: originLocationCode,
        destination: destinationLocationCode,
        departureDate,
        departureTime,
        adults,
        children,
        infants,
        travelClass,
        nonStop,
        currencyCode
      },
      summary: {
        totalOffers: processedData.data?.length || 0,
        directFlights: directFlights.length,
        connectingFlights: connectingFlights.length,
        fastestFlight: processedData.data?.[0]?.enhanced || null,
        searchTime: new Date().toISOString()
      },
      flights: {
        direct: directFlights,
        connecting: connectingFlights,
        all: processedData.data || []
      },
      meta: processedData.meta || {},
      dictionaries: processedData.dictionaries || {},
      timestamp: new Date().toISOString(),
      source: 'Amadeus Flight Offers Search API',
    });

  } catch (err: any) {
    console.error('Error in flight search API:', err);
    
    // Handle specific error types
    if (err?.status) {
      throw err; // Re-throw SvelteKit errors
    }
    
    if (err.message?.includes('credentials not configured')) {
      throw error(500, 'Amadeus API not properly configured. Please check environment variables.');
    }
    
    if (err.message?.includes('Authentication failed')) {
      throw error(401, 'Amadeus API authentication failed. Please check credentials.');
    }

    if (err.message?.includes('No flight found')) {
      return json({
        success: true,
        searchCriteria: {
          origin: url.searchParams.get('origin') || 'YUL',
          destination: url.searchParams.get('destination') || 'BNA',
          departureDate: url.searchParams.get('departureDate'),
        },
        summary: {
          totalOffers: 0,
          directFlights: 0,
          connectingFlights: 0,
          fastestFlight: null,
          searchTime: new Date().toISOString()
        },
        flights: { direct: [], connecting: [], all: [] },
        message: 'No flights found for your search criteria. Try different dates or airports.'
      });
    }
    
    throw error(500, err.message || 'Failed to search flights');
  }
}; 