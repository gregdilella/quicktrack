
/**
 * Flight Selection Algorithm
 * 
 * This module contains the core logic for selecting optimal flights based on:
 * - Ready time (when cargo is ready to fly)
 * - Flight availability 
 * - Preference for same-day flights when possible
 * - Minimizing total transit time
 */

export interface FlightOffer {
  id: string;
  enhanced: {
    departureTime: string;
    arrivalTime: string;
    totalDurationMinutes: number;
    isDirect: boolean;
  };
  price: {
    total: string;
    currency: string;
  };
  itineraries: any[];
}

export interface FlightSearchResults {
  flights: {
    all: FlightOffer[];
    direct: FlightOffer[];
    connecting: FlightOffer[];
  };
  summary: {
    totalOffers: number;
    directFlights: number;
    connectingFlights: number;
  };
}

export interface FlightRecommendation {
  flightId: string | null;
  flight: FlightOffer | null;
  etaISO: string | null;
  reasonCode: 'SAME_DAY_OPTIMAL' | 'SAME_DAY_AVAILABLE' | 'NEXT_DAY_EARLIEST' | 'NO_FLIGHTS_FOUND';
  explanation: string;
}

/**
 * Core flight selection algorithm that prioritizes flights closest to ready time
 */
export function selectOptimalFlight(
  searchResults: FlightSearchResults,
  readyDateTime: Date,
  destinationDriveMinutes: number = 0
): FlightRecommendation {
  const allFlights = searchResults.flights.all || [];
  
  if (allFlights.length === 0) {
    return {
      flightId: null,
      flight: null,
      etaISO: null,
      reasonCode: 'NO_FLIGHTS_FOUND',
      explanation: 'No flights available for the selected route and dates'
    };
  }

  // Filter flights that depart at or after ready time
  const availableFlights = allFlights.filter(flight => {
    const departureTime = new Date(flight.enhanced.departureTime);
    return departureTime >= readyDateTime;
  });

  if (availableFlights.length === 0) {
    return {
      flightId: null,
      flight: null,
      etaISO: null,
      reasonCode: 'NO_FLIGHTS_FOUND',
      explanation: 'No flights depart after the ready time'
    };
  }

  // Check if ready time is today
  const readyDate = new Date(readyDateTime);
  readyDate.setHours(0, 0, 0, 0);
  
  // Find same-day flights (departing on the ready date)
  const sameDayFlights = availableFlights.filter(flight => {
    const flightDate = new Date(flight.enhanced.departureTime);
    flightDate.setHours(0, 0, 0, 0);
    return flightDate.getTime() === readyDate.getTime();
  });

  let selectedFlight: FlightOffer;
  let reasonCode: FlightRecommendation['reasonCode'];
  let explanation: string;

  if (sameDayFlights.length > 0) {
    // Prioritize same-day flights
    // First, try to find direct flights on the same day
    const sameDayDirect = sameDayFlights.filter(f => f.enhanced.isDirect);
    
    if (sameDayDirect.length > 0) {
      // Choose the earliest direct flight on the same day
      selectedFlight = sameDayDirect.sort((a, b) => 
        new Date(a.enhanced.departureTime).getTime() - new Date(b.enhanced.departureTime).getTime()
      )[0];
      reasonCode = 'SAME_DAY_OPTIMAL';
      explanation = 'Selected earliest same-day direct flight';
    } else {
      // Choose the earliest connecting flight on the same day
      selectedFlight = sameDayFlights.sort((a, b) => 
        new Date(a.enhanced.departureTime).getTime() - new Date(b.enhanced.departureTime).getTime()
      )[0];
      reasonCode = 'SAME_DAY_AVAILABLE';
      explanation = 'Selected earliest same-day connecting flight (no direct flights available)';
    }
  } else {
    // No same-day flights, choose the earliest next-day flight
    selectedFlight = availableFlights.sort((a, b) => 
      new Date(a.enhanced.departureTime).getTime() - new Date(b.enhanced.departureTime).getTime()
    )[0];
    reasonCode = 'NEXT_DAY_EARLIEST';
    explanation = 'No same-day flights available, selected earliest next-day flight';
  }

  // Calculate estimated delivery time
  const arrivalTime = new Date(selectedFlight.enhanced.arrivalTime);
  // Add 90 minutes for cargo processing + destination drive time
  const estimatedDelivery = new Date(arrivalTime.getTime() + (90 + destinationDriveMinutes) * 60 * 1000);

  return {
    flightId: selectedFlight.id,
    flight: selectedFlight,
    etaISO: estimatedDelivery.toISOString(),
    reasonCode,
    explanation
  };
}

/**
 * Enhanced flight search that looks for flights starting from ready date
 * instead of a fixed departure date
 */
export async function searchFlightsFromReadyTime(
  origin: string,
  destination: string,
  readyDateTime: Date,
  searchDays: number = 3
): Promise<FlightSearchResults> {
  const readyDate = new Date(readyDateTime);
  readyDate.setHours(0, 0, 0, 0); // Get the date part
  
  const searchDates: string[] = [];
  
  // Generate search dates starting from ready date
  for (let i = 0; i < searchDays; i++) {
    const searchDate = new Date(readyDate);
    searchDate.setDate(readyDate.getDate() + i);
    searchDates.push(searchDate.toISOString().split('T')[0]); // YYYY-MM-DD format
  }

  console.log(`🔍 Searching flights for ${searchDays} days starting from ${searchDates[0]}`);
  console.log(`📅 Search dates: ${searchDates.join(', ')}`);

  // Search each date in parallel
  const searchPromises = searchDates.map(async (date, index) => {
    const params = new URLSearchParams({
      origin,
      destination,
      departureDate: date,
      adults: '1',
      children: '0',
      infants: '0',
      nonStop: 'false',
      currency: 'USD',
      max: '50'
    });

    // For the first day (ready date), include the ready time
    if (index === 0) {
      const readyTimeHHMM = readyDateTime.toTimeString().slice(0, 5); // HH:MM format
      params.set('departureTime', readyTimeHHMM);
    }

    try {
      const response = await fetch(`/api/flights/search?${params.toString()}`);
      const data = await response.json();
      return { ok: response.ok, data, date };
    } catch (error) {
      console.error(`Failed to search flights for ${date}:`, error);
      return { ok: false, data: null, date };
    }
  });

  const results = await Promise.all(searchPromises);

  // Merge all results
  const merged: FlightSearchResults = {
    flights: { direct: [], connecting: [], all: [] },
    summary: { totalOffers: 0, directFlights: 0, connectingFlights: 0 }
  };

  for (const { ok, data } of results) {
    if (!ok || !data?.flights) continue;

    // Filter out regional aircraft (as per user preference)
    const filteredDirect = filterOutRegionalAircraft(data.flights.direct || []);
    const filteredConnecting = filterOutRegionalAircraft(data.flights.connecting || []);
    const filteredAll = filterOutRegionalAircraft(data.flights.all || []);

    merged.flights.direct.push(...filteredDirect);
    merged.flights.connecting.push(...filteredConnecting);
    merged.flights.all.push(...filteredAll);
    
    merged.summary.totalOffers += filteredAll.length;
    merged.summary.directFlights += filteredDirect.length;
    merged.summary.connectingFlights += filteredConnecting.length;
  }

  // Sort all flights by departure time (earliest first)
  const sortByDeparture = (a: FlightOffer, b: FlightOffer) => 
    new Date(a.enhanced.departureTime).getTime() - new Date(b.enhanced.departureTime).getTime();

  merged.flights.all.sort(sortByDeparture);
  merged.flights.direct.sort(sortByDeparture);
  merged.flights.connecting.sort(sortByDeparture);

  console.log(`✅ Found ${merged.summary.totalOffers} total flights across ${searchDays} days`);
  console.log(`📊 Direct: ${merged.summary.directFlights}, Connecting: ${merged.summary.connectingFlights}`);

  return merged;
}

/**
 * Filter out regional aircraft based on user preference
 * This removes small regional planes that may not be suitable for cargo
 */
function filterOutRegionalAircraft(flights: FlightOffer[]): FlightOffer[] {
  const regionalAircraftCodes = [
    'CRJ', 'CR2', 'CR7', 'CR9', // Canadair Regional Jets
    'DH8', 'DHC', 'DH1', 'DH2', 'DH3', 'DH4', // Dash 8 series
    'EMB', 'EM2', 'E70', 'E75', 'E90', 'E95', // Embraer regional
    'AT7', 'ATR', 'AT4', 'AT5', // ATR turboprops
    'SF3', 'SH3', 'SH6', // Saab aircraft
    'BEC', 'BE1', 'BE9', // Beechcraft
    'CNA', 'CNJ', // Other small aircraft
    '32N', '32S', '32Q' // Some smaller Airbus variants
  ];

  return flights.filter(flight => {
    // Check all segments in the itinerary
    const hasRegionalAircraft = flight.itineraries.some((itinerary: any) => 
      itinerary.segments?.some((segment: any) => {
        const aircraftCode = segment.aircraft?.code || '';
        return regionalAircraftCodes.some(regional => 
          aircraftCode.toUpperCase().includes(regional)
        );
      })
    );

    return !hasRegionalAircraft;
  });
}

/**
 * Complete flight selection workflow:
 * 1. Search flights starting from ready date
 * 2. Select optimal flight based on timing and preferences
 * 3. Return recommendation with detailed reasoning
 */
export async function findOptimalFlightFromReadyTime(
  origin: string,
  destination: string,
  readyDateTime: Date,
  destinationDriveMinutes: number = 0,
  searchDays: number = 3
): Promise<FlightRecommendation> {
  console.log(`🎯 Finding optimal flight from ${origin} to ${destination}`);
  console.log(`⏰ Ready time: ${readyDateTime.toISOString()}`);
  console.log(`🚗 Destination drive: ${destinationDriveMinutes} minutes`);

  try {
    // Search for flights starting from ready date
    const searchResults = await searchFlightsFromReadyTime(
      origin, 
      destination, 
      readyDateTime, 
      searchDays
    );

    // Select the optimal flight
    const recommendation = selectOptimalFlight(
      searchResults, 
      readyDateTime, 
      destinationDriveMinutes
    );

    console.log(`🎯 Flight selection result: ${recommendation.reasonCode}`);
    console.log(`💡 ${recommendation.explanation}`);

    return recommendation;

  } catch (error) {
    console.error('❌ Error in findOptimalFlightFromReadyTime:', error);
    return {
      flightId: null,
      flight: null,
      etaISO: null,
      reasonCode: 'NO_FLIGHTS_FOUND',
      explanation: `Flight search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Utility function to add minutes to a date
 */
function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

/**
 * Format date to ISO string for consistent handling
 */
export function formatISO(date: Date): string {
  return date.toISOString();
}
