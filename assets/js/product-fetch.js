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

function updateCartCounter() {
  const cart = getCart();
  const totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const cartQuantityElement = document.querySelector(".cart-quantity");
  if (cartQuantityElement) {
    cartQuantityElement.textContent = totalItems;
    cartQuantityElement.style.display = totalItems > 0 ? "block" : "none";
  }
}

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

function removeFromCart(productId) {
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

function getStarIcons(rating) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5 ? 1 : 0;
  const emptyStars = 5 - fullStars - halfStar;

  return "★".repeat(fullStars) + (halfStar ? "½" : "") + "☆".repeat(emptyStars);
}

async function fetchProducts(searchTerm = "") {
  try {
    const url = searchTerm
      ? `http://localhost:5000/api/products/search?query=${encodeURIComponent(
          searchTerm
        )}`
      : "http://localhost:5000/api/products";

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch products:", error);
    throw error;
  }
}

async function renderProducts(products) {
  const productGrid = document.getElementById("productGrid");

  if (!products || products.length === 0) {
    productGrid.innerHTML =
      '<div class="col-12 text-center"><p>No products found matching your search</p></div>';
    return;
  }

  productGrid.innerHTML = "";
  const cart = getCart();

  products.forEach((product, index) => {
    const productId = product.id || index;
    const inCartQty = cart[productId] || 0;

    const productHTML = `
      <div class="col">
        <div class="card h-100">
          <img src="${
            product.image_url || "https://via.placeholder.com/300"
          }" class="card-img-top" alt="${product.name}" loading="lazy">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${product.name}</h5>
            <p class="card-text">${product.description}</p>
            <p class="card-text mt-auto">
              $${parseFloat(product.price).toFixed(2)}
            </p>
            <div class="d-flex align-items-center gap-2 mb-3">
              <label for="qty${productId}" class="form-label mb-0">Qty:</label>
              <input type="number" class="form-control form-control-sm quantity-input" 
                    id="qty${productId}" min="1" value="1" style="width: 60px;">
              ${
                inCartQty > 0
                  ? `<span class="badge bg-success ms-2">${inCartQty} in cart</span>`
                  : ""
              }
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-warning flex-grow-1 add-to-cart" data-product-id="${productId}">
                <i class="fas fa-shopping-cart me-2"></i>
                ${inCartQty > 0 ? "Add More" : "Add to Cart"}
              </button>
              ${
                inCartQty > 0
                  ? `<button class="btn btn-outline-danger remove-from-cart" data-product-id="${productId}">
                      <i class="fas fa-trash-alt"></i>
                     </button>`
                  : ""
              }
            </div>
          </div>
        </div>
      </div>
    `;

    productGrid.insertAdjacentHTML("beforeend", productHTML);
  });

  // Add event listeners for Add to Cart buttons
  document.querySelectorAll(".add-to-cart").forEach((button) => {
    button.addEventListener("click", function () {
      const productId = this.getAttribute("data-product-id");
      const quantityInput = document.getElementById(`qty${productId}`);
      const quantity = quantityInput.value;
      addToCart(productId, quantity);
      updateProductCardUI(productId);
    });
  });

  // Add event listeners for Remove from Cart buttons
  document.querySelectorAll(".remove-from-cart").forEach((button) => {
    button.addEventListener("click", function () {
      const productId = this.getAttribute("data-product-id");
      removeFromCart(productId);
      updateProductCardUI(productId);
    });
  });
}

async function loadProducts(searchTerm = "") {
  try {
    const productGrid = document.getElementById("productGrid");
    productGrid.innerHTML =
      '<div class="col-12 text-center"><div class="spinner-border text-warning" role="status"></div></div>';

    const products = await fetchProducts(searchTerm);
    await renderProducts(products);
    updateCartCounter();
  } catch (error) {
    console.error("Failed to load products:", error);
    document.getElementById("productGrid").innerHTML = `
      <div class="col-12 text-center">
        <p class="text-danger">Failed to load products. Please try again later.</p>
        <p>${error.message}</p>
      </div>
    `;
  }
}

function updateProductCardUI(productId) {
  const cart = getCart();
  const inCartQty = cart[productId] || 0;
  const cardBody = document
    .querySelector(`.add-to-cart[data-product-id="${productId}"]`)
    .closest(".card-body");

  // Update Add to Cart button text
  const addButton = cardBody.querySelector(".add-to-cart");
  addButton.innerHTML = `<i class="fas fa-shopping-cart me-2"></i>${
    inCartQty > 0 ? "Add More" : "Add to Cart"
  }`;

  // Update or create "in cart" badge
  const quantityInput = cardBody.querySelector(".quantity-input");
  const badgeContainer = quantityInput.parentNode;
  let badge = badgeContainer.querySelector(".badge.bg-success");
  if (inCartQty > 0) {
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "badge bg-success ms-2";
      badgeContainer.appendChild(badge);
    }
    badge.textContent = `${inCartQty} in cart`;
  } else if (badge) {
    badge.remove();
  }

  // Update Remove button
  let removeButton = cardBody.querySelector(".remove-from-cart");
  if (inCartQty > 0) {
    if (!removeButton) {
      removeButton = document.createElement("button");
      removeButton.className = "btn btn-outline-danger remove-from-cart";
      removeButton.setAttribute("data-product-id", productId);
      removeButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
      removeButton.addEventListener("click", function () {
        removeFromCart(productId);
        updateProductCardUI(productId);
      });
      cardBody.querySelector(".d-flex.gap-2").appendChild(removeButton);
    }
  } else if (removeButton) {
    removeButton.remove();
  }

  updateCartCounter();
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  loadProducts();

  // Search functionality
  const searchButton = document.querySelector(".search-button");
  const searchInput = document.querySelector(".search-bar");

  if (searchButton && searchInput) {
    const performSearch = () => {
      const searchTerm = searchInput.value.trim();
      loadProducts(searchTerm);
    };

    searchButton.addEventListener("click", performSearch);
    searchInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        performSearch();
      }
    });
  }
});
