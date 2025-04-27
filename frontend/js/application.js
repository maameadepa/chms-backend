if (typeof API_URL === 'undefined') {
    const API_URL = 'http://localhost:5000/api';
}

// Get roomId from URL
function getRoomIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('roomId');
}

// Fetch current user info
async function fetchUser() {
    const res = await fetch(`${API_URL}/auth/me`, { credentials: 'include' });
    if (!res.ok) return null;
    return await res.json();
}

// Fetch room info
async function fetchRoom(roomId) {
    const res = await fetch(`${API_URL}/rooms/${roomId}`, { credentials: 'include' });
    if (!res.ok) return null;
    return await res.json();
}

// Populate form fields
async function populateForm() {
    const roomId = getRoomIdFromUrl();
    if (!roomId) {
        showNotification('No room selected.', true);
        document.getElementById('applicationForm').style.display = 'none';
        return;
    }
    const [user, room] = await Promise.all([fetchUser(), fetchRoom(roomId)]);
    if (!user || !room) {
        showNotification('Could not load user or room info.', true);
        document.getElementById('applicationForm').style.display = 'none';
        return;
    }
    document.getElementById('studentName').value = user.name || '';
    document.getElementById('studentEmail').value = user.email || '';
    document.getElementById('roomNumber').value = room.room_number || '';
}

// Show notification
function showNotification(msg, isError = false) {
    const n = document.getElementById('applicationNotification');
    n.textContent = msg;
    n.style.display = 'block';
    n.className = 'notification' + (isError ? ' error' : ' success');
    setTimeout(() => { n.style.display = 'none'; }, 4000);
}

// Handle form submit
async function handleApplicationSubmit(e) {
    e.preventDefault(); // Prevent default form submission
    const roomId = getRoomIdFromUrl();
    if (!roomId) {
        showNotification('No room selected.', true);
        return;
    }
    const specialNeeds = document.getElementById('specialNeeds').value;
    const additionalNotes = document.getElementById('additionalNotes').value;
    try {
        const res = await fetch(`${API_URL}/applications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                room_id: roomId,
                special_needs: specialNeeds,
                additional_notes: additionalNotes,
                academic_year: new Date().getFullYear(),
                semester: 'fall'
            })
        });
        const data = await res.json();
        if (res.ok) {
            showNotification('Application submitted! Waiting for admin confirmation.');
            document.getElementById('applicationForm').reset();
            // Redirect to applications page after successful submission
            setTimeout(() => {
                window.location.href = 'applications.html';
            }, 2000);
        } else {
            showNotification(data.message || 'Failed to submit application.', true);
        }
    } catch (error) {
        console.error('Error submitting application:', error);
        showNotification('Failed to submit application. Please try again.', true);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    populateForm();
    document.getElementById('applicationForm').addEventListener('submit', handleApplicationSubmit);
}); 