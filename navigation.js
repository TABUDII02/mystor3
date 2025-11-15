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
        

