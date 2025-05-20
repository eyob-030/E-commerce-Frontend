export async function updateCart(productId, quantity, token) {
  return makeApiRequest(`/cart/${productId}`, "PUT", { quantity }, token);
}

export async function clearCart(token) {
  return makeApiRequest("/cart", "DELETE", null, token);
}
