#include <WiFi.h>
#include <HTTPClient.h>
#include <BLEDevice.h>
#include <BLEScan.h>
#include <BLEAdvertisedDevice.h>
#include <ArduinoJson.h>
#include <Preferences.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server configuration
const char* serverURL = "http://YOUR_SERVER_IP:3000/api/detections";

// Sensor configuration
const char* sensorId = "SENSOR_001";  // Unique ID for each sensor
const char* locationName = "Location A";  // Location identifier
const int scanDuration = 5;  // BLE scan duration in seconds
const int uploadInterval = 30;  // Upload data every 30 seconds

// BLE Scan
BLEScan* pBLEScan;
Preferences preferences;

// Detection data structure
struct PhoneDetection {
  String macAddress;
  String deviceName;
  int rssi;
  unsigned long firstSeen;
  unsigned long lastSeen;
  int detectionCount;
};

// Store detected devices
std::map<String, PhoneDetection> detectedDevices;

// RSSI to distance estimation (approximate, in meters)
float rssiToDistance(int rssi) {
  // Using path loss model: distance = 10^((TxPower - RSSI) / (10 * N))
  // TxPower typically -59 dBm at 1m for BLE
  // N (path loss exponent) typically 2-4 for indoor
  const float txPower = -59.0;
  const float n = 2.0;  // Path loss exponent
  
  if (rssi == 0) return -1.0;  // Invalid RSSI
  
  float ratio = (txPower - rssi) / (10.0 * n);
  float distance = pow(10, ratio);
  
  // Cap distance at reasonable values
  if (distance > 50.0) distance = 50.0;
  if (distance < 0.1) distance = 0.1;
  
  return distance;
}

class MyAdvertisedDeviceCallbacks: public BLEAdvertisedDeviceCallbacks {
  void onResult(BLEAdvertisedDevice advertisedDevice) {
    String macAddress = String(advertisedDevice.getAddress().toString().c_str());
    String deviceName = advertisedDevice.haveName() ? 
                        String(advertisedDevice.getName().c_str()) : 
                        "Unknown";
    int rssi = advertisedDevice.getRSSI();
    unsigned long currentTime = millis();
    
    // Filter out very weak signals (likely noise)
    if (rssi < -90) return;
    
    // Update or create detection record
    if (detectedDevices.find(macAddress) == detectedDevices.end()) {
      // New device detected
      PhoneDetection detection;
      detection.macAddress = macAddress;
      detection.deviceName = deviceName;
      detection.rssi = rssi;
      detection.firstSeen = currentTime;
      detection.lastSeen = currentTime;
      detection.detectionCount = 1;
      detectedDevices[macAddress] = detection;
    } else {
      // Update existing device
      detectedDevices[macAddress].lastSeen = currentTime;
      detectedDevices[macAddress].rssi = rssi;  // Update with latest RSSI
      detectedDevices[macAddress].detectionCount++;
    }
  }
};

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("ESP32 Phone Detection Sensor");
  Serial.println("============================");
  
  // Initialize preferences for storing sensor ID
  preferences.begin("sensor", false);
  String storedSensorId = preferences.getString("sensorId", "");
  if (storedSensorId.length() > 0) {
    sensorId = storedSensorId.c_str();
  } else {
    preferences.putString("sensorId", sensorId);
  }
  preferences.end();
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  int wifiTimeout = 0;
  while (WiFi.status() != WL_CONNECTED && wifiTimeout < 20) {
    delay(500);
    Serial.print(".");
    wifiTimeout++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi connection failed!");
  }
  
  // Initialize BLE
  BLEDevice::init("");
  pBLEScan = BLEDevice::getScan();
  pBLEScan->setAdvertisedDeviceCallbacks(new MyAdvertisedDeviceCallbacks());
  pBLEScan->setActiveScan(true);  // Active scan uses more power but gets more results
  pBLEScan->setInterval(100);
  pBLEScan->setWindow(99);
  
  Serial.println("BLE initialized. Starting scan...");
  Serial.print("Sensor ID: ");
  Serial.println(sensorId);
  Serial.print("Location: ");
  Serial.println(locationName);
}

void loop() {
  // Perform BLE scan
  BLEScanResults foundDevices = pBLEScan->start(scanDuration, false);
  Serial.print("Devices found: ");
  Serial.println(foundDevices.getCount());
  
  // Clean up old detections (devices not seen in last 60 seconds)
  unsigned long currentTime = millis();
  auto it = detectedDevices.begin();
  while (it != detectedDevices.end()) {
    if (currentTime - it->second.lastSeen > 60000) {
      // Device hasn't been seen in 60 seconds, remove it
      it = detectedDevices.erase(it);
    } else {
      ++it;
    }
  }
  
  // Upload data to server
  uploadDetectionData();
  
  // Wait before next scan
  delay(5000);
}

void uploadDetectionData() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected, skipping upload");
    return;
  }
  
  if (detectedDevices.empty()) {
    return;  // No data to upload
  }
  
  HTTPClient http;
  http.begin(serverURL);
  http.addHeader("Content-Type", "application/json");
  
  // Create JSON payload
  DynamicJsonDocument doc(4096);
  doc["sensorId"] = sensorId;
  doc["locationName"] = locationName;
  doc["timestamp"] = millis();
  doc["wifiRSSI"] = WiFi.RSSI();
  
  JsonArray detections = doc.createNestedArray("detections");
  
  unsigned long currentTime = millis();
  for (auto& pair : detectedDevices) {
    PhoneDetection& detection = pair.second;
    
    // Only upload devices that are currently present
    if (currentTime - detection.lastSeen < 10000) {  // Seen in last 10 seconds
      JsonObject device = detections.createNestedObject();
      device["macAddress"] = detection.macAddress;
      device["deviceName"] = detection.deviceName;
      device["rssi"] = detection.rssi;
      device["distance"] = rssiToDistance(detection.rssi);
      device["firstSeen"] = detection.firstSeen;
      device["lastSeen"] = detection.lastSeen;
      device["duration"] = detection.lastSeen - detection.firstSeen;
      device["detectionCount"] = detection.detectionCount;
    }
  }
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  Serial.println("Uploading data to server...");
  Serial.println(jsonPayload);
  
  int httpResponseCode = http.POST(jsonPayload);
  
  if (httpResponseCode > 0) {
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    String response = http.getString();
    Serial.println(response);
  } else {
    Serial.print("Error code: ");
    Serial.println(httpResponseCode);
  }
  
  http.end();
}

