// DOM Elements
const userNameElement = document.getElementById('userName');
const roomNumberElement = document.getElementById('roomNumber');
const floorElement = document.getElementById('floor');
const blockElement = document.getElementById('block');
const roomTypeElement = document.getElementById('roomType');
const occupancyElement = document.getElementById('occupancy');
const rentElement = document.getElementById('rent');
const roommatesListElement = document.getElementById('roommatesList');
const amenitiesListElement = document.getElementById('amenitiesList');
const rulesListElement = document.getElementById('rulesList');
const maintenanceHistoryElement = document.getElementById('maintenanceHistory');
const logoutBtn = document.getElementById('logoutBtn');

// API Endpoints
const API_BASE_URL = 'http://localhost:3000/api';

// State Management
let currentUser = null;
let roomData = null;

// Initialize Page
async function initializePage() {
    try {
        // Check authentication
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        // Fetch user data
        await fetchUserData();
        
        // Fetch room data
        await fetchRoomData();
        
        // Update UI
        updateUI();
    } catch (error) {
        console.error('Error initializing page:', error);
        showError('Failed to load room information');
    }
}

// Authentication Functions
async function fetchUserData() {
    try {
        const response = await fetch(`${API_BASE_URL}/users/profile`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch user data');
        
        currentUser = await response.json();
        userNameElement.textContent = `Welcome, ${currentUser.name}`;
    } catch (error) {
        console.error('Error fetching user data:', error);
        throw error;
    }
}

// Data Fetching Functions
async function fetchRoomData() {
    try {
        const response = await fetch(`${API_BASE_URL}/rooms/student/${currentUser.id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch room data');
        
        roomData = await response.json();
    } catch (error) {
        console.error('Error fetching room data:', error);
        throw error;
    }
}

// UI Update Functions
function updateUI() {
    if (!roomData) return;

    // Update room details
    roomNumberElement.textContent = roomData.roomNumber;
    floorElement.textContent = roomData.floor;
    blockElement.textContent = roomData.block;
    roomTypeElement.textContent = roomData.type;
    occupancyElement.textContent = `${roomData.currentOccupants}/${roomData.capacity}`;
    rentElement.textContent = `$${roomData.monthlyRent}`;

    // Update roommates
    updateRoommatesUI();

    // Update amenities
    updateAmenitiesUI();

    // Update rules
    updateRulesUI();

    // Update maintenance history
    updateMaintenanceHistoryUI();
}

function updateRoommatesUI() {
    if (!roomData.roommates || roomData.roommates.length === 0) {
        roommatesListElement.innerHTML = '<p>No roommates assigned</p>';
        return;
    }

    roommatesListElement.innerHTML = roomData.roommates.map(roommate => `
        <div class="roommate-card">
            <div class="roommate-avatar">
                ${roommate.name.charAt(0).toUpperCase()}
            </div>
            <div class="roommate-info">
                <h4>${roommate.name}</h4>
                <p>${roommate.studentId}</p>
            </div>
        </div>
    `).join('');
}

function updateAmenitiesUI() {
    if (!roomData.amenities || roomData.amenities.length === 0) {
        amenitiesListElement.innerHTML = '<p>No amenities listed</p>';
        return;
    }

    amenitiesListElement.innerHTML = roomData.amenities.map(amenity => `
        <div class="amenity-item">
            <div class="amenity-icon">
                ${getAmenityIcon(amenity.type)}
            </div>
            <span>${amenity.name}</span>
        </div>
    `).join('');
}

function updateRulesUI() {
    if (!roomData.rules || roomData.rules.length === 0) {
        rulesListElement.innerHTML = '<li>No rules listed</li>';
        return;
    }

    rulesListElement.innerHTML = roomData.rules.map(rule => `
        <li>${rule}</li>
    `).join('');
}

function updateMaintenanceHistoryUI() {
    if (!roomData.maintenanceHistory || roomData.maintenanceHistory.length === 0) {
        maintenanceHistoryElement.innerHTML = '<p>No maintenance history available</p>';
        return;
    }

    maintenanceHistoryElement.innerHTML = roomData.maintenanceHistory.map(item => `
        <div class="maintenance-item">
            <h4>${item.title}</h4>
            <p>${item.description}</p>
            <div class="maintenance-date">${new Date(item.date).toLocaleDateString()}</div>
        </div>
    `).join('');
}

// Utility Functions
function getAmenityIcon(type) {
    const icons = {
        'bed': '🛏️',
        'desk': '🪑',
        'closet': '👕',
        'bathroom': '🚿',
        'wifi': '📶',
        'ac': '❄️',
        'heating': '🔥',
        'default': '✨'
    };
    return icons[type] || icons.default;
}

function showError(message) {
    // Implementation for showing error messages
    console.error(message);
    // You can add a toast notification or alert here
}

// Event Handlers
async function handleLogout() {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
}

// Event Listeners
document.addEventListener('DOMContentLoaded', initializePage);
logoutBtn.addEventListener('click', handleLogout); 