// DOM Elements
const requestsGrid = document.querySelector('.requests-grid');
const newRequestModal = document.getElementById('newRequestModal');
const detailsModal = document.getElementById('requestDetailsModal');
const newRequestForm = document.getElementById('newRequestForm');
const filterForm = document.getElementById('filterForm');
const searchInput = document.getElementById('searchInput');

// State Management
let maintenanceRequests = [];
let filteredRequests = [];
let currentFilters = {
    status: 'all',
    priority: 'all',
    dateRange: 'all'
};

// Event Listeners
document.addEventListener('DOMContentLoaded', initializePage);
newRequestForm.addEventListener('submit', handleNewRequest);
filterForm.addEventListener('submit', (e) => e.preventDefault());
searchInput.addEventListener('input', handleSearch);

// Initialize Page
async function initializePage() {
    try {
        await fetchMaintenanceRequests();
        setupEventListeners();
        applyFilters();
    } catch (error) {
        console.error('Error initializing page:', error);
        showErrorMessage('Failed to load maintenance requests');
    }
}

// API Integration
async function fetchMaintenanceRequests() {
    try {
        const response = await fetch('/api/maintenance-requests', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch requests');
        
        maintenanceRequests = await response.json();
        filteredRequests = [...maintenanceRequests];
    } catch (error) {
        console.error('Error fetching maintenance requests:', error);
        throw error;
    }
}

async function submitMaintenanceRequest(requestData) {
    try {
        const response = await fetch('/api/maintenance-requests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) throw new Error('Failed to submit request');
        
        const newRequest = await response.json();
        maintenanceRequests.unshift(newRequest);
        applyFilters();
        return newRequest;
    } catch (error) {
        console.error('Error submitting maintenance request:', error);
        throw error;
    }
}

// Event Handlers
function handleNewRequest(event) {
    event.preventDefault();
    
    const formData = new FormData(newRequestForm);
    const requestData = {
        type: formData.get('type'),
        priority: formData.get('priority'),
        description: formData.get('description'),
        preferredTime: formData.get('preferredTime')
    };
    
    submitMaintenanceRequest(requestData)
        .then(() => {
            closeModal(newRequestModal);
            showSuccessMessage('Maintenance request submitted successfully');
            newRequestForm.reset();
        })
        .catch(() => {
            showErrorMessage('Failed to submit maintenance request');
        });
}

function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    applyFilters(searchTerm);
}

function handleStatusFilter(status) {
    currentFilters.status = status;
    applyFilters();
}

function handlePriorityFilter(priority) {
    currentFilters.priority = priority;
    applyFilters();
}

function handleDateRangeFilter(range) {
    currentFilters.dateRange = range;
    applyFilters();
}

// UI Updates
function applyFilters(searchTerm = '') {
    filteredRequests = maintenanceRequests.filter(request => {
        const matchesSearch = searchTerm ? 
            request.description.toLowerCase().includes(searchTerm) ||
            request.type.toLowerCase().includes(searchTerm) :
            true;
            
        const matchesStatus = currentFilters.status === 'all' || 
            request.status === currentFilters.status;
            
        const matchesPriority = currentFilters.priority === 'all' || 
            request.priority === currentFilters.priority;
            
        const matchesDateRange = filterByDateRange(request.createdAt, currentFilters.dateRange);
        
        return matchesSearch && matchesStatus && matchesPriority && matchesDateRange;
    });
    
    renderRequests();
}

function renderRequests() {
    requestsGrid.innerHTML = '';
    
    if (filteredRequests.length === 0) {
        requestsGrid.innerHTML = '<div class="loading-message">No maintenance requests found</div>';
        return;
    }
    
    filteredRequests.forEach(request => {
        const requestCard = createRequestCard(request);
        requestsGrid.appendChild(requestCard);
    });
}

function createRequestCard(request) {
    const card = document.createElement('div');
    card.className = 'request-card';
    card.innerHTML = `
        <div class="request-header">
            <span class="request-id">#${request.id}</span>
            <span class="request-status status-${request.status.toLowerCase()}">${request.status}</span>
        </div>
        <h3>${request.type}</h3>
        <p class="request-description">${request.description}</p>
        <div class="request-meta">
            <span class="request-priority ${request.priority.toLowerCase()}">${request.priority}</span>
            <span class="request-date">${formatDate(request.createdAt)}</span>
        </div>
    `;
    
    card.addEventListener('click', () => showRequestDetails(request));
    return card;
}

function showRequestDetails(request) {
    const detailsContent = document.querySelector('.request-details');
    detailsContent.innerHTML = `
        <div class="detail-section">
            <h4>Request Details</h4>
            <p><strong>ID:</strong> #${request.id}</p>
            <p><strong>Type:</strong> ${request.type}</p>
            <p><strong>Status:</strong> ${request.status}</p>
            <p><strong>Priority:</strong> ${request.priority}</p>
            <p><strong>Description:</strong> ${request.description}</p>
            <p><strong>Preferred Time:</strong> ${request.preferredTime || 'Not specified'}</p>
            <p><strong>Submitted:</strong> ${formatDate(request.createdAt)}</p>
        </div>
        ${request.updates ? renderUpdateTimeline(request.updates) : ''}
    `;
    
    openModal(detailsModal);
}

// Utility Functions
function filterByDateRange(date, range) {
    const requestDate = new Date(date);
    const now = new Date();
    
    switch (range) {
        case 'today':
            return isSameDay(requestDate, now);
        case 'week':
            return isWithinDays(requestDate, now, 7);
        case 'month':
            return isWithinDays(requestDate, now, 30);
        default:
            return true;
    }
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function renderUpdateTimeline(updates) {
    if (!updates || updates.length === 0) return '';
    
    const timelineItems = updates.map(update => `
        <div class="update-item">
            <span class="update-date">${formatDate(update.date)}</span>
            <p>${update.message}</p>
            ${update.technician ? `<p><small>By: ${update.technician}</small></p>` : ''}
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
    
    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target);
        }
    });
    
    // Filter change handlers
    document.getElementById('statusFilter').addEventListener('change', (e) => {
        handleStatusFilter(e.target.value);
    });
    
    document.getElementById('priorityFilter').addEventListener('change', (e) => {
        handlePriorityFilter(e.target.value);
    });
    
    document.getElementById('dateFilter').addEventListener('change', (e) => {
        handleDateRangeFilter(e.target.value);
    });
    
    // New request button
    document.getElementById('newRequestBtn').addEventListener('click', () => {
        openModal(newRequestModal);
    });
} 