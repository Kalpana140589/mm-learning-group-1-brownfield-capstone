// server.js
// ShopLite API - in-memory products + orders
// Supports:
// 1) Product filtering: GET /api/products?search=mouse&category=Electronics
// 2) Orders: POST /api/orders, GET /api/orders
// 3) Admin product management: POST/PUT/DELETE /api/admin/products

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ------------------------------------------------------
// In-memory "database"
// ------------------------------------------------------
let products = [
  {
    id: 1,
    name: "Wireless Mouse",
    category: "Electronics",
    price: 19.99,
    description: "2.4GHz wireless mouse",
    imageUrl: "https://via.placeholder.com/150",
    stock: 50,
  },
  {
    id: 2,
    name: "Mechanical Keyboard",
    category: "Electronics",
    price: 59.99,
    description: "Blue switches mechanical keyboard",
    imageUrl: "https://via.placeholder.com/150",
    stock: 25,
  },
  {
    id: 3,
    name: "Water Bottle",
    category: "Home",
    price: 12.5,
    description: "Insulated stainless steel bottle",
    imageUrl: "https://via.placeholder.com/150",
    stock: 100,
  },
];

let orders = [
  // Example:
  // {
  //   id: 1,
  //   createdAt: "2026-01-01T12:00:00.000Z",
  //   items: [{ productId: 1, name: "Wireless Mouse", price: 19.99, quantity: 2 }],
  //   totalAmount: 39.98,
  // }
];

// Simple incremental IDs
let nextProductId = products.length ? Math.max(...products.map((p) => p.id)) + 1 : 1;
let nextOrderId = orders.length ? Math.max(...orders.map((o) => o.id)) + 1 : 1;

// Helpers
function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}
function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// ------------------------------------------------------
// Health
// ------------------------------------------------------
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// ------------------------------------------------------
// 1) Product listing + filtering
// GET /api/products?search=mouse&category=Electronics
// - search matches "name" case-insensitively (substring)
// - category matches exactly (case-insensitive) by default
// ------------------------------------------------------
app.get("/api/products", (req, res) => {
  const { search, category } = req.query;

  let result = [...products];

  if (isNonEmptyString(search)) {
    const q = search.trim().toLowerCase();
    result = result.filter((p) => (p.name || "").toLowerCase().includes(q));
  }

  if (isNonEmptyString(category)) {
    const c = category.trim().toLowerCase();
    result = result.filter((p) => (p.category || "").toLowerCase() === c);
  }

  res.json(result);
});

// Optional: get single product by id
app.get("/api/products/:id", (req, res) => {
  const id = Number(req.params.id);
  const product = products.find((p) => p.id === id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json(product);
});

// ------------------------------------------------------
// 2) Orders
// POST /api/orders -> place an order
// GET  /api/orders -> view past orders
//
// POST body example:
// {
//   "items": [
//     { "productId": 1, "quantity": 2 },
//     { "productId": 3, "quantity": 1 }
//   ]
// }
//
// Response includes expanded item name/price + totalAmount.
// Stock is decremented (if present).
// ------------------------------------------------------
app.get("/api/orders", (req, res) => {
  // Return newest first for convenience
  const sorted = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(sorted);
});

app.post("/api/orders", (req, res) => {
  const { items } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Order must include a non-empty items array." });
  }

  // Validate and expand items
  const expandedItems = [];
  for (const item of items) {
    const productId = Number(item?.productId);
    const quantity = toNumber(item?.quantity);

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ message: "Each item must include a valid productId." });
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return res.status(400).json({ message: "Each item must include a valid quantity > 0." });
    }

    const product = products.find((p) => p.id === productId);
    if (!product) {
      return res.status(400).json({ message: `Product not found for productId=${productId}` });
    }

    // Stock check (if stock is defined)
    if (typeof product.stock === "number" && product.stock < quantity) {
      return res.status(400).json({
        message: `Insufficient stock for "${product.name}". Requested ${quantity}, available ${product.stock}.`,
      });
    }

    expandedItems.push({
      productId: product.id,
      name: product.name,
      price: Number(product.price) || 0,
      quantity,
    });
  }

  // Decrement stock after validation succeeds
  for (const it of expandedItems) {
    const product = products.find((p) => p.id === it.productId);
    if (product && typeof product.stock === "number") {
      product.stock -= it.quantity;
    }
  }

  const totalAmount = expandedItems.reduce((sum, it) => sum + it.price * it.quantity, 0);

  const newOrder = {
    id: nextOrderId++,
    createdAt: new Date().toISOString(),
    items: expandedItems,
    totalAmount: Number(totalAmount.toFixed(2)),
  };

  orders.push(newOrder);

  res.status(201).json(newOrder);
});

// ------------------------------------------------------
// 3) Admin Product Management
// NOTE: No auth included (in-memory brownfield demo).
//
// POST   /api/admin/products        -> add
// PUT    /api/admin/products/:id    -> update
// DELETE /api/admin/products/:id    -> delete
//
// Product payload example:
// {
//   "name": "USB-C Hub",
//   "category": "Electronics",
//   "price": 24.99,
//   "description": "7-in-1 hub",
//   "imageUrl": "https://...",
//   "stock": 10
// }
// ------------------------------------------------------
app.post("/api/admin/products", (req, res) => {
  const { name, category, price, description, imageUrl, stock } = req.body || {};

  if (!isNonEmptyString(name)) return res.status(400).json({ message: "name is required." });
  if (!isNonEmptyString(category)) return res.status(400).json({ message: "category is required." });

  const numericPrice = toNumber(price);
  if (numericPrice === null || numericPrice < 0) {
    return res.status(400).json({ message: "price must be a number >= 0." });
  }

  const numericStock = stock === undefined ? undefined : toNumber(stock);
  if (numericStock !== undefined && (numericStock === null || numericStock < 0)) {
    return res.status(400).json({ message: "stock must be a number >= 0 if provided." });
  }

  const newProduct = {
    id: nextProductId++,
    name: name.trim(),
    category: category.trim(),
    price: numericPrice,
    description: isNonEmptyString(description) ? description.trim() : "",
    imageUrl: isNonEmptyString(imageUrl) ? imageUrl.trim() : "",
    ...(numericStock !== undefined ? { stock: numericStock } : {}),
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
});

app.put("/api/admin/products/:id", (req, res) => {
  const id = Number(req.params.id);
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return res.status(404).json({ message: "Product not found" });

  const existing = products[idx];
  const { name, category, price, description, imageUrl, stock } = req.body || {};

  // Update only provided fields (PATCH-like behavior but via PUT)
  if (name !== undefined) {
    if (!isNonEmptyString(name)) return res.status(400).json({ message: "name cannot be empty." });
    existing.name = name.trim();
  }

  if (category !== undefined) {
    if (!isNonEmptyString(category)) return res.status(400).json({ message: "category cannot be empty." });
    existing.category = category.trim();
  }

  if (price !== undefined) {
    const numericPrice = toNumber(price);
    if (numericPrice === null || numericPrice < 0) {
      return res.status(400).json({ message: "price must be a number >= 0." });
    }
    existing.price = numericPrice;
  }

  if (description !== undefined) {
    existing.description = isNonEmptyString(description) ? description.trim() : "";
  }

  if (imageUrl !== undefined) {
    existing.imageUrl = isNonEmptyString(imageUrl) ? imageUrl.trim() : "";
  }

  if (stock !== undefined) {
    const numericStock = toNumber(stock);
    if (numericStock === null || numericStock < 0) {
      return res.status(400).json({ message: "stock must be a number >= 0." });
    }
    existing.stock = numericStock;
  }

  products[idx] = existing;
  res.json(existing);
});

app.delete("/api/admin/products/:id", (req, res) => {
  const id = Number(req.params.id);
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return res.status(404).json({ message: "Product not found" });

  const deleted = products.splice(idx, 1)[0];
  res.json({ message: "Product deleted", product: deleted });
});

// ------------------------------------------------------
// 404 + Error handler
// ------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

// ------------------------------------------------------
app.listen(PORT, () => {
  console.log(`ShopLite API server running on port ${PORT}`);
});