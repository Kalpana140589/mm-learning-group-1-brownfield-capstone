Feature 1: Product Search \& Category Filters



Feature: Product Search and Category Filters

&#x20; As a shopper

&#x20; I want to search products and filter by category

&#x20; So that I can quickly find what I need



&#x20; Background:

&#x20;   Given I am on the ShopLite home page



&#x20; @search

&#x20; Scenario: Search returns matching products by name

&#x20;   When I enter "shirt" in the product search box

&#x20;   And I submit the search

&#x20;   Then I should see a list of products matching "shirt"

&#x20;   And each visible product title should contain "shirt" or be otherwise highlighted as a match



&#x20; @search

&#x20; Scenario: Search with no matches shows empty state

&#x20;   When I enter "zzzz-nonexistent" in the product search box

&#x20;   And I submit the search

&#x20;   Then I should see a "No products found" message

&#x20;   And I should not see any product cards in the results grid



&#x20; @search

&#x20; Scenario: Clearing search restores full catalog

&#x20;   Given I have searched for "shirt"

&#x20;   When I clear the search input

&#x20;   Then I should see the default product listing



&#x20; @filters

&#x20; Scenario: Filter products by a single category

&#x20;   When I select the category filter "Electronics"

&#x20;   Then I should see only products in the "Electronics" category



&#x20; @filters

&#x20; Scenario: Changing category updates results

&#x20;   Given I have selected the category filter "Electronics"

&#x20;   When I change the category filter to "Clothing"

&#x20;   Then I should see only products in the "Clothing" category



&#x20; @filters

&#x20; Scenario: Reset category filter shows all categories

&#x20;   Given I have selected the category filter "Clothing"

&#x20;   When I reset the category filter to "All"

&#x20;   Then I should see products from multiple categories



&#x20; @search @filters

&#x20; Scenario: Search results can be narrowed by category filter

&#x20;   When I enter "shoe" in the product search box

&#x20;   And I submit the search

&#x20;   And I select the category filter "Sports"

&#x20;   Then I should see only products matching "shoe" in the "Sports" category



&#x20; @search @filters

&#x20; Scenario: Category filter persists while refining search text

&#x20;   Given I select the category filter "Books"

&#x20;   When I enter "history" in the product search box

&#x20;   And I submit the search

&#x20;   Then I should see only "Books" category products matching "history"

&#x20;   When I change the search text to "science"

&#x20;   And I submit the search

&#x20;   Then I should see only "Books" category products matching "science"







Feature 2: Order History
Feature: Order History

&#x20; As a shopper

&#x20; I want to view my order history

&#x20; So that I can track my past purchases



&#x20; Background:

&#x20;   Given I am an authenticated user



&#x20; @orders

&#x20; Scenario: Viewing order history displays a list of past orders

&#x20;   When I navigate to the "Order History" page

&#x20;   Then I should see a list of orders

&#x20;   And each order should display an order id

&#x20;   And each order should display an order date

&#x20;   And each order should display a total amount

&#x20;   And each order should display an order status



&#x20; @orders

&#x20; Scenario: Order history empty state

&#x20;   Given my account has no previous orders

&#x20;   When I navigate to the "Order History" page

&#x20;   Then I should see a "No orders yet" message

&#x20;   And I should see a call-to-action to start shopping



&#x20; @orders

&#x20; Scenario: Viewing order details from order history

&#x20;   Given I am on the "Order History" page

&#x20;   When I open the details for an order

&#x20;   Then I should see the order line items

&#x20;   And each line item should show product name

&#x20;   And each line item should show quantity

&#x20;   And each line item should show price

&#x20;   And I should see the order total matching the sum of line items (including any taxes/shipping if applicable)



&#x20; @orders

&#x20; Scenario: Order history is scoped to the current user

&#x20;   Given I am on the "Order History" page

&#x20;   Then I should not see orders that belong to other users



&#x20; @orders

&#x20; Scenario: Accessing order history requires authentication

&#x20;   Given I am not authenticated

&#x20;   When I navigate to the "Order History" page

&#x20;   Then I should be redirected to the login page

&#x20;   And I should see a message indicating login is required



Feature 3: Admin Dashboard (Add/Delete Products)

Feature: Admin Dashboard Product Management

&#x20; As an admin

&#x20; I want to add and delete products

&#x20; So that I can manage the store catalog



&#x20; Background:

&#x20;   Given I am authenticated as an admin user

&#x20;   And I am on the Admin Dashboard page



&#x20; @admin @add

&#x20; Scenario: Admin can add a product with valid data

&#x20;   When I click "Add Product"

&#x20;   And I enter product name "Test Product"

&#x20;   And I enter product price "19.99"

&#x20;   And I select product category "Clothing"

&#x20;   And I enter product description "A QA test item"

&#x20;   And I enter product image URL "https://example.com/test.png"

&#x20;   And I save the product

&#x20;   Then I should see a success message

&#x20;   And I should see "Test Product" in the product list



&#x20; @admin @add

&#x20; Scenario: Adding a product requires mandatory fields

&#x20;   When I click "Add Product"

&#x20;   And I leave the product name empty

&#x20;   And I save the product

&#x20;   Then I should see a validation error for the product name

&#x20;   And the product should not be created



&#x20; @admin @add

&#x20; Scenario: Adding a product with invalid price is rejected

&#x20;   When I click "Add Product"

&#x20;   And I enter product name "Bad Price Product"

&#x20;   And I enter product price "-5"

&#x20;   And I save the product

&#x20;   Then I should see a validation error for the price

&#x20;   And the product should not be created



&#x20; @admin @delete

&#x20; Scenario: Admin can delete an existing product

&#x20;   Given a product named "Delete Me Product" exists in the catalog

&#x20;   When I delete the product "Delete Me Product"

&#x20;   Then I should see a success message

&#x20;   And I should not see "Delete Me Product" in the product list



&#x20; @admin @delete

&#x20; Scenario: Delete product requires confirmation

&#x20;   Given a product named "Confirm Delete Product" exists in the catalog

&#x20;   When I click delete for "Confirm Delete Product"

&#x20;   Then I should see a delete confirmation prompt

&#x20;   When I confirm deletion

&#x20;   Then "Confirm Delete Product" should be removed from the product list



&#x20; @admin @security

&#x20; Scenario: Non-admin users cannot access Admin Dashboard

&#x20;   Given I am authenticated as a non-admin user

&#x20;   When I navigate to the Admin Dashboard page

&#x20;   Then I should see an access denied message or be redirected

&#x20;   And I should not be able to add or delete products

