const API_BASE_URL = window.location.origin + '/api';

let timelineChart = null;
let distanceChart = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
    setInterval(loadData, 5000); // Refresh every 5 seconds
});

async function initializeDashboard() {
    await loadSensors();
    await loadData();
    setupCharts();
    setupEventListeners();
}

function setupEventListeners() {
    document.getElementById('refreshBtn').addEventListener('click', loadData);
    document.getElementById('sensorFilter').addEventListener('change', loadData);
    document.getElementById('locationFilter').addEventListener('change', loadData);
}

async function loadSensors() {
    try {
        const response = await fetch(`${API_BASE_URL}/sensors`);
        const sensors = await response.json();
        
        const sensorSelect = document.getElementById('sensorFilter');
        const locationSelect = document.getElementById('locationFilter');
        
        // Clear existing options (except "All")
        sensorSelect.innerHTML = '<option value="">All Sensors</option>';
        locationSelect.innerHTML = '<option value="">All Locations</option>';
        
        const locations = new Set();
        
        sensors.forEach(sensor => {
            // Add sensor option
            const option = document.createElement('option');
            option.value = sensor.sensor_id;
            option.textContent = `${sensor.sensor_id} - ${sensor.location_name}`;
            sensorSelect.appendChild(option);
            
            // Collect unique locations
            locations.add(sensor.location_name);
        });
        
        // Add location options
        locations.forEach(location => {
            const option = document.createElement('option');
            option.value = location;
            option.textContent = location;
            locationSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading sensors:', error);
    }
}

async function loadData() {
    try {
        const sensorId = document.getElementById('sensorFilter').value;
        const locationName = document.getElementById('locationFilter').value;
        
        const params = new URLSearchParams();
        if (sensorId) params.append('sensorId', sensorId);
        if (locationName) params.append('locationName', locationName);
        params.append('limit', '100');
        
        // Load detections
        const detectionsResponse = await fetch(`${API_BASE_URL}/detections?${params}`);
        const detections = await detectionsResponse.json();
        
        // Load sessions
        const sessionsResponse = await fetch(`${API_BASE_URL}/sessions?${params}`);
        const sessions = await sessionsResponse.json();
        
        // Load stats
        const statsResponse = await fetch(`${API_BASE_URL}/stats?${params}`);
        const stats = await statsResponse.json();
        
        updateStats(stats);
        updateDetectionsTable(detections);
        updateSessionsTable(sessions);
        updateCharts(detections);
        
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

function updateStats(stats) {
    document.getElementById('activeDevices').textContent = stats.unique_devices || 0;
    document.getElementById('totalDetections').textContent = stats.total_detections || 0;
    document.getElementById('avgDistance').textContent = 
        stats.avg_distance ? `${stats.avg_distance.toFixed(2)} m` : '0 m';
    document.getElementById('avgDuration').textContent = 
        stats.avg_duration ? `${Math.round(stats.avg_duration / 1000)} s` : '0 s';
}

function updateDetectionsTable(detections) {
    const tbody = document.getElementById('detectionsTableBody');
    tbody.innerHTML = '';
    
    detections.slice(0, 50).forEach(detection => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${formatDateTime(detection.timestamp)}</td>
            <td>${detection.sensor_id}</td>
            <td>${detection.location_name}</td>
            <td>${detection.device_name || 'Unknown'}</td>
            <td class="mac-address">${detection.mac_address}</td>
            <td>${detection.distance ? detection.distance.toFixed(2) + ' m' : 'N/A'}</td>
            <td>${formatDuration(detection.duration)}</td>
            <td>${detection.rssi} dBm</td>
        `;
    });
}

function updateSessionsTable(sessions) {
    const tbody = document.getElementById('sessionsTableBody');
    tbody.innerHTML = '';
    
    // Filter to show active sessions first
    const activeSessions = sessions.filter(s => !s.session_end);
    const endedSessions = sessions.filter(s => s.session_end);
    const sortedSessions = [...activeSessions, ...endedSessions].slice(0, 50);
    
    sortedSessions.forEach(session => {
        const row = tbody.insertRow();
        const isActive = !session.session_end;
        const duration = session.total_duration || 
            (isActive ? Date.now() - new Date(session.session_start).getTime() : 0);
        
        row.innerHTML = `
            <td>${formatDateTime(session.session_start)}</td>
            <td>${session.sensor_id}</td>
            <td>${session.location_name}</td>
            <td>${session.device_name || 'Unknown'}</td>
            <td class="mac-address">${session.mac_address}</td>
            <td>${formatDuration(duration)}</td>
            <td>${session.avg_distance ? session.avg_distance.toFixed(2) + ' m' : 'N/A'}</td>
            <td>
                <span class="status-badge ${isActive ? 'status-active' : 'status-ended'}">
                    ${isActive ? 'Active' : 'Ended'}
                </span>
            </td>
        `;
    });
}

function setupCharts() {
    // Timeline Chart
    const timelineCtx = document.getElementById('timelineChart').getContext('2d');
    timelineChart = new Chart(timelineCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Detections per Hour',
                data: [],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
    // Distance Chart
    const distanceCtx = document.getElementById('distanceChart').getContext('2d');
    distanceChart = new Chart(distanceCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Number of Detections',
                data: [],
                backgroundColor: '#764ba2',
                borderColor: '#667eea',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function updateCharts(detections) {
    // Update timeline chart (group by hour)
    const hourlyData = {};
    detections.forEach(detection => {
        const date = new Date(detection.timestamp);
        const hour = `${date.getHours()}:00`;
        hourlyData[hour] = (hourlyData[hour] || 0) + 1;
    });
    
    const sortedHours = Object.keys(hourlyData).sort();
    timelineChart.data.labels = sortedHours;
    timelineChart.data.datasets[0].data = sortedHours.map(h => hourlyData[h]);
    timelineChart.update();
    
    // Update distance chart (group by distance ranges)
    const distanceRanges = {
        '0-1m': 0,
        '1-2m': 0,
        '2-5m': 0,
        '5-10m': 0,
        '10m+': 0
    };
    
    detections.forEach(detection => {
        if (detection.distance) {
            const dist = detection.distance;
            if (dist < 1) distanceRanges['0-1m']++;
            else if (dist < 2) distanceRanges['1-2m']++;
            else if (dist < 5) distanceRanges['2-5m']++;
            else if (dist < 10) distanceRanges['5-10m']++;
            else distanceRanges['10m+']++;
        }
    });
    
    distanceChart.data.labels = Object.keys(distanceRanges);
    distanceChart.data.datasets[0].data = Object.values(distanceRanges);
    distanceChart.update();
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
}

function formatDuration(milliseconds) {
    if (!milliseconds) return '0s';
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
}

