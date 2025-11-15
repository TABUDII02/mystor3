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

// =========================================================
// ⭐ AUTH CONSTANTS (MUST be declared globally if used by other files later)
// =========================================================
const USER_TOKEN_KEY = 'userToken';       // Key for customer JWT
const ADMIN_TOKEN_KEY = 'adminAuthToken'; // Key for admin JWT


/**
 * Checks for a token in localStorage and updates the UI accordingly.
 */
function updateAuthLink() {
    const authLink = document.getElementById('auth-link');
    if (!authLink) return;

    // Check if either a user or an admin token exists
    const userToken = localStorage.getItem(USER_TOKEN_KEY);
    const adminToken = localStorage.getItem(ADMIN_TOKEN_KEY);

    if (userToken || adminToken) {
        // User is logged in
        authLink.textContent = 'Logout 🚪';
        authLink.href = '#'; // Change the link destination
        authLink.addEventListener('click', handleLogout);
        
    } else {
        // User is logged out
        authLink.textContent = 'Account / Login';
        authLink.href = 'auth.html'; // Default login page
        // Remove existing listener to prevent duplicate attachment/errors
        authLink.removeEventListener('click', handleLogout);
    }
}

/**
 * Clears the tokens from localStorage and redirects the user.
 * @param {Event} event - The click event object.
 */
function handleLogout(event) {
    event.preventDefault(); // Stop the '#' link from jumping the page

    // 1. Remove both possible tokens
    localStorage.removeItem(USER_TOKEN_KEY);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    
    // 2. Clear Admin Mode flag if used
    // localStorage.removeItem('isAdminMode');

    // 3. Update the UI and redirect
    updateAuthLink(); // Immediately changes the link back to "Account / Login"
    alert("You have been successfully logged out.");
    window.location.href = 'index.html'; // Redirect to the home page
}

// Attach the update function to the page load event
document.addEventListener('DOMContentLoaded', updateAuthLink);
