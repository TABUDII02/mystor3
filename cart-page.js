// =========================================================
// CONSTANTS (REQUIRED FOR THIS PAGE)
// NOTE: These must be defined if they are not in navigation.js, 
// OR they must be pulled from the same central config file if you created one.
// Assuming they are NOT defined elsewhere for safety:
// =========================================================
const API_BASE_URL = 'https://mongodb-crud-api-ato3.onrender.com/api'; 
const CHECKOUT_API_URL = `${API_BASE_URL}/sales/checkout`;
const USER_TOKEN_KEY = 'userToken';
const ADMIN_TOKEN_KEY = 'adminAuthToken';
const CART_STORAGE_KEY = 'myStoreShoppingCart';

// --- Cart Page Elements ---
const cartItemsList = document.querySelector('.cart-items-list');
const summarySubtotal = document.querySelector('.cart-summary .summary-line:nth-child(1) .summary-value');
const shippingCostDisplay = document.querySelector('.summary-line:nth-child(2) .summary-value');
const taxAmountDisplay = document.querySelector('.summary-line.tax-line .summary-value');
const summaryTotal = document.querySelector('.cart-summary .total-value');
const checkoutButton = document.querySelector('.checkout-button');

const shippingCost = 7.99; // Fixed shipping cost
const taxRate = 0.04; // 4% tax rate (example)

// --- Utility Functions (Need to be duplicated or pulled from cart.js) ---
function getCart() {
    const cartJson = localStorage.getItem(CART_STORAGE_KEY);
    return cartJson ? JSON.parse(cartJson) : [];
}
function saveCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}
// You'll need updateCartIcon if you want the header cart count to update on cart.html

// --- Rendering Logic ---

function createCartItemHTML(item) {
    const itemTotal = (item.price * item.quantity).toFixed(2);
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

function updateCartTotals(cart) {
    let subtotal = 0;
    cart.forEach(item => subtotal += item.price * item.quantity);

    const taxAmount = subtotal * taxRate;
    const finalTotal = subtotal + shippingCost + taxAmount;

    if (summarySubtotal) summarySubtotal.textContent = `$${subtotal.toFixed(2)}`;
    if (shippingCostDisplay) shippingCostDisplay.textContent = `$${shippingCost.toFixed(2)}`;
    if (taxAmountDisplay) taxAmountDisplay.textContent = `$${taxAmount.toFixed(2)}`;
    if (summaryTotal) summaryTotal.textContent = `$${finalTotal.toFixed(2)}`;

    if (checkoutButton) {
        const isEmpty = cart.length === 0;
        checkoutButton.disabled = isEmpty;
        checkoutButton.textContent = isEmpty ? "Cart is Empty" : "Proceed to Checkout";
    }
}

function updateItemQuantity(itemId, newQuantity) {
    let cart = getCart();
    const itemIndex = cart.findIndex(item => item.id === itemId);
    if (itemIndex > -1) {
        cart[itemIndex].quantity = newQuantity;
        saveCart(cart);
        renderCart();
    }
}

function removeItem(itemId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== itemId);
    saveCart(cart);
    renderCart();
}

function attachCartEventListeners() {
    document.querySelectorAll('.item-quantity').forEach(input => {
        input.addEventListener('change', (event) => {
            const newQuantity = Math.max(1, parseInt(event.target.value));
            const itemId = event.target.closest('.cart-item').getAttribute('data-item-id');
            event.target.value = newQuantity;
            updateItemQuantity(itemId, newQuantity);
        });
    });
    document.querySelectorAll('.remove-button').forEach(button => {
        button.addEventListener('click', (event) => {
            const itemId = event.target.closest('.cart-item').getAttribute('data-item-id');
            removeItem(itemId);
        });
    });
}

function renderCart() {
    let cart = getCart();
    if (cartItemsList) cartItemsList.innerHTML = '';

    if (cartItemsList && cart.length === 0) {
        cartItemsList.innerHTML = `
            <div class="cart-empty-state">
                <p>Your cart is empty! <a href="index.html#products">Start shopping now.</a></p>
            </div>
        `;
    } else if (cartItemsList) {
        cart.forEach(item => cartItemsList.innerHTML += createCartItemHTML(item));
        attachCartEventListeners();
    }
    updateCartTotals(cart);
    // You may need to call updateCartIcon(cart) here if that function is global
}


// --- Checkout Logic ---

async function handleCheckout() {
    // 1. Get Authentication Token
    const token = localStorage.getItem(USER_TOKEN_KEY) || localStorage.getItem(ADMIN_TOKEN_KEY);

    if (!token) {
        alert("🔒 You must be logged in to complete your purchase.");
        window.location.href = 'auth.html';
        return;
    }

    // 2. Get and validate cart data (and checkout process...)
    // ... (The rest of your checkout function)
    
    // Placeholder to prevent long code block:
    alert("Proceeding to checkout logic (full function needed here).");
}

// --- Cart Page Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    if (cartItemsList) {
        renderCart();
    }
    if (checkoutButton) {
        checkoutButton.addEventListener('click', handleCheckout);
    }
});
