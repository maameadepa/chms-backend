// DOM Elements
const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
const dashboardSections = document.querySelectorAll('.dashboard-section');
const logoutBtn = document.getElementById('logoutBtn');

// API Endpoints
const API_BASE_URL = 'http://localhost:3000/api';

// State Management
let currentUser = null;
let maintenanceRequests = [];
let completedTasks = [];
let inventory = [];
let schedule = [];

// Initialize Dashboard
async function initializeDashboard() {
    try {
        // Check authentication
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        // Fetch user data
        await fetchUserData();
        
        // Load initial data
        await Promise.all([
            fetchMaintenanceRequests(),
            fetchCompletedTasks(),
            fetchInventory(),
            fetchSchedule()
        ]);

        // Update UI
        updateDashboardUI();
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showError('Failed to initialize dashboard');
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
        document.querySelector('.user-info').textContent = `Welcome, ${currentUser.name}`;
    } catch (error) {
        console.error('Error fetching user data:', error);
        throw error;
    }
}

// Data Fetching Functions
async function fetchMaintenanceRequests() {
    try {
        const response = await fetch(`${API_BASE_URL}/maintenance/requests`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch maintenance requests');
        
        maintenanceRequests = await response.json();
        updateMaintenanceRequestsUI();
    } catch (error) {
        console.error('Error fetching maintenance requests:', error);
        throw error;
    }
}

async function fetchCompletedTasks() {
    try {
        const response = await fetch(`${API_BASE_URL}/maintenance/completed`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch completed tasks');
        
        completedTasks = await response.json();
        updateCompletedTasksUI();
    } catch (error) {
        console.error('Error fetching completed tasks:', error);
        throw error;
    }
}

async function fetchInventory() {
    try {
        const response = await fetch(`${API_BASE_URL}/maintenance/inventory`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch inventory');
        
        inventory = await response.json();
        updateInventoryUI();
    } catch (error) {
        console.error('Error fetching inventory:', error);
        throw error;
    }
}

async function fetchSchedule() {
    try {
        const response = await fetch(`${API_BASE_URL}/maintenance/schedule`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch schedule');
        
        schedule = await response.json();
        updateScheduleUI();
    } catch (error) {
        console.error('Error fetching schedule:', error);
        throw error;
    }
}

// UI Update Functions
function updateDashboardUI() {
    // Update overview cards
    document.getElementById('pendingRequestsCount').textContent = maintenanceRequests.length;
    document.getElementById('completedTasksCount').textContent = completedTasks.length;
    document.getElementById('inventoryItemsCount').textContent = inventory.length;
    document.getElementById('scheduledTasksCount').textContent = schedule.length;
}

function updateMaintenanceRequestsUI() {
    const requestsContainer = document.getElementById('maintenanceRequests');
    requestsContainer.innerHTML = maintenanceRequests.map(request => `
        <div class="card">
            <h3>Request #${request.id}</h3>
            <p><strong>Location:</strong> ${request.location}</p>
            <p><strong>Description:</strong> ${request.description}</p>
            <p><strong>Priority:</strong> ${request.priority}</p>
            <p><strong>Status:</strong> ${request.status}</p>
            <div class="card-actions">
                <button class="btn btn-primary" onclick="updateRequestStatus(${request.id}, 'in-progress')">
                    Start Work
                </button>
                <button class="btn btn-secondary" onclick="viewRequestDetails(${request.id})">
                    View Details
                </button>
            </div>
        </div>
    `).join('');
}

function updateCompletedTasksUI() {
    const completedContainer = document.getElementById('completedTasks');
    completedContainer.innerHTML = completedTasks.map(task => `
        <div class="card">
            <h3>Task #${task.id}</h3>
            <p><strong>Location:</strong> ${task.location}</p>
            <p><strong>Description:</strong> ${task.description}</p>
            <p><strong>Completed Date:</strong> ${new Date(task.completedDate).toLocaleDateString()}</p>
            <p><strong>Time Taken:</strong> ${task.timeTaken} hours</p>
        </div>
    `).join('');
}

function updateInventoryUI() {
    const inventoryContainer = document.getElementById('inventoryItems');
    inventoryContainer.innerHTML = inventory.map(item => `
        <div class="card">
            <h3>${item.name}</h3>
            <p><strong>Quantity:</strong> ${item.quantity}</p>
            <p><strong>Category:</strong> ${item.category}</p>
            <p><strong>Last Restocked:</strong> ${new Date(item.lastRestocked).toLocaleDateString()}</p>
            <div class="card-actions">
                <button class="btn btn-primary" onclick="updateInventoryItem(${item.id})">
                    Update Stock
                </button>
            </div>
        </div>
    `).join('');
}

function updateScheduleUI() {
    const scheduleContainer = document.getElementById('maintenanceSchedule');
    scheduleContainer.innerHTML = schedule.map(task => `
        <div class="card">
            <h3>${task.title}</h3>
            <p><strong>Date:</strong> ${new Date(task.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${task.time}</p>
            <p><strong>Location:</strong> ${task.location}</p>
            <p><strong>Description:</strong> ${task.description}</p>
            <div class="card-actions">
                <button class="btn btn-primary" onclick="startScheduledTask(${task.id})">
                    Start Task
                </button>
                <button class="btn btn-secondary" onclick="rescheduleTask(${task.id})">
                    Reschedule
                </button>
            </div>
        </div>
    `).join('');
}

// Event Handlers
function handleNavigation(event) {
    event.preventDefault();
    const targetSection = event.target.getAttribute('href').substring(1);
    
    // Update active state
    sidebarLinks.forEach(link => link.parentElement.classList.remove('active'));
    event.target.parentElement.classList.add('active');
    
    // Show selected section
    dashboardSections.forEach(section => {
        section.classList.remove('active');
        if (section.id === targetSection) {
            section.classList.add('active');
        }
    });
}

async function handleLogout() {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
}

// Task Management Functions
async function updateRequestStatus(requestId, status) {
    try {
        const response = await fetch(`${API_BASE_URL}/maintenance/requests/${requestId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        
        if (!response.ok) throw new Error('Failed to update request status');
        
        await fetchMaintenanceRequests();
        showSuccess('Request status updated successfully');
    } catch (error) {
        console.error('Error updating request status:', error);
        showError('Failed to update request status');
    }
}

async function updateInventoryItem(itemId) {
    // Implementation for updating inventory items
}

async function startScheduledTask(taskId) {
    // Implementation for starting scheduled tasks
}

async function rescheduleTask(taskId) {
    // Implementation for rescheduling tasks
}

// Utility Functions
function showSuccess(message) {
    // Implementation for showing success messages
}

function showError(message) {
    // Implementation for showing error messages
}

// Event Listeners
document.addEventListener('DOMContentLoaded', initializeDashboard);
sidebarLinks.forEach(link => link.addEventListener('click', handleNavigation));
logoutBtn.addEventListener('click', handleLogout); 