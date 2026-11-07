import React, { useState, useEffect, useRef } from 'react';
import { X, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StarRating from './StarRating';
import API from '../services/api';

/**
 * ReviewModal — allows a customer to submit a star rating + text review
 * Props:
 *   isOpen       {boolean}
 *   onClose      {function}
 *   vegetableId  {number}
 *   orderId      {number}
 *   productName  {string}
 *   onSuccess    {function} — called after successful submission
 */
const ReviewModal = ({ isOpen, onClose, vegetableId, orderId, productName, onSuccess }) => {
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState(null); // 'success' | 'error' | null
    const [errorMsg, setErrorMsg] = useState('');
    const backdropRef = useRef(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setRating(0);
            setReviewText('');
            setStatus(null);
            setErrorMsg('');
        }
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            setErrorMsg('Please select a star rating.');
            setStatus('error');
            return;
        }

        setSubmitting(true);
        setStatus(null);
        setErrorMsg('');

        try {
            await API.post('/reviews', {
                vegetable_id: vegetableId,
                order_id: orderId,
                rating,
                review_text: reviewText.trim(),
            });
            setStatus('success');
            if (onSuccess) onSuccess(vegetableId, orderId);
        } catch (err) {
            const msg = err?.response?.data?.message || 'Failed to submit review. Please try again.';
            setErrorMsg(msg);
            setStatus('error');
        } finally {
            setSubmitting(false);
        }
    };

    const ratingLabels = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent' };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={backdropRef}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(15, 23, 42, 0.55)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ duration: 0.25, type: 'spring', stiffness: 300, damping: 25 }}
                        style={{
                            background: '#ffffff',
                            borderRadius: '24px',
                            padding: '36px',
                            width: '100%',
                            maxWidth: '480px',
                            boxShadow: '0 24px 60px rgba(11, 107, 58, 0.15)',
                            border: '1px solid #e2e8f0',
                            position: 'relative',
                        }}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                background: '#f1f5f9',
                                border: 'none',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: '#64748b',
                                transition: 'background 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                            onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
                        >
                            <X size={16} />
                        </button>

                        {/* Header */}
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{
                                width: '48px', height: '48px',
                                background: 'linear-gradient(135deg, #0B6B3A, #16A34A)',
                                borderRadius: '14px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '16px',
                                fontSize: '22px',
                            }}>
                                ⭐
                            </div>
                            <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0f172a', fontFamily: 'Poppins', marginBottom: '4px' }}>
                                Rate Your Purchase
                            </h2>
                            <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                Share your experience with <strong style={{ color: '#0B6B3A' }}>{productName}</strong>
                            </p>
                        </div>

                        {/* Success State */}
                        {status === 'success' ? (
                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                >
                                    <CheckCircle size={60} color="#16A34A" style={{ marginBottom: '16px' }} />
                                </motion.div>
                                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
                                    Thank you for your review!
                                </h3>
                                <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '24px' }}>
                                    Your feedback helps other customers and supports our farmers.
                                </p>
                                <button
                                    onClick={onClose}
                                    className="btn btn-primary"
                                    style={{ padding: '10px 28px', borderRadius: '12px' }}
                                >
                                    Close
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                {/* Star Rating Selector */}
                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>
                                        Your Rating *
                                    </label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <StarRating rating={rating} onChange={setRating} size={32} />
                                        {rating > 0 && (
                                            <motion.span
                                                key={rating}
                                                initial={{ opacity: 0, x: -8 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                style={{
                                                    fontSize: '0.88rem', fontWeight: '700',
                                                    color: '#0B6B3A', background: '#dcfce7',
                                                    padding: '4px 12px', borderRadius: '20px',
                                                }}
                                            >
                                                {ratingLabels[rating]}
                                            </motion.span>
                                        )}
                                    </div>
                                </div>

                                {/* Review Text */}
                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
                                        Write a Review *
                                    </label>
                                    <textarea
                                        value={reviewText}
                                        onChange={(e) => setReviewText(e.target.value)}
                                        rows={4}
                                        maxLength={500}
                                        required
                                        placeholder="How was the quality, freshness and delivery? Share your experience..."
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            border: '1.5px solid #cbd5e1',
                                            borderRadius: '12px',
                                            fontSize: '0.9rem',
                                            color: '#0f172a',
                                            resize: 'vertical',
                                            fontFamily: 'Inter, sans-serif',
                                            outline: 'none',
                                            transition: 'border-color 0.2s',
                                            boxSizing: 'border-box',
                                        }}
                                        onFocus={e => e.target.style.borderColor = '#0B6B3A'}
                                        onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                                    />
                                    <div style={{ textAlign: 'right', fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
                                        {reviewText.length}/500
                                    </div>
                                </div>

                                {/* Error message */}
                                {status === 'error' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            background: '#fef2f2', border: '1px solid #fecaca',
                                            borderRadius: '10px', padding: '10px 14px',
                                            marginBottom: '16px',
                                            fontSize: '0.88rem', color: '#dc2626',
                                        }}
                                    >
                                        <AlertCircle size={16} />
                                        {errorMsg}
                                    </motion.div>
                                )}

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="btn btn-primary"
                                    style={{ width: '100%', padding: '13px', borderRadius: '12px', fontSize: '0.95rem', justifyContent: 'center' }}
                                >
                                    {submitting ? (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{
                                                width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)',
                                                borderTopColor: 'white', borderRadius: '50%',
                                                animation: 'spin 0.7s linear infinite', display: 'inline-block'
                                            }} />
                                            Submitting...
                                        </span>
                                    ) : (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                            <Send size={16} /> Submit Review
                                        </span>
                                    )}
                                </button>
                            </form>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ReviewModal;
