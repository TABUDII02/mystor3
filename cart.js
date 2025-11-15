// A persistent key for storing cart data in the browser
const CART_STORAGE_KEY = 'myStoreShoppingCart';
// A reference to the cart count element in the header
const cartIcon = document.querySelector('.nav-cart');

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

// --- Main Cart Logic (Add to Cart) ---

/**
 * Handles the click event for all 'Add to Cart' buttons.
 * @param {Event} event - The click event object (or mock object from delegation).
 */
function handleAddToCart(event) {
    event.preventDefault();

    const button = event.target;
    const productCard = button.closest('.product-card');

    if (!productCard) return;

    // 2. Extract product details
    const productId = productCard.getAttribute('data-product-id');
    const productName = productCard.querySelector('h3').textContent;
    const productPriceText = productCard.querySelector('.price').textContent;

    const quantityInput = productCard.querySelector('.product-quantity');
    const selectedQuantity = quantityInput ? parseInt(quantityInput.value) : 1;

    const productPrice = parseFloat(productPriceText.replace('$', ''));

    if (!productId || isNaN(productPrice) || selectedQuantity < 1) {
        console.error("Missing required product data.");
        alert("Product data is incomplete. Cannot add to cart.");
        return;
    }

    // 3. Get current cart state
    let cart = getCart();

    // 4. Check if the item already exists in the cart
    const existingItemIndex = cart.findIndex(item => item.id === productId);

    if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity += selectedQuantity;
    } else {
        const newItem = {
            id: productId,
            name: productName,
            price: productPrice,
            quantity: selectedQuantity,
            imageSrc: productCard.querySelector('img').src
        };
        cart.push(newItem);
    }

    // 5. Save the updated cart and refresh the icon count
    saveCart(cart);
    updateCartIcon(cart);

    alert(`${productName} added to cart!`);

    // Reset quantity input
    if (quantityInput) {
        quantityInput.value = 1;
    }
}

// --- Event Delegation (Index/Home Page Initialization) ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Attach event delegation listener to the main product grid
    const productsGrid = document.getElementById('products');

    if (productsGrid) {
        productsGrid.addEventListener('click', (event) => {
            const clickedButton = event.target.closest('.add-to-cart-btn');

            if (clickedButton) {
                // Call the add to cart handler
                handleAddToCart({ target: clickedButton, preventDefault: event.preventDefault.bind(event) });
            }
        });
    }

    // 2. Initial load: Update the cart icon with the count from storage
    updateCartIcon(getCart());
});
