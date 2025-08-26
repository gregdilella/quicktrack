import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

// Amadeus API configuration
const AMADEUS_BASE_URL = 'https://test.api.amadeus.com';
const TOKEN_ENDPOINT = '/v1/security/oauth2/token';

// Available endpoints for testing
const ENDPOINTS = {
  'flight-inspirations': '/v1/shopping/flight-inspirations',
  'flight-offers': '/v2/shopping/flight-offers',
  'flight-destinations': '/v1/shopping/flight-destinations',
  'airport-nearest': '/v1/reference-data/locations/airports'
};

// Cache for access token
let accessTokenCache: {
  token: string | null;
  expiresAt: number;
} = {
  token: null,
  expiresAt: 0
};

/**
 * Get Amadeus access token
 */
async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (accessTokenCache.token && accessTokenCache.expiresAt > now) {
    return accessTokenCache.token;
  }

  const clientId = env.AMADEUS_CLIENT_ID;
  const clientSecret = env.AMADEUS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Amadeus API credentials not configured');
  }

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
    throw new Error(`Authentication failed: ${response.status} ${response.statusText} - ${errorData}`);
  }

  const tokenData = await response.json();
  const expiresIn = tokenData.expires_in * 1000;
  accessTokenCache = {
    token: tokenData.access_token,
    expiresAt: now + expiresIn - (5 * 60 * 1000),
  };

  return tokenData.access_token;
}

/**
 * Raw Amadeus API Test
 * This endpoint allows testing different Amadeus API endpoints with custom parameters
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { endpoint, params } = body;

    console.log('🔧 Raw Amadeus API Test:', { endpoint, params });

    if (!endpoint || !ENDPOINTS[endpoint as keyof typeof ENDPOINTS]) {
      return json({
        success: false,
        error: `Invalid endpoint. Available endpoints: ${Object.keys(ENDPOINTS).join(', ')}`,
        availableEndpoints: Object.keys(ENDPOINTS)
      }, { status: 400 });
    }

    // Get access token
    const accessToken = await getAccessToken();
    console.log('✅ Access token obtained');

    // Build the API URL
    const apiEndpoint = ENDPOINTS[endpoint as keyof typeof ENDPOINTS];
    let apiUrl = `${AMADEUS_BASE_URL}${apiEndpoint}`;

    // Build query parameters based on endpoint
    const searchParams = new URLSearchParams();

    if (endpoint === 'flight-inspirations') {
      // Flight Inspirations parameters
      if (params.origin) searchParams.append('origin', params.origin);
      if (params.departureDate) searchParams.append('departureDate', params.departureDate);
      if (params.oneWay !== undefined) searchParams.append('oneWay', params.oneWay.toString());
      if (params.duration) searchParams.append('duration', params.duration);
      if (params.nonStop !== undefined) searchParams.append('nonStop', params.nonStop.toString());
      if (params.maxPrice) searchParams.append('maxPrice', params.maxPrice.toString());
      if (params.currency) searchParams.append('currency', params.currency);
    } else if (endpoint === 'flight-offers') {
      // Flight Offers parameters
      if (params.origin) searchParams.append('originLocationCode', params.origin);
      if (params.destination) searchParams.append('destinationLocationCode', params.destination || 'JFK');
      if (params.departureDate) searchParams.append('departureDate', params.departureDate);
      searchParams.append('adults', '1');
      if (params.currency) searchParams.append('currencyCode', params.currency);
      searchParams.append('max', '10');
    } else if (endpoint === 'flight-destinations') {
      // Flight Destinations parameters
      if (params.origin) searchParams.append('origin', params.origin);
    } else if (endpoint === 'airport-nearest') {
      // Airport search parameters
      searchParams.append('latitude', '45.5017');
      searchParams.append('longitude', '-73.5673');
      searchParams.append('radius', '500');
    }

    if (searchParams.toString()) {
      apiUrl += `?${searchParams.toString()}`;
    }

    console.log(`Making request to: ${apiUrl}`);

    // Make the API request
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`Response status: ${response.status} ${response.statusText}`);

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      responseData = { rawResponse: responseText };
    }

    if (!response.ok) {
      console.error('❌ API request failed:', responseData);
      return json({
        success: false,
        error: `API request failed: ${response.status} ${response.statusText}`,
        details: {
          endpoint: apiUrl,
          status: response.status,
          statusText: response.statusText,
          response: responseData
        }
      }, { status: response.status });
    }

    console.log('✅ API request successful');
    console.log(`Data items: ${responseData.data?.length || 0}`);

    return json({
      success: true,
      endpoint: apiUrl,
      data: responseData,
      meta: {
        status: response.status,
        statusText: response.statusText,
        dataCount: responseData.data?.length || 0,
        timestamp: new Date().toISOString()
      }
    });

  } catch (err: any) {
    console.error('💥 Raw API test crashed:', err);
    
    return json({
      success: false,
      error: err.message || 'Raw API test failed',
      details: {
        errorType: err.constructor.name,
        stack: err.stack?.split('\n').slice(0, 5)
      }
    }, { status: 500 });
  }
};
