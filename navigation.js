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
    // 1. Get the navigation link element
    // Ensure you have added id="auth-link" to your <a> tag in index.html!
    const authLink = document.getElementById('auth-link');
    
    // 2. Check for the customer's authentication token
    const customerToken = localStorage.getItem('authToken'); 
    
    if (authLink) {
        if (customerToken) {
            // Case 1: CUSTOMER is Logged In
            
            // Set the link to 'Logout'
            authLink.textContent = 'Logout 👋';
            authLink.href = '#'; // Use a placeholder link when logged in
            
            // Attach the click handler for logout
            authLink.addEventListener('click', (e) => {
                e.preventDefault();
                handleCustomerLogout();
            });

        } else {
            // Case 2: CUSTOMER is Logged Out
            
            // Ensure the link is correct (it points to the login/register page)
            authLink.textContent = 'Account / Login';
            authLink.href = 'auth.html';
            
            // Note: Since this file runs before admin.js, the admin logic in admin.js
            // that changes the button for the Admin Dashboard will override this if needed.
        }
    }
});

/**
 * Clears the customer's session data and redirects to the store page.
 */
function handleCustomerLogout() {
    // Clear the customer token and name
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    
    alert('You have been logged out.');
    
    // Redirect to the home page to refresh the navigation state
    window.location.href = 'index.html';
}        


