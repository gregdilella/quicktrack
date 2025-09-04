
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
    searchTime?: string;
  };
  byDate?: Array<{
    date: string;
    flights: {
      all: FlightOffer[];
      direct: FlightOffer[];
      connecting: FlightOffer[];
    };
  }>;
}

export interface FlightRecommendation {
  flightId: string | null;
  flight: FlightOffer | null;
  etaISO: string | null;
  reasonCode: 'SAME_DAY_OPTIMAL' | 'SAME_DAY_AVAILABLE' | 'NEXT_DAY_EARLIEST' | 'NO_FLIGHTS_FOUND';
  explanation: string;
  // Enhanced display information
  flightDetails?: {
    departureTimeLocal: string;
    arrivalTimeLocal: string;
    departureTimeUTC: string;
    arrivalTimeUTC: string;
    flightDuration: string;
    flightDurationMinutes: number;
    airportArrivalTimeLocal: string;
    cargoProcessingTime: string; // "90 minutes"
    finalDeliveryTimeLocal: string;
    isDirect: boolean;
    cargoReadyTimeISO: string; // When cargo is ready to leave airport (for time-specific routing)
  };
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

  // Calculate enhanced flight details
  // Note: Using simplified timezone offsets (0) for now - could be enhanced with actual timezone lookup
  const flightDetails = calculateFlightDetails(
    selectedFlight, 
    destinationDriveMinutes, 
    0, // Origin timezone offset (could be enhanced)
    0  // Destination timezone offset (could be enhanced)
  );

  return {
    flightId: selectedFlight.id,
    flight: selectedFlight,
    etaISO: estimatedDelivery.toISOString(),
    reasonCode,
    explanation,
    flightDetails
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
    summary: { totalOffers: 0, directFlights: 0, connectingFlights: 0 },
    byDate: []
  };

  for (const { ok, data, date } of results) {
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

    // Add to byDate structure for UI display
    merged.byDate!.push({
      date: data.searchCriteria?.departureDate || date,
      flights: {
        direct: filteredDirect,
        connecting: filteredConnecting,
        all: filteredAll
      }
    });
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
 * Handles both detailed itinerary format and simple enhanced.aircraft format
 */
export function filterOutRegionalAircraft(flights: FlightOffer[]): FlightOffer[] {
  return flights.filter((flight: any) => {
    // Handle the enhanced.aircraft format (simple string format)
    const aircraft = flight.enhanced?.aircraft;
    if (aircraft && typeof aircraft === 'string') {
      const aircraftList = aircraft.split(', ');
      const hasRegionalAircraft = aircraftList.some((plane: string) => {
        const cleanPlane = plane.trim().toUpperCase();
        return (
          cleanPlane.startsWith('E') ||
          cleanPlane.startsWith('CR') ||
          cleanPlane.includes('DE HAVILLAND') ||
          cleanPlane.includes('DASH') ||
          cleanPlane.startsWith('DH')
        );
      });
      return !hasRegionalAircraft;
    }

    // Handle the detailed itinerary format (structured data)
    if (flight.itineraries && Array.isArray(flight.itineraries)) {
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

      const hasRegionalAircraft = flight.itineraries.some((itinerary: any) => 
        itinerary.segments?.some((segment: any) => {
          const aircraftCode = segment.aircraft?.code || '';
          return regionalAircraftCodes.some(regional => 
            aircraftCode.toUpperCase().includes(regional)
          );
        })
      );
      return !hasRegionalAircraft;
    }

    // If no aircraft information is available, include the flight
    return true;
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
 * Format duration in minutes to human readable string
 */
function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${mins}m`;
}

/**
 * Convert UTC time to local time string (best effort without timezone data)
 * Note: This is a simplified conversion. For production, consider using a timezone library
 */
function formatLocalTime(utcTimeString: string, timezoneOffset: number = 0): string {
  const date = new Date(utcTimeString);
  // Add timezone offset in hours
  const localDate = new Date(date.getTime() + (timezoneOffset * 60 * 60 * 1000));
  return localDate.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Enhanced flight details calculation
 * Note: For production use, consider integrating with Google Maps time-specific routing
 * to get more accurate delivery times based on expected traffic at delivery time
 */
function calculateFlightDetails(
  flight: FlightOffer, 
  destinationDriveMinutes: number,
  originTimezoneOffset: number = 0,
  destinationTimezoneOffset: number = 0
) {
  const departureTime = new Date(flight.enhanced.departureTime);
  const arrivalTime = new Date(flight.enhanced.arrivalTime);
  const flightDurationMinutes = flight.enhanced.totalDurationMinutes;
  
  // Calculate cargo processing and final delivery times
  const cargoProcessingTime = addMinutes(arrivalTime, 90);
  const finalDeliveryTime = addMinutes(cargoProcessingTime, destinationDriveMinutes);
  
  return {
    departureTimeLocal: formatLocalTime(flight.enhanced.departureTime, originTimezoneOffset),
    arrivalTimeLocal: formatLocalTime(flight.enhanced.arrivalTime, destinationTimezoneOffset),
    departureTimeUTC: departureTime.toISOString(),
    arrivalTimeUTC: arrivalTime.toISOString(),
    flightDuration: formatDuration(flightDurationMinutes),
    flightDurationMinutes,
    airportArrivalTimeLocal: formatLocalTime(flight.enhanced.arrivalTime, destinationTimezoneOffset),
    cargoProcessingTime: "90 minutes",
    finalDeliveryTimeLocal: formatLocalTime(finalDeliveryTime.toISOString(), destinationTimezoneOffset),
    isDirect: flight.enhanced.isDirect,
    // Include timing for potential time-specific route calculation
    cargoReadyTimeISO: cargoProcessingTime.toISOString()
  };
}

/**
 * Format date to ISO string for consistent handling
 */
export function formatISO(date: Date): string {
  return date.toISOString();
}

/**
 * Simplified flight search interface that matches the current page expectations
 * This searches for 2 days (base day + next day) and returns results in the expected format
 */
export async function searchFlightsForJobCreation(
  origin: string,
  destination: string,
  baseDate: string,
  earliestISO: string | null
): Promise<FlightSearchResults> {
  // Convert baseDate string to Date object
  const readyDate = new Date(`${baseDate}T00:00:00`);
  
  // If we have an earliest time, use that; otherwise use the start of the ready date
  const readyDateTime = earliestISO ? new Date(earliestISO) : readyDate;
  
  // Search for 2 days (base day + next day) to match current page behavior
  const searchResults = await searchFlightsFromReadyTime(
    origin,
    destination,
    readyDateTime,
    2 // Only search 2 days like the current pages
  );

  // Add search time for compatibility
  searchResults.summary.searchTime = new Date().toISOString();
  
  return searchResults;
}

/**
 * Compute recommended flight and ETA using the advanced algorithm
 * This replaces the simple duplicated logic in both pages
 */
export function computeRecommendedFlightAndETA(
  mergedFlights: FlightSearchResults,
  earliestISO: string,
  destDriveMins: number
): { flightId: string | null; etaISO: string | null } {
  const earliest = new Date(earliestISO);
  
  // Use the advanced flight selection algorithm
  const recommendation = selectOptimalFlight(
    mergedFlights,
    earliest,
    destDriveMins
  );
  
  return {
    flightId: recommendation.flightId,
    etaISO: recommendation.etaISO
  };
}
