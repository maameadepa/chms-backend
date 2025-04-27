if (typeof API_URL === 'undefined') {
    const API_URL = 'http://localhost:5000/api';
}

// Check admin access
async function checkAdminAccess() {
    try {
        const res = await fetch(`${API_URL}/auth/me`, { credentials: 'include' });
        if (!res.ok) {
            window.location.href = 'index.html';
            return;
        }
        const user = await res.json();
        if (user.role !== 'admin') {
            alert('Access denied. Admin privileges required.');
            window.location.href = 'index.html';
            return;
        }
        document.getElementById('adminName').textContent = user.name || 'Admin';
    } catch (err) {
        console.error('Error checking admin access:', err);
        window.location.href = 'index.html';
    }
}

// Fetch all rooms
async function fetchRooms() {
    try {
        const res = await fetch(`${API_URL}/rooms`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch rooms');
        console.log(res)
        return await res.json();
    } catch (err) {
        console.error('Error fetching rooms:', err);
        return [];
    }
}

// Create or update room
async function saveRoom(roomData, roomId = null) {
    try {
        const url = roomId ? `${API_URL}/rooms/${roomId}` : `${API_URL}/rooms`;
        const method = roomId ? 'PUT' : 'POST';
        
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(roomData)
        });
        
        if (!res.ok) throw new Error('Failed to save room');
        return true;
    } catch (err) {
        console.error('Error saving room:', err);
        return false;
    }
}

// Delete room
async function deleteRoom(roomId) {
    if (!confirm('Are you sure you want to delete this room?')) return;
    
    try {
        const res = await fetch(`${API_URL}/rooms/${roomId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (!res.ok) throw new Error('Failed to delete room');
        return true;
    } catch (err) {
        console.error('Error deleting room:', err);
        return false;
    }
}

// Render rooms grid
function renderRooms(rooms) {
    const grid = document.getElementById('roomsGrid');
    if (!rooms.length) {
        grid.innerHTML = '<div class="no-data">No rooms found</div>';
        return;
    }

    grid.innerHTML = rooms.map(room => `
        <div class="room-card">
            ${room.image_url ? `<img src="${room.image_url}" alt="Room ${room.room_number}" class="room-image">` : ''}
            <div class="room-info">
                <h3>Room ${room.room_number}</h3>
                <p>Type: ${room.room_type}</p>
                <p>Occupancy: ${room.occupancy_limit}</p>
                <p>Price: $${room.price_per_semester}/semester</p>
                <p>Description: ${room.description || 'No description'}</p>
            </div>
            <div class="room-actions">
                <button class="btn btn-sm btn-info" onclick="editRoom(${room.id})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteRoom(${room.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

// Open room modal
function openRoomModal(room = null) {
    const modal = document.getElementById('roomModal');
    const form = document.getElementById('roomForm');
    const title = document.getElementById('modalTitle');
    
    title.textContent = room ? 'Edit Room' : 'New Room';
    form.reset();
    
    if (room) {
        form.room_number.value = room.room_number;
        form.room_type.value = room.room_type;
        form.occupancy_limit.value = room.occupancy_limit;
        form.price_per_semester.value = room.price_per_semester;
        form.description.value = room.description || '';
        form.image_url.value = room.image_url || '';
        form.dataset.roomId = room.id;
    } else {
        delete form.dataset.roomId;
    }
    
    updateImagePreview();
    modal.style.display = 'block';
}

// Update image preview
function updateImagePreview() {
    const imageUrl = document.getElementById('roomImage').value;
    const preview = document.getElementById('imagePreview');
    
    if (imageUrl) {
        preview.innerHTML = `<img src="${imageUrl}" alt="Room Preview" style="max-width: 200px; margin-top: 10px;">`;
    } else {
        preview.innerHTML = '';
    }
}

// Filter rooms
function filterRooms(rooms, type, search) {
    return rooms.filter(room => {
        const matchesType = type === 'all' || room.room_type === type;
        const matchesSearch = !search || 
            room.room_number.toLowerCase().includes(search.toLowerCase()) ||
            room.description?.toLowerCase().includes(search.toLowerCase());
        return matchesType && matchesSearch;
    });
}

// Load and display rooms
async function loadRooms() {
    const rooms = await fetchRooms();
    const typeFilter = document.getElementById('typeFilter').value;
    const searchInput = document.getElementById('searchInput').value;
    const filteredRooms = filterRooms(rooms, typeFilter, searchInput);
    renderRooms(filteredRooms);
}

// Event listeners
// document.getElementById('newRoomBtn').addEventListener('click', () => openRoomModal());
document.getElementById('roomForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const roomId = form.dataset.roomId;
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;
    
    try {
        const roomData = {
            room_number: form.room_number.value,
            room_type: form.room_type.value,
            occupancy_limit: form.occupancy_limit.value,
            price_per_semester: form.price_per_semester.value,
            description: form.description.value,
            image_url: form.image_url.value
        };
        
        const success = await saveRoom(roomData, roomId);
        if (success) {
            document.getElementById('roomModal').style.display = 'none';
            loadRooms();
            alert('Room saved successfully!');
        } else {
            alert('Failed to save room. Please try again.');
        }
    } catch (error) {
        console.error('Error saving room:', error);
        alert('An error occurred while saving the room. Please try again.');
    } finally {
        // Reset button state
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
    }
});

document.getElementById('roomImage').addEventListener('change', updateImagePreview);
document.getElementById('typeFilter').addEventListener('change', loadRooms);
document.getElementById('searchInput').addEventListener('input', loadRooms);
document.querySelector('.close-btn').addEventListener('click', () => {
    document.getElementById('roomModal').style.display = 'none';
});
document.getElementById('cancelBtn').addEventListener('click', () => {
    document.getElementById('roomModal').style.display = 'none';
});

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        const res = await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        if (res.ok) {
            window.location.href = 'index.html';
        } else {
            alert('Logout failed. Please try again.');
        }
    } catch (err) {
        console.error('Logout error:', err);
        alert('Logout failed. Please try again.');
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await checkAdminAccess();
    loadRooms();
}); 