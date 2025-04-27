// API Configuration
if (typeof API_URL === 'undefined') {
    const API_URL = 'http://localhost:5000/api';
}

// DOM Elements
const roomsGrid = document.getElementById('roomsGrid');
const roomSearch = document.getElementById('roomSearch');
const searchBtn = document.getElementById('searchBtn');
const roomTypeFilter = document.getElementById('roomTypeFilter');
const priceFilter = document.getElementById('priceFilter');
const roomDetailsModal = document.getElementById('roomDetailsModal');
const roomDetailsContent = document.getElementById('roomDetailsContent');

let allRooms = [];

// Load all rooms
async function loadRooms() {
    try {
        const response = await fetch(`${API_URL}/rooms`, {
            credentials: 'include'
        });
        const rooms = await response.json();
        allRooms = rooms;
        displayRooms(allRooms);
    } catch (error) {
        console.error('Error loading rooms:', error);
        roomsGrid.innerHTML = '<p class="error-message">Error loading rooms. Please try again later.</p>';
    }
}

// Display rooms in grid
function displayRooms(rooms) {
    if (!rooms.length) {
        roomsGrid.innerHTML = '<p class="no-rooms">No rooms available at the moment.</p>';
        return;
    }
    const roomsHTML = rooms.map(room => `
        <div class="room-card" data-room-id="${room.id}">
            <img src="${room.image_url || 'images/default-room.jpg'}" alt="${room.room_number}" class="room-image">
            <div class="room-content">
                <h3 class="room-title">${room.room_number}</h3>
                <p class="room-description">${room.description || ''}</p>
                <div class="room-details">
                    <p><strong>Occupancy:</strong> ${room.occupancy_limit || '-'} person(s)</p>
                    <p><strong>Room Type:</strong> ${room.room_type || '-'}</p>
                </div>
                <div class="room-price">
                    $${room.price_per_semester || '-'} per semester
                </div>
                <div class="room-actions">
                    <button class="btn-book" onclick="window.location.href='application.html?roomId=${room.id}'">Apply</button>
                    <a href="#" class="btn-details" onclick="showRoomDetails('${room.id}')">More Details</a>
                </div>
            </div>
        </div>
    `).join('');
    roomsGrid.innerHTML = roomsHTML;
}

// Search and filter rooms
function searchRooms() {
    const searchTerm = roomSearch.value.toLowerCase();
    const roomType = roomTypeFilter.value;
    const priceSort = priceFilter.value;

    let filtered = allRooms.filter(room => {
        const matchesSearch = room.room_number.toLowerCase().includes(searchTerm);
        const matchesRoomType = roomType === 'all' || (room.room_type && room.room_type.toLowerCase() === roomType);
        return matchesSearch && matchesRoomType;
    });

    // Sort by price if needed
    if (priceSort !== 'all') {
        filtered = filtered.sort((a, b) => {
            const priceA = parseFloat(a.price_per_semester || 0);
            const priceB = parseFloat(b.price_per_semester || 0);
            return priceSort === 'low' ? priceA - priceB : priceB - priceA;
        });
    }
    displayRooms(filtered);
}

// Show room details
async function showRoomDetails(roomId) {
    try {
        const response = await fetch(`${API_URL}/rooms/${roomId}`, {
            credentials: 'include'
        });
        const room = await response.json();
        roomDetailsContent.innerHTML = `
            <div class="room-details-full">
                <img src="${room.image_url || 'images/default-room.jpg'}" alt="${room.room_number}" class="room-image-large">
                <h2>${room.room_number}</h2>
                <p class="room-description-full">${room.description || ''}</p>
                <div class="room-price-full">
                    <h3>Pricing</h3>
                    <p>$${room.price_per_semester || '-'} per semester</p>
                </div>
                <button class="btn-book" onclick="bookRoom('${room.id}')">Book Now</button>
            </div>
        `;
        roomDetailsModal.style.display = 'block';
    } catch (error) {
        console.error('Error loading room details:', error);
        alert('Error loading room details. Please try again later.');
    }
}

// Book room
async function bookRoom(roomId) {
    try {
        const response = await fetch(`${API_URL}/applications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                room_id: roomId,
                academic_year: new Date().getFullYear(),
                semester: 'fall' // You might want to make this dynamic
            })
        });
        if (response.ok) {
            alert('Room booking request submitted successfully!');
        } else {
            const error = await response.json();
            alert(error.message || 'Error booking room. Please try again later.');
        }
    } catch (error) {
        console.error('Error booking room:', error);
        alert('Error booking room. Please try again later.');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadRooms();
    searchBtn.addEventListener('click', searchRooms);
    roomSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchRooms();
    });
    roomTypeFilter.addEventListener('change', searchRooms);
    priceFilter.addEventListener('change', searchRooms);
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === roomDetailsModal) {
            roomDetailsModal.style.display = 'none';
        }
    });
    // Close modal when clicking close button
    document.querySelector('.close-btn').addEventListener('click', () => {
        roomDetailsModal.style.display = 'none';
    });
}); 