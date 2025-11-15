// Simple smooth scroll script for navigation links
        document.addEventListener('DOMContentLoaded', () => {
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function (e) {
                    e.preventDefault();
                    document.querySelector(this.getAttribute('href')).scrollIntoView({
                        behavior: 'smooth'
                    });
                });
            });
        });

/**
 * navigation.js
 * Handles dynamic updates to the navigation bar based on CUSTOMER login status.
 * (Assumes the customer token is stored as 'authToken'.)
 */

// NOTE: No changes are needed in your admin.js for this feature.

document.addEventListener('DOMContentLoaded', () => {
    // 🛑 IMPORTANT: Define constants LOCALLY to avoid global conflicts 🛑
    const USER_TOKEN_KEY = 'userToken';
    const ADMIN_TOKEN_KEY = 'adminAuthToken';
    
    // Select the HTML element
    const authLink = document.getElementById('auth-link');
    if (!authLink) return;

    /**
     * Handles the logout process: clears tokens, updates UI, and redirects.
     */
    function handleLogout(event) {
        event.preventDefault(); 

        // 1. Clear tokens from localStorage
        localStorage.removeItem(USER_TOKEN_KEY);
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        
        // 2. Alert and redirect
        alert("You have been successfully logged out.");
        window.location.href = 'index.html'; 
    }

    // Check for tokens
    const userToken = localStorage.getItem(USER_TOKEN_KEY);
    const adminToken = localStorage.getItem(ADMIN_TOKEN_KEY);

    if (userToken || adminToken) {
        // User is logged in: Change link to Logout
        authLink.textContent = 'Logout 🚪';
        authLink.href = '#'; 
        
        // Add the click listener for the logout process
        authLink.addEventListener('click', handleLogout);
    } else {
        // User is logged out: Link remains 'Account / Login' and href remains 'auth.html'
        // No action needed here, as the HTML is already set correctly.
    }
});

