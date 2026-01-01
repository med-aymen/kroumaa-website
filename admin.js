/**
 * KROUMA FAMILY - Admin Module
 * Handles admin dashboard functionality and data management
 */

// ========== CONSTANTS ==========
const STORAGE_KEYS = {
    USERS: 'krouma_users',
    ADMIN_SESSION: 'krouma_admin_session',
    MEALS: 'krouma_meals',
    SHOPPING_LIST: 'krouma_shopping_list',
    THEME: 'krouma_theme'
};

let currentSection = 'dashboard';
let editingItemId = null;

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
 * Get today's date key
 */
function getTodayKey() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

/**
 * Generate unique ID
 */
function generateId() {
    return 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ========== AUTHENTICATION ==========

/**
 * Check admin authentication
 */
function checkAdminAuth() {
    const adminSessionStr = localStorage.getItem(STORAGE_KEYS.ADMIN_SESSION);
    
    if (!adminSessionStr) {
        window.location.href = 'index.html';
        return false;
    }
    
    try {
        const session = JSON.parse(adminSessionStr);
        return session.isAdmin === true;
    } catch (error) {
        console.error('Error parsing admin session:', error);
        window.location.href = 'index.html';
        return false;
    }
}

/**
 * Logout admin
 */
function adminLogout() {
    localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
    showToast('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// ========== NAVIGATION ==========

/**
 * Setup sidebar navigation
 */
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    const pageTitle = document.getElementById('pageTitle');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            const sectionId = this.dataset.section;
            
            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // Update active section
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(`${sectionId}Section`).classList.add('active');
            
            // Update page title
            const titles = {
                'dashboard': 'Dashboard',
                'meals': 'Manage Meals',
                'shopping': 'Shopping List',
                'users': 'Family Members'
            };
            pageTitle.textContent = titles[sectionId] || 'Dashboard';
            
            currentSection = sectionId;
            
            // Load section data
            loadSectionData(sectionId);
        });
    });
}

/**
 * Load data for current section
 */
function loadSectionData(sectionId) {
    switch(sectionId) {
        case 'dashboard':
            loadDashboardStats();
            loadCharts();
            break;
        case 'meals':
            loadMeals();
            break;
        case 'shopping':
            loadAdminShoppingList();
            break;
        case 'users':
            loadUsers();
            break;
    }
}

// ========== SIDEBAR TOGGLE ==========

/**
 * Setup sidebar toggle for mobile
 */
function setupSidebarToggle() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('adminSidebar');
    
    sidebarToggle.addEventListener('click', function() {
        sidebar.classList.toggle('collapsed');
    });
}

// ========== THEME TOGGLE ==========

/**
 * Setup theme toggle
 */
function setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const currentTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
    
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);
    
    themeToggle.addEventListener('click', function() {
        const theme = document.documentElement.getAttribute('data-theme');
        const newTheme = theme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
        updateThemeIcon(newTheme);
        
        showToast(`${newTheme === 'dark' ? '🌙' : '☀️'} ${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} mode`, 'success');
    });
}

/**
 * Update theme icon
 */
function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggle i');
    icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

// ========== DASHBOARD STATS ==========

/**
 * Load dashboard statistics
 */
function loadDashboardStats() {
    const users = getUsers();
    const shoppingList = getShoppingList();
    
    // Total users
    document.getElementById('totalUsers').textContent = users.length;
    
    // Today's meals (always 3)
    document.getElementById('todayMeals').textContent = '3';
    
    // Shopping items
    document.getElementById('shoppingItems').textContent = shoppingList.length;
    
    // Completion rate
    const checkedItems = shoppingList.filter(item => item.checked).length;
    const completionRate = shoppingList.length > 0 
        ? Math.round((checkedItems / shoppingList.length) * 100) 
        : 0;
    document.getElementById('completionRate').textContent = `${completionRate}%`;
}

/**
 * Load charts
 */
function loadCharts() {
    loadShoppingChart();
    loadActivityChart();
}

/**
 * Load shopping chart
 */
function loadShoppingChart() {
    const ctx = document.getElementById('shoppingChart');
    if (!ctx) return;
    
    const shoppingList = getShoppingList();
    
    // Count by category
    const categories = {
        groceries: 0,
        household: 0,
        personal: 0,
        other: 0
    };
    
    shoppingList.forEach(item => {
        categories[item.category] = (categories[item.category] || 0) + 1;
    });
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Groceries', 'Household', 'Personal', 'Other'],
            datasets: [{
                data: [
                    categories.groceries,
                    categories.household,
                    categories.personal,
                    categories.other
                ],
                backgroundColor: [
                    '#d4856f',
                    '#7a9d96',
                    '#f4c542',
                    '#6b8e9f'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            family: 'Karla',
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

/**
 * Load activity chart
 */
function loadActivityChart() {
    const ctx = document.getElementById('activityChart');
    if (!ctx) return;
    
    const users = getUsers();
    
    // Get last 7 days
    const days = [];
    const loginCounts = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        
        // Simulate activity (in real app, track actual logins)
        loginCounts.push(Math.floor(Math.random() * 5) + 1);
    }
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: days,
            datasets: [{
                label: 'Family Activity',
                data: loginCounts,
                borderColor: '#d4856f',
                backgroundColor: 'rgba(212, 133, 111, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#d4856f',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: {
                            family: 'Karla'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        font: {
                            family: 'Karla'
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// ========== MEALS MANAGEMENT ==========

/**
 * Get meals data
 */
function getMeals() {
    const mealsStr = localStorage.getItem(STORAGE_KEYS.MEALS);
    return mealsStr ? JSON.parse(mealsStr) : {};
}

/**
 * Save meals data
 */
function saveMeals(meals) {
    localStorage.setItem(STORAGE_KEYS.MEALS, JSON.stringify(meals));
}

/**
 * Load meals into form
 */
function loadMeals() {
    const allMeals = getMeals();
    const todayKey = getTodayKey();
    const todayMeals = allMeals[todayKey] || {
        breakfast: { time: '08:00', description: '' },
        lunch: { time: '12:30', description: '' },
        dinner: { time: '19:00', description: '' }
    };
    
    // Breakfast
    document.getElementById('breakfastTimeInput').value = todayMeals.breakfast.time;
    document.getElementById('breakfastDescInput').value = todayMeals.breakfast.description;
    
    // Lunch
    document.getElementById('lunchTimeInput').value = todayMeals.lunch.time;
    document.getElementById('lunchDescInput').value = todayMeals.lunch.description;
    
    // Dinner
    document.getElementById('dinnerTimeInput').value = todayMeals.dinner.time;
    document.getElementById('dinnerDescInput').value = todayMeals.dinner.description;
}

/**
 * Setup meal forms
 */
function setupMealForms() {
    const forms = document.querySelectorAll('.meal-form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const mealType = this.dataset.meal;
            const timeInput = document.getElementById(`${mealType}TimeInput`);
            const descInput = document.getElementById(`${mealType}DescInput`);
            
            // Get all meals
            const allMeals = getMeals();
            const todayKey = getTodayKey();
            
            if (!allMeals[todayKey]) {
                allMeals[todayKey] = {};
            }
            
            // Update meal
            allMeals[todayKey][mealType] = {
                time: timeInput.value,
                description: descInput.value
            };
            
            // Save
            saveMeals(allMeals);
            
            // Show success message
            showToast(`${mealType.charAt(0).toUpperCase() + mealType.slice(1)} updated successfully!`, 'success');
        });
    });
}

// ========== SHOPPING LIST MANAGEMENT ==========

/**
 * Get shopping list
 */
function getShoppingList() {
    const listStr = localStorage.getItem(STORAGE_KEYS.SHOPPING_LIST);
    return listStr ? JSON.parse(listStr) : [];
}

/**
 * Save shopping list
 */
function saveShoppingList(items) {
    localStorage.setItem(STORAGE_KEYS.SHOPPING_LIST, JSON.stringify(items));
}

/**
 * Load admin shopping list
 */
function loadAdminShoppingList(searchTerm = '') {
    const items = getShoppingList();
    const container = document.getElementById('adminShoppingList');
    
    // Filter by search
    let filteredItems = items;
    if (searchTerm) {
        filteredItems = items.filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    if (filteredItems.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No items found</p></div>';
        return;
    }
    
    // Generate HTML
    container.innerHTML = filteredItems.map(item => `
        <div class="admin-shopping-item">
            <div class="item-details">
                <div class="item-name">
                    ${item.name}
                    ${item.priority ? '<i class="fas fa-star" style="color: #f4c542; margin-left: 0.5rem;"></i>' : ''}
                </div>
                <span class="item-category">${item.category}</span>
            </div>
            <div class="item-actions">
                <button class="btn-edit" onclick="editItem('${item.id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete" onclick="deleteItem('${item.id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * Open add item modal
 */
function openAddItemModal() {
    const modal = document.getElementById('itemModal');
    const modalTitle = document.getElementById('itemModalTitle');
    const form = document.getElementById('itemForm');
    
    modalTitle.textContent = 'Add Shopping Item';
    form.reset();
    document.getElementById('itemId').value = '';
    editingItemId = null;
    
    modal.classList.add('active');
    document.getElementById('itemName').focus();
}

/**
 * Edit item
 */
function editItem(itemId) {
    const items = getShoppingList();
    const item = items.find(i => i.id === itemId);
    
    if (!item) return;
    
    const modal = document.getElementById('itemModal');
    const modalTitle = document.getElementById('itemModalTitle');
    
    modalTitle.textContent = 'Edit Shopping Item';
    document.getElementById('itemId').value = item.id;
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemCategory').value = item.category;
    document.getElementById('itemPriority').checked = item.priority;
    
    editingItemId = itemId;
    modal.classList.add('active');
    document.getElementById('itemName').focus();
}

/**
 * Delete item
 */
function deleteItem(itemId) {
    if (!confirm('Are you sure you want to delete this item?')) {
        return;
    }
    
    let items = getShoppingList();
    items = items.filter(i => i.id !== itemId);
    saveShoppingList(items);
    
    loadAdminShoppingList();
    loadDashboardStats();
    showToast('Item deleted successfully', 'success');
}

/**
 * Setup item modal
 */
function setupItemModal() {
    const modal = document.getElementById('itemModal');
    const addItemBtn = document.getElementById('addItemBtn');
    const closeModalBtn = document.getElementById('closeItemModal');
    const cancelBtn = document.getElementById('cancelItemBtn');
    const itemForm = document.getElementById('itemForm');
    
    // Open modal
    addItemBtn.addEventListener('click', openAddItemModal);
    
    // Close modal
    const closeModal = () => {
        modal.classList.remove('active');
        itemForm.reset();
        editingItemId = null;
    };
    
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    // Close on outside click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Form submission
    itemForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const itemId = document.getElementById('itemId').value;
        const name = document.getElementById('itemName').value.trim();
        const category = document.getElementById('itemCategory').value;
        const priority = document.getElementById('itemPriority').checked;
        
        let items = getShoppingList();
        
        if (itemId) {
            // Update existing item
            const item = items.find(i => i.id === itemId);
            if (item) {
                item.name = name;
                item.category = category;
                item.priority = priority;
            }
            showToast('Item updated successfully', 'success');
        } else {
            // Add new item
            items.push({
                id: generateId(),
                name: name,
                category: category,
                priority: priority,
                checked: false,
                addedDate: new Date().toISOString()
            });
            showToast('Item added successfully', 'success');
        }
        
        saveShoppingList(items);
        loadAdminShoppingList();
        loadDashboardStats();
        closeModal();
    });
}

/**
 * Setup search
 */
function setupSearch() {
    const searchInput = document.getElementById('searchItems');
    
    searchInput.addEventListener('input', function() {
        loadAdminShoppingList(this.value);
    });
}

// ========== USERS MANAGEMENT ==========

/**
 * Get users
 */
function getUsers() {
    const usersStr = localStorage.getItem(STORAGE_KEYS.USERS);
    return usersStr ? JSON.parse(usersStr) : [];
}

/**
 * Load users table
 */
function loadUsers() {
    const users = getUsers();
    const tbody = document.getElementById('usersTableBody');
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--gray);">No family members yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = users.map(user => {
        const lastLogin = new Date(user.lastLogin);
        const now = new Date();
        const diffTime = Math.abs(now - lastLogin);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let lastLoginText = '';
        if (diffDays === 0) {
            lastLoginText = 'Today';
        } else if (diffDays === 1) {
            lastLoginText = 'Yesterday';
        } else {
            lastLoginText = `${diffDays} days ago`;
        }
        
        const isActive = diffDays <= 7;
        
        return `
            <tr>
                <td>${user.firstName} ${user.lastName}</td>
                <td>${lastLoginText}</td>
                <td>
                    <span class="status-badge ${isActive ? 'status-active' : 'status-inactive'}">
                        ${isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

// ========== DATA EXPORT ==========

/**
 * Export all data
 */
function exportData() {
    const data = {
        users: getUsers(),
        meals: getMeals(),
        shoppingList: getShoppingList(),
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `krouma-family-data-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Data exported successfully', 'success');
}

// Setup export button
document.getElementById('exportDataBtn').addEventListener('click', exportData);

// ========== LOGOUT ==========

// Setup logout button
document.getElementById('adminLogoutBtn').addEventListener('click', function() {
    if (confirm('Are you sure you want to logout?')) {
        adminLogout();
    }
});

// ========== INITIALIZATION ==========

/**
 * Initialize admin dashboard
 */
function init() {
    console.log('🏠 KROUMA FAMILY - Admin Dashboard initializing...');
    
    // Check authentication
    if (!checkAdminAuth()) {
        return;
    }
    
    // Setup navigation
    setupNavigation();
    
    // Setup sidebar toggle
    setupSidebarToggle();
    
    // Setup theme toggle
    setupThemeToggle();
    
    // Setup meal forms
    setupMealForms();
    
    // Setup item modal
    setupItemModal();
    
    // Setup search
    setupSearch();
    
    // Load initial data
    loadDashboardStats();
    loadCharts();
    
    console.log('✅ Admin dashboard loaded successfully!');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// ========== GLOBAL FUNCTIONS ==========
// Make these available globally for onclick handlers
window.editItem = editItem;
window.deleteItem = deleteItem;
