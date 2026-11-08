-- Add/update produce units and place fruit listings under a Karvenagar grower.
-- Run once against the target FreshFarm database. Statements are safe to rerun.

ALTER TABLE vegetables MODIFY sold_by VARCHAR(12) NOT NULL DEFAULT 'weight';

INSERT INTO farmers (full_name, email, password, phone, village, district)
SELECT 'FreshFarm Fruit Grower', 'fruit.farmer@freshfarm.com', 'FreshFarmFruit2026!', '9000000005', 'Karvenagar', 'Pune'
WHERE NOT EXISTS (
  SELECT 1 FROM farmers WHERE LOWER(email) = 'fruit.farmer@freshfarm.com'
);

UPDATE vegetables
SET farmer_id = (SELECT farmer_id FROM farmers WHERE LOWER(email) = 'fruit.farmer@freshfarm.com' LIMIT 1)
WHERE LOWER(category) = 'fruits';

UPDATE vegetables SET sold_by = 'dozen' WHERE LOWER(vegetable_name) LIKE '%banana%';
UPDATE vegetables SET sold_by = 'piece' WHERE LOWER(vegetable_name) LIKE '%cabbage%';

