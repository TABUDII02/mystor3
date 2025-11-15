// admin.js

// --- Core Constants and Page Configuration ---

const ADMIN_MODE_KEY = 'isAdminMode';
const ADMIN_TOKEN_KEY = 'adminAuthToken'; 

// Backend API endpoints (UPDATED with your Render URL)
const API_BASE_URL = 'https://mongodb-crud-api-ato3.onrender.com/api';
const ADMIN_LOGIN_API = `${API_BASE_URL}/admin/login`; 
const CUSTOMER_LIST_API = `${API_BASE_URL}/users`; 
const CUSTOMER_DELETE_API = `${API_BASE_URL}/users`; 
const PRODUCTS_API_URL = `${API_BASE_URL}/products`; 
// ⭐ Dedicated API for Admin product listing
const ADMIN_PRODUCTS_API_URL = `${API_BASE_URL}/admin/products`; 
const SALES_REPORT_API = `${API_BASE_URL}/sales/report`; 


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


// --- DOM References (Initialized safely in DOMContentLoaded where possible) ---
let productGrid = null; 
const productFormContainer = document.getElementById('product-form-container');
const productForm = document.getElementById('product-form');
const formTitle = document.getElementById('form-title');
const adminLoginForm = document.getElementById('admin-login-form');
const loginError = document.getElementById('login-error'); 
const showLoginFormBtn = document.getElementById('auth-link');
const customerListContainer = document.getElementById('customer-list-container');
const salesReportContainer = document.getElementById('sales-report-container');


// --- Core Authentication and Redirection Logic ---

function toggleAdminMode(enable, token = null) {
    if (enable && token) {
        localStorage.setItem(ADMIN_TOKEN_KEY, token);
        localStorage.removeItem(ADMIN_MODE_KEY); 
        
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

// --- Product Data Management Functions ---

function createProductCardHTML(product, isAdmin = false) {
    let adminButtonsHTML = '';
    const stockQuantity = parseInt(product.stock) || 0;
    const isOutOfStock = stockQuantity <= 0;
    let actionButtonHTML;
    
    const productId = product.id || product._id; 

    if (isAdmin) {
        // Admin mode always shows stock and CRUD buttons
        adminButtonsHTML = `
            <p class="stock-info">Stock: **${stockQuantity}**</p>
            <div class="admin-buttons">
                <button class="edit-btn" data-id="${productId}">✏️ Edit</button>
                <button class="delete-btn" data-id="${productId}">❌ Delete</button>
            </div>
        `;
        actionButtonHTML = '<button disabled style="opacity: 0.7;">Add to Cart (Admin)</button>'; 
    } else {
        // Public mode shows stock status and Add to Cart
        if (isOutOfStock) {
            actionButtonHTML = '<button disabled style="background-color: #f44336; opacity: 1; cursor: default;">Out of Stock</button>';
        } else {
            actionButtonHTML = `
                <div class="cart-controls">
                    <label for="qty-${productId}">Qty:</label>
                    <input type="number" id="qty-${productId}" class="product-quantity" value="1" min="1" max="${stockQuantity > 0 ? stockQuantity : 1}" style="width: 50px; margin-right: 10px;">
                    <button class="add-to-cart-btn" data-id="${productId}">Add to Cart</button>
                </div>
            `;
        }
    }

    const formattedPrice = `$${parseFloat(product.price).toFixed(2)}`;

    return `
        <div class="product-card" data-product-id="${productId}">
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

// Fetches and Renders products using the appropriate API route (public or admin)
async function fetchAndRenderProducts(isAdmin = false) {
    let currentProductGrid = productGrid; 

    if (!currentProductGrid) {
        if (isAdmin) {
            currentProductGrid = document.getElementById('products-list-container');
        } else {
            currentProductGrid = document.getElementById('products');
        }
    }

    if (!currentProductGrid) {
        console.error(`ERROR: Product grid element was not found for page: ${CURRENT_PAGE_NAME}.`);
        return; 
    }

    currentProductGrid.innerHTML = isAdmin ? '<p>Loading products for Admin Dashboard...</p>' : '<h2>🔥 Top Picks & New Arrivals (Loading...)</h2>';
    currentProductGrid.classList.toggle('admin-mode', isAdmin);

    let fetchUrl = PRODUCTS_API_URL;
    const fetchHeaders = {};
    
    if (isAdmin) {
        // Use the protected Admin route for the dashboard
        fetchUrl = ADMIN_PRODUCTS_API_URL; 
        const token = localStorage.getItem(ADMIN_TOKEN_KEY);

        if (!token) {
            currentProductGrid.innerHTML = '<p class="error-message">Admin Token missing. Redirecting to login...</p>';
            setTimeout(() => window.location.href = getAdminLoginPagePath(), 1000);
            return;
        }
        
        // Include Authorization header for the protected route
        fetchHeaders['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(fetchUrl, {
            method: 'GET',
            headers: fetchHeaders
        }); 
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP error! Status: ${response.status}. Error: ${errorData.error || 'Unknown server error.'}`);
        }
        
        const data = await response.json(); 
        
        let products = Array.isArray(data) ? data : data.products || data.data || [];
        
        currentProductGrid.innerHTML = isAdmin ? '' : '<h2>🔥 Top Picks & New Arrivals</h2>';
        
        if (products.length === 0) {
            currentProductGrid.innerHTML += '<p>No active products found in the database. Add new products via the form in the dashboard.</p>';
            return;
        }

        products.forEach(product => {
            currentProductGrid.innerHTML += createProductCardHTML(product, isAdmin);
        });

        if (isAdmin) {
            // Attach Admin CRUD listeners
            document.querySelectorAll('.product-card .edit-btn').forEach(button => {
                button.addEventListener('click', handleEditProduct);
            });
            document.querySelectorAll('.product-card .delete-btn').forEach(button => {
                button.addEventListener('click', handleDeleteProduct); 
            });
        }
        // NOTE: Add-to-cart listeners (for !isAdmin) are typically handled in a separate `store.js` or global script.

    } catch (error) {
        console.error("Failed to load products from API:", error);
        currentProductGrid.innerHTML = `<p class="error-message">Could not load products. Error: ${error.message}</p>`;
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(productForm);
    // Use the hidden 'product-id' field value
    const productId = document.getElementById('product-id').value || undefined; 
    
    const productData = {
        id: productId, // Send the custom string 'id'
        name: formData.get('name'),
        image: formData.get('image'),
        description: formData.get('description'),
        price: parseFloat(formData.get('price')),
        stock: parseInt(formData.get('stock'))
    };

    const isEditing = !!productId;
    const url = isEditing ? `${PRODUCTS_API_URL}/${productId}` : PRODUCTS_API_URL;
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

async function handleEditProduct(e) {
    const productId = e.target.dataset.id;
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);

    if (!token) {
        alert("Authentication error. Please re-login.");
        return;
    }

    try {
        // Fetch single product data using the public endpoint (it handles auth for admin)
        const response = await fetch(`${PRODUCTS_API_URL}/${productId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}` 
            },
        });

        const product = await response.json();

        if (!response.ok) {
            throw new Error(product.error || `Server responded with status ${response.status}`);
        }
        
        formTitle.textContent = 'Edit Product';
        // Populate form fields
        document.getElementById('product-id').value = product.id;
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-image').value = product.image;
        document.getElementById('product-description').value = product.description;
        document.getElementById('product-price').value = parseFloat(product.price).toFixed(2);
        document.getElementById('product-stock').value = parseInt(product.stock);
        
        productFormContainer.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
        console.error("Error fetching product for edit:", error);
        alert(`Failed to fetch product data for editing: ${error.message}`);
    }
}


async function handleDeleteProduct(e) {
    const productId = e.target.dataset.id;
    if (!confirm('Are you sure you want to move this product to trash (soft delete)?')) {
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

        alert(`Product successfully moved to trash!`);
        
        await fetchAndRenderProducts(true); 

    } catch (error) {
        console.error("Error deleting product:", error);
        alert(`Failed to delete product: ${error.message}`);
    }
}

function setupAddProductForm() {
    formTitle.textContent = 'Add New Product';
    productForm.reset();
    document.getElementById('product-id').value = '';
    productFormContainer.style.display = 'block';
}

function hideProductForm() {
    productForm.reset();
    document.getElementById('product-id').value = '';
    productFormContainer.style.display = 'none';
}


// --- Customer Management ---

async function fetchCustomerList() {
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
            
            const users = Array.isArray(data) ? data : data.users || data.data || [];

            if (users.length === 0) {
                html += '<p>No customers registered yet.</p>';
            } else {
                html += '<table class="customer-table"><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Actions</th></tr></thead><tbody>';
                users.forEach(user => {
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


async function handleDeleteCustomer(e) {
    const userId = e.target.dataset.id;
    if (!confirm(`Are you sure you want to permanently delete customer ID: ${userId.slice(-6)}? This action cannot be undone.`)) {
        return;
    }

    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
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
        
        await fetchCustomerList(); 

    } catch (error) {
        console.error("Error deleting customer:", error);
        alert(`Failed to delete customer: ${error.message}`);
    }
}

// --- Sales Report ---

async function fetchSalesReport() {
    if (!salesReportContainer) return;

    salesReportContainer.innerHTML = '<p>Loading sales data...</p>';
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);

    if (!token) {
        salesReportContainer.innerHTML = '<p class="error">Access token missing. Cannot load sales data.</p>';
        return;
    }

    try {
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

            let tableHTML = '<table class="sales-table"><thead><tr><th>Product ID</th><th>Name</th><th>Units Sold</th><th>Total Revenue ($)</th></tr></thead><tbody>';

            salesData.forEach(item => {
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


// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    
    // Initialize productGrid element reference safely
    if (CURRENT_PAGE_NAME === ADMIN_DASHBOARD_PAGE_NAME) {
        productGrid = document.getElementById('products-list-container');
    } else if (CURRENT_PAGE_NAME === STORE_PAGE_NAME || CURRENT_PAGE_NAME === '') {
        productGrid = document.getElementById('products');
    }
    
    const adminToken = localStorage.getItem(ADMIN_TOKEN_KEY);
    const isAdminLoggedIn = !!adminToken; 

    // --- Store Page Logic (index.html) ---
    if (CURRENT_PAGE_NAME === STORE_PAGE_NAME || CURRENT_PAGE_NAME === '') {
        fetchAndRenderProducts(false); // Fetch public products
        
        if (showLoginFormBtn) {
            // Adjust link based on auth status
            showLoginFormBtn.href = isAdminLoggedIn ? getAdminDashboardPath() : getAuthPagePath();
            showLoginFormBtn.textContent = isAdminLoggedIn ? 'Admin Dashboard' : 'Account / Login';
        }
    } 
    
    // --- Customer Auth Page Logic (auth.html) ---
    else if (CURRENT_PAGE_NAME === AUTH_PAGE_NAME) { 
        if (isAdminLoggedIn) {
            // Prevent admin from lingering on the public auth page
            window.location.href = getAdminDashboardPath();
            return;
        }
    }
    
    // ADMIN LOGIN ATTACHMENT (admin-login.html)
    else if (CURRENT_PAGE_NAME === ADMIN_LOGIN_PAGE_NAME) {
        if (isAdminLoggedIn) {
            window.location.href = getAdminDashboardPath();
            return;
        }
        if (adminLoginForm) {
            adminLoginForm.addEventListener('submit', handleAdminLogin);
        }
    }
    
    // --- Admin Dashboard Logic (admindashboard.html) ---
    else if (CURRENT_PAGE_NAME === ADMIN_DASHBOARD_PAGE_NAME) {

        // 🚨 Guardrail: If no token is found, redirect away to the login page
        if (!isAdminLoggedIn) {
            alert('Access Denied. Please log in.');
            window.location.href = getAdminLoginPagePath(); 
            return;
        }
        
        // Fetch Admin Data for the dashboard
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







