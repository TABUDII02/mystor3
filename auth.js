document.addEventListener('DOMContentLoaded', () => {
    // =========================================================
    // A. UI TOGGLE LOGIC (CONNECTING HTML/CSS TO JS)
    // =========================================================

    const registerPanel = document.getElementById('register-panel');
    const loginPanel = document.getElementById('login-panel');
    const adminLoginPanel = document.getElementById('admin-login-panel');
    
    const showLogin = document.getElementById('show-login');
    const showRegister = document.getElementById('show-register');
    const logoutButton = document.getElementById('logout-button'); // New element to handle logout

    /**
     * Toggles the visibility of the customer register and login forms, 
     * ensuring the admin panel is hidden.
     * @param {string} target 'login' or 'register'
     */
    function toggleCustomerForm(target) {
        // Always hide the admin panel when showing a customer form
        if (adminLoginPanel) {
            adminLoginPanel.style.display = 'none';
        }

        if (target === 'login') {
            registerPanel.classList.remove('active-form');
            loginPanel.classList.add('active-form');
            loginPanel.style.display = 'block'; 
            registerPanel.style.display = 'none';
        } else if (target === 'register') {
            loginPanel.classList.remove('active-form');
            registerPanel.classList.add('active-form');
            registerPanel.style.display = 'block'; 
            loginPanel.style.display = 'none';
        }
        document.title = "MyStore | Sign In / Register";
    }
    
    // Logic to show the Admin Login Panel
    function showAdminLogin() {
        if (adminLoginPanel) {
            // Hide customer forms
            loginPanel.classList.remove('active-form');
            registerPanel.classList.remove('active-form');
            loginPanel.style.display = 'none';
            registerPanel.style.display = 'none';
            
            // Show admin form
            adminLoginPanel.style.display = 'block';
            document.title = "MyStore | Admin Login";
        }
    }
    
    // Logic to check URL for initial mode
    function checkInitialMode() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // If mode=admin is in the URL, switch to the admin form immediately
        if (urlParams.get('mode') === 'admin') {
            showAdminLogin();
        } else {
            // Default to 'register' view
            toggleCustomerForm('register'); 
        }
    }

    // --- Logout Function ---
    function handleLogout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userName');
        localStorage.removeItem('userRole'); // Clear role as well
        alert('You have been logged out.');
        window.location.href = 'auth.html'; // Redirect to the login/register page
    }
    
    // Attach logout listener
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
    
    // Attach listeners for customer form toggles
    if (showLogin) {
        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            toggleCustomerForm('login');
        });
    }

    if (showRegister) {
        showRegister.addEventListener('click', (e) => {
            e.preventDefault();
            toggleCustomerForm('register');
        });
    }
    
    // Listener to switch back from Admin to Customer Login
    const backToCustomerLink = document.getElementById('show-customer-login');
    if (backToCustomerLink) {
        backToCustomerLink.addEventListener('click', (e) => {
            e.preventDefault();
            toggleCustomerForm('login'); // Revert to customer login view
        });
    }


    // =========================================================
    // B. API HANDLER LOGIC
    // =========================================================
    
    // --- Configuration ---
    // ⚠️ CRITICAL FIX: Use your Render Backend URL, MUST USE HTTPS!
    // REPLACE THIS WITH YOUR RENDER BACKEND PUBLIC URL + /api
    const API_BASE_URL = 'https://mongodb-crud-api-ato3.onrender.com/api'; // Changed to end without /api
    
    // --- Get Form Elements ---
    const registrationForm = document.getElementById('registration-form');
    const loginForm = document.getElementById('login-form');
    const adminLoginForm = document.getElementById('admin-login-form'); // 🆕 Grab the Admin Form

    /**
     * Helper Function for Fetch Requests (for public routes like register/login)
     * @param {string} endpoint - The API endpoint (e.g., 'register', 'login', 'admin/login')
     * @param {Object} data - The data payload to send
     * @returns {Promise<Object>} The API response result
     */
    async function apiRequest(endpoint, data) {
        try {
            // Concatenates to: https://[backend].onrender.com/api/register (or /api/admin/login)
            const response = await fetch(`${API_BASE_URL}/${endpoint}`, { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                // Throw server-side error message if status is 4xx or 5xx
                throw new Error(result.error || `Server responded with status ${response.status}`);
            }

            return result; 
        } catch (error) {
            console.error(`API Request to /${endpoint} failed:`, error);
            // Re-throw to be caught by the form submission handlers
            throw error; 
        }
    }

    // Helper Function for Fetch Requests requiring a JWT (UNCHANGED)
    // NOTE: This function assumes the full endpoint (e.g., 'admin/products') is passed
    async function authorizedApiRequest(endpoint, method = 'GET', data = null) {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
            throw new Error('User is not logged in. No authentication token found.');
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        };

        const config = {
            method: method,
            headers: headers,
        };

        if (data) {
            config.body = JSON.stringify(data);
        }

        const response = await fetch(`${API_BASE_URL}/${endpoint}`, config);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || `Server responded with status ${response.status}`);
        }

        return result;
    }


    // =========================================================
    // 1. REGISTRATION HANDLER (UNCHANGED)
    // =========================================================
    if (registrationForm) {
        registrationForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 

            const name = e.target.elements['reg-name'].value; 
            const email = e.target.elements['reg-email'].value;
            const password = e.target.elements['reg-password'].value;
            
            if (!name || !email || !password) {
                alert('Please fill in all fields.');
                return;
            }

            const registrationData = { name, email, password };
            
            try {
                // Calls POST /api/register
                const response = await apiRequest('register', registrationData);

                alert(`✅ Registration Successful! Welcome, ${response.user.name}! Please sign in now.`);
                
                registrationForm.reset();
                toggleCustomerForm('login'); 

            } catch (error) {
                alert(`❌ Registration Failed: ${error.message}`);
            }
        });
    }

    // =========================================================
    // 2. CUSTOMER LOGIN HANDLER (UNCHANGED)
    // =========================================================
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 

            const email = e.target.elements['login-email'].value;
            const password = e.target.elements['login-password'].value;
            
            const loginData = { email, password };

            try {
                // Calls POST /api/login
                const response = await apiRequest('login', loginData);

                // Save token and user data (crucial for maintaining login state)
                if (response.token) {
                    localStorage.setItem('authToken', response.token); 
                }
                if (response.user) {
                    localStorage.setItem('userName', response.user.name); 
                    // Important: Store role as 'customer'
                    localStorage.setItem('userRole', 'customer');
                }
                
                alert(`🎉 Login Successful! Welcome back, ${response.user.name}!`);
                
                // Redirect the user to the main products page
                window.location.href = 'index.html'; 

            } catch (error) {
                alert(`🔒 Login Failed: ${error.message}`);
            }
        });
    }
    
    // =========================================================
    // 3. ADMIN LOGIN HANDLER (🆕 NEW CODE)
    // =========================================================
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 

            const email = e.target.elements['admin-login-email'].value;
            const password = e.target.elements['admin-login-password'].value;
            
            const loginData = { email, password };

            try {
                // Calls POST /api/admin/login
                const response = await apiRequest('admin/login', loginData);

                if (response.token) {
                    localStorage.setItem('authToken', response.token); 
                }
                if (response.user) {
                    localStorage.setItem('userName', response.user.name); 
                    // CRITICAL: Store role as 'admin'
                    localStorage.setItem('userRole', response.user.role);
                }
                
                alert(`👑 Admin Login Successful! Welcome, ${response.user.name}! Redirecting to dashboard.`);
                
                // Redirect Admin to the dashboard page (or index.html with admin logic)
                window.location.href = 'index.html'; // Assuming index.html handles admin view
                
            } catch (error) {
                alert(`❌ Admin Login Failed: ${error.message}`);
            }
        });
    }
    
    // CRITICAL: Call the function to check the URL and set the initial view
    checkInitialMode();
});


