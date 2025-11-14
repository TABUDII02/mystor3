// admin.js

// --- Core Constants and Page Configuration ---

const ADMIN_MODE_KEY = 'isAdminMode';
const ADMIN_TOKEN_KEY = 'adminAuthToken'; 

// Backend API endpoints
const API_BASE_URL = 'https://mongodb-crud-api-ato3.onrender.com';
const ADMIN_LOGIN_API = `${API_BASE_URL}/api/admin/login`; 
const CUSTOMER_LIST_API = `${API_BASE_URL}/api/users`; 
const CUSTOMER_DELETE_API = `${API_BASE_URL}/api/users`; 
const PRODUCTS_API_URL = `${API_BASE_URL}/api/products`; 
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

// Global variables for DOM elements (initialized to null)
let globalProductGrid = null;
let globalProductForm = null;
let globalFormTitle = null;
let globalProductFormContainer = null;
let globalAdminLoginForm = null;
let globalLoginError = null;
let globalShowLoginFormBtn = null;
let globalCustomerListContainer = null;
let globalSalesReportContainer = null;


// --- Product Data Management Functions ---

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


// --- DOM Rendering & CRUD Functions ---
function createProductCardHTML(product, isAdmin = false) {
    let adminButtonsHTML = '';
    const stockQuantity = parseInt(product.stock) || 0;
    const isOutOfStock = stockQuantity <= 0;
    let actionButtonHTML;

    if (isAdmin) {
        adminButtonsHTML = `
            <p class="stock-info">Stock: **${stockQuantity}**</p>
            <div class="admin-buttons">
                <button class="edit-btn" data-id="${product.id}">✏️ Edit</button>
                <button class="delete-btn" data-id="${product.id}">❌ Delete</button>
            </div>
        `;
        actionButtonHTML = '<button disabled style="opacity: 0.7;">Add to Cart (Admin)</button>'; 
    } else {
        if (isOutOfStock) {
            actionButtonHTML = '<button disabled style="background-color: #f44336; opacity: 1; cursor: default;">Out of Stock</button>';
        } else {
            actionButtonHTML = `
                <div class="cart-controls">
                    <label for="qty-${product.id}">Qty:</label>
                    <input type="number" id="qty-${product.id}" class="product-quantity" value="1" min="1" max="${stockQuantity > 0 ? stockQuantity : 1}" style="width: 50px; margin-right: 10px;">
                    <button class="add-to-cart-btn" data-id="${product.id}">Add to Cart</button>
                </div>
            `;
        }
    }

    const formattedPrice = `$${parseFloat(product.price).toFixed(2)}`;

    return `
        <div class="product-card" data-product-id="${product.id}">
            <img src="${product.image}" alt="${product.name} Image">
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="description">${product.description}</p>
                <p class="price">${formattedPrice}</p>
                ${actionButtonHTML} 
                ${adminButtonsHTML}
            </div>
        </div>
    `;
}

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

    const isEditing = !!productData.id;
    const url = isEditing ? `${PRODUCTS_API_URL}/${productData.id}` : PRODUCTS_API_URL;
    const method = isEditing ? 'PUT' : 'POST';

    const token = localStorage.getItem(ADMIN_TOKEN_KEY);

    if (!token) {
        alert("Authentication error. Please re-login.");
        return;
    }

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(productData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `Server responded with status ${response.status}`);
        }

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

async function handleDeleteProduct(e) {
    const productId = e.target.dataset.id;
    if (!confirm('Are you sure you want to move this product to trash?')) {
        return;
    }

    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    const url = `${PRODUCTS_API_URL}/${productId}`;

    try {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `Server responded with status ${response.status}`);
        }

        alert(`Product '${productId}' successfully moved to trash!`);
        
        await fetchAndRenderProducts(true); 

    } catch (error) {
        console.error("Error deleting product:", error);
        alert(`Failed to delete product: ${error.message}`);
    }
}


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


// --- Customer Management ---

async function fetchCustomerList() {
    const customerListContainer = globalCustomerListContainer;
    if (!customerListContainer) return;

    customerListContainer.innerHTML = '<h3>Customer List (Loading...)</h3>';
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);

    if (!token) {
        customerListContainer.innerHTML = '<h3>Customer List</h3><p class="error">Access token missing. Please log in.</p>';
        return;
    }

    try {
        const response = await fetch(CUSTOMER_LIST_API, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}` 
            },
        });

        const data = await response.json();

        if (response.ok) {
            let html = '<h3>Registered Customers</h3>';
            
            if (data.length === 0) {
                html += '<p>No customers registered yet.</p>';
            } else {
                html += '<table><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Actions</th></tr></thead><tbody>';
                data.forEach(user => {
                    html += `
                        <tr>
                            <td>${user._id.slice(-6)}</td>
                            <td>${user.name}</td>
                            <td>${user.email}</td>
                            <td><button class="primary-btn delete-customer-btn" data-id="${user._id}">Delete</button></td>
                        </tr>
                    `;
                });
                html += '</tbody></table>';
            }
            customerListContainer.innerHTML = html;
            
            // ATTACH DELETE LISTENERS
            document.querySelectorAll('.delete-customer-btn').forEach(button => {
                button.addEventListener('click', handleDeleteCustomer);
            });
            
        } else {
            customerListContainer.innerHTML = `<h3>Customer List</h3><p class="error">Failed to fetch data: ${data.error || 'Server error.'}</p>`;
            console.error('API Error:', data.error);
        }

    } catch (error) {
        console.error('Network Error:', error);
        customerListContainer.innerHTML = '<h3>Customer List</h3><p class="error">Network error. Is the backend running?</p>';
    }
}


// Handle Customer Deletion
async function handleDeleteCustomer(e) {
    const userId = e.target.dataset.id;
    if (!confirm(`Are you sure you want to permanently delete customer ID: ${userId.slice(-6)}? This action cannot be undone.`)) {
        return;
    }

    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    // Assumes the DELETE API endpoint is CUSTOMER_DELETE_API/:id
    const url = `${CUSTOMER_DELETE_API}/${userId}`; 

    try {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `Server responded with status ${response.status}`);
        }

        alert(`Customer account '${userId.slice(-6)}' successfully deleted!`);
        
        // Refresh the customer list table
        await fetchCustomerList(); 

    } catch (error) {
        console.error("Error deleting customer:", error);
        alert(`Failed to delete customer: ${error.message}`);
    }
}

// Fetch and Render Sales Report
async function fetchSalesReport() {
    const salesReportContainer = globalSalesReportContainer;
    if (!salesReportContainer) return;

    salesReportContainer.innerHTML = '<p>Loading sales data...</p>';
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);

    if (!token) {
        salesReportContainer.innerHTML = '<p class="error">Access token missing. Cannot load sales data.</p>';
        return;
    }

    try {
        // NOTE: This assumes your backend returns an array of sales records or a summary
        const response = await fetch(SALES_REPORT_API, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const salesData = await response.json();

        if (response.ok) {
            if (salesData.length === 0) {
                salesReportContainer.innerHTML = '<h4>No sales records found yet.</h4>';
                return;
            }

            let tableHTML = '<table><thead><tr><th>Product ID</th><th>Name</th><th>Units Sold</th><th>Total Revenue ($)</th></tr></thead><tbody>';

            salesData.forEach(item => {
                // Adjust property names based on your actual backend response structure
                const totalRevenue = parseFloat(item.totalRevenue || 0).toFixed(2);
                
                tableHTML += `
                    <tr>
                        <td>${item.productId?.slice(-6) || 'N/A'}</td>
                        <td>${item.productName || 'Unknown Product'}</td>
                        <td>${item.totalUnitsSold || 0}</td>
                        <td>$${totalRevenue}</td>
                    </tr>
                `;
            });

            tableHTML += '</tbody></table>';
            salesReportContainer.innerHTML = tableHTML;

        } else {
            salesReportContainer.innerHTML = `<p class="error">Failed to load sales data: ${salesData.error || 'Server error.'}</p>`;
        }

    } catch (error) {
        console.error('Network Error fetching sales report:', error);
        salesReportContainer.innerHTML = '<p class="error">Network error. Failed to connect to sales API.</p>';
    }
}


function toggleAdminMode(enable, token = null) {
    if (enable && token) {
        localStorage.setItem(ADMIN_TOKEN_KEY, token);
        localStorage.removeItem(ADMIN_MODE_KEY); 
        
        // FIXED REDIRECTION LOGIC
        if (CURRENT_PAGE_NAME === STORE_PAGE_NAME || CURRENT_PAGE_NAME === AUTH_PAGE_NAME || CURRENT_PAGE_NAME === ADMIN_LOGIN_PAGE_NAME || CURRENT_PAGE_NAME === '') {
            console.log("Admin login successful. Redirecting to dashboard.");
            window.location.href = getAdminDashboardPath(); 
            return;
        }
        if (CURRENT_PAGE_NAME === ADMIN_DASHBOARD_PAGE_NAME) {
            fetchAndRenderProducts(true); 
        }

    } else {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        localStorage.removeItem('adminUser'); 
        localStorage.removeItem(ADMIN_MODE_KEY); 
        
        if (CURRENT_PAGE_NAME === ADMIN_DASHBOARD_PAGE_NAME) {
            console.log("Admin logged out. Redirecting to store.");
            window.location.href = getStorePagePath();
            return;
        }
        window.location.href = getStorePagePath();
    }
}

const handleAdminLogin = async (e) => {
    e.preventDefault();
    const adminLoginForm = globalAdminLoginForm;
    const loginError = globalLoginError;

    if (!adminLoginForm || !loginError) return;

    loginError.textContent = '';
    loginError.style.display = 'none';

    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;

    if (!email || !password) {
        loginError.textContent = "Please enter both email and password.";
        loginError.style.display = 'block';
        return;
    }

    const credentials = { email, password };

    try {
        const response = await fetch(ADMIN_LOGIN_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
            localStorage.setItem('adminUser', JSON.stringify(data.user)); 
            
            toggleAdminMode(true, data.token);

        } else {
            loginError.textContent = data.error || 'Login failed. Please check your credentials.';
            loginError.style.display = 'block';
        }

    } catch (error) {
        console.error("Admin Login Fetch Error:", error);
        loginError.textContent = 'A server or network error occurred during login.';
        loginError.style.display = 'block';
    }
};


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
        fetchSalesReport(); 

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
