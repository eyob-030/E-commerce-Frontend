import {
  getCart,
  addToCart,
  removeFromCart,
  updateCartCounter,
} from "./cartModule.js";

let currentPage = 1;
let currentSearchTerm = "";
let isLoading = false;
let hasMoreProducts = true;

export function getStarIcons(rating) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5 ? 1 : 0;
  const emptyStars = 5 - fullStars - halfStar;

  return "★".repeat(fullStars) + (halfStar ? "½" : "") + "☆".repeat(emptyStars);
}

export async function fetchProducts(searchTerm = "", page = 1) {
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

export function createLoadMoreButton() {
  const loadMoreBtn = document.createElement("button");
  loadMoreBtn.className = "btn btn-primary mt-4 mx-auto d-block";
  loadMoreBtn.id = "loadMoreBtn";
  loadMoreBtn.textContent = "Load More Products";
  loadMoreBtn.addEventListener("click", () => {
    currentPage++;
    loadProducts(currentSearchTerm, currentPage, true);
  });

  const container = document.createElement("div");
  container.className = "col-12 text-center";
  container.appendChild(loadMoreBtn);

  return container;
}

export function updateProductCardUI(productId) {
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

  // Update badge
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

export async function renderProducts(products, append = false) {
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

  // Add event listeners
  document.querySelectorAll(".add-to-cart").forEach((button) => {
    button.addEventListener("click", function () {
      const productId = this.getAttribute("data-product-id");
      const quantityInput = document.getElementById(`qty${productId}`);
      const quantity = quantityInput.value;
      addToCart(productId, quantity);
      updateProductCardUI(productId);
    });
  });

  document.querySelectorAll(".remove-from-cart").forEach((button) => {
    button.addEventListener("click", function () {
      const productId = this.getAttribute("data-product-id");
      removeFromCart(productId);
      updateProductCardUI(productId);
    });
  });

  // Load more button
  const existingLoadMore = document.getElementById("loadMoreBtn");
  if (existingLoadMore) {
    existingLoadMore.remove();
  }

  if (hasMoreProducts) {
    productGrid.appendChild(createLoadMoreButton());
  }
}

export async function loadProducts(searchTerm = "", page = 1, append = false) {
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
          '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
      }
    }

    const { products, hasMore } = await fetchProducts(searchTerm, page);
    hasMoreProducts = hasMore !== undefined ? hasMore : true;

    await renderProducts(products, append);
    updateCartCounter();
  } catch (error) {
    console.error("Failed to load products:", error);
    if (!append) {
      document.getElementById("productGrid").innerHTML = `
        <div class="col-12 text-center">
          <p class="text-danger">Failed to load products. Please try again later.</p>
          <p>${error.message}</p>
        </div>
      `;
    }
  } finally {
    isLoading = false;
  }
}
