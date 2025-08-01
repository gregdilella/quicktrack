# Flight APIs Setup Guide

This guide will help you set up both AviationStack and Amadeus APIs for the flight testing dashboard.

## 🛫 AviationStack API Setup

AviationStack provides real-time flight tracking and departure information.

### 1. Get Your API Key
1. Visit [AviationStack](https://aviationstack.com/)
2. Sign up for a free account
3. Choose your plan:
   - **Free**: 1,000 requests/month
   - **Basic**: $9.99/month, 10,000 requests
   - **Professional**: $49.99/month, 100,000 requests

### 2. Configure Environment Variable
Add to your `.env` file:
```env
AVIATIONSTACK_API_KEY=your-aviationstack-api-key-here
```

### 3. API Features
- ✅ Real-time flight departures
- ✅ Flight status updates
- ✅ Airport information
- ✅ Aircraft details
- ✅ Airline information

---

## ✈️ Amadeus Flight Inspiration Search API Setup

Amadeus provides flight destination discovery and pricing information.

### 1. Create Developer Account
1. Visit [Amadeus for Developers](https://developers.amadeus.com/)
2. Sign up for a free account
3. Create a new application
4. Get your Client ID and Client Secret

### 2. API Access Levels
- **Test Environment**: Free, limited data
- **Production**: Paid, full access to live data

### 3. Configure Environment Variables
Add to your `.env` file:
```env
AMADEUS_CLIENT_ID=your-amadeus-client-id-here
AMADEUS_CLIENT_SECRET=your-amadeus-client-secret-here
```

### 4. API Features
- ✅ Flight destination discovery
- ✅ Price predictions
- ✅ Popular destinations from origin
- ✅ Flexible date searches
- ✅ Trip duration filtering
- ✅ Price range filtering

---

## 🧪 Using the Testing Dashboard

### Access the Testing Page
Navigate to: `http://localhost:5173/dashboard/testing`

### Testing AviationStack API
1. **Select Airport**: Choose departure airport code (YUL, JFK, LAX, etc.)
2. **Set Results Limit**: Choose how many flights to return (10-100)
3. **Click Test**: Press "🚀 Test AviationStack API"
4. **View Results**: See real-time flight departures

### Testing Amadeus API
1. **Select Origin**: Choose departure airport
2. **Set Departure Date**: Pick future travel date
3. **Configure Options**:
   - Trip Duration (1-15 days)
   - Max Price ($200-$5000)
   - One-way vs Round-trip
   - Non-stop preference
4. **Click Search**: Press "🌍 Search Flight Inspirations"
5. **View Results**: See available destinations and prices

---

## 🔧 API Endpoints

### AviationStack
- **Endpoint**: `/api/flights`
- **Method**: GET
- **Parameters**:
  - `airport`: Airport code (default: YUL)
  - `limit`: Results limit (default: 100)

### Amadeus
- **Endpoint**: `/api/flights/amadeus`
- **Method**: GET
- **Parameters**:
  - `origin`: Origin airport code
  - `departureDate`: Date in YYYY-MM-DD format
  - `one_way`: Boolean for trip type
  - `duration`: Trip duration range (e.g., "1,15")
  - `non_stop`: Boolean for direct flights only
  - `max_price`: Maximum price in USD
  - `currency`: Currency code (default: USD)

---

## 🚀 Example API Calls

### AviationStack - Get YUL Departures
```bash
curl "http://localhost:5173/api/flights?airport=YUL&limit=20"
```

### Amadeus - Search Inspirations from YUL
```bash
curl "http://localhost:5173/api/flights/amadeus?origin=YUL&departureDate=2024-03-01&max_price=500&currency=USD"
```

---

## 🔍 Troubleshooting

### Common Issues

**1. "API credentials not configured"**
- Check your `.env` file exists
- Verify environment variable names match exactly
- Restart your development server after adding variables

**2. "Authentication failed" (Amadeus)**
- Verify your Client ID and Secret are correct
- Check if your Amadeus account is active
- Ensure you're using the correct environment (test vs production)

**3. "Rate limit exceeded"**
- You've exceeded your API plan limits
- Upgrade your plan or wait for the limit to reset
- Check your usage in the respective API dashboards

**4. "No flights found"**
- Try different airport codes
- Check if the departure date is not too far in the future
- Some smaller airports may have limited flight data

### API Status Monitoring
- **AviationStack Status**: [status.aviationstack.com](https://status.aviationstack.com/)
- **Amadeus Status**: Check the developer portal for service status

---

## 📊 API Comparison

| Feature | AviationStack | Amadeus |
|---------|---------------|---------|
| **Purpose** | Real-time tracking | Trip inspiration |
| **Data Type** | Live flight status | Historical + predictive |
| **Update Frequency** | Real-time | Daily |
| **Free Tier** | 1,000 requests/month | Yes (limited) |
| **Best For** | Operations, tracking | Planning, booking |
| **Response Time** | Fast (< 1s) | Medium (1-3s) |

---

## 🎯 Next Steps

1. **Set up your API keys** using the instructions above
2. **Test both APIs** using the testing dashboard
3. **Integrate into your application** using the provided endpoints
4. **Monitor usage** through the respective API dashboards
5. **Upgrade plans** as needed based on your usage

For more detailed API documentation, visit:
- [AviationStack Docs](https://aviationstack.com/documentation)
- [Amadeus API Docs](https://developers.amadeus.com/self-service/category/flights)

Happy coding! ✈️🚀 