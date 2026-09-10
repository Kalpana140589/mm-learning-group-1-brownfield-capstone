// public/script.js

const API_BASE = ""; // same origin

// DOM
const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("categorySelect");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");
const viewOrdersBtn = document.getElementById("viewOrdersBtn");

const catalogGrid = document.getElementById("catalogGrid");
const catalogCount = document.getElementById("catalogCount");
const catalogError = document.getElementById("catalogError");

const cartList = document.getElementById("cartList");
const cartTotal = document.getElementById("cartTotal");
const clearCartBtn = document.getElementById("clearCartBtn");
const placeOrderBtn = document.getElementById("placeOrderBtn");
const orderMessage = document.getElementById("orderMessage");

const addProductForm = document.getElementById("addProductForm");
const adminName = document.getElementById("adminName");
const adminPrice = document.getElementById("adminPrice");
const adminCategory = document.getElementById("adminCategory");
const adminMessage = document.getElementById("adminMessage");

// Orders modal
const ordersModalBackdrop = document.getElementById("ordersModalBackdrop");
const closeOrdersBtn = document.getElementById("closeOrdersBtn");
const ordersList = document.getElementById("ordersList");
const ordersEmpty = document.getElementById("ordersEmpty");
const ordersError = document.getElementById("ordersError");

// State
let currentProducts = [];
let cart = new Map(); // productId -> { product, quantity }

// ---------------------------
// Utilities
// ---------------------------
function money(n) {
  const num = Number(n) || 0;
  return `$${num.toFixed(2)}`;
}

function showMessage(el, type, text) {
  el.className = type === "error" ? "error" : "success";
  el.textContent = text || "";
}

function clearMessage(el) {
  el.className = "";
  el.textContent = "";
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  // Try parse JSON always
  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    // ignore
  }

  if (!res.ok) {
    const msg = data?.message || `Request failed: ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

function buildProductsQuery() {
  const params = new URLSearchParams();
  const search = searchInput.value.trim();
  const category = categorySelect.value.trim();

  if (search) params.set("search", search);
  if (category) params.set("category", category);

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function deriveCategories(products) {
  const set = new Set();
  products.forEach((p) => {
    if (p.category && String(p.category).trim()) set.add(String(p.category).trim());
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function syncCategoryDropdownFromProducts(products) {
  const currentValue = categorySelect.value;
  const categories = deriveCategories(products);

  // keep the first option (All Categories)
  const first = categorySelect.querySelector("option[value='']");
  categorySelect.innerHTML = "";
  categorySelect.appendChild(first);

  categories.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    categorySelect.appendChild(opt);
  });

  // restore selection if still present
  const stillExists = categories.includes(currentValue);
  categorySelect.value = stillExists ? currentValue : "";
}

// ---------------------------
// Catalog rendering
// ---------------------------
function renderCatalog(products) {
  catalogGrid.innerHTML = "";
  catalogCount.textContent = `${products.length} item(s)`;

  if (!products.length) {
    const div = document.createElement("div");
    div.className = "muted";
    div.textContent = "No products match your filters.";
    catalogGrid.appendChild(div);
    return;
  }

  for (const p of products) {
    const card = document.createElement("div");
    card.className = "card product-card";

    const title = document.createElement("h3");
    title.textContent = p.name ?? "Unnamed product";

    const meta = document.createElement("div");
    meta.className = "meta";
    const stockText =
      typeof p.stock === "number" ? ` • Stock: ${p.stock}` : "";
    meta.textContent = `${p.category ?? "Uncategorized"}${stockText}`;

    const price = document.createElement("div");
    price.className = "price";
    price.textContent = money(p.price);

    const qtyRow = document.createElement("div");
    qtyRow.className = "qty-row";

    const qty = document.createElement("input");
    qty.type = "number";
    qty.min = "1";
    qty.step = "1";
    qty.value = "1";

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.textContent = "Add to Cart";
    addBtn.addEventListener("click", () => {
      const q = Math.max(1, Number(qty.value) || 1);
      addToCart(p, q);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "danger";
    deleteBtn.textContent = "Delete";
    deleteBtn.style.marginLeft = "auto";
    deleteBtn.addEventListener("click", async () => {
      const ok = confirm(`Delete product "${p.name}"?`);
      if (!ok) return;
      await deleteProduct(p.id);
    });

    qtyRow.appendChild(qty);
    qtyRow.appendChild(addBtn);
    qtyRow.appendChild(deleteBtn);

    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(price);
    card.appendChild(qtyRow);

    catalogGrid.appendChild(card);
  }
}

// ---------------------------
// Cart
// ---------------------------
function addToCart(product, quantity) {
  clearMessage(orderMessage);

  const existing = cart.get(product.id);
  const newQty = (existing?.quantity || 0) + quantity;

  // Optional client-side stock guard
  if (typeof product.stock === "number" && newQty > product.stock) {
    showMessage(
      orderMessage,
      "error",
      `Cannot add ${newQty}. Only ${product.stock} in stock for "${product.name}".`
    );
    return;
  }

  cart.set(product.id, { product, quantity: newQty });
  renderCart();
}

function removeFromCart(productId) {
  cart.delete(productId);
  renderCart();
}

function clearCart() {
  cart.clear();
  renderCart();
}

function renderCart() {
  cartList.innerHTML = "";

  let total = 0;
  for (const { product, quantity } of cart.values()) {
    total += (Number(product.price) || 0) * quantity;

    const li = document.createElement("li");

    const topRow = document.createElement("div");
    topRow.className = "row";
    topRow.style.justifyContent = "space-between";

    const name = document.createElement("div");
    name.innerHTML = `<strong>${product.name}</strong> <span class="muted">(${money(
      product.price
    )})</span>`;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "danger";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", () => removeFromCart(product.id));

    topRow.appendChild(name);
    topRow.appendChild(removeBtn);

    const bottomRow = document.createElement("div");
    bottomRow.className = "row";
    bottomRow.style.marginTop = "8px";

    const qtyLabel = document.createElement("div");
    qtyLabel.className = "muted";
    qtyLabel.textContent = "Qty:";

    const qtyInput = document.createElement("input");
    qtyInput.type = "number";
    qtyInput.min = "1";
    qtyInput.step = "1";
    qtyInput.value = String(quantity);
    qtyInput.addEventListener("change", () => {
      const q = Math.max(1, Number(qtyInput.value) || 1);

      // Optional client-side stock guard
      if (typeof product.stock === "number" && q > product.stock) {
        qtyInput.value = String(quantity);
        showMessage(
          orderMessage,
          "error",
          `Cannot set qty to ${q}. Only ${product.stock} in stock for "${product.name}".`
        );
        return;
      }

      cart.set(product.id, { product, quantity: q });
      renderCart();
    });

    const lineTotal = document.createElement("div");
    lineTotal.style.marginLeft = "auto";
    lineTotal.innerHTML = `<strong>${money(
      (Number(product.price) || 0) * quantity
    )}</strong>`;

    bottomRow.appendChild(qtyLabel);
    bottomRow.appendChild(qtyInput);
    bottomRow.appendChild(lineTotal);

    li.appendChild(topRow);
    li.appendChild(bottomRow);
    cartList.appendChild(li);
  }

  cartTotal.textContent = money(total);
  placeOrderBtn.disabled = cart.size === 0;
}

// ---------------------------
// API operations
// ---------------------------
async function loadProducts() {
  clearMessage(adminMessage);
  catalogError.style.display = "none";
  catalogError.textContent = "";

  try {
    const qs = buildProductsQuery();
    const products = await apiFetch(`/api/products${qs}`);
    currentProducts = products;

    // Populate categories from the *full dataset* so users can pick categories
    // even when current filter narrows results.
    const allProducts = await apiFetch("/api/products");
    syncCategoryDropdownFromProducts(allProducts);

    renderCatalog(products);
  } catch (err) {
    catalogError.style.display = "block";
    catalogError.textContent = err.message || "Failed to load products.";
  }
}

async function placeOrder() {
  clearMessage(orderMessage);

  const items = Array.from(cart.values()).map(({ product, quantity }) => ({
    productId: product.id,
    quantity,
  }));

  try {
    placeOrderBtn.disabled = true;
    const created = await apiFetch("/api/orders", {
      method: "POST",
      body: JSON.stringify({ items }),
    });

    showMessage(orderMessage, "success", `Order placed (#${created.id}) - Total: ${money(created.totalAmount)}`);
    clearCart();

    // Refresh products to reflect updated stock
    await loadProducts();
  } catch (err) {
    showMessage(orderMessage, "error", err.message || "Failed to place order.");
  } finally {
    placeOrderBtn.disabled = cart.size === 0;
  }
}

async function loadOrdersIntoModal() {
  ordersError.style.display = "none";
  ordersError.textContent = "";
  ordersList.innerHTML = "";
  ordersEmpty.style.display = "none";

  try {
    const orders = await apiFetch("/api/orders");

    if (!orders.length) {
      ordersEmpty.style.display = "block";
      return;
    }

    for (const o of orders) {
      const li = document.createElement("li");

      const header = document.createElement("div");
      header.className = "row";
      header.style.justifyContent = "space-between";

      const left = document.createElement("div");
      left.innerHTML = `<strong>Order #${o.id}</strong> <span class="muted">(${new Date(
        o.createdAt
      ).toLocaleString()})</span>`;

      const right = document.createElement("div");
      right.innerHTML = `<strong>${money(o.totalAmount)}</strong>`;

      header.appendChild(left);
      header.appendChild(right);

      const items = document.createElement("div");
      items.className = "muted";
      items.style.marginTop = "8px";
      const lines =
        (o.items || [])
          .map((it) => `${it.quantity} × ${it.name} (${money(it.price)})`)
          .join(" • ") || "No items";
      items.textContent = lines;

      li.appendChild(header);
      li.appendChild(items);

      ordersList.appendChild(li);
    }
  } catch (err) {
    ordersError.style.display = "block";
    ordersError.textContent = err.message || "Failed to load orders.";
  }
}

async function addProduct() {
  clearMessage(adminMessage);

  const payload = {
    name: adminName.value.trim(),
    price: Number(adminPrice.value),
    category: adminCategory.value.trim(),
  };

  if (!payload.name || !payload.category || !Number.isFinite(payload.price)) {
    showMessage(adminMessage, "error", "Please enter name, price, and category.");
    return;
  }

  try {
    await apiFetch("/api/admin/products", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    showMessage(adminMessage, "success", "Product added.");
    addProductForm.reset();

    // refresh catalog (keeps filters)
    await loadProducts();
  } catch (err) {
    showMessage(adminMessage, "error", err.message || "Failed to add product.");
  }
}

async function deleteProduct(productId) {
  clearMessage(adminMessage);
  clearMessage(orderMessage);

  try {
    await apiFetch(`/api/admin/products/${productId}`, { method: "DELETE" });

    // remove from cart if present
    if (cart.has(productId)) cart.delete(productId);
    renderCart();

    showMessage(adminMessage, "success", "Product deleted.");
    await loadProducts();
  } catch (err) {
    showMessage(adminMessage, "error", err.message || "Failed to delete product.");
  }
}

// ---------------------------
// Modal controls
// ---------------------------
function openOrdersModal() {
  ordersModalBackdrop.classList.add("show");
  loadOrdersIntoModal();
}
function closeOrdersModal() {
  ordersModalBackdrop.classList.remove("show");
}

// ---------------------------
// Events
// ---------------------------
let searchDebounce = null;
searchInput.addEventListener("input", () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(loadProducts, 250);
});

categorySelect.addEventListener("change", () => loadProducts());

clearFiltersBtn.addEventListener("click", () => {
  searchInput.value = "";
  categorySelect.value = "";
  loadProducts();
});

clearCartBtn.addEventListener("click", () => {
  clearMessage(orderMessage);
  clearCart();
});

placeOrderBtn.addEventListener("click", placeOrder);

viewOrdersBtn.addEventListener("click", openOrdersModal);
closeOrdersBtn.addEventListener("click", closeOrdersModal);

// Close modal when clicking backdrop
ordersModalBackdrop.addEventListener("click", (e) => {
  if (e.target === ordersModalBackdrop) closeOrdersModal();
});

// Admin form
addProductForm.addEventListener("submit", (e) => {
  e.preventDefault();
  addProduct();
});

// Init
(async function init() {
  renderCart();
  await loadProducts();
})();