import { loadProducts, syncCartWithServer } from "./productModule.js";
import { updateCartCounter } from "./cartModule.js";

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

  // Initial cart sync with server
  syncCartWithServer();
});
