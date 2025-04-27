if (typeof API_URL === 'undefined') {
    const API_URL = 'http://localhost:5000/api';
}

async function fetchApplications() {
    const res = await fetch(`${API_URL}/applications/my-applications`, { credentials: 'include' });
    if (!res.ok) return [];
    return await res.json();
}

function renderApplications(applications) {
    const list = document.getElementById('applicationsList');
    if (!applications.length) {
        list.innerHTML = '<div class="no-results">You have not submitted any applications yet.</div>';
        return;
    }
    list.innerHTML = applications.map(app => `
        <div class="application-card">
            <div class="application-header">
                <span class="application-id">Application #${app.id}</span>
                <span class="application-status status-${app.status.toLowerCase()}">${app.status}</span>
            </div>
            <div class="application-details">
                <div class="application-field">
                    <span class="application-label">Room Number:</span>
                    <span class="application-value">${app.room_number || '-'}</span>
                </div>
                <div class="application-field">
                    <span class="application-label">Room Type:</span>
                    <span class="application-value">${app.room_type || '-'}</span>
                </div>
                <div class="application-field">
                    <span class="application-label">Status:</span>
                    <span class="application-value">${app.status}</span>
                </div>
                <div class="application-field">
                    <span class="application-label">Special Needs:</span>
                    <span class="application-value">${app.special_needs || '-'}</span>
                </div>
                <div class="application-field">
                    <span class="application-label">Notes:</span>
                    <span class="application-value">${app.additional_notes || '-'}</span>
                </div>
                <div class="application-field">
                    <span class="application-label">Submitted:</span>
                    <span class="application-value">${new Date(app.created_at).toLocaleString() || '-'}</span>
                </div>
                ${app.status === 'Approved' && app.room_number ? `
                <div class="application-field">
                    <span class="application-label">Assigned Room:</span>
                    <span class="application-value">${app.room_number}</span>
                </div>` : ''}
            </div>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
    const applications = await fetchApplications();
    renderApplications(applications);
}); 