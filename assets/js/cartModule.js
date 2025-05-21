export const CART_KEY = "shopping_cart";

export function getCart() {
  const cart = localStorage.getItem(CART_KEY);
  return cart ? JSON.parse(cart) : {};
}

export async function syncCartWithServer() {
  try {
    const cart = getCart();
    const response = await fetch("http://localhost:5000/api/cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cart }),
    });

    if (!response.ok) {
      throw new Error("Failed to sync cart with server");
    }
    console.log("Cart successfully synced with server");
  } catch (error) {
    console.error("Error syncing cart:", error);
  }
}

export function updateCart(productId, quantity) {
  const cart = getCart();

  if (quantity > 0) {
    cart[productId] = (cart[productId] || 0) + parseInt(quantity);
  } else {
    delete cart[productId];
  }

  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCounter();
  syncCartWithServer();
  return cart;
}

export function updateCartCounter() {
  const cart = getCart();
  const totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const cartQuantityElement = document.querySelector(".cart-quantity");
  if (cartQuantityElement) {
    cartQuantityElement.textContent = totalItems;
    cartQuantityElement.style.display = totalItems > 0 ? "block" : "none";
  }
}

export function addToCart(productId, quantity) {
  if (isNaN(quantity)) {
    console.error("Invalid quantity");
    return;
  }

  const qty = parseInt(quantity);
  if (qty < 1) {
    alert("Please enter a valid quantity");
    return;
  }

  updateCart(productId, qty);

  // Show feedback to user
  const feedback = document.createElement("div");
  feedback.className = "alert alert-success position-fixed top-0 end-0 m-3";
  feedback.style.zIndex = "1000";
  feedback.textContent = `Added ${qty} item(s) to cart!`;
  document.body.appendChild(feedback);

  setTimeout(() => {
    feedback.style.opacity = "0";
    setTimeout(() => feedback.remove(), 300);
  }, 2000);
}

export function removeFromCart(productId) {
  updateCart(productId, 0);

  // Show feedback to user
  const feedback = document.createElement("div");
  feedback.className = "alert alert-danger position-fixed top-0 end-0 m-3";
  feedback.style.zIndex = "1000";
  feedback.textContent = "Item removed from cart!";
  document.body.appendChild(feedback);

  setTimeout(() => {
    feedback.style.opacity = "0";
    setTimeout(() => feedback.remove(), 300);
  }, 2000);
}
