const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Mock initial product database (Brownfield baseline)
let products = [
  { id: 1, name: 'Wireless Mouse', price: 25.99, category: 'Electronics' },
  { id: 2, name: 'Mechanical Keyboard', price: 79.99, category: 'Electronics' },
  { id: 3, name: 'Running Shoes', price: 59.99, category: 'Sports' }
];

// API endpoint to get products
app.get('/api/products', (req, res) => {
  res.json(products);
});

app.listen(PORT, () => {
  console.log(`ShopLite server running at http://localhost:${PORT}`);
});