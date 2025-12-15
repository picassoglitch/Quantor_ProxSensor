# Installation Guide

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Arduino IDE
- ESP32 development board
- WiFi network

### Step 1: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start the server
npm start
```

The server will start on `http://localhost:3000`

### Step 2: ESP32 Setup

1. **Install Arduino IDE** and add ESP32 support:
   - File → Preferences → Additional Board Manager URLs
   - Add: `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
   - Tools → Board → Boards Manager → Search "ESP32" → Install

2. **Install Libraries**:
   - Tools → Manage Libraries
   - Install: "ArduinoJson" by Benoit Blanchon

3. **Configure ESP32 Code**:
   - Open `esp32_sensor/esp32_phone_detector.ino`
   - Update these lines:
     ```cpp
     const char* ssid = "YOUR_WIFI_SSID";
     const char* password = "YOUR_WIFI_PASSWORD";
     const char* serverURL = "http://YOUR_SERVER_IP:3000/api/detections";
     const char* sensorId = "SENSOR_001";
     const char* locationName = "Location A";
     ```
   - Replace `YOUR_SERVER_IP` with your computer's IP address
   - For each sensor, use a unique `sensorId`

4. **Upload to ESP32**:
   - Select your ESP32 board (Tools → Board)
   - Select the correct port (Tools → Port)
   - Click Upload
   - Open Serial Monitor (115200 baud) to see status

### Step 3: Access Dashboard

Open your web browser and go to:
```
http://localhost:3000
```

Or if accessing from another device:
```
http://YOUR_SERVER_IP:3000
```

## Finding Your Server IP Address

### Windows
```cmd
ipconfig
```
Look for "IPv4 Address" under your active network adapter.

### Mac/Linux
```bash
ifconfig
```
Or:
```bash
ip addr show
```

## Testing

1. **Test Backend**: Open `http://localhost:3000/api/health` - should return `{"status":"ok"}`

2. **Test ESP32**: 
   - Check Serial Monitor for "WiFi connected" message
   - Check Serial Monitor for "Uploading data to server" messages
   - Check dashboard for incoming detections

3. **Test Detection**:
   - Enable Bluetooth on your phone
   - Walk near the ESP32 sensor
   - Check dashboard for your device appearing

## Multiple Sensors

To add more sensors:

1. Upload the same code to another ESP32
2. Change `sensorId` to "SENSOR_002", "SENSOR_003", etc.
3. Change `locationName` to identify the location
4. All sensors will send data to the same server
5. Dashboard will show data from all sensors with filtering options

## Troubleshooting

### ESP32 won't connect to WiFi
- Verify SSID and password are correct
- Ensure WiFi is 2.4GHz (ESP32 doesn't support 5GHz)
- Check signal strength

### ESP32 can't reach server
- Verify server is running
- Check server IP address is correct
- Ensure firewall allows connections on port 3000
- Try pinging the server IP from another device

### No devices detected
- Ensure Bluetooth is enabled on phones
- Some phones may not advertise BLE when screen is off
- Try moving closer to the sensor
- Check Serial Monitor for "Devices found" messages

### Dashboard not loading
- Check server is running (`npm start` in backend directory)
- Check browser console for errors
- Verify API endpoints are accessible

