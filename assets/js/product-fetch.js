async function loadProducts() {
  try {
    const res = await fetch("http://localhost:5000/api/products");
    const products = await res.json();
    const container = document.getElementById("product-list");
    container.innerHTML = "";

    products.forEach((product, index) => {
      const starIcons = getStarIcons(product.rating);

      const productHTML = `
          <div class="col">
            <div class="card h-100">
              <img src="${product.image}" class="card-img-top" alt="${
        product.title
      }" />
              <div class="card-body">
                <h5 class="card-title">${product.title}</h5>
                <p class="card-text">
                  $${product.price.toFixed(2)}
                  <span class="text-decoration-line-through text-muted small ms-2">
                    $${product.original_price.toFixed(2)}
                  </span>
                </p>
                <div class="text-warning mb-2">
                  ${starIcons}
                  <span class="text-muted small ms-2">(${
                    product.reviews
                  })</span>
                </div>
                <div class="d-flex align-items-center gap-2 mb-3">
                  <label for="qty${index}" class="form-label mb-0">Qty:</label>
                  <input type="number" class="form-control form-control-sm quantity-input" id="qty${index}" min="1" value="1" />
                </div>
                <button class="btn btn-warning w-100">
                  <i class="fas fa-shopping-cart me-2"></i>Add to Cart
                </button>
              </div>
            </div>
          </div>
        `;
      container.insertAdjacentHTML("beforeend", productHTML);
    });
  } catch (err) {
    console.error("Failed to load products:", err);
  }
}

function getStarIcons(rating) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  let starsHTML = "";

  for (let i = 0; i < fullStars; i++) {
    starsHTML += '<i class="fas fa-star"></i>';
  }
  if (halfStar) {
    starsHTML += '<i class="fas fa-star-half-alt"></i>';
  }
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  for (let i = 0; i < emptyStars; i++) {
    starsHTML += '<i class="far fa-star"></i>';
  }
  return starsHTML;
}

// Run on page load
document.addEventListener("DOMContentLoaded", loadProducts);
