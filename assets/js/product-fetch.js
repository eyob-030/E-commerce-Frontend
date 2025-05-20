// Cart functions
const CART_KEY = "shopping_cart";

function getCart() {
  const cart = localStorage.getItem(CART_KEY);
  return cart ? JSON.parse(cart) : {};
}

function updateCart(productId, quantity) {
  const cart = getCart();

  if (quantity > 0) {
    cart[productId] = (cart[productId] || 0) + parseInt(quantity);
  } else {
    delete cart[productId];
  }

  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCounter();
  return cart;
}

// Update the updateCartCounter function to match your HTML structure
function updateCartCounter() {
  const cart = getCart();
  const totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  // Update cart quantity in your specific HTML structure
  const cartQuantityElement = document.querySelector(".cart-quantity");
  if (cartQuantityElement) {
    cartQuantityElement.textContent = totalItems;
    // Hide if empty, show if has items (optional)
    cartQuantityElement.style.display = totalItems > 0 ? "block" : "none";
  }
}

// Modified addToCart function with quantity validation
function addToCart(productId, quantity) {
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

async function loadProducts() {
  try {
    const productGrid = document.getElementById("productGrid");
    productGrid.innerHTML =
      '<div class="col-12 text-center"><div class="spinner-border text-warning" role="status"></div></div>';

    const response = await fetch("http://localhost/api/products");
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const products = await response.json();
    productGrid.innerHTML = "";

    if (!products || products.length === 0) {
      productGrid.innerHTML =
        '<div class="col-12 text-center"><p>No products found</p></div>';
      return;
    }

    const cart = getCart();

    products.forEach((product, index) => {
      const productId = product.id || index;
      const inCartQty = cart[productId] || 0;

      const productHTML = `
        <div class="col">
          <div class="card h-100">
            <img src="${product.image}" class="card-img-top" alt="${
        product.title
      }" loading="lazy">
            <div class="card-body">
              <h5 class="card-title">${product.title}</h5>
              <p class="card-text">
                $${product.price.toFixed(2)}
                <span class="text-decoration-line-through text-muted small ms-2">
                  $${product.original_price?.toFixed(2) || ""}
                </span>
              </p>
              <div class="text-warning mb-2">
                ${getStarIcons(product.rating || 0)}
                <span class="text-muted small ms-2">(${
                  product.reviews || 0
                })</span>
              </div>
              <div class="d-flex align-items-center gap-2 mb-3">
                <label for="qty${productId}" class="form-label mb-0">Qty:</label>
                <input type="number" class="form-control form-control-sm quantity-input" 
                       id="qty${productId}" min="1" value="1">
                ${
                  inCartQty > 0
                    ? `<span class="badge bg-success ms-2">${inCartQty} in cart</span>`
                    : ""
                }
              </div>
              <button class="btn btn-warning w-100 add-to-cart" data-product-id="${productId}">
                <i class="fas fa-shopping-cart me-2"></i>
                ${inCartQty > 0 ? "Add More" : "Add to Cart"}
              </button>
            </div>
          </div>
        </div>
      `;

      productGrid.insertAdjacentHTML("beforeend", productHTML);
    });

    // Add event listeners
    document.querySelectorAll(".add-to-cart").forEach((button) => {
      button.addEventListener("click", function () {
        const productId = this.getAttribute("data-product-id");
        const quantityInput = document.getElementById(`qty${productId}`);
        const quantity = quantityInput.value;

        addToCart(productId, quantity);

        // Update the UI immediately
        const cart = getCart();
        const inCartQty = cart[productId] || 0;

        // Update button text
        this.innerHTML = `<i class="fas fa-shopping-cart me-2"></i>${
          inCartQty > 0 ? "Add More" : "Add to Cart"
        }`;

        // Update or create "in cart" badge
        let badge =
          this.closest(".card-body").querySelector(".badge.bg-success");
        if (inCartQty > 0) {
          if (!badge) {
            badge = document.createElement("span");
            badge.className = "badge bg-success ms-2";
            quantityInput.parentNode.appendChild(badge);
          }
          badge.textContent = `${inCartQty} in cart`;
        } else if (badge) {
          badge.remove();
        }
      });
    });

    // Initialize cart counter
    updateCartCounter();
  } catch (error) {
    console.error("Failed to load products:", error);
    document.getElementById("productGrid").innerHTML = `
      <div class="col-12 text-center">
        <p class="text-danger">Failed to load products. Please try again later.</p>
      </div>
    `;
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  loadProducts();

  // Search functionality
  const searchButton = document.querySelector(".search-button");
  const searchInput = document.querySelector(".search-bar");

  if (searchButton && searchInput) {
    searchButton.addEventListener("click", function () {
      const searchTerm = searchInput.value.trim();
      if (searchTerm) {
        // You can implement search filtering here
        console.log("Searching for:", searchTerm);
      }
    });

    searchInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        searchButton.click();
      }
    });
  }
});
