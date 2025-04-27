// DOM Elements
const complaintsList = document.querySelector('.complaints-grid');
const complaintModal = document.getElementById('complaintModal');
const detailsModal = document.getElementById('detailsModal');
const complaintForm = document.getElementById('complaintForm');
const searchInput = document.getElementById('searchComplaints');
const statusFilter = document.getElementById('statusFilter');
const dateFilter = document.getElementById('dateFilter');

// State Management
let complaints = [];
let filteredComplaints = [];
let currentFilters = {
    status: 'all',
    dateRange: 'all',
    searchTerm: ''
};

// Event Listeners
document.addEventListener('DOMContentLoaded', initializePage);
complaintForm.addEventListener('submit', handleNewComplaint);
searchInput.addEventListener('input', handleSearch);
statusFilter.addEventListener('change', handleStatusFilter);
dateFilter.addEventListener('change', handleDateFilter);

// Initialize Page
async function initializePage() {
    try {
        await fetchComplaints();
        setupEventListeners();
        applyFilters();
    } catch (error) {
        console.error('Error initializing page:', error);
        showErrorMessage('Failed to load complaints');
    }
}

// API Integration
async function fetchComplaints() {
    try {
        const response = await fetch('/api/complaints', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch complaints');
        
        complaints = await response.json();
        filteredComplaints = [...complaints];
    } catch (error) {
        console.error('Error fetching complaints:', error);
        throw error;
    }
}

async function submitComplaint(complaintData) {
    try {
        const response = await fetch('/api/complaints', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(complaintData)
        });
        
        if (!response.ok) throw new Error('Failed to submit complaint');
        
        const newComplaint = await response.json();
        complaints.unshift(newComplaint);
        applyFilters();
        return newComplaint;
    } catch (error) {
        console.error('Error submitting complaint:', error);
        throw error;
    }
}

// Event Handlers
function handleNewComplaint(event) {
    event.preventDefault();
    
    const formData = new FormData(complaintForm);
    const complaintData = {
        type: formData.get('type'),
        severity: formData.get('severity'),
        description: formData.get('description'),
        location: formData.get('location'),
        anonymous: formData.get('anonymous') === 'on'
    };
    
    submitComplaint(complaintData)
        .then(() => {
            closeModal(complaintModal);
            showSuccessMessage('Complaint submitted successfully');
            complaintForm.reset();
        })
        .catch(() => {
            showErrorMessage('Failed to submit complaint');
        });
}

function handleSearch(event) {
    currentFilters.searchTerm = event.target.value.toLowerCase();
    applyFilters();
}

function handleStatusFilter(event) {
    currentFilters.status = event.target.value;
    applyFilters();
}

function handleDateFilter(event) {
    currentFilters.dateRange = event.target.value;
    applyFilters();
}

// UI Updates
function applyFilters() {
    filteredComplaints = complaints.filter(complaint => {
        const matchesSearch = currentFilters.searchTerm ? 
            (complaint.description.toLowerCase().includes(currentFilters.searchTerm) ||
             complaint.type.toLowerCase().includes(currentFilters.searchTerm) ||
             complaint.location.toLowerCase().includes(currentFilters.searchTerm)) :
            true;
            
        const matchesStatus = currentFilters.status === 'all' || 
            complaint.status === currentFilters.status;
            
        const matchesDate = filterByDateRange(complaint.createdAt, currentFilters.dateRange);
        
        return matchesSearch && matchesStatus && matchesDate;
    });
    
    renderComplaints();
}

function renderComplaints() {
    complaintsList.innerHTML = '';
    
    if (filteredComplaints.length === 0) {
        complaintsList.innerHTML = '<div class="loading-message">No complaints found</div>';
        return;
    }
    
    filteredComplaints.forEach(complaint => {
        const complaintCard = createComplaintCard(complaint);
        complaintsList.appendChild(complaintCard);
    });
}

function createComplaintCard(complaint) {
    const card = document.createElement('div');
    card.className = 'complaint-card';
    card.innerHTML = `
        <div class="complaint-header">
            <span class="complaint-id">#${complaint.id}</span>
            <span class="complaint-status status-${complaint.status.toLowerCase()}">${complaint.status}</span>
        </div>
        <h3>${complaint.type}</h3>
        <p class="complaint-description">${complaint.description}</p>
        <div class="complaint-meta">
            <span class="complaint-type">Location: ${complaint.location}</span>
            <span class="complaint-severity ${complaint.severity.toLowerCase()}">${complaint.severity}</span>
        </div>
        <div class="complaint-date">Submitted: ${formatDate(complaint.createdAt)}</div>
        <button class="btn btn-secondary view-details" data-id="${complaint.id}">View Details</button>
    `;
    
    card.querySelector('.view-details').addEventListener('click', () => showComplaintDetails(complaint));
    return card;
}

function showComplaintDetails(complaint) {
    const detailsContent = document.querySelector('.complaint-details');
    detailsContent.innerHTML = `
        <div class="detail-section">
            <h4>Complaint Information</h4>
            <p><strong>Complaint ID:</strong> #${complaint.id}</p>
            <p><strong>Status:</strong> <span class="status-${complaint.status.toLowerCase()}">${complaint.status}</span></p>
            <p><strong>Type:</strong> ${complaint.type}</p>
            <p><strong>Severity:</strong> ${complaint.severity}</p>
            <p><strong>Location:</strong> ${complaint.location}</p>
            <p><strong>Submitted:</strong> ${formatDate(complaint.createdAt)}</p>
            <p><strong>Description:</strong> ${complaint.description}</p>
            ${complaint.anonymous ? '<p><em>This complaint was submitted anonymously</em></p>' : ''}
        </div>
        ${complaint.updates ? renderUpdateTimeline(complaint.updates) : ''}
    `;
    
    openModal(detailsModal);
}

// Utility Functions
function filterByDateRange(date, range) {
    const complaintDate = new Date(date);
    const now = new Date();
    
    switch (range) {
        case 'today':
            return isSameDay(complaintDate, now);
        case 'week':
            return isWithinDays(complaintDate, now, 7);
        case 'month':
            return isWithinDays(complaintDate, now, 30);
        default:
            return true;
    }
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function renderUpdateTimeline(updates) {
    if (!updates || updates.length === 0) return '';
    
    const timelineItems = updates.map(update => `
        <div class="update-item">
            <span class="update-date">${formatDate(update.date)}</span>
            <p>${update.message}</p>
            ${update.by ? `<p><small>By: ${update.by}</small></p>` : ''}
        </div>
    `).join('');
    
    return `
        <div class="detail-section">
            <h4>Updates</h4>
            <div class="update-timeline">
                ${timelineItems}
            </div>
        </div>
    `;
}

function isSameDay(date1, date2) {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
}

function isWithinDays(date1, date2, days) {
    const diffTime = Math.abs(date2 - date1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= days;
}

function openModal(modal) {
    modal.style.display = 'block';
}

function closeModal(modal) {
    modal.style.display = 'none';
}

function showSuccessMessage(message) {
    // Implement your preferred notification system
    alert(message);
}

function showErrorMessage(message) {
    // Implement your preferred notification system
    alert(message);
}

// Setup Event Listeners
function setupEventListeners() {
    // Close modal buttons
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal(btn.closest('.modal'));
        });
    });
    
    // Cancel complaint button
    document.getElementById('cancelComplaint').addEventListener('click', () => {
        closeModal(complaintModal);
    });
    
    // New complaint button
    document.getElementById('newComplaintBtn').addEventListener('click', () => {
        openModal(complaintModal);
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target);
        }
    });
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });
} 