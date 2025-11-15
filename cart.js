// A persistent key for storing cart data in the browser
const CART_STORAGE_KEY = 'myStoreShoppingCart';
// A reference to the cart count element in the header
const cartIcon = document.querySelector('.nav-cart');

// =========================================================
// ⭐ NEW: API & AUTH CONFIGURATION
// =========================================================
const API_BASE_URL = 'https://mongodb-crud-api-ato3.onrender.com/api'; // Your backend server address
const CHECKOUT_API_URL = `${API_BASE_URL}/api/sales/checkout`;
const USER_TOKEN_KEY = 'userToken';       // Key for customer JWT
//const ADMIN_TOKEN_KEY = 'adminAuthToken'; // Key for admin JWT

// --- Utility Functions ---

/**
 * Loads the cart items array from localStorage.
 * @returns {Array} The current cart items or an empty array.
 */
function getCart() {
    const cartJson = localStorage.getItem(CART_STORAGE_KEY);
    return cartJson ? JSON.parse(cartJson) : [];
}

/**
 * Saves the cart items array back to localStorage.
 * @param {Array} cart - The cart items array to save.
 */
function saveCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

/**
 * Updates the visual count in the header cart icon.
 * @param {Array} cart - The current cart array.
 */
function updateCartIcon(cart) {
    if (cartIcon) {
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartIcon.textContent = `Cart (${totalItems}) 🛒`;
    }
}

// --- Main Cart Logic (FIXED for Dynamic Products) ---

/**
 * Handles the click event for all 'Add to Cart' buttons.
 * @param {Event} event - The click event object (or mock object from delegation).
 */
function handleAddToCart(event) {
    // 1. Prevent default button behavior
    event.preventDefault();

    // In delegation, the target is the button (or the mocked button for consistency)
    const button = event.target; 
    const productCard = button.closest('.product-card');

    if (!productCard) return; 

    // 2. Extract product details
    const productId = productCard.getAttribute('data-product-id');
    const productName = productCard.querySelector('h3').textContent;
    const productPriceText = productCard.querySelector('.price').textContent;
    
    // Read the quantity from the associated input field, using the button's context
    const quantityInput = productCard.querySelector('.product-quantity');
    const selectedQuantity = quantityInput ? parseInt(quantityInput.value) : 1;
    
    // Clean up and convert the price string to a float
    const productPrice = parseFloat(productPriceText.replace('$', ''));

    if (!productId || isNaN(productPrice) || selectedQuantity < 1) {
        console.error("Missing required product data (ID, Price, or Quantity). Cannot add to cart.");
        alert("Product data is incomplete. Please check the product card HTML.");
        return;
    }

    // 3. Get current cart state
    let cart = getCart();

    // 4. Check if the item already exists in the cart
    const existingItemIndex = cart.findIndex(item => item.id === productId);

    if (existingItemIndex > -1) {
        // Item exists: increase quantity by the selected amount
        cart[existingItemIndex].quantity += selectedQuantity;
        console.log(`Increased quantity for: ${productName} by ${selectedQuantity}`);
    } else {
        // New item: add it to the cart
        const newItem = {
            id: productId,
            name: productName,
            price: productPrice,
            quantity: selectedQuantity, 
            imageSrc: productCard.querySelector('img').src 
        };
        cart.push(newItem);
        console.log(`Added new item: ${productName} with quantity ${selectedQuantity}`);
    }

    // 5. Save the updated cart and refresh the icon count
    saveCart(cart);
    updateCartIcon(cart);
    
    // Optional feedback to the user
    alert(`${productName} added to cart! Total items: ${cart.reduce((total, item) => total + item.quantity, 0)}`);
    
    // Reset quantity input to 1 after adding to cart for a smoother UX
    if (quantityInput) {
        quantityInput.value = 1;
    }
}

// --- Event Delegation (Index/Home Page Logic) ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Attach event delegation listener to the main product grid
    const productsGrid = document.getElementById('products');
    
    if (productsGrid) {
        // We use event delegation on the parent element (#products) to handle 
        // buttons that are created dynamically by admin.js.
        productsGrid.addEventListener('click', (event) => {
            // Check if the clicked element (or its closest ancestor) is the 'Add to Cart' button
            const clickedButton = event.target.closest('.add-to-cart-btn');
            
            // Only proceed if an 'Add to Cart' button was clicked
            if (clickedButton) {
                // Pass a mock event object to handleAddToCart for compatibility
                handleAddToCart({ target: clickedButton, preventDefault: event.preventDefault.bind(event) });
            }
        });
    }

    // 2. Initial load: Update the cart icon with the count from storage
    updateCartIcon(getCart());
});


// --- Cart Page Specific Logic (assuming these elements exist on cart.html) ---

const cartItemsList = document.querySelector('.cart-items-list');
// Fixed selector based on the provided HTML structure (need to select the element containing the text)
const summarySubtotal = document.querySelector('.cart-summary .summary-line:nth-child(1) .summary-value'); 
const shippingCostDisplay = document.querySelector('.summary-line:nth-child(2) .summary-value');
const taxAmountDisplay = document.querySelector('.summary-line.tax-line .summary-value');
const summaryTotal = document.querySelector('.cart-summary .total-value');
const checkoutButton = document.querySelector('.checkout-button'); 

const shippingCost = 7.99; // Fixed shipping cost
const taxRate = 0.04; // 4% tax rate (example)


/**
 * Creates the HTML markup for a single item in the cart.
 * @param {Object} item - The product object from the cart.
 * @returns {string} The HTML string for the cart item.
 */
function createCartItemHTML(item) {
    const itemTotal = (item.price * item.quantity).toFixed(2);
    
    // Note the 'data-item-id' for JavaScript targeting and event listeners
    return `
        <div class="cart-item" data-item-id="${item.id}">
            <img src="${item.imageSrc}" alt="${item.name}" class="item-image">
            <div class="item-details">
                <h3 class="item-name">${item.name}</h3>
                <p class="item-description">Price: $${item.price.toFixed(2)}</p>
            </div>
            <div class="item-controls">
                <label for="qty-${item.id}">Qty:</label>
                <input type="number" id="qty-${item.id}" name="quantity" value="${item.quantity}" min="1" class="item-quantity">
                <button class="remove-button">Remove</button>
            </div>
            <div class="item-total">$${itemTotal}</div>
        </div>
    `;
}

/**
 * Recalculates all cart totals and updates the summary sidebar.
 */
function updateCartTotals(cart) {
    let subtotal = 0;
    
    // Calculate subtotal
    cart.forEach(item => {
        subtotal += item.price * item.quantity;
    });

    // Calculate tax and final total
    const taxAmount = subtotal * taxRate;
    const finalTotal = subtotal + shippingCost + taxAmount;
    
    // Update the Summary Sidebar (based on the HTML structure)
    if (summarySubtotal) {
        summarySubtotal.textContent = `$${subtotal.toFixed(2)}`;
    }
    if (shippingCostDisplay) {
        shippingCostDisplay.textContent = `$${shippingCost.toFixed(2)}`;
    }
    if (taxAmountDisplay) {
        taxAmountDisplay.textContent = `$${taxAmount.toFixed(2)}`;
    }
    if (summaryTotal) {
        summaryTotal.textContent = `$${finalTotal.toFixed(2)}`;
    }
    
    // Disable/enable checkout based on cart contents
    if (checkoutButton) {
        const isEmpty = cart.length === 0;
        checkoutButton.disabled = isEmpty;
        checkoutButton.textContent = isEmpty ? "Cart is Empty" : "Proceed to Checkout";
    }
}


/**
 * Renders the full cart display, including items and summary.
 */
function renderCart() {
    let cart = getCart();
    // Check if the cart list element exists before clearing/writing
    if (cartItemsList) {
        cartItemsList.innerHTML = ''; // Clear existing content
    }


    if (cartItemsList && cart.length === 0) {
        // Display empty cart message
        cartItemsList.innerHTML = `
            <div class="cart-empty-state">
                <p>Your cart is empty! <a href="index.html#products">Start shopping now.</a></p>
            </div>
        `;
    } else if (cartItemsList) {
        // Display each item
        cart.forEach(item => {
            cartItemsList.innerHTML += createCartItemHTML(item);
        });

        // Attach event listeners after items are rendered
        attachCartEventListeners();
    }
    
    updateCartTotals(cart);
    updateCartIcon(cart);
}

/**
 * Attaches event listeners for quantity changes and remove buttons.
 */
function attachCartEventListeners() {
    // 1. Quantity Change Listener
    document.querySelectorAll('.item-quantity').forEach(input => {
        input.addEventListener('change', (event) => {
            const newQuantity = Math.max(1, parseInt(event.target.value)); 
            const itemId = event.target.closest('.cart-item').getAttribute('data-item-id');
            
            event.target.value = newQuantity; 
            
            updateItemQuantity(itemId, newQuantity);
        });
    });

    // 2. Remove Button Listener
    document.querySelectorAll('.remove-button').forEach(button => {
        button.addEventListener('click', (event) => {
            const itemId = event.target.closest('.cart-item').getAttribute('data-item-id');
            removeItem(itemId);
        });
    });
}

/**
 * Updates the quantity of a specific item in the cart.
 */
function updateItemQuantity(itemId, newQuantity) {
    let cart = getCart();
    const itemIndex = cart.findIndex(item => item.id === itemId);

    if (itemIndex > -1) {
        cart[itemIndex].quantity = newQuantity;
        saveCart(cart);
        renderCart(); // Re-render the cart to update totals and display
    }
}

/**
 * Removes a specific item from the cart.
 */
function removeItem(itemId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== itemId); 
    
    saveCart(cart);
    renderCart(); // Re-render the cart
}


// =========================================================
// ⭐ NEW: ASYNCHRONOUS CHECKOUT LOGIC
// =========================================================

/**
 * Handles the checkout process: saves the sales data to the backend,
 * updates inventory, and clears the client-side cart.
 */
async function handleCheckout() {
    // 1. Get Authentication Token
    const token = localStorage.getItem(USER_TOKEN_KEY) || localStorage.getItem(ADMIN_TOKEN_KEY); 
    
    if (!token) {
        alert("🔒 You must be logged in to complete your purchase. Redirecting to login page.");
        window.location.href = 'auth.html'; 
        return;
    }

    // 2. Get and validate cart data
    const cart = getCart();
    if (cart.length === 0) {
        alert("Your cart is empty. Please add items to proceed.");
        return;
    }

    // Prepare the order items in the format the backend expects
    const orderItems = cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
    }));

    // 3. User Confirmation and UI Update
    const finalTotal = summaryTotal?.textContent || '$0.00';
    if (!confirm(`Confirm purchase for the total amount of ${finalTotal}?`)) {
        return;
    }
    
    // Disable the button to prevent double-click submissions
    checkoutButton.disabled = true;
    checkoutButton.textContent = 'Processing Order... Please Wait';

    try {
        // 4. Send transaction data to the backend (POST /api/sales/checkout)
        const response = await fetch(CHECKOUT_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Attach the token for Admin/Customer authorization
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ orderItems }) // Send the array of order items
        });

        const data = await response.json();

        if (!response.ok) {
            // Handle HTTP errors or backend validation errors (e.g., stock running out)
            throw new Error(data.error || `Server responded with status ${response.status}`);
        }

        // 5. Success: Clear the cart and notify user
        saveCart([]); // Clear local storage cart
        
        alert("✅ Order placed successfully! Your sales data has been recorded and inventory updated.");
        
        // Update the UI immediately
        renderCart(); 

        // Redirect to a confirmation page or home page
        // window.location.href = '/order-confirmation.html'; 

    } catch (error) {
        console.error("Checkout Failed:", error);
        alert(`❌ Checkout failed: ${error.message}. Please review your order.`);
        
        // Re-enable button on failure
        checkoutButton.disabled = false;
        checkoutButton.textContent = 'Proceed to Checkout';
    }
}

// --- Cart Page Initialization ---

// These functions ensure the cart displays and calculations run on the cart.html page
document.addEventListener('DOMContentLoaded', () => {
    // Only run renderCart if the necessary elements (like cartItemsList) are found
    if (cartItemsList) {
        renderCart();
    }
    
    // Attach the new asynchronous handleCheckout function to the button
    if (checkoutButton) {
        checkoutButton.addEventListener('click', handleCheckout);
    }
});






