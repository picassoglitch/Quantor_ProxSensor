const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize database
const dbPath = path.join(__dirname, 'sensor_data.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  db.serialize(() => {
    // Sensors table
    db.run(`CREATE TABLE IF NOT EXISTS sensors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sensor_id TEXT UNIQUE NOT NULL,
      location_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Detections table
    db.run(`CREATE TABLE IF NOT EXISTS detections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sensor_id TEXT NOT NULL,
      location_name TEXT NOT NULL,
      mac_address TEXT NOT NULL,
      device_name TEXT,
      rssi INTEGER,
      distance REAL,
      first_seen INTEGER,
      last_seen INTEGER,
      duration INTEGER,
      detection_count INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sensor_id) REFERENCES sensors(sensor_id)
    )`);

    // Sessions table (tracks continuous presence)
    db.run(`CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sensor_id TEXT NOT NULL,
      location_name TEXT NOT NULL,
      mac_address TEXT NOT NULL,
      device_name TEXT,
      session_start DATETIME NOT NULL,
      session_end DATETIME,
      total_duration INTEGER,
      avg_distance REAL,
      min_distance REAL,
      max_distance REAL,
      FOREIGN KEY (sensor_id) REFERENCES sensors(sensor_id)
    )`);

    // Users table for authentication
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'client',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    console.log('Database tables initialized');
  });
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Receive detection data from ESP32 sensors
app.post('/api/detections', (req, res) => {
  const { sensorId, locationName, timestamp, detections } = req.body;

  if (!sensorId || !locationName || !detections) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Update or insert sensor
  db.run(
    `INSERT OR REPLACE INTO sensors (sensor_id, location_name, last_seen)
     VALUES (?, ?, datetime('now'))`,
    [sensorId, locationName],
    (err) => {
      if (err) {
        console.error('Error updating sensor:', err);
      }
    }
  );

  // Process each detection
  const stmt = db.prepare(`INSERT INTO detections 
    (sensor_id, location_name, mac_address, device_name, rssi, distance, 
     first_seen, last_seen, duration, detection_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  detections.forEach((detection) => {
    stmt.run(
      sensorId,
      locationName,
      detection.macAddress,
      detection.deviceName || 'Unknown',
      detection.rssi,
      detection.distance,
      detection.firstSeen,
      detection.lastSeen,
      detection.duration,
      detection.detectionCount
    );

    // Update or create session
    updateSession(sensorId, locationName, detection);
  });

  stmt.finalize();

  res.json({ 
    success: true, 
    message: `Processed ${detections.length} detections`,
    timestamp: new Date().toISOString()
  });
});

// Update session tracking
function updateSession(sensorId, locationName, detection) {
  const macAddress = detection.macAddress;
  const sessionTimeout = 60000; // 60 seconds

  // Check if there's an active session
  db.get(
    `SELECT * FROM sessions 
     WHERE sensor_id = ? AND mac_address = ? AND session_end IS NULL
     ORDER BY session_start DESC LIMIT 1`,
    [sensorId, macAddress],
    (err, row) => {
      if (err) {
        console.error('Error checking session:', err);
        return;
      }

      if (row) {
        // Update existing session
        const timeSinceLastUpdate = Date.now() - new Date(row.session_start).getTime();
        
        if (timeSinceLastUpdate < sessionTimeout) {
          // Still in same session, update stats
          db.run(
            `UPDATE sessions 
             SET total_duration = ?,
                 avg_distance = (avg_distance * ? + ?) / (? + 1),
                 min_distance = MIN(min_distance, ?),
                 max_distance = MAX(max_distance, ?)
             WHERE id = ?`,
            [
              Date.now() - new Date(row.session_start).getTime(),
              row.total_duration || 0,
              detection.distance,
              row.total_duration || 0,
              detection.distance,
              detection.distance,
              row.id
            ]
          );
        } else {
          // Session timeout, close it
          db.run(
            `UPDATE sessions SET session_end = datetime('now'), total_duration = ?
             WHERE id = ?`,
            [timeSinceLastUpdate, row.id]
          );
        }
      } else {
        // Create new session
        db.run(
          `INSERT INTO sessions 
           (sensor_id, location_name, mac_address, device_name, session_start, 
            avg_distance, min_distance, max_distance)
           VALUES (?, ?, ?, ?, datetime('now'), ?, ?, ?)`,
          [
            sensorId,
            locationName,
            macAddress,
            detection.deviceName || 'Unknown',
            detection.distance,
            detection.distance,
            detection.distance
          ]
        );
      }
    }
  );
}

// Get all sensors
app.get('/api/sensors', (req, res) => {
  db.all(`SELECT * FROM sensors ORDER BY last_seen DESC`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get detections with filters
app.get('/api/detections', (req, res) => {
  const { sensorId, locationName, macAddress, startDate, endDate, limit } = req.query;
  
  let query = `SELECT * FROM detections WHERE 1=1`;
  const params = [];

  if (sensorId) {
    query += ` AND sensor_id = ?`;
    params.push(sensorId);
  }
  if (locationName) {
    query += ` AND location_name = ?`;
    params.push(locationName);
  }
  if (macAddress) {
    query += ` AND mac_address = ?`;
    params.push(macAddress);
  }
  if (startDate) {
    query += ` AND timestamp >= ?`;
    params.push(startDate);
  }
  if (endDate) {
    query += ` AND timestamp <= ?`;
    params.push(endDate);
  }

  query += ` ORDER BY timestamp DESC`;
  
  if (limit) {
    query += ` LIMIT ?`;
    params.push(parseInt(limit));
  } else {
    query += ` LIMIT 1000`;
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get sessions
app.get('/api/sessions', (req, res) => {
  const { sensorId, locationName, macAddress, startDate, endDate } = req.query;
  
  let query = `SELECT * FROM sessions WHERE 1=1`;
  const params = [];

  if (sensorId) {
    query += ` AND sensor_id = ?`;
    params.push(sensorId);
  }
  if (locationName) {
    query += ` AND location_name = ?`;
    params.push(locationName);
  }
  if (macAddress) {
    query += ` AND mac_address = ?`;
    params.push(macAddress);
  }
  if (startDate) {
    query += ` AND session_start >= ?`;
    params.push(startDate);
  }
  if (endDate) {
    query += ` AND session_end <= ?`;
    params.push(endDate);
  }

  query += ` ORDER BY session_start DESC LIMIT 1000`;

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get statistics
app.get('/api/stats', (req, res) => {
  const { sensorId, locationName, startDate, endDate } = req.query;
  
  let whereClause = `WHERE 1=1`;
  const params = [];

  if (sensorId) {
    whereClause += ` AND sensor_id = ?`;
    params.push(sensorId);
  }
  if (locationName) {
    whereClause += ` AND location_name = ?`;
    params.push(locationName);
  }
  if (startDate) {
    whereClause += ` AND timestamp >= ?`;
    params.push(startDate);
  }
  if (endDate) {
    whereClause += ` AND timestamp <= ?`;
    params.push(endDate);
  }

  const statsQuery = `
    SELECT 
      COUNT(DISTINCT mac_address) as unique_devices,
      COUNT(*) as total_detections,
      AVG(distance) as avg_distance,
      MIN(distance) as min_distance,
      MAX(distance) as max_distance,
      AVG(duration) as avg_duration
    FROM detections
    ${whereClause}
  `;

  db.get(statsQuery, params, (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(row);
  });
});

// Serve static files (dashboard)
app.use(express.static(path.join(__dirname, '../frontend')));

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
  console.log(`Dashboard available at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed');
    process.exit(0);
  });
});

