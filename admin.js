// admin.js

// --- Core Constants and Page Configuration (UPDATED) ---

const ADMIN_MODE_KEY = 'isAdminMode';
const ADMIN_TOKEN_KEY = 'adminAuthToken'; 

// Backend API endpoints (UPDATED: Added Sales and Customer Delete API)
const API_BASE_URL = 'https://mongodb-crud-api-ato3.onrender.com';
const ADMIN_LOGIN_API = `${API_BASE_URL}/api/admin/login`; 
const CUSTOMER_LIST_API = `${API_BASE_URL}/api/users`; 
const CUSTOMER_DELETE_API = `${API_BASE_URL}/api/users`; // Assumes DELETE /api/users/:id
const PRODUCTS_API_URL = `${API_BASE_URL}/api/products`; 
// ⭐ NEW API ENDPOINT
const SALES_REPORT_API = `${API_BASE_URL}/api/sales/report`; 


// Define page paths using ONLY the filename for consistent comparison
const STORE_PAGE_NAME = 'index.html';
const ADMIN_DASHBOARD_PAGE_NAME = 'admindashboard.html'; 
const ADMIN_LOGIN_PAGE_NAME = 'admin-login.html'; 
const AUTH_PAGE_NAME = 'auth.html'; 

// Calculate the current page filename
const CURRENT_PAGE_NAME = window.location.pathname.split('/').pop() || STORE_PAGE_NAME; 

// Helper function to get the correct path for redirection
const getAdminDashboardPath = () => `/${ADMIN_DASHBOARD_PAGE_NAME}`;
const getStorePagePath = () => `/${STORE_PAGE_NAME}`; 
const getAuthPagePath = () => `/${AUTH_PAGE_NAME}`; 
const getAdminLoginPagePath = () => `/${ADMIN_LOGIN_PAGE_NAME}`; 

// Global variables for DOM elements (initialized to null for use in functions)
let globalProductGrid = null;
let globalProductForm = null;
let globalFormTitle = null;
let globalProductFormContainer = null;
let globalAdminLoginForm = null;
let globalLoginError = null;
let globalShowLoginFormBtn = null;
let globalCustomerListContainer = null;
let globalSalesReportContainer = null;


// --- Product Data Management Functions (UPDATED to use global variables) ---

/**
 * Renders products fetched from the server and attaches event listeners.
 * @param {boolean} isAdmin - True if running on the dashboard (show CRUD buttons).
 */
async function fetchAndRenderProducts(isAdmin = false) {
    // Use the global variable assigned in DOMContentLoaded
    const productGrid = globalProductGrid;

    if (!productGrid) {
        console.warn(`Attempted to fetch products, but productGrid element was not found on page: ${CURRENT_PAGE_NAME}`);
        return; 
    }

    // Clear and set loading state
    productGrid.innerHTML = isAdmin ? '<p>Loading products...</p>' : '<h2>🔥 Top Picks & New Arrivals (Loading...)</h2>';
    productGrid.classList.toggle('admin-mode', isAdmin);

    try {
        const response = await fetch(PRODUCTS_API_URL); 
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const products = await response.json(); 
        
        productGrid.innerHTML = isAdmin ? '' : '<h2>🔥 Top Picks & New Arrivals</h2>';
        
        if (products.length === 0) {
            productGrid.innerHTML += '<p>No products found in the database.</p>';
            return;
        }

        products.forEach(product => {
            productGrid.innerHTML += createProductCardHTML(product, isAdmin);
        });

        if (isAdmin) {
            document.querySelectorAll('.product-card .edit-btn').forEach(button => {
                button.addEventListener('click', handleEditProduct);
            });
            document.querySelectorAll('.product-card .delete-btn').forEach(button => {
                button.addEventListener('click', handleDeleteProduct); 
            });
        }

    } catch (error) {
        console.error("Failed to load products from API:", error);
        productGrid.innerHTML = `<p class="error-message">Could not load products. Please ensure the backend is running. Error: ${error.message}</p>`;
    }
}


// --- DOM Rendering & CRUD Functions (Using new global variables) ---
// ... (createProductCardHTML remains the same)

async function handleFormSubmit(e) {
    e.preventDefault();
    const productForm = globalProductForm;
    const productFormContainer = globalProductFormContainer;

    const formData = new FormData(productForm);
    const productData = {
        id: formData.get('id') || undefined,
        name: formData.get('name'),
        image: formData.get('image'),
        description: formData.get('description'),
        price: parseFloat(formData.get('price')),
        stock: parseInt(formData.get('stock'))
    };

    // ... (rest of handleFormSubmit remains the same)
        alert(`Product ${isEditing ? 'updated' : 'created'} successfully!`);
        hideProductForm();
        
        await fetchAndRenderProducts(true); 

    } catch (error) {
        console.error(`Error ${isEditing ? 'updating' : 'creating'} product:`, error);
        alert(`Failed to save product: ${error.message}`);
    }
}

function handleEditProduct(e) {
    const formTitle = globalFormTitle;
    const productFormContainer = globalProductFormContainer;

    const productId = e.target.dataset.id;
    const card = e.target.closest('.product-card');
    
    if (card) {
        const name = card.querySelector('h3').textContent;
        const description = card.querySelector('.description').textContent;
        const priceText = card.querySelector('.price').textContent;
        const price = parseFloat(priceText.replace('$', ''));
        const image = card.querySelector('img').src.split('/').pop();
        const stockText = card.querySelector('.stock-info')?.textContent;
        const stock = stockText ? parseInt(stockText.split('**')[1].trim()) : 0;


        formTitle.textContent = 'Edit';
        document.getElementById('product-id').value = productId;
        document.getElementById('product-name').value = name;
        document.getElementById('product-image').value = image;
        document.getElementById('product-description').value = description;
        document.getElementById('product-price').value = price;
        document.getElementById('product-stock').value = stock;
        
        productFormContainer.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ... (handleDeleteProduct remains the same)

function setupAddProductForm() {
    const formTitle = globalFormTitle;
    const productForm = globalProductForm;
    const productFormContainer = globalProductFormContainer;

    formTitle.textContent = 'Add New';
    productForm.reset();
    document.getElementById('product-id').value = '';
    productFormContainer.style.display = 'block';
}

function hideProductForm() {
    const productForm = globalProductForm;
    const productFormContainer = globalProductFormContainer;

    productForm.reset();
    document.getElementById('product-id').value = '';
    productFormContainer.style.display = 'none';
}


// --- Customer Management (UPDATED to add delete button) ---

async function fetchCustomerList() {
    const customerListContainer = globalCustomerListContainer;
    if (!customerListContainer) return;

    customerListContainer.innerHTML = '<h3>Customer List (Loading...)</h3>';
// ... (rest of fetchCustomerList remains the same)
}

// ... (handleDeleteCustomer remains the same)

// ⭐ NEW FUNCTION: Fetch and Render Sales Report
async function fetchSalesReport() {
    const salesReportContainer = globalSalesReportContainer;
    if (!salesReportContainer) return;

    salesReportContainer.innerHTML = '<p>Loading sales data...</p>';
// ... (rest of fetchSalesReport remains the same)
}

// ... (toggleAdminMode and handleAdminLogin remain the same)


// --- Initialization (CRITICAL FIX APPLIED HERE) ---

document.addEventListener('DOMContentLoaded', () => {
    
    // ⭐ DOM LOOKUPS MOVED INSIDE DOMContentLoaded (CRITICAL FIX)
    if (CURRENT_PAGE_NAME === ADMIN_DASHBOARD_PAGE_NAME) {
        globalProductGrid = document.getElementById('products-list-container');
    } else if (CURRENT_PAGE_NAME === STORE_PAGE_NAME || CURRENT_PAGE_NAME === '') {
        globalProductGrid = document.getElementById('products');
    }

    // Assign remaining global variables
    globalProductFormContainer = document.getElementById('product-form-container');
    globalProductForm = document.getElementById('product-form');
    globalFormTitle = document.getElementById('form-title');
    globalAdminLoginForm = document.getElementById('admin-login-form');
    globalLoginError = document.getElementById('login-error'); 
    globalShowLoginFormBtn = document.getElementById('show-login-form-btn');
    globalCustomerListContainer = document.getElementById('customer-list-container');
    globalSalesReportContainer = document.getElementById('sales-report-container');


    const adminToken = localStorage.getItem(ADMIN_TOKEN_KEY);
    const isAdminLoggedIn = !!adminToken; 

    const showLoginFormBtn = globalShowLoginFormBtn; // Re-alias for local use

    // --- Store Page Logic (index.html) ---
    if (CURRENT_PAGE_NAME === STORE_PAGE_NAME || CURRENT_PAGE_NAME === '') {
        fetchAndRenderProducts(false); 
        
        if (showLoginFormBtn) {
            showLoginFormBtn.href = isAdminLoggedIn ? getAuthPagePath() : getAdminDashboardPath();
            showLoginFormBtn.textContent = isAdminLoggedIn ? 'Account / Login' : 'Admin Dashboard 🛑';
        }
    } 
    
    // --- Customer Auth Page Logic (auth.html) ---
    else if (CURRENT_PAGE_NAME === AUTH_PAGE_NAME) { 
        if (isAdminLoggedIn) {
            window.location.href = getAdminDashboardPath();
            return;
        }
    }
    
    // ⭐ ADMIN LOGIN ATTACHMENT (admin-login.html) ⭐
    const adminLoginForm = globalAdminLoginForm;
    if (adminLoginForm) {
        if (isAdminLoggedIn) {
            window.location.href = getAdminDashboardPath();
            return;
        }
        adminLoginForm.addEventListener('submit', handleAdminLogin);
        console.log("Admin Login Handler Attached successfully."); 
    }
    
    // --- Admin Dashboard Logic (admindashboard.html) ---
    else if (CURRENT_PAGE_NAME === ADMIN_DASHBOARD_PAGE_NAME) {
        const productForm = globalProductForm;

        // 🚨 Guardrail: If no token is found, redirect away to the login page
        if (!isAdminLoggedIn) {
            alert('Access Denied. Please log in.');
            window.location.href = getAdminLoginPagePath(); 
            return;
        }
        
        // Fetch Admin Data
        fetchAndRenderProducts(true);
        fetchCustomerList();
        fetchSalesReport(); // ⭐ CALL NEW SALES FUNCTION

        // Attach Logout listener
        const logoutBtn = document.getElementById('logout-admin-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                toggleAdminMode(false); 
                alert('Admin Mode Deactivated!');
                window.location.href = getStorePagePath(); 
            return;
            });
        }
        
        // Attach CRUD Form Event Listeners 
        if (productForm) {
            document.getElementById('show-add-product-form-btn').addEventListener('click', setupAddProductForm);
            document.getElementById('cancel-form-btn').addEventListener('click', hideProductForm);
            productForm.addEventListener('submit', handleFormSubmit); 
        }
    }
});
