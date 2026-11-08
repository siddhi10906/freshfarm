-- Cauliflower listings are sold as individual heads rather than by weight.
UPDATE vegetables
SET sold_by = 'piece'
WHERE LOWER(vegetable_name) LIKE '%cauliflower%';
