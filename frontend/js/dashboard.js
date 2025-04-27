// API Configuration
const API_URL = 'http://localhost:5000/api';

// Load hostel preview on dashboard
async function loadHostelPreview() {
    try {
        const response = await fetch(`${API_URL}/hostels`, {
            credentials: 'include'
        });
        const hostels = await response.json();
        
        const previewContainer = document.getElementById('hostelsPreview');
        if (hostels.length === 0) {
            previewContainer.innerHTML = '<p>No hostels available at the moment.</p>';
            return;
        }

        // Show first 3 hostels as preview
        const previewHTML = hostels.slice(0, 3).map(hostel => `
            <div class="hostel-preview">
                <h4>${hostel.name}</h4>
                <p>${hostel.description.substring(0, 100)}...</p>
                <p><strong>Available Rooms:</strong> ${hostel.available_rooms}/${hostel.total_rooms}</p>
            </div>
        `).join('');
        
        previewContainer.innerHTML = previewHTML;
    } catch (error) {
        console.error('Error loading hostel preview:', error);
        document.getElementById('hostelsPreview').innerHTML = 
            '<p>Error loading hostel information. Please try again later.</p>';
    }
}

// Load room details
async function loadRoomDetails() {
    try {
        const response = await fetch(`${API_URL}/applications/my-applications`, {
            credentials: 'include'
        });
        const applications = await response.json();
        
        const roomDetailsContainer = document.getElementById('roomDetails');
        if (applications.length === 0) {
            roomDetailsContainer.innerHTML = '<p>No room assigned yet.</p>';
            return;
        }

        // Show most recent application
        const latestApp = applications[0];
        roomDetailsContainer.innerHTML = `
            <p><strong>Status:</strong> ${latestApp.status}</p>
            <p><strong>Preferred Hostel:</strong> ${latestApp.preferredHostel?.name || 'Not specified'}</p>
            <p><strong>Room Type:</strong> ${latestApp.preferred_room_type || 'Not specified'}</p>
        `;
    } catch (error) {
        console.error('Error loading room details:', error);
        document.getElementById('roomDetails').innerHTML = 
            '<p>Error loading room information. Please try again later.</p>';
    }
}

// Load recent notifications
async function loadRecentNotifications() {
    // This would be implemented when you add a notifications system
    document.getElementById('recentNotifications').innerHTML = 
        '<p>No recent notifications</p>';
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    loadHostelPreview();
    loadRoomDetails();
    loadRecentNotifications();
}); 