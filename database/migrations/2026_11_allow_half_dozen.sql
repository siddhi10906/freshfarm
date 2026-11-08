-- Allows banana stock to be decremented/reserved in half-dozen increments.
ALTER TABLE vegetables MODIFY COLUMN quantity DECIMAL(10,3) NOT NULL DEFAULT 0;
ALTER TABLE cart MODIFY COLUMN quantity DECIMAL(10,3) NOT NULL DEFAULT 1;
ALTER TABLE order_items MODIFY COLUMN quantity DECIMAL(10,3) NOT NULL;
