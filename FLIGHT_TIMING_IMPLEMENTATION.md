# Flight Timing Implementation

This document describes the implementation of flight timing estimates in the Quicktrack timetable system.

## Overview

The system now automatically saves detailed flight timing estimates to the `timetable` table when jobs are created with flight information. This provides accurate tracking and visibility into the entire delivery timeline.

## Database Changes

### Database Schema Changes

Run the SQL migration: `database/add_flight_estimated_times.sql`

**New columns added to `timetable` table (timing estimates):**

- `estimated_flight_departure` (TIMESTAMPTZ) - Estimated departure time of selected flight
- `estimated_flight_arrival` (TIMESTAMPTZ) - Estimated arrival time at destination airport  
- `estimated_airport_pickup` (TIMESTAMPTZ) - When cargo is ready to leave airport (arrival + 90min)
- `estimated_cargo_ready` (TIMESTAMPTZ) - Same as airport_pickup - when cargo is ready for delivery
- `estimated_delivery` (TIMESTAMPTZ) - Final estimated delivery time at consignee

**New columns added to `awb` table (flight metadata):**

- `flight_duration_minutes` (INTEGER) - Total flight duration in minutes
- `selected_flight_id` (TEXT) - ID of the selected flight from flight search API
- `origin_airport_code` (TEXT) - IATA code of origin airport (e.g., LAX)
- `destination_airport_code` (TEXT) - IATA code of destination airport (e.g., JFK)
- `is_direct_flight` (BOOLEAN) - Whether the flight is direct or connecting

## Code Changes

### 1. New Service: `src/lib/services/timetableService.ts`

**Key Functions:**
- `saveFlightEstimatesToTimetable()` - Saves flight timing estimates to database
- `updateFlightEstimates()` - Updates existing flight estimates
- `getFlightEstimates()` - Retrieves flight estimates for a job

### 2. Enhanced Flight Algorithm Integration

Both customer and operations job creation pages now:
- Use the advanced flight selection algorithm (`selectOptimalFlight`)
- Store detailed flight recommendations with timing breakdowns
- Automatically save flight estimates to timetable after job creation

### 3. Updated Job Creation Services

**Operations Page (`src/routes/(auth-required)/dashboard/operations/add-new-job/+page.svelte`):**
- Added `FlightRecommendation` variable to store detailed flight info
- Integrated advanced flight selection algorithm
- Added automatic timetable saving after job creation

**Customer Page (`src/routes/(auth-required)/dashboard/customer/new-job/+page.svelte`):**
- Same enhancements as operations page
- Updated `createCustomerJob` call to include flight recommendation

**Customer Service (`src/lib/services/customerService.ts`):**
- Updated `createCustomerJob()` to accept `FlightRecommendation` parameter
- Added automatic flight estimates saving to timetable

### 4. Server-Side Actions (Optional)

**Added `+page.server.ts` files for both customer and operations:**
- `saveFlightEstimates` action - Server-side flight timing save
- `updateFlightEstimates` action - Server-side flight timing updates
- Can be used for additional server-side processing if needed

## Data Flow

### Job Creation with Flight Timing

1. **Address Validation**: User enters shipper/consignee addresses
2. **Airport Finding**: System finds nearest airports using enhanced global coverage
3. **Flight Search**: Advanced algorithm searches flights for ready date + next day
4. **Flight Selection**: `selectOptimalFlight()` chooses best flight with detailed reasoning
5. **Job Creation**: Job is saved to `jobsfile` table
6. **Timetable Creation**: Flight estimates automatically saved to `timetable` table
7. **AWB Creation**: Air Waybill created with selected flight data

### Timing Calculations

The system calculates a complete timeline:

```
Ready Time (User Input)
    ↓ + Drive to Origin Airport
Earliest Departure Time
    ↓ + Flight Selection Algorithm
Selected Flight Departure
    ↓ + Flight Duration  
Flight Arrival at Destination Airport
    ↓ + 90 minutes (Cargo Processing)
Cargo Ready for Pickup
    ↓ + Drive to Final Destination
Estimated Delivery Time
```

## Enhanced Flight Details

The `FlightRecommendation` interface now includes:

```typescript
flightDetails: {
  departureTimeLocal: "Mon, Dec 23, 08:30 AM",
  arrivalTimeLocal: "Mon, Dec 23, 11:15 AM", 
  flightDuration: "2h 45m",
  flightDurationMinutes: 165,
  airportArrivalTimeLocal: "Mon, Dec 23, 11:15 AM",
  cargoProcessingTime: "90 minutes",
  finalDeliveryTimeLocal: "Mon, Dec 23, 02:30 PM",
  isDirect: true,
  cargoReadyTimeISO: "2024-12-23T12:45:00.000Z"
}
```

## Benefits

1. **Complete Timeline Visibility**: Full end-to-end timing from ready time to delivery
2. **Accurate ETAs**: Traffic-aware routing and realistic processing times
3. **Automatic Tracking**: No manual entry required - estimates saved during job creation
4. **Global Coverage**: Enhanced airport finding for UK, Europe, and worldwide
5. **Advanced Algorithm**: Sophisticated flight selection with detailed reasoning
6. **Audit Trail**: All timing estimates stored with flight IDs and airport codes

## Usage

### For Developers

The system automatically handles flight timing when jobs are created through the UI. No additional code is required for basic functionality.

### For Operations

Flight timing estimates will appear in the timetable view and can be used for:
- Customer communication (accurate delivery ETAs)
- Operations planning (driver scheduling)
- Performance tracking (estimated vs actual times)
- Exception handling (delays, missed flights)

## Database Schema Update

After running the migration, remember to update your TypeScript types:

```bash
npx supabase gen types typescript --local > src/lib/types/supabase.types.ts
```

## Future Enhancements

Potential improvements:
- Real-time flight tracking integration
- Automatic updates when flights are delayed
- SMS/email notifications based on timing estimates  
- Performance analytics (estimated vs actual delivery times)
- Integration with driver dispatch systems
