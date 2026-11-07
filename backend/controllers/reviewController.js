const db = require('../config/db');

// 1. Submit a Review
// POST /api/reviews
// Only allowed if: customer is logged in, order status is 'Delivered', and no duplicate review exists
exports.submitReview = async (req, res) => {
    const body = req.body || {};
    const vegetableId = Number(body.vegetable_id);
    const orderId = Number(body.order_id);
    const numRating = Number(body.rating);
    const reviewText = typeof body.review_text === 'string' ? body.review_text.trim() : '';

    if (!Number.isSafeInteger(vegetableId) || vegetableId < 1 ||
        !Number.isSafeInteger(orderId) || orderId < 1 ||
        !Number.isInteger(numRating) || numRating < 1 || numRating > 5 ||
        !reviewText || reviewText.length > 500) {
        return res.status(400).json({
            message: 'A valid product, order, 1–5 star rating, and review of up to 500 characters are required.'
        });
    }

    let connection;
    try {
        connection = await db.getConnection();
        const customer_id = req.user.id;
        await connection.beginTransaction();

        // Check the order belongs to this customer and is Delivered
        const [orderCheck] = await connection.query(
            `SELECT o.status FROM orders o
             JOIN order_items oi ON o.order_id = oi.order_id
             WHERE o.order_id = ? AND o.customer_id = ? AND oi.vegetable_id = ?`,
            [orderId, customer_id, vegetableId]
        );

        if (orderCheck.length === 0) {
            await connection.rollback();
            return res.status(403).json({ message: 'You have not ordered this product.' });
        }
        if (orderCheck[0].status !== 'Delivered') {
            await connection.rollback();
            return res.status(403).json({ message: 'You can only review a product after it has been delivered.' });
        }

        // Insert review (will fail gracefully on duplicate due to UNIQUE KEY)
        await connection.query(
            `INSERT INTO product_reviews (vegetable_id, customer_id, order_id, rating, review_text)
             VALUES (?, ?, ?, ?, ?)`,
            [vegetableId, customer_id, orderId, numRating, reviewText]
        );

        // Update the cached average atomically so concurrent reviews cannot overwrite one another.
        await connection.query(
            `UPDATE vegetables
             SET avg_rating = ((COALESCE(avg_rating, 0) * COALESCE(review_count, 0)) + ?) /
                              (COALESCE(review_count, 0) + 1),
                 review_count = COALESCE(review_count, 0) + 1
             WHERE vegetable_id = ?`,
            [numRating, vegetableId]
        );

        await connection.commit();
        res.status(201).json({ message: 'Review submitted successfully! Thank you for your feedback.' });
    } catch (err) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error('Error rolling back review submission:', rollbackError);
            }
        }
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'You have already reviewed this product for this order.' });
        }
        console.error('Error submitting review:', err);
        res.status(500).json({ message: 'Server error while submitting review.' });
    } finally {
        if (connection) connection.release();
    }
};

// 2. Get All Reviews for a Vegetable (Public)
// GET /api/reviews/vegetable/:id
exports.getVegetableReviews = async (req, res) => {
    try {
        const { id } = req.params;

        const [reviews] = await db.query(
            `SELECT pr.review_id, pr.rating, pr.review_text, pr.created_at,
                    c.full_name AS customer_name
             FROM product_reviews pr
             JOIN customers c ON pr.customer_id = c.customer_id
             WHERE pr.vegetable_id = ?
             ORDER BY pr.created_at DESC`,
            [id]
        );

        // Compute summary
        const totalReviews = reviews.length;
        const avgRating = totalReviews > 0
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
            : '0.0';

        // Star breakdown
        const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviews.forEach(r => { breakdown[r.rating] = (breakdown[r.rating] || 0) + 1; });

        res.status(200).json({ avgRating, totalReviews, breakdown, reviews });
    } catch (err) {
        console.error('Error fetching vegetable reviews:', err);
        res.status(500).json({ message: 'Server error fetching reviews.' });
    }
};

// 3. Get Reviews Already Submitted by This Customer (to disable duplicate review buttons)
// GET /api/reviews/customer/submitted
exports.getCustomerSubmittedReviews = async (req, res) => {
    try {
        const customer_id = req.user.id;

        const [rows] = await db.query(
            `SELECT vegetable_id, order_id, review_id, rating
             FROM product_reviews
             WHERE customer_id = ?`,
            [customer_id]
        );

        res.status(200).json(rows);
    } catch (err) {
        console.error('Error fetching submitted reviews:', err);
        res.status(500).json({ message: 'Server error fetching submitted reviews.' });
    }
};

// 4. Admin: Get All Reviews (Admin Only)
// GET /api/reviews/admin/all
exports.getAllReviewsAdmin = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT pr.review_id, pr.rating, pr.review_text, pr.created_at,
                    c.full_name AS customer_name, c.email AS customer_email,
                    v.vegetable_name, v.vegetable_id,
                    pr.order_id
             FROM product_reviews pr
             JOIN customers c  ON pr.customer_id  = c.customer_id
             JOIN vegetables v ON pr.vegetable_id = v.vegetable_id
             ORDER BY pr.created_at DESC`
        );
        res.status(200).json(rows);
    } catch (err) {
        console.error('Error fetching all reviews (admin):', err);
        res.status(500).json({ message: 'Server error fetching reviews.' });
    }
};
