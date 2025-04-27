document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated
    checkAuth();

    // DOM Elements
    const editProfileBtn = document.getElementById('editProfileBtn');
    const editProfileModal = document.getElementById('editProfileModal');
    const closeBtn = document.querySelector('.close-btn');
    const cancelBtn = document.getElementById('cancelEdit');
    const editProfileForm = document.getElementById('editProfileForm');
    const logoutBtn = document.getElementById('logoutBtn');

    // Show edit profile modal
    editProfileBtn.addEventListener('click', () => {
        editProfileModal.style.display = 'block';
        populateEditForm();
    });

    // Close modal
    closeBtn.addEventListener('click', () => {
        editProfileModal.style.display = 'none';
    });

    // Cancel edit
    cancelBtn.addEventListener('click', () => {
        editProfileModal.style.display = 'none';
    });

    // Handle form submission
    editProfileForm.addEventListener('submit', handleProfileUpdate);

    // Logout button
    logoutBtn.addEventListener('click', handleLogout);

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === editProfileModal) {
            editProfileModal.style.display = 'none';
        }
    });
});

// Check if user is authenticated
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Set user name in header
    const userName = localStorage.getItem('userName');
    if (userName) {
        document.getElementById('userName').textContent = userName;
    }

    // Load profile data
    loadProfileData();
}

// Load profile data from API
async function loadProfileData() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/users/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load profile data');
        }

        const data = await response.json();
        populateProfileFields(data);
    } catch (error) {
        console.error('Error loading profile:', error);
        showError('Failed to load profile data. Please try again later.');
    }
}

// Populate profile fields with data
function populateProfileFields(data) {
    // Personal Information
    document.getElementById('fullName').textContent = data.fullName || 'Not provided';
    document.getElementById('studentId').textContent = data.studentId || 'Not provided';
    document.getElementById('email').textContent = data.email || 'Not provided';
    document.getElementById('phone').textContent = data.phone || 'Not provided';
    document.getElementById('dob').textContent = formatDate(data.dateOfBirth) || 'Not provided';
    document.getElementById('gender').textContent = capitalizeFirstLetter(data.gender) || 'Not provided';

    // Academic Information
    document.getElementById('program').textContent = data.program || 'Not provided';
    document.getElementById('yearLevel').textContent = data.yearLevel || 'Not provided';
    document.getElementById('department').textContent = data.department || 'Not provided';
    document.getElementById('enrollmentStatus').textContent = capitalizeFirstLetter(data.enrollmentStatus) || 'Not provided';

    // Housing Information
    document.getElementById('currentRoom').textContent = data.currentRoom || 'Not assigned';
    document.getElementById('roomType').textContent = data.roomType || 'Not provided';
    document.getElementById('checkInDate').textContent = formatDate(data.checkInDate) || 'Not provided';
    document.getElementById('checkOutDate').textContent = formatDate(data.checkOutDate) || 'Not provided';

    // Emergency Contact
    document.getElementById('emergencyName').textContent = data.emergencyContact?.name || 'Not provided';
    document.getElementById('emergencyRelation').textContent = data.emergencyContact?.relationship || 'Not provided';
    document.getElementById('emergencyPhone').textContent = data.emergencyContact?.phone || 'Not provided';
    document.getElementById('emergencyEmail').textContent = data.emergencyContact?.email || 'Not provided';
}

// Populate edit form with current data
function populateEditForm() {
    // Personal Information
    document.getElementById('editFullName').value = document.getElementById('fullName').textContent;
    document.getElementById('editPhone').value = document.getElementById('phone').textContent;
    
    // Format date for input field (YYYY-MM-DD)
    const dobText = document.getElementById('dob').textContent;
    if (dobText !== 'Not provided') {
        const dobDate = new Date(dobText);
        document.getElementById('editDob').value = formatDateForInput(dobDate);
    }
    
    document.getElementById('editGender').value = document.getElementById('gender').textContent.toLowerCase();

    // Emergency Contact
    document.getElementById('editEmergencyName').value = document.getElementById('emergencyName').textContent;
    document.getElementById('editEmergencyRelation').value = document.getElementById('emergencyRelation').textContent;
    document.getElementById('editEmergencyPhone').value = document.getElementById('emergencyPhone').textContent;
    document.getElementById('editEmergencyEmail').value = document.getElementById('emergencyEmail').textContent;
}

// Handle profile update
async function handleProfileUpdate(e) {
    e.preventDefault();

    try {
        const token = localStorage.getItem('token');
        const formData = {
            fullName: document.getElementById('editFullName').value,
            phone: document.getElementById('editPhone').value,
            dateOfBirth: document.getElementById('editDob').value,
            gender: document.getElementById('editGender').value,
            emergencyContact: {
                name: document.getElementById('editEmergencyName').value,
                relationship: document.getElementById('editEmergencyRelation').value,
                phone: document.getElementById('editEmergencyPhone').value,
                email: document.getElementById('editEmergencyEmail').value
            }
        };

        const response = await fetch('/api/users/profile', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error('Failed to update profile');
        }

        // Close modal
        document.getElementById('editProfileModal').style.display = 'none';
        
        // Reload profile data
        loadProfileData();
        
        // Show success message
        showSuccess('Profile updated successfully!');
    } catch (error) {
        console.error('Error updating profile:', error);
        showError('Failed to update profile. Please try again later.');
    }
}

// Handle logout
function handleLogout() {
    // Clear authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    
    // Redirect to login page
    window.location.href = 'login.html';
}

// Helper functions
function formatDate(dateString) {
    if (!dateString) return 'Not provided';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

function showSuccess(message) {
    // You can implement a toast notification or alert
    alert(message);
}

function showError(message) {
    // You can implement a toast notification or alert
    alert(message);
} 