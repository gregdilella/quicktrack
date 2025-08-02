import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, fetch }) => {
  try {
    // AviationStack API key
    const apiKey = env.AVIATIONSTACK_API_KEY;
    
    if (!apiKey) {
      console.error('AVIATIONSTACK_API_KEY not configured');
      throw error(500, 'Flight API not configured');
    }
    
    // Get query parameters
    const airport = url.searchParams.get('airport') || 'YUL';
    const limit = url.searchParams.get('limit') || '100';
    
    console.log(`Fetching flights for airport: ${airport}`);

    // Call AviationStack API
    const aviationStackResponse = await fetch(
      `https://api.aviationstack.com/v1/flights?access_key=${apiKey}&limit=${limit}&dep_iata=${airport}`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!aviationStackResponse.ok) {
      console.error('AviationStack API Error:', aviationStackResponse.status, aviationStackResponse.statusText);
      throw error(aviationStackResponse.status, `AviationStack API Error: ${aviationStackResponse.statusText}`);
    }

    const data = await aviationStackResponse.json();
    
    // Check if API returned an error
    if (data.error) {
      console.error('AviationStack API Error:', data.error);
      throw error(400, `AviationStack API Error: ${data.error.message || 'Unknown error'}`);
    }

    console.log(`Found ${data.data?.length || 0} flights`);

    return json({
      success: true,
      airport,
      flights: data.data || [],
      pagination: data.pagination || {},
      total: data.data?.length || 0,
      timestamp: new Date().toISOString()
    });

  } catch (err: any) {
    console.error('Error in flights API:', err);
    
    if (err?.status) {
      throw err; // Re-throw SvelteKit errors
    }
    
    throw error(500, 'Failed to fetch flight data');
  }
}; 