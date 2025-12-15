# Sensor Code Improvements

## Key Improvements Made

### 1. **Fixed Critical Bugs**
- ✅ Fixed `String_printf` → Used proper `sprintf` with buffer
- ✅ Improved MAC address extraction with proper frame offset handling
- ✅ Added validation to skip invalid/broadcast MACs
- ✅ Better error handling for WiFi operations

### 2. **Better MAC Address Extraction**
- ✅ Separate function `extractMAC()` for cleaner code
- ✅ Handles different frame types correctly (Probe Request, Beacon, Data)
- ✅ Proper offset calculations for each frame type
- ✅ Validates MAC addresses before processing

### 3. **Improved Distance Calculation**
- ✅ New `calculateDistance()` function with calibrated indoor model
- ✅ Uses path loss exponent of 2.5 (better for indoor)
- ✅ Caps distance at reasonable values (0.1m - 50m)
- ✅ Handles edge cases (invalid RSSI, too close)

### 4. **Enhanced Upload Logic**
- ✅ Cleans up old devices before creating JSON
- ✅ Only uploads active devices (seen in last 30 seconds)
- ✅ Increased JSON buffer size (16KB) for larger payloads
- ✅ Better error messages with response codes
- ✅ Exponential backoff on retries
- ✅ Timeout settings for HTTP requests

### 5. **Better WiFi Management**
- ✅ Auto-reconnect enabled
- ✅ Reconnection logic in main loop
- ✅ Status monitoring and reporting
- ✅ Better connection feedback

### 6. **Improved Debugging**
- ✅ Comprehensive serial output
- ✅ Status updates every 60 seconds
- ✅ Clear success/failure indicators (✓/✗)
- ✅ Payload size reporting
- ✅ Device count tracking

### 7. **Code Quality**
- ✅ Better code organization
- ✅ More descriptive variable names
- ✅ Proper error checking for all WiFi operations
- ✅ Cleaner JSON structure matching Supabase schema exactly

## Supabase Schema Compatibility

The code now perfectly matches your Supabase schema:

```json
{
  "sensor_id": "SENSOR_XXXXXX",
  "location": "Entrance-01",
  "wifi_rssi": -65,
  "devices": [
    {
      "mac": "aa:bb:cc:dd:ee:ff",
      "fp": "fingerprint_hash",
      "rssi": -75,
      "peak_rssi": -70,
      "duration": 120,
      "packets": 45,
      "distance_m": 2.5
    }
  ]
}
```

## Configuration

Update these values in the code:

```cpp
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";
const char* LOCATION_NAME = "Your-Location-Name";
```

## Testing Checklist

1. **Upload Test**
   - [ ] Verify devices are detected
   - [ ] Check serial output for upload success
   - [ ] Verify data appears in Supabase dashboard

2. **WiFi Test**
   - [ ] Verify connection on startup
   - [ ] Test reconnection after disconnect
   - [ ] Check RSSI values are reasonable

3. **Detection Test**
   - [ ] Walk near sensor with phone
   - [ ] Verify device appears in tracking
   - [ ] Check distance calculations are reasonable

4. **Channel Hopping Test**
   - [ ] Verify channel switches every 3 seconds
   - [ ] Check devices detected on all channels

## Performance Notes

- **Memory**: Uses ~16KB JSON buffer (adjust if needed)
- **Upload Interval**: 25 seconds (good balance)
- **Device Timeout**: 3 minutes (removes stale devices)
- **Channel Hopping**: Every 3 seconds (covers all channels)

## Troubleshooting

### No devices detected
- Check RSSI_THRESHOLD (-92 is quite low, try -85)
- Verify WiFi is in promiscuous mode
- Check serial output for errors

### Upload failures
- Verify Supabase URL and API key
- Check WiFi connection status
- Review serial output for error codes
- Ensure Supabase table has correct schema

### Memory issues
- Reduce JSON buffer size if needed
- Reduce DEVICE_TIMEOUT to clean up faster
- Limit number of tracked devices

## Next Steps

1. Upload the code to your ESP32
2. Monitor serial output for first upload
3. Check Supabase dashboard for incoming data
4. Adjust thresholds based on your environment

