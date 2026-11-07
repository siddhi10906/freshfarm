import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, MessageSquare, User, Calendar, TrendingUp } from 'lucide-react';
import StarRating from '../components/StarRating';
import LoadingSpinner from '../components/LoadingSpinner';
import API from '../services/api';

const ProductReviewsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [vegetable, setVegetable] = useState(null);
    const [reviewData, setReviewData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [vegRes, reviewRes] = await Promise.all([
                    API.get(`/vegetables/${id}`),
                    API.get(`/reviews/vegetable/${id}`),
                ]);
                setVegetable(vegRes.data);
                setReviewData(reviewRes.data);
            } catch (err) {
                console.error('Error loading reviews page:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) return <LoadingSpinner message="Loading reviews..." />;

    const { avgRating, totalReviews, breakdown, reviews } = reviewData || {};
    const avgNum = parseFloat(avgRating) || 0;

    const StarBar = ({ star, count, total }) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: '600', minWidth: '18px' }}>{star}</span>
                <Star size={13} fill="#F59E0B" color="#F59E0B" />
                <div style={{ flex: 1, height: '8px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: 0.1 * (5 - star) }}
                        style={{
                            height: '100%',
                            background: pct > 0
                                ? 'linear-gradient(90deg, #16A34A, #0B6B3A)'
                                : 'transparent',
                            borderRadius: '99px',
                        }}
                    />
                </div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', minWidth: '30px', textAlign: 'right' }}>{count}</span>
            </div>
        );
    };

    return (
        <div className="container" style={{ padding: '32px 20px', maxWidth: '800px', margin: '0 auto' }}>
            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#64748b', fontSize: '0.9rem', fontWeight: '600',
                    marginBottom: '24px', padding: 0,
                    transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#0B6B3A'}
                onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
            >
                <ArrowLeft size={18} /> Back
            </button>

            {/* Product Header */}
            {vegetable && (
                <div className="card" style={{ padding: '24px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <img
                        src={vegetable.image?.startsWith('http') ? vegetable.image : `/uploads/${vegetable.image || 'default-vegetable.jpg'}`}
                        alt={vegetable.vegetable_name}
                        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200&q=80'; }}
                        style={{ width: '72px', height: '72px', borderRadius: '14px', objectFit: 'cover', flexShrink: 0 }}
                    />
                    <div>
                        <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', fontFamily: 'Poppins', marginBottom: '4px' }}>
                            {vegetable.vegetable_name}
                        </h1>
                        <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
                            by <strong style={{ color: '#0B6B3A' }}>{vegetable.farmer_name}</strong> • {vegetable.village}, {vegetable.district}
                        </p>
                    </div>
                </div>
            )}

            {/* Rating Summary */}
            <div className="card" style={{ padding: '28px', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', fontFamily: 'Poppins', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={20} color="#0B6B3A" /> Rating Summary
                </h2>

                <div style={{ display: 'flex', alignItems: 'center', gap: '36px', flexWrap: 'wrap' }}>
                    {/* Big Avg Score */}
                    <div style={{ textAlign: 'center', minWidth: '110px' }}>
                        <div style={{ fontSize: '3.5rem', fontWeight: '900', color: '#0B6B3A', lineHeight: 1, fontFamily: 'Poppins' }}>
                            {avgNum > 0 ? avgNum.toFixed(1) : '—'}
                        </div>
                        <StarRating rating={Math.round(avgNum)} size={18} />
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '6px' }}>
                            {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                        </div>
                    </div>

                    {/* Bar Chart */}
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        {[5, 4, 3, 2, 1].map(star => (
                            <StarBar key={star} star={star} count={breakdown?.[star] || 0} total={totalReviews} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Individual Reviews */}
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={18} color="#0B6B3A" />
                <h2 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', fontFamily: 'Poppins' }}>
                    Customer Reviews
                </h2>
            </div>

            {reviews && reviews.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {reviews.map((review, idx) => (
                        <motion.div
                            key={review.review_id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.06 }}
                            className="card"
                            style={{ padding: '20px' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px', gap: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#0B6B3A', fontWeight: '800', fontSize: '1rem',
                                        flexShrink: 0,
                                    }}>
                                        {(review.customer_name || 'A')[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <User size={13} color="#64748b" />
                                            <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1e293b' }}>
                                                {review.customer_name}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                            <Calendar size={12} color="#94a3b8" />
                                            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                                                {new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    background: '#fef9c3', borderRadius: '20px', padding: '5px 12px', flexShrink: 0,
                                }}>
                                    <Star size={14} fill="#F59E0B" color="#F59E0B" />
                                    <span style={{ fontSize: '0.88rem', fontWeight: '800', color: '#92400e' }}>
                                        {review.rating}.0
                                    </span>
                                </div>
                            </div>

                            {review.review_text && (
                                <p style={{
                                    fontSize: '0.9rem', color: '#475569', lineHeight: 1.6,
                                    background: '#f8fafc', borderRadius: '10px', padding: '12px 14px',
                                    borderLeft: '3px solid #16A34A', margin: 0,
                                }}>
                                    "{review.review_text}"
                                </p>
                            )}
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <Star size={48} color="#cbd5e1" style={{ marginBottom: '12px' }} />
                    <h3 style={{ color: '#64748b', marginBottom: '8px' }}>No reviews yet</h3>
                    <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                        Be the first to review this product after your order is delivered!
                    </p>
                    <Link to="/vegetables" className="btn btn-primary" style={{ marginTop: '16px', display: 'inline-flex' }}>
                        Shop Now
                    </Link>
                </div>
            )}
        </div>
    );
};

export default ProductReviewsPage;
