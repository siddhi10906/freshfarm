# FreshFarm Database Entity-Relationship (ER) Diagram

Below is the complete normalized Entity-Relationship (ER) diagram representing all tables, primary keys, foreign keys, and cardinalities in the **FreshFarm** MySQL database.

```mermaid
erDiagram
    ADMIN {
        int admin_id PK
        string name
        string email UK
        string password
        timestamp created_at
    }

    FARMERS {
        int farmer_id PK
        string full_name
        string email UK
        string password
        string phone
        string village
        string district
        timestamp created_at
    }

    CUSTOMERS {
        int customer_id PK
        string full_name
        string email UK
        string password
        string phone
        string address
        string city
        string pincode
        timestamp created_at
    }

    VEGETABLES {
        int vegetable_id PK
        int farmer_id FK
        string vegetable_name
        string category
        string description
        decimal price
        int quantity
        string image
        decimal avg_rating
        int review_count
        timestamp created_at
    }

    CART {
        int cart_id PK
        int customer_id FK
        int vegetable_id FK
        int quantity
        timestamp created_at
    }

    ORDERS {
        int order_id PK
        int customer_id FK
        decimal total_amount
        string payment_method
        string delivery_address
        enum status
        timestamp order_date
    }

    ORDER_ITEMS {
        int item_id PK
        int order_id FK
        int vegetable_id FK
        int quantity
        decimal price
    }

    DELIVERY_STATUS {
        int delivery_id PK
        int order_id FK
        enum current_status
        timestamp updated_at
    }

    PRODUCT_REVIEWS {
        int review_id PK
        int vegetable_id FK
        int customer_id FK
        int order_id FK
        int rating
        string review_text
        timestamp created_at
    }

    FARMERS ||--o{ VEGETABLES : "supplies (1-to-Many)"
    CUSTOMERS ||--o{ CART : "adds (1-to-Many)"
    VEGETABLES ||--o{ CART : "contained_in (1-to-Many)"
    CUSTOMERS ||--o{ ORDERS : "places (1-to-Many)"
    ORDERS ||--o{ ORDER_ITEMS : "includes (1-to-Many)"
    VEGETABLES ||--o{ ORDER_ITEMS : "ordered_in (1-to-Many)"
    ORDERS ||--1| DELIVERY_STATUS : "tracked_by (1-to-1)"
    VEGETABLES ||--o{ PRODUCT_REVIEWS : "receives (1-to-Many)"
    CUSTOMERS ||--o{ PRODUCT_REVIEWS : "writes (1-to-Many)"
    ORDERS ||--o{ PRODUCT_REVIEWS : "verifies (1-to-Many)"
```

### Table Relationships Summary

1. **FARMERS (1) -> VEGETABLES (N)**: One farmer can list multiple vegetables.
2. **CUSTOMERS (1) -> CART (N)**: One customer can have multiple items in their active cart.
3. **VEGETABLES (1) -> CART (N)**: A vegetable can be in multiple customers' carts.
4. **CUSTOMERS (1) -> ORDERS (N)**: One customer can place multiple orders.
5. **ORDERS (1) -> ORDER_ITEMS (N)**: One order contains multiple line items.
6. **VEGETABLES (1) -> ORDER_ITEMS (N)**: A vegetable can be included in multiple historical order items.
7. **ORDERS (1) -> DELIVERY_STATUS (1)**: Each order maps to a delivery tracking record.
8. **PRODUCT_REVIEWS**: A customer can review a product included in their delivered order; each product stores its calculated average rating and review count.
