const API_URL = 'http://localhost:5000/api';

// Check if user is admin
async function checkAdminAccess() {
    try {
        const res = await fetch(`${API_URL}/auth/me`, { credentials: 'include' });
        if (!res.ok) {
            window.location.href = 'login.html';
            return;
        }
        const user = await res.json();
        if (user.role !== 'admin') {
            alert('Access denied. Admin privileges required.');
            window.location.href = 'login.html';
            return;
        }
        // Set admin name in header
        document.getElementById('adminName').textContent = user.name || 'Admin';
    } catch (err) {
        console.error('Error checking admin access:', err);
        window.location.href = 'login.html';
    }
}

// Sidebar navigation logic
function showSection(sectionId) {
    document.querySelectorAll('.admin-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    document.querySelectorAll('.sidebar-nav li').forEach(li => li.classList.remove('active'));
    if (sectionId === 'overviewSection') document.getElementById('navDashboard').parentElement.classList.add('active');
    if (sectionId === 'applicationsSection') document.getElementById('navApplications').parentElement.classList.add('active');
    if (sectionId === 'roomsSection') document.getElementById('navRooms').parentElement.classList.add('active');
}

document.getElementById('navDashboard').addEventListener('click', e => { 
    e.preventDefault(); 
    window.location.href = 'admin-dashboard.html';
});

document.getElementById('navApplications').addEventListener('click', e => { 
    e.preventDefault(); 
    window.location.href = 'admin-applications.html';
});

document.getElementById('navRooms').addEventListener('click', e => { 
    e.preventDefault(); 
    window.location.href = 'admin-rooms.html';
});

// Fetch and display all applications
async function fetchApplications() {
    const res = await fetch(`${API_URL}/applications`, { credentials: 'include' });
    if (!res.ok) return [];
    return await res.json();
}

async function fetchRooms() {
    const res = await fetch(`${API_URL}/rooms`, { credentials: 'include' });
    if (!res.ok) return [];
    return await res.json();
}

async function updateApplicationStatus(appId, status, roomId = null) {
    const res = await fetch(`${API_URL}/applications/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, room_id: roomId })
    });
    return res.ok;
}

function renderApplications(applications, rooms) {
    const list = document.getElementById('adminApplicationsList');
    if (!applications.length) {
        list.innerHTML = '<div class="no-results">No applications found.</div>';
        return;
    }
    list.innerHTML = applications.map(app => {
        const roomOptions = rooms.map(room => `<option value="${room.id}" ${app.room_id === room.id ? 'selected' : ''}>${room.room_number}</option>`).join('');
        return `
        <div class="application-card">
            <div class="application-header">
                <span class="application-id">Application #${app.id}</span>
                <span class="application-status status-${app.status.toLowerCase()}">${app.status}</span>
            </div>
            <div class="application-details">
                <div class="application-field"><span class="application-label">Student:</span> <span class="application-value">${app.user_name || '-'}</span></div>
                <div class="application-field"><span class="application-label">Email:</span> <span class="application-value">${app.user_email || '-'}</span></div>
                <div class="application-field"><span class="application-label">Room:</span> <span class="application-value">${app.room_number || '-'}</span></div>
                <div class="application-field"><span class="application-label">Room Type:</span> <span class="application-value">${app.room_type || '-'}</span></div>
                <div class="application-field"><span class="application-label">Status:</span> <span class="application-value">${app.status}</span></div>
                <div class="application-field"><span class="application-label">Special Needs:</span> <span class="application-value">${app.special_needs || '-'}</span></div>
                <div class="application-field"><span class="application-label">Notes:</span> <span class="application-value">${app.additional_notes || '-'}</span></div>
                <div class="application-field"><span class="application-label">Submitted:</span> <span class="application-value">${new Date(app.created_at).toLocaleString() || '-'}</span></div>
                <div class="application-actions">
                    <button class="btn btn-success" onclick="acceptApplication('${app.id}')">Accept</button>
                    <button class="btn btn-danger" onclick="rejectApplication('${app.id}')">Reject</button>
                    <select class="assign-room-select" data-app-id="${app.id}">
                        <option value="">Assign Room</option>
                        ${roomOptions}
                    </select>
                </div>
            </div>
        </div>
        `;
    }).join('');
    // Add event listeners for assign room selects
    document.querySelectorAll('.assign-room-select').forEach(sel => {
        sel.addEventListener('change', async function() {
            const appId = this.getAttribute('data-app-id');
            const roomId = this.value;
            if (roomId) {
                await updateApplicationStatus(appId, 'Approved', roomId);
                loadApplicationsAndRooms();
            }
        });
    });
}

// Room modal logic
let editingRoomId = null;
const roomModal = document.getElementById('roomModal');
const roomForm = document.getElementById('roomForm');
const newRoomBtn = document.getElementById('newRoomBtn');
const closeRoomModal = document.getElementById('closeRoomModal');
const cancelRoomModal = document.getElementById('cancelRoomModal');
const roomModalTitle = document.getElementById('roomModalTitle');

function openRoomModal(room = null) {
    editingRoomId = room ? room.id : null;
    roomModalTitle.textContent = room ? 'Edit Room' : 'New Room';
    roomForm.reset();
    roomForm.room_number.value = room ? room.room_number : '';
    roomForm.room_type.value = room ? room.room_type : 'single';
    roomForm.occupancy_limit.value = room ? room.occupancy_limit : '';
    roomForm.price_per_semester.value = room ? room.price_per_semester : '';
    roomForm.description.value = room ? room.description : '';
    roomForm.image.value = room ? room.image_url : '';
    updateImagePreview();
    roomModal.style.display = 'block';
}
function closeRoomModalFunc() {
    roomModal.style.display = 'none';
    editingRoomId = null;
}
newRoomBtn.addEventListener('click', () => openRoomModal());
closeRoomModal.addEventListener('click', closeRoomModalFunc);
cancelRoomModal.addEventListener('click', closeRoomModalFunc);
window.addEventListener('click', (e) => { if (e.target === roomModal) closeRoomModalFunc(); });

const roomFormError = document.createElement('div');
roomFormError.className = 'form-error';
roomForm.insertBefore(roomFormError, roomForm.firstChild);
roomFormError.style.display = 'none';

function showRoomFormError(msg) {
    roomFormError.textContent = msg;
    roomFormError.style.display = 'block';
}
function clearRoomFormError() {
    roomFormError.textContent = '';
    roomFormError.style.display = 'none';
}

// Add image preview functionality
function updateImagePreview() {
    const selectedImage = roomForm.image.value;
    const previewContainer = document.getElementById('imagePreview');
    if (selectedImage) {
        previewContainer.innerHTML = `<img src="${selectedImage}" alt="Room Preview" style="max-width: 200px; margin-top: 10px;">`;
    } else {
        previewContainer.innerHTML = '';
    }
}

// Add event listener for image selection change
document.getElementById('roomImageSelect').addEventListener('change', updateImagePreview);

// Update the form validation
roomForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    clearRoomFormError();
    
    // Validation
    if (!roomForm.room_number.value.trim()) {
        showRoomFormError('Room number is required.');
        return;
    }
    if (!roomForm.room_type.value) {
        showRoomFormError('Room type is required.');
        return;
    }
    if (!roomForm.occupancy_limit.value || isNaN(roomForm.occupancy_limit.value) || Number(roomForm.occupancy_limit.value) < 1) {
        showRoomFormError('Occupancy limit must be at least 1.');
        return;
    }
    if (!roomForm.price_per_semester.value || isNaN(roomForm.price_per_semester.value) || Number(roomForm.price_per_semester.value) < 0) {
        showRoomFormError('Price per semester must be a non-negative number.');
        return;
    }
    if (!roomForm.image.value) {
        showRoomFormError('Please select an image for the room.');
        return;
    }

    const data = {
        room_number: roomForm.room_number.value,
        room_type: roomForm.room_type.value,
        occupancy_limit: roomForm.occupancy_limit.value,
        price_per_semester: roomForm.price_per_semester.value,
        description: roomForm.description.value,
        image_url: roomForm.image.value
    };
    let url = `${API_URL}/rooms`;
    let method = 'POST';
    if (editingRoomId) {
        url += `/${editingRoomId}`;
        method = 'PUT';
    }
    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
    });
    if (res.ok) {
        closeRoomModalFunc();
        loadApplicationsAndRooms();
    } else {
        const err = await res.json().catch(() => ({}));
        showRoomFormError(err.message || 'Failed to save room.');
    }
});

async function deleteRoom(roomId) {
    if (!confirm('Are you sure you want to delete this room?')) return;
    const res = await fetch(`${API_URL}/rooms/${roomId}`, {
        method: 'DELETE',
        credentials: 'include'
    });
    if (res.ok) {
        loadApplicationsAndRooms();
    } else {
        alert('Failed to delete room.');
    }
}

// Update renderRooms to display image if available
function renderRooms(rooms, applications) {
    const list = document.getElementById('adminRoomsList');
    if (!rooms.length) {
        list.innerHTML = '<div class="no-results">No rooms found.</div>';
        return;
    }
    list.innerHTML = rooms.map(room => {
        const assigned = applications.filter(app => app.room_id === room.id && app.status === 'Approved');
        return `
        <div class="room-card">
            ${room.image_url ? `<img src="${room.image_url}" alt="Room Image" class="room-image">` : ''}
            <h3>Room ${room.room_number}</h3>
            <p>Type: ${room.room_type || '-'}</p>
            <p>Occupancy: ${room.occupancy_limit || '-'}</p>
            <p>Price: $${room.price_per_semester || '-'}</p>
            <p>Assigned Students: ${assigned.length}</p>
            <ul>
                ${assigned.map(a => `<li>${a.user_name} (${a.user_email})</li>`).join('')}
            </ul>
            <div class="room-actions">
                <button class="btn btn-secondary" onclick="editRoom(${room.id})">Edit</button>
                <button class="btn btn-danger" onclick="deleteRoom(${room.id})">Delete</button>
            </div>
        </div>
        `;
    }).join('');
}

// Expose editRoom globally for inline onclick
window.editRoom = async function(roomId) {
    const rooms = await fetchRooms();
    const room = rooms.find(r => r.id === roomId);
    openRoomModal(room);
};

async function acceptApplication(appId) {
    await updateApplicationStatus(appId, 'Approved');
    loadApplicationsAndRooms();
}
async function rejectApplication(appId) {
    await updateApplicationStatus(appId, 'Rejected');
    loadApplicationsAndRooms();
}

async function loadApplicationsAndRooms() {
    const [applications, rooms] = await Promise.all([fetchApplications(), fetchRooms()]);
    renderApplications(applications, rooms);
    renderRooms(rooms, applications);
}

document.addEventListener('DOMContentLoaded', async () => {
    await checkAdminAccess();
    loadApplicationsAndRooms();
}); 