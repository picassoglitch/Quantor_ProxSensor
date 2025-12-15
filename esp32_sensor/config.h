// Configuration file for ESP32 sensor
// Copy this file and update with your settings

#ifndef CONFIG_H
#define CONFIG_H

// WiFi Configuration
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Server Configuration
#define SERVER_URL "http://YOUR_SERVER_IP:3000/api/detections"

// Sensor Configuration
#define SENSOR_ID "SENSOR_001"  // Change this for each sensor
#define LOCATION_NAME "Location A"  // Change this for each location

// Scan Configuration
#define SCAN_DURATION 5  // BLE scan duration in seconds
#define UPLOAD_INTERVAL 30  // Upload data every 30 seconds

#endif

