import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

// Amadeus API configuration
const AMADEUS_BASE_URL = 'https://test.api.amadeus.com'; // Use 'https://api.amadeus.com' for production
const TOKEN_ENDPOINT = '/v1/security/oauth2/token';
const INSPIRATION_ENDPOINT = '/v1/shopping/flight-inspirations';

// Cache for access token (in production, use Redis or similar)
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

  console.log('Requesting new Amadeus access token...');

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
 * Call Amadeus Flight Inspiration Search API
 */
async function searchFlightInspirations(params: {
  origin: string;
  departureDate: string;
  oneWay?: boolean;
  duration?: string;
  nonStop?: boolean;
  maxPrice?: number;
  currency?: string;
}) {
  const accessToken = await getAmadeusAccessToken();

  // Build query parameters for Amadeus API
  const searchParams = new URLSearchParams({
    origin: params.origin,
    departureDate: params.departureDate,
  });

  // Add optional parameters
  if (params.oneWay !== undefined) {
    searchParams.append('oneWay', params.oneWay.toString());
  }
  
  if (params.duration) {
    searchParams.append('duration', params.duration);
  }
  
  if (params.nonStop !== undefined) {
    searchParams.append('nonStop', params.nonStop.toString());
  }
  
  if (params.maxPrice) {
    searchParams.append('maxPrice', params.maxPrice.toString());
  }
  
  if (params.currency) {
    searchParams.append('currency', params.currency);
  }

  console.log(`Searching Amadeus Flight Inspirations from ${params.origin} on ${params.departureDate}`);

  try {
    const response = await fetch(
      `${AMADEUS_BASE_URL}${INSPIRATION_ENDPOINT}?${searchParams.toString()}`,
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
      console.error('❌ Amadeus API error:', response.status, errorData);
      console.error('Request URL:', `${AMADEUS_BASE_URL}${INSPIRATION_ENDPOINT}?${searchParams.toString()}`);
      
      let errorMessage = `Amadeus API Error: ${response.status} ${response.statusText}`;
      let errorDetails: any = { 
        status: response.status, 
        statusText: response.statusText,
        url: `${AMADEUS_BASE_URL}${INSPIRATION_ENDPOINT}?${searchParams.toString()}`
      };
      
      try {
        const errorJson = JSON.parse(errorData);
        errorDetails = { ...errorDetails, ...errorJson };
        
        if (errorJson.errors && errorJson.errors.length > 0) {
          const firstError = errorJson.errors[0];
          errorMessage = firstError.title || firstError.detail || errorMessage;
          
          // Provide specific guidance for common errors
          if (firstError.code === 'RESOURCE_NOT_FOUND' || firstError.title?.includes('not found')) {
            errorMessage += '. This might be due to: invalid airport code, unsupported route, or limited test data availability.';
          } else if (firstError.code === 'INVALID_FORMAT') {
            errorMessage += '. Please check the format of your parameters (date should be YYYY-MM-DD, airport codes should be 3-letter IATA codes).';
          }
        }
      } catch (parseError) {
        errorDetails.rawError = errorData;
        console.error('Failed to parse error response:', parseError);
      }
      
      const enhancedError = new Error(errorMessage);
      (enhancedError as any).details = errorDetails;
      throw enhancedError;
    }

    const data = await response.json();
    console.log(`Found ${data.data?.length || 0} flight inspirations`);
    
    return data;

  } catch (err: any) {
    console.error('Error calling Amadeus Flight Inspirations API:', err);
    throw err;
  }
}

export const GET: RequestHandler = async ({ url, fetch }) => {
  try {
    // Get query parameters
    const origin = url.searchParams.get('origin') || 'YUL';
    const departureDate = url.searchParams.get('departureDate');
    const oneWay = url.searchParams.get('one_way') === 'true';
    const duration = url.searchParams.get('duration');
    const nonStop = url.searchParams.get('non_stop') === 'true';
    const maxPriceStr = url.searchParams.get('max_price');
    const currency = url.searchParams.get('currency') || 'USD';

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

    // Parse max price
    const maxPrice = maxPriceStr ? parseInt(maxPriceStr, 10) : undefined;
    if (maxPriceStr && (isNaN(maxPrice!) || maxPrice! <= 0)) {
      throw error(400, 'Max price must be a positive number');
    }

    console.log('Amadeus API request parameters:', {
      origin,
      departureDate,
      oneWay,
      duration,
      nonStop,
      maxPrice,
      currency
    });

    // Call Amadeus API
    const amadeusData = await searchFlightInspirations({
      origin,
      departureDate,
      oneWay,
      duration: duration || undefined,
      nonStop,
      maxPrice,
      currency,
    });

    // Return formatted response
    return json({
      success: true,
      origin,
      departureDate,
      oneWay,
      duration,
      nonStop,
      maxPrice,
      currency,
      data: amadeusData.data || [],
      meta: amadeusData.meta || {},
      dictionaries: amadeusData.dictionaries || {},
      total: amadeusData.data?.length || 0,
      timestamp: new Date().toISOString(),
      source: 'Amadeus Flight Inspiration Search API',
    });

  } catch (err: any) {
    console.error('💥 Error in Amadeus flights API:', err);
    
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
    
    // Enhanced error response with details
    const errorMessage = err.message || 'Failed to fetch Amadeus flight data';
    const errorDetails = err.details || {};
    
    console.error('Error details:', errorDetails);
    
    // Return more detailed error information in development
    throw error(500, {
      message: errorMessage,
      details: errorDetails,
      timestamp: new Date().toISOString(),
      endpoint: 'flight-inspirations'
    });
  }
}; 