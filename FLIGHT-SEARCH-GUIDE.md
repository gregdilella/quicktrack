# ✈️ Flight Search Guide

## 🎯 Quick Start

Your new flight search tool is ready! Access it at:
**http://localhost:5174/dashboard/testing/flight-search**

## 🚀 How to Use

### 1. **Quick Route Selection**
Click any of the popular routes to auto-fill origin and destination:
- **Montreal → New York** (YUL → JFK)
- **Montreal → Toronto** (YUL → YYZ) 
- **London → Paris** (LHR → CDG)
- **Madrid → Barcelona** (MAD → BCN)
- And more...

### 2. **Custom Search**
- **From/To Airports**: Select from dropdown or use the route buttons
- **Departure Date**: Pick a date 1-4 weeks from now (works best)
- **Return Date**: Optional for round trips
- **Passengers**: Adults, children, infants
- **Travel Class**: Economy, Premium, Business, First
- **Non-stop**: Check for direct flights only

### 3. **Search Results**
You'll see:
- **⚡ Fastest Flight** highlighted at the top
- **✈️ Direct Flights** with no stops
- **🔄 Connecting Flights** with layovers
- **Price, duration, airlines** for each option

## 🎯 Best Routes for Testing

### **European Routes** (Usually have good data)
```
MAD → BCN  (Madrid → Barcelona)
LHR → CDG  (London → Paris)  
LHR → MAD  (London → Madrid)
CDG → BCN  (Paris → Barcelona)
```

### **North American Routes**
```
YUL → YYZ  (Montreal → Toronto)
JFK → LAX  (New York → Los Angeles)
MIA → BNA  (Miami → Nashville)
JFK → MIA  (New York → Miami)
```

### **Transatlantic Routes**
```
LHR → JFK  (London → New York)
CDG → JFK  (Paris → New York)
MAD → JFK  (Madrid → New York)
```

## 💡 Pro Tips

### **📅 Date Selection**
- ✅ **Best**: 1-4 weeks from today
- ✅ **Good**: Weekdays (Tue-Thu)
- ❌ **Avoid**: Same day, weekends, far future

### **🛫 Airport Codes**
- **MAD, BCN, LHR, CDG** - Usually have the most test data
- **YUL, JFK, LAX** - Good North American options
- **Avoid obscure airports** - Limited test data

### **⚙️ Search Settings**
- **Start with Economy** - Most flight options
- **Try both direct and connecting** - More results
- **Max results: 20** - Good balance of speed and options

## 🔧 Troubleshooting

### **"No Flights Found"**
1. **Try popular routes** like MAD→BCN or LHR→CDG
2. **Change the date** to 2-3 weeks from now
3. **Disable non-stop only** to see connecting flights
4. **Remember**: Test API has limited data vs production

### **"Resource not found" Error**
1. **Check airport codes** - must be valid 3-letter IATA codes
2. **Verify date format** - should be YYYY-MM-DD
3. **Try different route** - some routes have no test data
4. **Use debug tool** at `/dashboard/testing/amadeus-debug`

### **Slow Loading**
- Normal for first search (getting auth token)
- Subsequent searches should be faster
- Check browser console for detailed logs

## 🌟 Features

### **Smart Results Display**
- **Direct flights** shown first (green border)
- **Connecting flights** grouped separately (orange border)  
- **Fastest option** highlighted at top
- **Price comparison** in your preferred currency

### **Search Summary**
- Total offers found
- Direct vs connecting flight counts
- Search criteria displayed
- Timestamp for debugging

### **Mobile Friendly**
- Responsive design works on all devices
- Touch-friendly route selection buttons
- Optimized for small screens

## 🚨 Important Notes

### **Test vs Production**
- Currently using **Amadeus TEST API**
- Limited flight data compared to production
- Some routes may return no results
- This is normal and expected

### **API Limits**
- Test API has usage quotas
- Don't spam searches too quickly
- Production API requires paid subscription

## 🎓 Learning Points

This tool demonstrates:
- **API Integration** - Amadeus Flight Offers API
- **Error Handling** - Graceful failures with helpful messages
- **Data Processing** - Sorting and categorizing flight results
- **User Experience** - Quick route selection and clear results
- **Responsive Design** - Works on desktop and mobile

---

**🔗 Related Tools:**
- **Amadeus Debug**: `/dashboard/testing/amadeus-debug`
- **General Flight Testing**: `/dashboard/testing`
- **Airport Debug**: `/dashboard/testing/airport-debug`

Happy flight searching! ✈️
