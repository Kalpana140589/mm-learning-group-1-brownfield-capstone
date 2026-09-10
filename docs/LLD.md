2\) Low-Level Design (LLD) — API Endpoints \& Behaviors

> Naming convention: all endpoints under /api to separate from static HTML.





2.1 Data Models (Backend)

Product

json





Copy



Download

{

&#x20; "id": "p-1001",

&#x20; "name": "Classic T-Shirt",

&#x20; "description": "100% cotton ...",

&#x20; "category": "Apparel",

&#x20; "price": 19.99,

&#x20; "imageUrl": "/images/tshirt.png",

&#x20; "isActive": true,

&#x20; "createdAt": "ISO-8601",

&#x20; "updatedAt": "ISO-8601"

}

Order

json





Copy



Download

{

&#x20; "id": "o-2001",

&#x20; "userId": "u-1",

&#x20; "status": "PLACED",

&#x20; "createdAt": "ISO-8601",

&#x20; "updatedAt": "ISO-8601",

&#x20; "items": \[

&#x20;   {

&#x20;     "productId": "p-1001",

&#x20;     "name": "Classic T-Shirt",

&#x20;     "unitPrice": 19.99,

&#x20;     "quantity": 2,

&#x20;     "lineTotal": 39.98

&#x20;   }

&#x20; ],

&#x20; "totals": {

&#x20;   "subtotal": 39.98,

&#x20;   "tax": 0,

&#x20;   "shipping": 0,

&#x20;   "grandTotal": 39.98

&#x20; }

}

2.2 Product Search \& Category Filter APIs

A) GET /api/products

Purpose: Retrieve products with optional filters.

Auth: Public (or requires login if baseline requires it).

Query Params:





q (optional): keyword search across name and description (case-insensitive)



category (optional): exact category match



sort (optional): price\_asc|price\_desc|name\_asc|name\_desc



Request Example:

GET /api/products?q=shirt\&category=Apparel\&sort=price\_asc





Success Response (200):





json





Copy



Download

{

&#x20; "items": \[ { "id": "...", "name": "...", "category": "...", "price": 10.0 } ],

&#x20; "total": 12

}

Rules:





Only return isActive=true products.



If no matches, return items: \[] and total: 0.



B) GET /api/categories

Purpose: Provide category list for dropdown.

Auth: Public.

Response (200):





json





Copy



Download

{ "items": \["All", "Apparel", "Electronics", "Books"] }

Rules:





Categories derived from active products to prevent stale categories.



> Note: You mentioned GET /api/search. You can implement it, but it’s redundant if /api/products supports q. If you want it explicitly:





C) GET /api/search (optional alias)

Accepts same query params, returns same payload as /api/products.



2.3 Order History APIs

A) POST /api/orders

Purpose: Convert the cart into an order (“checkout”).

Auth: Required.





Request Body:





json





Copy



Download

{

&#x20; "items": \[

&#x20;   { "productId": "p-1001", "quantity": 2 },

&#x20;   { "productId": "p-1005", "quantity": 1 }

&#x20; ]

}

Validation Rules:





items must exist and not be empty.



Each quantity must be integer >= 1.



Each product must exist and be active.



Totals calculated server-side (do not trust client pricing).



Success Response (201):





json





Copy



Download

{ "orderId": "o-2001", "status": "PLACED" }

Errors:





400: empty cart, invalid quantities



401: unauthenticated



404: product not found



409: product inactive/unavailable (optional)



B) GET /api/orders

Purpose: List orders for the logged-in user.

Auth: Required.





Success Response (200):





json





Copy



Download

{

&#x20; "items": \[

&#x20;   { "id": "o-2001", "createdAt": "...", "status": "PLACED", "grandTotal": 39.98 }

&#x20; ]

}

Rules:





Only return orders where order.userId === req.user.id.



C) GET /api/orders/:orderId

Purpose: Get detail for a specific order.

Auth: Required + Ownership enforced.





Success Response (200):





json





Copy



Download

{ "id": "o-2001", "items": \[ ... ], "totals": { ... }, "status": "PLACED" }

Errors:





401: unauthenticated



403/404: order not owned by user (choose one pattern consistently)



2.4 Admin Dashboard APIs (Product Management)

All admin endpoints require:





Auth: Required



Authorization: Admin role required (req.user.role === "admin")



A) POST /api/admin/products

Purpose: Create a product.





Request Body:





json





Copy



Download

{

&#x20; "name": "New Product",

&#x20; "description": "Details...",

&#x20; "category": "Books",

&#x20; "price": 12.99,

&#x20; "imageUrl": "/images/book.png"

}

Response (201):





json





Copy



Download

{ "id": "p-1010" }

Validation:





name/category required



price numeric > 0



description optional (but recommended)



B) PUT /api/admin/products/:productId

Purpose: Update product fields.





Request Body (example):





json





Copy



Download

{ "price": 14.99, "category": "Specials", "isActive": true }

Response (200):





json





Copy



Download

{ "message": "Updated", "id": "p-1010" }

C) DELETE /api/admin/products/:productId

Purpose: Soft delete product (recommended).

Behavior: set isActive=false.





Response (200):





json





Copy



Download

{ "message": "Deleted", "id": "p-1010" }

Errors:





401 unauthenticated



403 non-admin



404 product not found

