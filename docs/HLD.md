1\) High-Level Design (HLD) Overview

1.1 System Context

ShopLite is a brownfield e-commerce application with baseline capabilities:





User login (authentication)



Product listing



Cart functionality



Enhancements to be added:





Product Search \& Category Filters



Order History (Checkout → Orders → Order Tracking)



Admin Dashboard (Product catalog CRUD)



1.2 Architecture Style

Client–Server architecture





Client: HTML + Bootstrap + JavaScript (fetch/XHR)



Server: Node.js + Express (REST API)



Data storage: Initially in-memory collections within server.js (or JSON persistence if already present). Orders require persistent storage for realistic history; if not available, implement file-backed JSON storage as a stepping stone.



1.3 Component View

Frontend (HTML/Bootstrap)





Pages/Views (or SPA-like screens):



Home/Product Listing (enhanced with search + category filter)



Cart (enhanced with Checkout)



Order History (new)



Order Detail (optional but recommended)



Admin Dashboard (new; admin-only)



JS modules (recommended): products.js, orders.js, admin.js, auth.js, api.js



Backend (Express)





Middleware:



requireAuth (ensures authenticated access)



requireAdmin (role-based access control)



Routes:



Product browse/search endpoints



Order endpoints (create + list + detail)



Admin product management endpoints



Data layer:



products\[], orders\[], users\[] (or file-based repositories)



1.4 Key Design Decisions

RBAC: Add role to user (e.g., user, admin) to restrict admin APIs and admin UI.



Order immutability: Store snapshots of purchased item name/price in order items so historical orders remain accurate after product edits.



Soft delete products: Admin “delete” should mark product inactive (isActive=false) to avoid breaking existing orders.



Search/filter performed server-side: Keeps client simple and supports consistent behavior.



1.5 Security Overview

Authentication: reuse existing mechanism (session/JWT/basic token) in baseline.



Authorization:



Orders endpoints require authenticated user and ownership checks.



Admin endpoints require authenticated admin.



Input validation:



Product CRUD validates required fields and types.



Orders validate quantities and product existence/active status.



1.6 Non-Functional Requirements (NFRs)

Performance: product filtering should operate efficiently for small/medium catalogs (in-memory filtering acceptable initially).



Reliability: consistent error codes/messages; prevent partial order creation.



Maintainability: keep route handlers modular (even if staying in server.js, group by feature).



Usability: filters should be clearable; empty states should guide users.

