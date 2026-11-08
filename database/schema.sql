-- FreshFarm Online Vegetable Marketplace & Delivery System

CREATE DATABASE IF NOT EXISTS freshfarm_db;
USE freshfarm_db;

-- Disable Foreign Key Checks during setup
SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables if re-running script
DROP TABLE IF EXISTS delivery_status;
DROP TABLE IF EXISTS product_reviews;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS cart;
DROP TABLE IF EXISTS vegetables;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS farmers;
DROP TABLE IF EXISTS admin;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. Admin Table
CREATE TABLE admin (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Farmers Table
CREATE TABLE farmers (
    farmer_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    village VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Customers Table
CREATE TABLE customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Vegetables Table
CREATE TABLE vegetables (
    vegetable_id INT AUTO_INCREMENT PRIMARY KEY,
    farmer_id INT NOT NULL,
    vegetable_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    quantity DECIMAL(10,3) NOT NULL DEFAULT 0,
    sold_by VARCHAR(12) NOT NULL DEFAULT 'weight',
    image VARCHAR(255) DEFAULT 'default-vegetable.jpg',
    avg_rating DECIMAL(3,2) NOT NULL DEFAULT 0,
    review_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES farmers(farmer_id) ON DELETE CASCADE,
    INDEX idx_category (category),
    INDEX idx_farmer (farmer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Cart Table
CREATE TABLE cart (
    cart_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    vegetable_id INT NOT NULL,
    quantity DECIMAL(10,3) NOT NULL DEFAULT 1,
    quantity_unit VARCHAR(12) NOT NULL DEFAULT 'kg',
    quantity_value DECIMAL(10,3) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (vegetable_id) REFERENCES vegetables(vegetable_id) ON DELETE CASCADE,
    UNIQUE KEY unique_customer_veg (customer_id, vegetable_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Orders Table
CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'COD',
    delivery_address TEXT NOT NULL,
    status ENUM('Order Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled') DEFAULT 'Order Placed',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    INDEX idx_customer (customer_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Order Items Table
CREATE TABLE order_items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    vegetable_id INT NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    quantity_unit VARCHAR(12) NOT NULL DEFAULT 'kg',
    quantity_value DECIMAL(10,3) NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (vegetable_id) REFERENCES vegetables(vegetable_id) ON DELETE CASCADE,
    INDEX idx_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Delivery Status Table
CREATE TABLE delivery_status (
    delivery_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    current_status ENUM('Order Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered') DEFAULT 'Order Placed',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    INDEX idx_delivery_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Product Reviews
CREATE TABLE product_reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    vegetable_id INT NOT NULL,
    customer_id INT NOT NULL,
    order_id INT NOT NULL,
    rating TINYINT NOT NULL,
    review_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vegetable_id) REFERENCES vegetables(vegetable_id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    UNIQUE KEY unique_review (customer_id, vegetable_id, order_id),
    INDEX idx_veg_reviews (vegetable_id),
    INDEX idx_customer_reviews (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



-- Seed Admin
INSERT INTO admin (name, email, password) VALUES 
('System Admin', 'admin@freshfarm.com', 'password123');

-- Seed Farmers
INSERT INTO farmers (full_name, email, password, phone, village, district) VALUES
('Ramesh Patil', 'ramesh.patil@freshfarm.com', 'password123', '9822012345', 'Manchar', 'Pune'),
('Suresh Deshmukh', 'suresh.deshmukh@freshfarm.com', 'password123', '9822054321', 'Junnar', 'Pune'),
('Anil Shinde', 'anil.shinde@freshfarm.com', 'password123', '9890112233', 'Baramati', 'Pune');

-- Seed Customers
INSERT INTO customers (full_name, email, password, phone, address, city, pincode) VALUES
('Rahul Sharma', 'rahul.sharma@gmail.com', 'password123', '9765432109', 'Flat 402, Green Acres, Kothrud', 'Pune', '411038'),
('Priya Verma', 'priya.verma@gmail.com', 'password123', '9812345678', 'Plot 12, Viman Nagar', 'Pune', '411014');

-- Seed Vegetables
INSERT INTO vegetables (farmer_id, vegetable_name, category, description, price, quantity, image) VALUES
(1, 'Fresh Red Tomatoes', 'Nightshades', 'Organically grown farm-fresh juicy red tomatoes directly from Manchar fields.', 40.00, 150, 'tomatoes.jpg'),
(1, 'Organic Spinach (Palak)', 'Leafy Greens', 'Crisp, washed, nutrient-rich spinach leaves plucked fresh every morning.', 25.00, 80, 'spinach.jpg'),
(2, 'Fresh Potatoes', 'Root Vegetables', 'High-quality naturally harvested brown potatoes rich in starch.', 30.00, 200, 'potatoes.jpg'),
(2, 'Green Capsicum', 'Nightshades', 'Fresh crunchy green bell peppers perfect for salads and cooking.', 60.00, 90, 'capsicum.jpg'),
(3, 'Fresh Onions', 'Root Vegetables', 'Premium quality Maharashtra pink onions sourced directly from Baramati.', 35.00, 250, 'onions.jpg'),
(3, 'Farm Carrots', 'Root Vegetables', 'Sweet and crunchy orange carrots packed with Vitamin A.', 50.00, 100, 'carrots.jpg'),
(1, 'Fresh Cauliflower', 'Cruciferous', 'Pure white fresh cauliflowers grown with organic fertilizers.', 45.00, 60, 'cauliflower.jpg'),
(2, 'Green Peas (Matar)', 'Pods', 'Tender sweet green peas freshly podded from Pune farms.', 70.00, 110, 'green_peas.jpg');

-- Seed Orders
INSERT INTO orders (customer_id, total_amount, payment_method, delivery_address, status, order_date) VALUES
(1, 145.00, 'UPI', 'Flat 402, Green Acres, Kothrud, Pune - 411038', 'Out for Delivery', NOW() - INTERVAL 1 DAY),
(2, 190.00, 'COD', 'Plot 12, Viman Nagar, Pune - 411014', 'Delivered', NOW() - INTERVAL 3 DAY);

-- Seed Order Items
INSERT INTO order_items (order_id, vegetable_id, quantity, price) VALUES
(1, 1, 2, 40.00), -- 2kg Tomatoes = 80
(1, 2, 1, 25.00), -- 1 bunch Spinach = 25
(1, 3, 1, 30.00), -- 1kg Potatoes = 30
(2, 5, 2, 35.00), -- 2kg Onions = 70
(2, 4, 2, 60.00); -- 2kg Capsicum = 120

-- Seed Delivery Status
INSERT INTO delivery_status (order_id, current_status) VALUES
(1, 'Out for Delivery'),
(2, 'Delivered');
USE freshfarm_db;
SELECT customer_id, full_name, email, password FROM customers;
SELECT 
    f.farmer_id,
    f.full_name AS farmer_name,
    f.email,
    f.password,
    f.phone,
    f.village,
    v.vegetable_name,
    v.category,
    v.price,
    v.quantity AS stock_kg
FROM farmers f
LEFT JOIN vegetables v ON f.farmer_id = v.farmer_id
ORDER BY f.farmer_id ASC;
