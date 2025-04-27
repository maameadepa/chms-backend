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

// Fetch all applications
async function fetchApplications() {
    try {
        const res = await fetch(`${API_URL}/applications`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch applications');
        return await res.json();
    } catch (err) {
        console.error('Error fetching applications:', err);
        return [];
    }
}

// Fetch all rooms
async function fetchRooms() {
    try {
        const res = await fetch(`${API_URL}/rooms`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch rooms');
        return await res.json();
    } catch (err) {
        console.error('Error fetching rooms:', err);
        return [];
    }
}

// Update application status
async function updateApplicationStatus(appId, status, roomId = null) {
    try {
        const res = await fetch(`${API_URL}/applications/${appId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ status, room_id: roomId })
        });
        if (!res.ok) throw new Error('Failed to update application');
        return true;
    } catch (err) {
        console.error('Error updating application:', err);
        return false;
    }
}

// Render applications table
function renderApplications(applications) {
    const tbody = document.getElementById('applicationsTableBody');
    if (!applications.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">No applications found</td></tr>';
        return;
    }

    tbody.innerHTML = applications.map(app => `
        <tr>
            <td>${app.id}</td>
            <td>${app.user_name || '-'}</td>
            <td>${app.user_email || '-'}</td>
            <td>${app.room_number || '-'}</td>
            <td><span class="status-badge status-${app.status.toLowerCase()}">${app.status}</span></td>
            <td>${new Date(app.created_at).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="viewApplication(${app.id})">View</button>
            </td>
        </tr>
    `).join('');
}

// View application details
async function viewApplication(appId) {
    const applications = await fetchApplications();
    const rooms = await fetchRooms();
    const application = applications.find(app => app.id === appId);
    
    if (!application) {
        alert('Application not found');
        return;
    }

    const modal = document.getElementById('applicationModal');
    const details = document.getElementById('applicationDetails');
    const roomSelect = document.getElementById('roomSelect');

    // Populate room select
    roomSelect.innerHTML = `
        <option value="">Select Room</option>
        ${rooms.map(room => `
            <option value="${room.id}" ${application.room_id === room.id ? 'selected' : ''}>
                ${room.room_number} (${room.room_type})
            </option>
        `).join('')}
    `;

    // Populate details
    details.innerHTML = `
        <div class="detail-group">
            <label>Student:</label>
            <p>${application.user_name || '-'}</p>
        </div>
        <div class="detail-group">
            <label>Email:</label>
            <p>${application.user_email || '-'}</p>
        </div>
        <div class="detail-group">
            <label>Current Room:</label>
            <p>${application.room_number || 'Not assigned'}</p>
        </div>
        <div class="detail-group">
            <label>Status:</label>
            <p class="status-badge status-${application.status.toLowerCase()}">${application.status}</p>
        </div>
        <div class="detail-group">
            <label>Applied Date:</label>
            <p>${new Date(application.created_at).toLocaleString()}</p>
        </div>
    `;

    // Show/hide buttons based on status
    const approveBtn = document.getElementById('approveBtn');
    const rejectBtn = document.getElementById('rejectBtn');
    approveBtn.style.display = application.status === 'pending' ? 'block' : 'none';
    rejectBtn.style.display = application.status === 'pending' ? 'block' : 'none';

    // Add event listeners
    approveBtn.onclick = async () => {
        const roomId = roomSelect.value;
        if (!roomId) {
            alert('Please select a room first');
            return;
        }
        if (await updateApplicationStatus(appId, 'approved', roomId)) {
            modal.style.display = 'none';
            loadApplications();
        }
    };

    rejectBtn.onclick = async () => {
        if (await updateApplicationStatus(appId, 'rejected')) {
            modal.style.display = 'none';
            loadApplications();
        }
    };

    // Show modal
    modal.style.display = 'block';
}

// Close modal
document.querySelector('.close-btn').onclick = function() {
    document.getElementById('applicationModal').style.display = 'none';
};

// Filter applications
function filterApplications(applications, status, search) {
    return applications.filter(app => {
        const matchesStatus = status === 'all' || app.status.toLowerCase() === status;
        const matchesSearch = !search || 
            app.user_name?.toLowerCase().includes(search.toLowerCase()) ||
            app.user_email?.toLowerCase().includes(search.toLowerCase());
        return matchesStatus && matchesSearch;
    });
}

// Load and display applications
async function loadApplications() {
    const applications = await fetchApplications();
    const statusFilter = document.getElementById('statusFilter').value;
    const searchInput = document.getElementById('searchInput').value;
    const filteredApplications = filterApplications(applications, statusFilter, searchInput);
    renderApplications(filteredApplications);
}

// Event listeners
document.getElementById('statusFilter').addEventListener('change', loadApplications);
document.getElementById('searchInput').addEventListener('input', loadApplications);

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
    loadApplications();
}); 