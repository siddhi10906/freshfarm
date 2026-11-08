-- Add demo produce to an existing FreshFarm database.
-- Safe to run more than once; existing products with these names are skipped.
-- These rows use the seeded farmer accounts and can be edited/deleted in Farmer Dashboard.

INSERT INTO vegetables
    (farmer_id, vegetable_name, category, description, price, quantity, image)
SELECT f.farmer_id, p.vegetable_name, p.category, p.description, p.price, p.quantity, p.image
FROM farmers f
CROSS JOIN (
    SELECT 'Fresh Lady Finger (Bhindi)' AS vegetable_name, 'Pods & Beans' AS category,
           'Tender green okra harvested fresh from local farms.' AS description,
           30.00 AS price, 45 AS quantity, '/assets/images/produce/bhindi_exact.png' AS image,
           'ramesh.patil@freshfarm.com' AS farmer_email
    UNION ALL SELECT 'Farm Fresh Cucumbers', 'Gourds',
           'Cool, crisp cucumbers for salads and everyday meals.',
           35.00, 55, '/assets/images/produce/cucumber.png', 'suresh.deshmukh@freshfarm.com'
    UNION ALL SELECT 'Fresh Green Cabbage', 'Cruciferous',
           'Firm green cabbage grown by local farmers.',
           32.00, 38, '/assets/images/produce/cabbage.png', 'suresh.deshmukh@freshfarm.com'
    UNION ALL SELECT 'Earthy Beetroot', 'Root Vegetables',
           'Naturally sweet beetroot, freshly harvested.',
           45.00, 30, '/assets/images/produce/beetroot.png', 'ramesh.patil@freshfarm.com'
    UNION ALL SELECT 'Crisp Red Apples', 'Fruits',
           'Sweet and crisp apples for a fresh daily snack.',
           160.00, 35, '/assets/images/produce/apples.png', 'ramesh.patil@freshfarm.com'
    UNION ALL SELECT 'Fresh Bananas', 'Fruits',
           'Naturally sweet bananas sourced from trusted growers.',
           60.00, 50, '/assets/images/produce/bananas.png', 'anil.shinde@freshfarm.com'
    UNION ALL SELECT 'Juicy Oranges', 'Fruits',
           'Bright, juicy oranges packed with a refreshing citrus taste.',
           85.00, 40, '/assets/images/produce/oranges.png', 'anil.shinde@freshfarm.com'
    UNION ALL SELECT 'Sweet Pomegranates', 'Fruits',
           'Fresh pomegranates with juicy ruby-red seeds.',
           140.00, 25, '/assets/images/produce/pomegranate.jpg', 'anil.shinde@freshfarm.com'
) p
WHERE LOWER(f.email) = LOWER(p.farmer_email)
  AND NOT EXISTS (
      SELECT 1 FROM vegetables existing
      WHERE LOWER(existing.vegetable_name) = LOWER(p.vegetable_name)
  );

-- Refresh paths when this migration was previously run with the initial placeholders.
UPDATE vegetables
SET image = CASE
    WHEN vegetable_name = 'Fresh Lady Finger (Bhindi)' THEN '/assets/images/produce/bhindi_exact.png'
    WHEN vegetable_name = 'Farm Fresh Cucumbers' THEN '/assets/images/produce/cucumber.png'
    WHEN vegetable_name = 'Fresh Green Cabbage' THEN '/assets/images/produce/cabbage.png'
    WHEN vegetable_name = 'Earthy Beetroot' THEN '/assets/images/produce/beetroot.png'
    WHEN vegetable_name = 'Crisp Red Apples' THEN '/assets/images/produce/apples.png'
    WHEN vegetable_name = 'Fresh Bananas' THEN '/assets/images/produce/bananas.png'
    WHEN vegetable_name = 'Juicy Oranges' THEN '/assets/images/produce/oranges.png'
    WHEN vegetable_name = 'Sweet Pomegranates' THEN '/assets/images/produce/pomegranate.jpg'
    ELSE image
END
WHERE vegetable_name IN (
    'Fresh Lady Finger (Bhindi)', 'Farm Fresh Cucumbers', 'Fresh Green Cabbage',
    'Earthy Beetroot', 'Crisp Red Apples', 'Fresh Bananas', 'Juicy Oranges', 'Sweet Pomegranates'
);
