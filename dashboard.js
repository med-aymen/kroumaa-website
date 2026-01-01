/**
 * KROUMA FAMILY - Dashboard Module
 * Handles user dashboard display and interactions
 */

// ========== CONSTANTS ==========
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const STORAGE_KEYS = {
    USERS: 'krouma_users',
    CURRENT_USER: 'krouma_current_user',
    LAST_ACTIVITY: 'krouma_last_activity',
    MEALS: 'krouma_meals',
    SHOPPING_LIST: 'krouma_shopping_list',
    THEME: 'krouma_theme'
};

let currentUser = null;
let activityTimer = null;

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
 * Format date
 */
function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

/**
 * Format time
 */
function formatTime(date) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Get today's date key
 */
function getTodayKey() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

/**
 * Update last activity timestamp
 */
function updateActivity() {
    localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString());
}

/**
 * Check session validity
 */
function checkSession() {
    const lastActivity = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
    
    if (!lastActivity) {
        logout();
        return false;
    }
    
    const timeSinceActivity = Date.now() - parseInt(lastActivity);
    
    if (timeSinceActivity > SESSION_TIMEOUT) {
        showToast('Session expired. Please log in again.', 'warning');
        setTimeout(logout, 2000);
        return false;
    }
    
    return true;
}

/**
 * Logout function
 */
function logout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.LAST_ACTIVITY);
    window.location.href = 'index.html';
}

// ========== AUTHENTICATION ==========

/**
 * Check if user is logged in
 */
function checkAuth() {
    const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    
    if (!userStr) {
        window.location.href = 'index.html';
        return null;
    }
    
    try {
        currentUser = JSON.parse(userStr);
        
        // Check session validity
        if (!checkSession()) {
            return null;
        }
        
        return currentUser;
    } catch (error) {
        console.error('Error parsing user data:', error);
        window.location.href = 'index.html';
        return null;
    }
}

// ========== USER INTERFACE ==========

/**
 * Display user info in header
 */
function displayUserInfo() {
    if (!currentUser) return;
    
    // Set user name
    const welcomeNameEl = document.getElementById('welcomeName');
    const userNameDisplayEl = document.getElementById('userNameDisplay');
    
    welcomeNameEl.textContent = currentUser.firstName;
    userNameDisplayEl.textContent = `${currentUser.firstName} ${currentUser.lastName}`;
    
    // Set user initials
    const initials = `${currentUser.firstName.charAt(0)}${currentUser.lastName.charAt(0)}`.toUpperCase();
    document.getElementById('userInitials').textContent = initials;
}

/**
 * Update date and time display
 */
function updateDateTime() {
    const now = new Date();
    
    // Update date
    const dateEl = document.querySelector('#currentDate span');
    dateEl.textContent = formatDate(now);
    
    // Update time
    const timeEl = document.getElementById('currentTime');
    timeEl.textContent = formatTime(now);
}

// ========== MEALS ==========

/**
 * Get default meals
 */
function getDefaultMeals() {
    return {
        breakfast: {
            time: '08:00',
            description: 'Pancakes with fresh berries, maple syrup, and a glass of orange juice. A delightful start to your day!'
        },
        lunch: {
            time: '12:30',
            description: 'Grilled chicken salad with mixed greens, cherry tomatoes, cucumbers, and balsamic dressing. Light and nutritious!'
        },
        dinner: {
            time: '19:00',
            description: 'Homemade spaghetti bolognese with garlic bread and a fresh garden salad. Family favorite!'
        }
    };
}

/**
 * Get today\'s meals
 */
function getTodayMeals() {
    const mealsStr = localStorage.getItem(STORAGE_KEYS.MEALS);
    
    if (!mealsStr) {
        // Initialize with default meals
        const defaultMeals = {};
        defaultMeals[getTodayKey()] = getDefaultMeals();
        localStorage.setItem(STORAGE_KEYS.MEALS, JSON.stringify(defaultMeals));
        return getDefaultMeals();
    }
    
    try {
        const allMeals = JSON.parse(mealsStr);
        const todayKey = getTodayKey();
        
        if (!allMeals[todayKey]) {
            // Set default for today
            allMeals[todayKey] = getDefaultMeals();
            localStorage.setItem(STORAGE_KEYS.MEALS, JSON.stringify(allMeals));
        }
        
        return allMeals[todayKey];
    } catch (error) {
        console.error('Error parsing meals:', error);
        return getDefaultMeals();
    }
}

/**
 * Display meals
 */
function displayMeals() {
    const meals = getTodayMeals();
    
    // Breakfast
    document.getElementById('breakfastTime').textContent = formatMealTime(meals.breakfast.time);
    document.getElementById('breakfastDescription').textContent = meals.breakfast.description;
    
    // Lunch
    document.getElementById('lunchTime').textContent = formatMealTime(meals.lunch.time);
    document.getElementById('lunchDescription').textContent = meals.lunch.description;
    
    // Dinner
    document.getElementById('dinnerTime').textContent = formatMealTime(meals.dinner.time);
    document.getElementById('dinnerDescription').textContent = meals.dinner.description;
}

/**
 * Format meal time
 */
function formatMealTime(time) {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

// ========== SHOPPING LIST ==========

/**
 * Get default shopping items
 */
function getDefaultShoppingItems() {
    return [
        {
            id: 'item_1',
            name: 'Fresh Milk',
            category: 'groceries',
            priority: false,
            checked: false,
            addedDate: new Date().toISOString()
        },
        {
            id: 'item_2',
            name: 'Whole Wheat Bread',
            category: 'groceries',
            priority: false,
            checked: false,
            addedDate: new Date().toISOString()
        },
        {
            id: 'item_3',
            name: 'Fresh Vegetables',
            category: 'groceries',
            priority: true,
            checked: false,
            addedDate: new Date().toISOString()
        },
        {
            id: 'item_4',
            name: 'Laundry Detergent',
            category: 'household',
            priority: false,
            checked: false,
            addedDate: new Date().toISOString()
        },
        {
            id: 'item_5',
            name: 'Toilet Paper',
            category: 'household',
            priority: true,
            checked: false,
            addedDate: new Date().toISOString()
        }
    ];
}

/**
 * Get shopping list
 */
function getShoppingList() {
    const listStr = localStorage.getItem(STORAGE_KEYS.SHOPPING_LIST);
    
    if (!listStr) {
        const defaultList = getDefaultShoppingItems();
        localStorage.setItem(STORAGE_KEYS.SHOPPING_LIST, JSON.stringify(defaultList));
        return defaultList;
    }
    
    try {
        return JSON.parse(listStr);
    } catch (error) {
        console.error('Error parsing shopping list:', error);
        return getDefaultShoppingItems();
    }
}

/**
 * Save shopping list
 */
function saveShoppingList(items) {
    localStorage.setItem(STORAGE_KEYS.SHOPPING_LIST, JSON.stringify(items));
}

/**
 * Toggle item checked state
 */
function toggleItemChecked(itemId) {
    const items = getShoppingList();
    const item = items.find(i => i.id === itemId);
    
    if (item) {
        item.checked = !item.checked;
        saveShoppingList(items);
        displayShoppingList(currentFilter);
        
        if (item.checked) {
            showToast(`✓ ${item.name} noted`, 'success');
        }
    }
}

// Current filter
let currentFilter = 'all';

/**
 * Display shopping list
 */
function displayShoppingList(filter = 'all') {
    const items = getShoppingList();
    const container = document.getElementById('shoppingList');
    const emptyState = document.getElementById('emptyShoppingList');
    
    // Filter items
    let filteredItems = items;
    if (filter !== 'all') {
        filteredItems = items.filter(item => item.category === filter);
    }
    
    // Check if empty
    if (filteredItems.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    container.style.display = 'grid';
    emptyState.style.display = 'none';
    
    // Sort: priority first, then unchecked first
    filteredItems.sort((a, b) => {
        if (a.priority !== b.priority) return b.priority ? 1 : -1;
        if (a.checked !== b.checked) return a.checked ? 1 : -1;
        return 0;
    });
    
    // Generate HTML
    container.innerHTML = filteredItems.map((item, index) => `
        <div class="shopping-item ${item.checked ? 'checked' : ''}" 
             style="animation-delay: ${index * 0.05}s"
             data-item-id="${item.id}">
            <div class="item-checkbox ${item.checked ? 'checked' : ''}" 
                 onclick="toggleItemChecked('${item.id}')">
                ${item.checked ? '<i class="fas fa-check"></i>' : ''}
            </div>
            <div class="item-details">
                <div class="item-name">${item.name}</div>
                <span class="item-category">${item.category}</span>
            </div>
            ${item.priority ? '<i class="fas fa-star item-priority"></i>' : ''}
        </div>
    `).join('');
}

// ========== FILTERS ==========

/**
 * Setup filter buttons
 */
function setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Update active state
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Get filter value
            const filter = this.dataset.filter;
            currentFilter = filter;
            
            // Display filtered list
            displayShoppingList(filter);
        });
    });
}

// ========== THEME TOGGLE ==========

/**
 * Setup theme toggle
 */
function setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const currentTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
    
    // Set initial theme
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);
    
    themeToggle.addEventListener('click', function() {
        const theme = document.documentElement.getAttribute('data-theme');
        const newTheme = theme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
        updateThemeIcon(newTheme);
        
        showToast(`${newTheme === 'dark' ? '🌙' : '☀️'} ${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} mode enabled`, 'success');
    });
}

/**
 * Update theme icon
 */
function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggle i');
    icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

// ========== USER MENU ==========

/**
 * Setup user menu dropdown
 */
function setupUserMenu() {
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Toggle dropdown
    userMenuBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        userDropdown.classList.toggle('active');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function() {
        userDropdown.classList.remove('active');
    });
    
    // Logout
    logoutBtn.addEventListener('click', function() {
        showToast('Logging out...', 'success');
        setTimeout(logout, 1000);
    });
}

// ========== PRINT SHOPPING LIST ==========

/**
 * Print shopping list
 */
function printShoppingList() {
    window.print();
    showToast('Preparing shopping list for print...', 'success');
}

// Setup print button
document.getElementById('printShoppingList').addEventListener('click', printShoppingList);

// ========== ACTIVITY TRACKING ==========

/**
 * Track user activity
 */
function trackActivity() {
    updateActivity();
    
    // Reset activity timer
    if (activityTimer) {
        clearTimeout(activityTimer);
    }
    
    // Set new timer
    activityTimer = setTimeout(() => {
        showToast('You\'ve been inactive. Logging out for security...', 'warning');
        setTimeout(logout, 3000);
    }, SESSION_TIMEOUT);
}

/**
 * Setup activity tracking
 */
function setupActivityTracking() {
    // Track user interactions
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
        document.addEventListener(event, trackActivity);
    });
    
    // Initial tracking
    trackActivity();
}

// ========== INITIALIZATION ==========

/**
 * Initialize dashboard
 */
function init() {
    console.log('🏠 KROUMA FAMILY - Dashboard initializing...');
    
    // Check authentication
    if (!checkAuth()) {
        return;
    }
    
    // Display user info
    displayUserInfo();
    
    // Update date and time
    updateDateTime();
    setInterval(updateDateTime, 1000); // Update every second
    
    // Display meals
    displayMeals();
    
    // Display shopping list
    displayShoppingList();
    
    // Setup filters
    setupFilters();
    
    // Setup theme toggle
    setupThemeToggle();
    
    // Setup user menu
    setupUserMenu();
    
    // Setup activity tracking
    setupActivityTracking();
    
    console.log('✅ Dashboard loaded successfully!');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// ========== EXPORTS (for testing) ==========
window.kroumaFamily = {
    toggleItemChecked,
    displayShoppingList,
    logout
};
