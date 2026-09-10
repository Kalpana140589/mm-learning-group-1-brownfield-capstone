3\) Simple UI Wireframe Descriptions (HTML/Bootstrap)

These are textual wireframes describing layout and elements.





3.1 Home Page — Search Bar + Category Dropdown (Product Listing)

Layout (Top → Bottom):





Header/Nav



Brand: “ShopLite”



Links: Home, Cart, My Orders, (Admin if role=admin), Logout/Login



Filter Bar (single row)



Left: Search Input



Placeholder: “Search products…”



Button: “Search”



Middle/Right: Category Dropdown



Default: “All Categories”



Options populated from /api/categories



Optional: “Clear Filters” link/button (resets search + category)



Results Summary Row



Text: “Showing X products”



Optional: Sort dropdown (Price ↑/↓, Name A–Z)



Product Grid



Cards with: image, name, category badge, price, “Add to Cart”



Empty State



Message: “No products found”



Button: “Clear filters”



Key UI behaviors:





On search submit or dropdown change: re-fetch /api/products?q=...\&category=...



Keep cart count unaffected by filtering.



3.2 Order History View Page

Layout:





Header/Nav (same as above)



Page Title



“My Orders”



Orders List (Bootstrap table or stacked cards)



Columns:



Order ID



Date



Status (badge: PLACED/SHIPPED/etc.)



Total



Action: “View Details”



Each row clickable (optional): navigates to details.



Order Detail Panel (optional)



Either separate page /orders/:id or a modal.



Shows:



Items table: Product Name, Unit Price, Qty, Line Total



Totals summary



Status + timestamps



Empty State



“You have no orders yet.”



Button: “Start shopping” → Home



Key UI behaviors:





Load on page open: GET /api/orders



View details calls: GET /api/orders/:id



Handle 401 by redirecting to login.



3.3 Admin Dashboard Management Form

Layout:





Header/Nav



Admin link highlighted



Page Title



“Admin Dashboard — Product Management”



Two-column layout (desktop)



Left Column: Product Form (Add/Edit)



Fields:



Name (text)



Description (textarea)



Category (text or dropdown)



Price (number)



Image URL (text)



Active toggle (checkbox) (optional)



Buttons:



Primary: “Save”



Secondary: “Reset”



If editing: “Cancel Edit”



Right Column: Product List Table



Columns:



Name



Category



Price



Active (Yes/No)



Actions: Edit | Delete



Delete triggers confirmation modal:



“Are you sure you want to remove this product from the catalog?”



Toast/Alert area



Success: “Product saved”



Error: validation or permission issues



Key UI behaviors:





On load: fetch /api/products (admin may want inactive too; optionally add includeInactive=true for admin only).



Save:



Add mode → POST /api/admin/products



Edit mode → PUT /api/admin/products/:id



Delete → DELETE /api/admin/products/:id (soft delete)

