import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

// Amadeus API configuration
const AMADEUS_BASE_URL = 'https://test.api.amadeus.com';
const TOKEN_ENDPOINT = '/v1/security/oauth2/token';

/**
 * Test Amadeus API Authentication
 * This endpoint tests only the authentication flow without making API calls
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    console.log('🔐 Testing Amadeus API Authentication...');

    const clientId = env.AMADEUS_CLIENT_ID;
    const clientSecret = env.AMADEUS_CLIENT_SECRET;

    // Check if credentials are configured
    if (!clientId || !clientSecret) {
      console.error('❌ Amadeus credentials not found in environment');
      return json({
        success: false,
        error: 'Amadeus API credentials not configured',
        details: {
          clientIdPresent: !!clientId,
          clientSecretPresent: !!clientSecret,
          clientIdLength: clientId?.length || 0,
          clientSecretLength: clientSecret?.length || 0
        }
      }, { status: 500 });
    }

    console.log('✅ Credentials found, testing authentication...');
    console.log(`Client ID: ${clientId.substring(0, 8)}...`);
    console.log(`Client Secret: ${clientSecret.substring(0, 4)}...`);

    // Test authentication
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

    console.log(`Auth response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Authentication failed:', errorData);
      
      let errorMessage = `Authentication failed: ${response.status} ${response.statusText}`;
      let errorDetails: any = { status: response.status, statusText: response.statusText };
      
      try {
        const errorJson = JSON.parse(errorData);
        errorDetails = { ...errorDetails, ...errorJson };
        if (errorJson.error_description) {
          errorMessage = errorJson.error_description;
        }
      } catch (parseError) {
        errorDetails.rawError = errorData;
      }

      return json({
        success: false,
        error: errorMessage,
        details: errorDetails
      }, { status: response.status });
    }

    const tokenData = await response.json();
    console.log('✅ Authentication successful!');
    console.log(`Token type: ${tokenData.type || 'unknown'}`);
    console.log(`Expires in: ${tokenData.expires_in || 'unknown'} seconds`);

    return json({
      success: true,
      message: 'Authentication successful',
      token: tokenData.access_token ? 'PRESENT' : 'MISSING',
      details: {
        tokenType: tokenData.type,
        expiresIn: tokenData.expires_in,
        scope: tokenData.scope,
        tokenLength: tokenData.access_token?.length || 0,
        timestamp: new Date().toISOString()
      }
    });

  } catch (err: any) {
    console.error('💥 Authentication test crashed:', err);
    
    return json({
      success: false,
      error: err.message || 'Authentication test failed',
      details: {
        errorType: err.constructor.name,
        stack: err.stack?.split('\n').slice(0, 3) // First 3 lines of stack trace
      }
    }, { status: 500 });
  }
};
