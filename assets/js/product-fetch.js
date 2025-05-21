const CART_KEY = "shopping_cart";
let currentPage = 1;
let currentSearchTerm = "";
let isLoading = false;
let hasMoreProducts = true;

function getCart() {
  const cart = localStorage.getItem(CART_KEY);
  return cart ? JSON.parse(cart) : {};
}

async function syncCartItemWithServer(productId, quantity) {
  try {
    const response = await fetch("http://localhost:5000/api/cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId: parseInt(productId),
        quantity: parseInt(quantity),
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to update cart on server");
    }

    console.log("Cart item successfully updated on server");
    return await response.json();
  } catch (error) {
    console.error("Error syncing cart item:", error);
    throw error;
  }
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

  // Sync with server but don't wait for it to complete
  syncCartItemWithServer(productId, cart[productId] || 0).catch((error) => {
    console.error("Background cart sync failed:", error);
  });

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

  // Show loading feedback on the button
  const addButton = document.querySelector(
    `.add-to-cart[data-product-id="${productId}"]`
  );
  const originalButtonHTML = addButton.innerHTML;
  addButton.innerHTML =
    '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Adding...';
  addButton.disabled = true;

  // First update local cart
  updateCart(productId, qty);

  // Then update server (though updateCart already does this)
  syncCartItemWithServer(productId, qty)
    .then(() => {
      // Show success feedback to user
      const feedback = document.createElement("div");
      feedback.className = "alert alert-success position-fixed top-0 end-0 m-3";
      feedback.style.zIndex = "1000";
      feedback.textContent = `Added ${qty} item(s) to cart!`;
      document.body.appendChild(feedback);

      setTimeout(() => {
        feedback.style.opacity = "0";
        setTimeout(() => feedback.remove(), 300);
      }, 2000);
    })
    .catch((error) => {
      // Show error feedback
      const feedback = document.createElement("div");
      feedback.className = "alert alert-danger position-fixed top-0 end-0 m-3";
      feedback.style.zIndex = "1000";
      feedback.textContent = "Failed to update cart. Please try again.";
      document.body.appendChild(feedback);

      setTimeout(() => {
        feedback.style.opacity = "0";
        setTimeout(() => feedback.remove(), 300);
      }, 2000);
    })
    .finally(() => {
      // Restore button state
      addButton.innerHTML = originalButtonHTML;
      addButton.disabled = false;
      updateProductCardUI(productId);
    });
}

function removeFromCart(productId) {
  const removeButton = document.querySelector(
    `.remove-from-cart[data-product-id="${productId}"]`
  );
  const originalButtonHTML = removeButton ? removeButton.innerHTML : "";

  if (removeButton) {
    removeButton.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
    removeButton.disabled = true;
  }

  // First update local cart
  updateCart(productId, 0);

  // Then update server
  syncCartItemWithServer(productId, 0)
    .then(() => {
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
    })
    .catch((error) => {
      console.error("Failed to remove item from server cart:", error);
      const feedback = document.createElement("div");
      feedback.className = "alert alert-danger position-fixed top-0 end-0 m-3";
      feedback.style.zIndex = "1000";
      feedback.textContent = "Failed to remove item. Please try again.";
      document.body.appendChild(feedback);

      setTimeout(() => {
        feedback.style.opacity = "0";
        setTimeout(() => feedback.remove(), 300);
      }, 2000);
    })
    .finally(() => {
      if (removeButton) {
        removeButton.innerHTML = originalButtonHTML;
        removeButton.disabled = false;
      }
      updateProductCardUI(productId);
    });
}

function getStarIcons(rating) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5 ? 1 : 0;
  const emptyStars = 5 - fullStars - halfStar;

  return "★".repeat(fullStars) + (halfStar ? "½" : "") + "☆".repeat(emptyStars);
}

async function fetchProducts(searchTerm = "", page = 1) {
  try {
    let url;
    if (searchTerm) {
      url = `http://localhost:5000/api/products/search?query=${encodeURIComponent(
        searchTerm
      )}&page=${page}`;
    } else {
      url = `http://localhost:5000/api/products?page=${page}`;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    return {
      products: data.products || data,
      hasMore: data.hasMore,
    };
  } catch (error) {
    console.error("Failed to fetch products:", error);
    throw error;
  }
}

function createLoadMoreButton() {
  const container = document.createElement("div");
  container.className = "col-12 text-center my-4"; // Added my-4 for vertical spacing

  const loadMoreBtn = document.createElement("button");
  loadMoreBtn.className = "btn btn-danger px-4 py-2"; // Added padding for better appearance
  loadMoreBtn.id = "loadMoreBtn";
  loadMoreBtn.textContent = "Load More Products";

  loadMoreBtn.addEventListener("click", () => {
    loadMoreBtn.disabled = true;
    loadMoreBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Loading...';

    currentPage++;
    loadProducts(currentSearchTerm, currentPage, true).finally(() => {
      // Only restore if button still exists (might be removed if no more products)
      if (document.getElementById("loadMoreBtn")) {
        loadMoreBtn.disabled = false;
        loadMoreBtn.textContent = "Load More Products";
      }
    });
  });

  container.appendChild(loadMoreBtn);
  return container;
}

async function renderProducts(products, append = false) {
  const productGrid = document.getElementById("productGrid");

  if (!append) {
    productGrid.innerHTML = "";
    currentPage = 1;
  }

  if (!products || products.length === 0) {
    if (!append) {
      productGrid.innerHTML =
        '<div class="col-12 text-center"><p>No products found matching your search</p></div>';
    }
    return;
  }

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
    });
  });

  // Add event listeners for Remove from Cart buttons
  document.querySelectorAll(".remove-from-cart").forEach((button) => {
    button.addEventListener("click", function () {
      const productId = this.getAttribute("data-product-id");
      removeFromCart(productId);
    });
  });

  // Remove existing load more button if it exists
  const existingLoadMore = document.getElementById("loadMoreBtn");
  if (existingLoadMore) {
    existingLoadMore.parentElement.remove(); // Remove the container div
  }

  // Add new load more button if there are more products
  if (hasMoreProducts) {
    productGrid.appendChild(createLoadMoreButton());
  }
}

async function loadProducts(searchTerm = "", page = 1, append = false) {
  if (isLoading) return;

  try {
    isLoading = true;
    currentSearchTerm = searchTerm;

    const productGrid = document.getElementById("productGrid");
    if (!append) {
      productGrid.innerHTML =
        '<div class="col-12 text-center"><div class="spinner-border text-warning" role="status"></div></div>';
    } else {
      const loadMoreBtn = document.getElementById("loadMoreBtn");
      if (loadMoreBtn) {
        loadMoreBtn.disabled = true;
        loadMoreBtn.innerHTML =
          '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Loading...';
      }
    }

    const { products, hasMore } = await fetchProducts(searchTerm, page);
    hasMoreProducts = hasMore !== undefined ? hasMore : true;

    await renderProducts(products, append);
    updateCartCounter();

    // Hide load more button if no more products
    if (!hasMoreProducts && document.getElementById("loadMoreBtn")) {
      document.getElementById("loadMoreBtn").parentElement.remove();
    }
  } catch (error) {
    console.error("Failed to load products:", error);

    // Restore load more button if error occurs
    const loadMoreBtn = document.getElementById("loadMoreBtn");
    if (loadMoreBtn) {
      loadMoreBtn.disabled = false;
      loadMoreBtn.textContent = "Load More Products";
    }

    if (!append) {
      document.getElementById("productGrid").innerHTML = `
        <div class="col-12 text-center">
          <p class="text-danger">Failed to load products. Please try again later.</p>
          <p class="small">${error.message}</p>
        </div>
      `;
    }
  } finally {
    isLoading = false;
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
  // Load initial products
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
