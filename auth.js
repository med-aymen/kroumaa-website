/**
 * KROUMA FAMILY - Authentication Module
 * Handles user login, admin access, and session management
 */

// ========== CONSTANTS ==========
const ADMIN_PASSWORD = 'admin123'; // Simple password for demo
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const STORAGE_KEYS = {
    USERS: 'krouma_users',
    CURRENT_USER: 'krouma_current_user',
    ADMIN_SESSION: 'krouma_admin_session',
    REMEMBER_ME: 'krouma_remember_me',
    LAST_ACTIVITY: 'krouma_last_activity'
};

// ========== UTILITY FUNCTIONS ==========

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/**
 * Show/hide loading overlay
 */
function toggleLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.add('active');
    } else {
        overlay.classList.remove('active');
    }
}

/**
 * Sanitize input to prevent XSS
 */
function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

/**
 * Validate name (letters, spaces, hyphens only)
 */
function isValidName(name) {
    return /^[a-zA-Z\s-]{2,30}$/.test(name);
}

/**
 * Simple password hashing (for demo purposes)
 */
function hashPassword(password) {
    // In production, use proper encryption
    return btoa(password);
}

/**
 * Verify password
 */
function verifyPassword(password, hash) {
    return btoa(password) === hash;
}

/**
 * Get or initialize users array
 */
function getUsers() {
    const users = localStorage.getItem(STORAGE_KEYS.USERS);
    return users ? JSON.parse(users) : [];
}

/**
 * Save users array
 */
function saveUsers(users) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

/**
 * Add or update user
 */
function addUser(firstName, lastName) {
    const users = getUsers();
    const existingUserIndex = users.findIndex(
        u => u.firstName.toLowerCase() === firstName.toLowerCase() && 
             u.lastName.toLowerCase() === lastName.toLowerCase()
    );
    
    const userData = {
        firstName: sanitizeInput(firstName),
        lastName: sanitizeInput(lastName),
        lastLogin: new Date().toISOString(),
        loginCount: 1
    };
    
    if (existingUserIndex >= 0) {
        // Update existing user
        users[existingUserIndex].lastLogin = userData.lastLogin;
        users[existingUserIndex].loginCount += 1;
    } else {
        // Add new user
        users.push(userData);
    }
    
    saveUsers(users);
    return userData;
}

/**
 * Set current user session
 */
function setCurrentUser(userData, rememberMe = false) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userData));
    localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString());
    
    if (rememberMe) {
        localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, JSON.stringify({
            firstName: userData.firstName,
            lastName: userData.lastName
        }));
    } else {
        localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
    }
}

/**
 * Set admin session
 */
function setAdminSession() {
    const sessionData = {
        isAdmin: true,
        loginTime: new Date().toISOString(),
        lastActivity: Date.now()
    };
    localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify(sessionData));
}

// ========== FORM VALIDATION ==========

/**
 * Validate login form
 */
function validateLoginForm(firstName, lastName) {
    let isValid = true;
    
    // Reset error messages
    document.getElementById('firstNameError').textContent = '';
    document.getElementById('lastNameError').textContent = '';
    
    // Validate first name
    if (!firstName.trim()) {
        document.getElementById('firstNameError').textContent = 'First name is required';
        isValid = false;
    } else if (!isValidName(firstName)) {
        document.getElementById('firstNameError').textContent = 'Please enter a valid first name';
        isValid = false;
    }
    
    // Validate last name
    if (!lastName.trim()) {
        document.getElementById('lastNameError').textContent = 'Last name is required';
        isValid = false;
    } else if (!isValidName(lastName)) {
        document.getElementById('lastNameError').textContent = 'Please enter a valid last name';
        isValid = false;
    }
    
    return isValid;
}

// ========== LOGIN FORM HANDLER ==========

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // Validate form
    if (!validateLoginForm(firstName, lastName)) {
        return;
    }
    
    // Show loading
    toggleLoading(true);
    
    // Simulate network delay for better UX
    setTimeout(() => {
        try {
            // Add/update user and create session
            const userData = addUser(firstName, lastName);
            setCurrentUser(userData, rememberMe);
            
            // Show success message
            showToast(`Welcome back, ${firstName}!`, 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 500);
            
        } catch (error) {
            toggleLoading(false);
            showToast('Login failed. Please try again.', 'error');
            console.error('Login error:', error);
        }
    }, 800);
});

// ========== ADMIN MODAL ==========

const adminModal = document.getElementById('adminModal');
const adminAccessBtn = document.getElementById('adminAccessBtn');
const closeAdminModal = document.getElementById('closeAdminModal');
const adminLoginForm = document.getElementById('adminLoginForm');

// Open admin modal
adminAccessBtn.addEventListener('click', function() {
    adminModal.classList.add('active');
    document.getElementById('adminPassword').focus();
});

// Close admin modal
closeAdminModal.addEventListener('click', function() {
    adminModal.classList.remove('active');
    adminLoginForm.reset();
    document.getElementById('adminPasswordError').textContent = '';
});

// Close modal on outside click
adminModal.addEventListener('click', function(e) {
    if (e.target === adminModal) {
        adminModal.classList.remove('active');
        adminLoginForm.reset();
        document.getElementById('adminPasswordError').textContent = '';
    }
});

// Admin login form handler
adminLoginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const password = document.getElementById('adminPassword').value;
    const errorEl = document.getElementById('adminPasswordError');
    
    // Reset error
    errorEl.textContent = '';
    
    // Validate password
    if (!password) {
        errorEl.textContent = 'Password is required';
        return;
    }
    
    // Show loading
    toggleLoading(true);
    
    // Simulate network delay
    setTimeout(() => {
        // Check password
        if (password === ADMIN_PASSWORD) {
            // Set admin session
            setAdminSession();
            
            // Show success message
            showToast('Admin access granted', 'success');
            
            // Redirect to admin panel
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 500);
        } else {
            toggleLoading(false);
            errorEl.textContent = 'Incorrect password';
            showToast('Incorrect password', 'error');
        }
    }, 800);
});

// ========== INPUT ANIMATIONS ==========

// Add focus animations to inputs
const inputs = document.querySelectorAll('input[type="text"], input[type="password"]');
inputs.forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
    });
    
    input.addEventListener('blur', function() {
        if (!this.value) {
            this.parentElement.classList.remove('focused');
        }
    });
});

// ========== REMEMBER ME ==========

// Auto-fill form if "remember me" was checked
window.addEventListener('DOMContentLoaded', function() {
    const rememberedUser = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME);
    
    if (rememberedUser) {
        try {
            const userData = JSON.parse(rememberedUser);
            document.getElementById('firstName').value = userData.firstName;
            document.getElementById('lastName').value = userData.lastName;
            document.getElementById('rememberMe').checked = true;
        } catch (error) {
            console.error('Error loading remembered user:', error);
        }
    }
});

// ========== SESSION CHECK ==========

/**
 * Check if user has an active session
 */
function checkActiveSession() {
    const currentUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    const lastActivity = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
    
    if (currentUser && lastActivity) {
        const timeSinceActivity = Date.now() - parseInt(lastActivity);
        
        // If session is still valid, redirect to dashboard
        if (timeSinceActivity < SESSION_TIMEOUT) {
            window.location.href = 'dashboard.html';
        }
    }
}

// Check for active session on page load
window.addEventListener('DOMContentLoaded', checkActiveSession);

// ========== KEYBOARD SHORTCUTS ==========

// Press Enter in first name to focus last name
document.getElementById('firstName').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('lastName').focus();
    }
});

// Press Escape to close admin modal
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && adminModal.classList.contains('active')) {
        adminModal.classList.remove('active');
        adminLoginForm.reset();
        document.getElementById('adminPasswordError').textContent = '';
    }
});

// ========== INITIALIZATION ==========

console.log('🏠 KROUMA FAMILY - Authentication loaded');
console.log('💡 Tip: Default admin password is "admin123"');
