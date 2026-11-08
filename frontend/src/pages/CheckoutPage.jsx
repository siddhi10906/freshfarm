import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import { tVegName } from '../utils/i18nHelpers';
import { CreditCard, Truck, ShieldCheck, CheckCircle2, PhoneCall, Lock, ArrowLeft, RefreshCw, QrCode, Copy, Check, AlertCircle, KeyRound, XCircle } from 'lucide-react';

const loadRazorpayCheckout = () => new Promise((resolve, reject) => {
  if (window.Razorpay) return resolve(true);
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.onload = () => resolve(true);
  script.onerror = () => reject(new Error('Could not load the secure payment window. Please try again.'));
  document.body.appendChild(script);
});

const CheckoutPage = () => {
  const { t } = useTranslation();
  const { cart, fetchCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [deliveryAddress, setDeliveryAddress] = useState(
    user ? `${user.address || ''}, ${user.city || 'Pune'} - ${user.pincode || ''}` : ''
  );
  const [phone, setPhone] = useState(user?.phone || '');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [deliverySpeed, setDeliverySpeed] = useState('EXPRESS');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 1. UPI Payment State
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(300); // 5 minute countdown
  const [upiProcessing, setUpiProcessing] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [upiWarning, setUpiWarning] = useState('');

  // 2. Card & OTP State
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [showCardForm, setShowCardForm] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpProcessing, setOtpProcessing] = useState(false);
  const [cardError, setCardError] = useState('');

  const items = cart.items || [];

  // Countdown timer for UPI payment window
  useEffect(() => {
    let interval = null;
    if (showUpiModal && timerSeconds > 0 && !upiProcessing) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (showUpiModal && timerSeconds === 0) {
      // Payment Expired
      setShowUpiModal(false);
      setError('Payment Expired: The 5-minute payment window elapsed. Order was not created.');
    }
    return () => clearInterval(interval);
  }, [showUpiModal, timerSeconds, upiProcessing]);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText('freshfarm@upi');
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // Called when user clicks main checkout submit button
  const handleInitiateCheckout = (e) => {
    e.preventDefault();
    if (!deliveryAddress || !phone) {
      setError('Please provide a complete delivery address and recipient phone number.');
      return;
    }
    setError('');

    if (paymentMethod === 'COD') executeOrderPlacement('COD');
    else startRazorpayPayment();
  };

  const startRazorpayPayment = async () => {
    setSubmitting(true);
    setError('');
    let attemptId;
    try {
      const { data } = await API.post('/payments/razorpay/order', {
        delivery_address: deliveryAddress,
        payment_method: paymentMethod
      });
      attemptId = data.attempt_id;
      await loadRazorpayCheckout();

      let paymentCallbackReceived = false;
      const checkout = new window.Razorpay({
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: 'FreshFarm',
        description: 'Fresh produce order',
        order_id: data.razorpay_order_id,
        prefill: {
          name: user?.full_name || user?.name || '',
          email: user?.email || '',
          contact: phone
        },
        theme: { color: '#0B6B3A' },
        handler: async paymentResult => {
          paymentCallbackReceived = true;
          setSubmitting(true);
          try {
            const verified = await API.post('/payments/razorpay/verify', paymentResult);
            await fetchCart();
            navigate(`/order-success/${verified.data.order_id}`);
          } catch (verifyError) {
            setError(verifyError.response?.data?.message || 'Payment was received but could not be verified yet. Please check My Orders before trying again.');
          } finally {
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: async () => {
            setSubmitting(false);
            if (!paymentCallbackReceived) {
              try { await API.post(`/payments/razorpay/cancel/${attemptId}`); } catch {}
            }
          }
        }
      });
      checkout.on('payment.failed', event => {
        setError(event.error?.description || 'Payment failed. Your order was not placed.');
      });
      checkout.open();
      setSubmitting(false);
    } catch (paymentError) {
      if (attemptId) {
        try { await API.post(`/payments/razorpay/cancel/${attemptId}`); } catch {}
      }
      setError(paymentError.response?.data?.message || paymentError.message || 'Unable to start payment.');
      setSubmitting(false);
    }
  };

  // UPI Execution when customer clicks "Confirm Payment Completed"
  const handleUpiPaySubmit = () => {
    setUpiWarning('Payment not detected. Please scan the QR code using Google Pay, PhonePe, Paytm, or any UPI app before confirming payment.');
  };

  // UPI Cancelled by Customer
  const handleCancelUpi = () => {
    setShowUpiModal(false);
    setUpiWarning('');
    setError('Payment Cancelled: Payment was not completed. Order was not placed.');
  };

  // Card Pay button clicked -> Open 6-digit Bank OTP Popup
  const handleCardSubmit = (e) => {
    e.preventDefault();
    setCardError('');

    if (!cardData.name || !cardData.number || !cardData.expiry || !cardData.cvv) {
      setCardError('Please enter all card details (Cardholder Name, 16-digit Card Number, Expiry, CVV).');
      return;
    }

    if (cardData.number.replace(/\s+/g, '').length < 15) {
      setCardError('Please enter a valid 16-digit Debit / Credit card number.');
      return;
    }

    setShowOtpModal(true);
    setOtpCode('');
  };

  // Submit Bank OTP Verification
  const handleOtpVerifySubmit = (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 4) {
      setCardError('Please enter the 6-digit OTP sent to your mobile phone.');
      return;
    }

    setOtpProcessing(true);
    setTimeout(() => {
      setOtpProcessing(false);
      executeOrderPlacement('Credit Card', 'Payment Successful');
    }, 2000);
  };

  // Cancel OTP verification
  const handleCancelOtp = () => {
    setShowOtpModal(false);
    setError('Payment Failed: OTP Verification was cancelled. Order was not placed.');
  };

  // Execute Order Creation in MySQL Backend Database ONLY AFTER payment confirmation
  const executeOrderPlacement = async (pm) => {
    setSubmitting(true);

    try {
      const res = await API.post('/orders', {
        payment_method: pm,
        delivery_address: deliveryAddress
      });

      await fetchCart();
      setShowUpiModal(false);
      setShowOtpModal(false);
      setShowCardForm(false);
      navigate(`/order-success/${res.data.order_id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order.');
      setShowUpiModal(false);
      setShowOtpModal(false);
    } finally {
      setSubmitting(false);
      setUpiProcessing(false);
      setOtpProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h2>{t('cart.empty')}</h2>
        <Link to="/vegetables" className="btn btn-primary" style={{ marginTop: '16px' }}>
          {t('cart.continueShopping')}
        </Link>
      </div>
    );
  }

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=upi://pay?pa=freshfarm@upi%26pn=FreshFarm%20Marketplace%26am=${cart.grandTotal.toFixed(2)}%26cu=INR`;

  return (
    <div style={{ width: '100%', background: '#f8fafc', paddingBottom: '60px' }}>
      {/* Top Header & Step Indicator Bar */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '18px 0', marginBottom: '30px' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0B6B3A', fontFamily: 'Poppins' }}>{t('checkout.title')}</div>

          {/* Stepper */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '0.85rem', fontWeight: '700' }}>
            <span style={{ color: '#94a3b8' }}>1. {t('nav.login')}</span>
            <span style={{ color: '#0B6B3A', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ background: '#0B6B3A', color: 'white', width: '22px', height: '22px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>2</span> {t('checkout.customerInfo')}
            </span>
            <span style={{ color: '#0B6B3A', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ background: '#0B6B3A', color: 'white', width: '22px', height: '22px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>3</span> {t('checkout.paymentMethod')}
            </span>
          </div>

          <Link to="/cart" style={{ fontSize: '0.88rem', fontWeight: '700', color: '#64748b', textDecoration: 'none' }}>
            ← {t('cart.continueShopping')}
          </Link>
        </div>
      </div>

      <div className="container">
        {error && (
          <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', color: '#dc2626', padding: '14px 18px', borderRadius: '14px', marginBottom: '24px', fontSize: '0.92rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <XCircle size={20} />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleInitiateCheckout} style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '30px' }}>
          {/* Left Form Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Address Card */}
            <div className="card" style={{ padding: '30px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0f172a', marginBottom: '6px', fontFamily: 'Poppins' }}>
                {t('checkout.customerInfo')}
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px' }}>
                {t('checkout.payNotice')}
              </p>

              <div className="form-group">
                <label className="form-label">{t('checkout.phone')}</label>
                <input
                  type="tel"
                  required
                  className="form-control"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 98220 12345"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('checkout.address')}</label>
                <textarea
                  required
                  rows="3"
                  className="form-control"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Flat / Building Name, Street Address, Area, PIN Code"
                ></textarea>
              </div>

              {/* Delivery Speed Selector Cards */}
              <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', margin: '24px 0 12px 0', fontFamily: 'Poppins' }}>
                {t('checkout.selectDeliverySlot')}
              </h4>

              <div className="grid-2">
                <div
                  onClick={() => setDeliverySpeed('EXPRESS')}
                  style={{
                    padding: '16px',
                    borderRadius: '14px',
                    border: deliverySpeed === 'EXPRESS' ? '2px solid #0B6B3A' : '1px solid #e2e8f0',
                    background: deliverySpeed === 'EXPRESS' ? '#f0fdf4' : 'white',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontWeight: '800', fontSize: '0.92rem', color: '#0B6B3A' }}>{t('checkout.expressDelivery')}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>{t('checkout.harvestPlucked')}</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#0f172a', marginTop: '6px' }}>
                    {cart.subtotal >= 199 ? t('checkout.freeDeliverySlot') : '₹15.00'}
                  </div>
                </div>

                <div
                  onClick={() => setDeliverySpeed('SAME_DAY')}
                  style={{
                    padding: '16px',
                    borderRadius: '14px',
                    border: deliverySpeed === 'SAME_DAY' ? '2px solid #0B6B3A' : '1px solid #e2e8f0',
                    background: deliverySpeed === 'SAME_DAY' ? '#f0fdf4' : 'white',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontWeight: '800', fontSize: '0.92rem', color: '#0f172a' }}>{t('checkout.sameDaySlot')}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>{t('checkout.deliveredBy7pm')}</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#0f172a', marginTop: '6px' }}>₹25.00</div>
                </div>
              </div>
            </div>

            {/* Payment Method Selector Card */}
            <div className="card" style={{ padding: '30px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0f172a', marginBottom: '16px', fontFamily: 'Poppins' }}>
                {t('checkout.paymentMethod')}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* 1. UPI Option */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    padding: '16px',
                    borderRadius: '14px',
                    border: paymentMethod === 'UPI' ? '2px solid #0B6B3A' : '1px solid #cbd5e1',
                    background: paymentMethod === 'UPI' ? '#f0fdf4' : 'white',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="UPI"
                    checked={paymentMethod === 'UPI'}
                    onChange={() => { setPaymentMethod('UPI'); setShowCardForm(false); }}
                    style={{ marginTop: '4px', accentColor: '#0B6B3A' }}
                  />
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#0f172a' }}>
                      {t('checkout.upi')}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                      {t('checkout.upiDesc')}
                    </div>
                  </div>
                </label>

                {/* 2. COD Option */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    padding: '16px',
                    borderRadius: '14px',
                    border: paymentMethod === 'COD' ? '2px solid #0B6B3A' : '1px solid #cbd5e1',
                    background: paymentMethod === 'COD' ? '#f0fdf4' : 'white',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={() => { setPaymentMethod('COD'); setShowCardForm(false); }}
                    style={{ marginTop: '4px', accentColor: '#0B6B3A' }}
                  />
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#0f172a' }}>
                      {t('checkout.cod')}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                      {t('checkout.codDesc')}
                    </div>
                  </div>
                </label>

                {/* 3. Credit Card Option */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    padding: '16px',
                    borderRadius: '14px',
                    border: paymentMethod === 'Credit Card' ? '2px solid #0B6B3A' : '1px solid #cbd5e1',
                    background: paymentMethod === 'Credit Card' ? '#f0fdf4' : 'white',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="Credit Card"
                    checked={paymentMethod === 'Credit Card'}
                    onChange={() => setPaymentMethod('Credit Card')}
                    style={{ marginTop: '4px', accentColor: '#0B6B3A' }}
                  />
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#0f172a' }}>
                      {t('checkout.card')}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                      {t('checkout.cardDesc')}
                    </div>
                  </div>
                </label>

              </div>

              {/* Card details are collected only by Razorpay Checkout. */}
              {paymentMethod === 'Credit Card' && (
                <div style={{ marginTop: '14px', color: '#64748b', fontSize: '0.85rem' }}>
                  Card details and bank authentication are handled securely by Razorpay Checkout.
                </div>
              )}

            </div>
          </div>

          {/* Right Order Summary Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card" style={{ padding: '24px', position: 'sticky', top: '90px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '16px', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', fontFamily: 'Poppins' }}>
                {t('checkout.orderSummary')}
              </h3>

              <div style={{ maxHeight: '220px', overflowY: 'auto', marginBottom: '16px', paddingRight: '4px' }}>
                {items.map((item) => {
                  const unit = item.quantity_unit || (item.sold_by === 'piece' ? 'piece' : item.sold_by === 'dozen' ? 'dozen' : 'kg');
                  const val = item.quantity_value !== undefined ? item.quantity_value : item.quantity;
                  const itemLineTotal = item.item_total !== undefined
                    ? item.item_total
                    : (unit === 'g' ? (item.price * val) / 1000 : item.price * val);

                  return (
                    <div key={item.cart_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem', marginBottom: '12px', borderBottom: '1px dashed #f1f5f9', paddingBottom: '8px' }}>
                      <div>
                        <div style={{ fontWeight: '800', color: '#0f172a' }}>{tVegName(t, item.vegetable_name)}</div>
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          👨‍🌾 {item.farmer_name} • {val} {unit === 'piece' ? (val > 1 ? 'pcs' : 'pc') : unit === 'dozen' ? (val > 1 ? 'dozens' : 'dozen') : unit}
                        </span>
                      </div>
                      <span style={{ fontWeight: '800', color: '#0B6B3A' }}>
                        ₹{itemLineTotal.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem', borderTop: '1px solid #e2e8f0', paddingTop: '14px', marginBottom: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>{t('cart.subtotal')} ({items.length} {items.length === 1 ? 'item' : 'items'})</span>
                  <span style={{ fontWeight: '700' }}>₹{cart.subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>{t('cart.gst')}</span>
                  <span style={{ fontWeight: '700', color: '#16A34A' }}>₹0.00</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>{t('cart.delivery')}</span>
                  <span style={{ fontWeight: '700', color: cart.deliveryCharge === 0 ? '#0B6B3A' : '#0f172a' }}>
                    {cart.deliveryCharge === 0 ? t('cart.freeDelivery') : `₹${cart.deliveryCharge.toFixed(2)}`}
                  </span>
                </div>

                <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '1.3rem' }}>
                  <span style={{ fontWeight: '800', color: '#0f172a' }}>{t('cart.total')}</span>
                  <span style={{ fontWeight: '800', color: '#0B6B3A' }}>₹{cart.grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Main Submit Button */}
              {paymentMethod === 'COD' && (
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: '1rem', background: '#0B6B3A', borderRadius: '12px' }}
                >
                  {submitting ? 'Creating Order...' : t('checkout.placeOrder')}
                </button>
              )}

              {paymentMethod === 'UPI' && (
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: '1rem', background: '#0B6B3A', borderRadius: '12px' }}
                >
                  {t('checkout.placeOrder')}
                </button>
              )}

              {paymentMethod === 'Credit Card' && (
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: '1rem', background: '#0B6B3A', borderRadius: '12px' }}
                >
                  {t('checkout.placeOrder')}
                </button>
              )}

              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', marginTop: '16px', fontSize: '0.82rem', color: '#64748b' }}>
                <div style={{ fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <PhoneCall size={14} color="#0B6B3A" /> {t('checkout.needHelp')}
                </div>
                <div>{t('checkout.supportHours')}</div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* 1. UPI QR CODE PAYMENT MODAL */}
      {showUpiModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.78)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            maxWidth: '490px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0'
          }}>
            {/* Modal Header */}
            <div style={{ background: 'linear-gradient(135deg, #065F46 0%, #0B6B3A 100%)', color: 'white', padding: '22px 28px', textAlign: 'center', position: 'relative' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '800', fontFamily: 'Poppins' }}>
                {t('checkout.scanAndPay')}
              </h3>
              <p style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '2px' }}>
                {t('checkout.amountPayable')} <b style={{ fontSize: '1.15rem', color: '#fef08a' }}>₹{cart.grandTotal.toFixed(2)}</b>
              </p>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '26px 28px 24px 28px', textAlign: 'center' }}>
              
              {/* MESSAGE DISPLAYED AUTOMATICALLY ABOVE QR CODE */}
              <div style={{
                background: '#eff6ff',
                border: '1.5px solid #93c5fd',
                borderRadius: '16px',
                padding: '14px 18px',
                marginBottom: '16px',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.08)'
              }}>
                <div style={{ color: '#1e40af', fontSize: '0.92rem', fontWeight: '700', lineHeight: '1.5', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {t('checkout.scanInstruction')}
                </div>
              </div>

              {/* QR Code Container (Kept 100% visible) */}
              <div style={{
                background: '#ffffff',
                padding: '14px',
                borderRadius: '18px',
                display: 'inline-block',
                border: '2px solid #0B6B3A',
                boxShadow: '0 8px 20px rgba(11, 107, 58, 0.12)',
                marginBottom: '14px'
              }}>
                <img
                  src={qrCodeUrl}
                  alt="FreshFarm UPI QR Code Scanner"
                  style={{ width: '190px', height: '190px', display: 'block' }}
                />
              </div>

              {/* UPI VPA & Copy Button */}
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '700' }}>{t('checkout.upiId')}</div>
                  <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.9rem' }}>freshfarm@upi</div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  style={{ border: 'none', background: '#e6f4ea', color: '#0B6B3A', padding: '5px 10px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {copiedUpi ? <Check size={14} /> : <Copy size={14} />}
                  {copiedUpi ? t('checkout.copied') : t('checkout.copyUpi')}
                </button>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  disabled={upiProcessing}
                  onClick={handleUpiPaySubmit}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: '1rem', background: '#0B6B3A', borderRadius: '12px', opacity: upiProcessing ? 0.8 : 1 }}
                >
                  {upiProcessing ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                      <RefreshCw size={18} className="spin-icon" /> Verifying Bank Payment Receipt...
                    </span>
                  ) : (
                    `${t('checkout.confirmPayment')} (₹${cart.grandTotal.toFixed(2)})`
                  )}
                </button>

                {upiWarning && (
                  <div style={{
                    background: '#fef2f2',
                    border: '1.5px solid #fecaca',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    color: '#dc2626',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    textAlign: 'center',
                    lineHeight: '1.4',
                    marginTop: '2px'
                  }}>
                    {upiWarning}
                  </div>
                )}

                <button
                  type="button"
                  disabled={upiProcessing}
                  onClick={handleCancelUpi}
                  style={{ border: 'none', background: 'none', color: '#ef4444', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', padding: '6px' }}
                >
                  {t('common.cancel')}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 3. CARD OTP VERIFICATION POPUP MODAL */}
      {showOtpModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.78)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            maxWidth: '440px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0'
          }}>
            {/* Modal Header */}
            <div style={{ background: '#0B6B3A', color: 'white', padding: '22px 28px', textAlign: 'center' }}>
              <div style={{ background: 'rgba(255,255,255,0.15)', width: '48px', height: '48px', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px auto' }}>
                <KeyRound size={26} />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '800', fontFamily: 'Poppins' }}>
                {t('checkout.bankOtpTitle')}
              </h3>
              <p style={{ fontSize: '0.82rem', opacity: 0.9, marginTop: '2px' }}>
                {t('checkout.otpNotice')}
              </p>
            </div>

            {/* OTP Form */}
            <form onSubmit={handleOtpVerifySubmit} style={{ padding: '28px' }}>
              <div className="form-group" style={{ textAlign: 'center' }}>
                <label className="form-label" style={{ textAlign: 'center', display: 'block', marginBottom: '8px' }}>
                  {t('checkout.otpCode')}
                </label>
                <input
                  type="password"
                  required
                  maxLength="6"
                  placeholder="123456"
                  className="form-control"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  style={{ textAlign: 'center', fontSize: '1.4rem', letterSpacing: '8px', fontWeight: '800' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                <button
                  type="submit"
                  disabled={otpProcessing}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: '1rem', background: '#0B6B3A', borderRadius: '12px' }}
                >
                  {otpProcessing ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                      <RefreshCw size={18} className="spin-icon" /> Verifying Bank OTP...
                    </span>
                  ) : (
                    `${t('checkout.submitOtp')} (₹${cart.grandTotal.toFixed(2)})`
                  )}
                </button>

                <button
                  type="button"
                  disabled={otpProcessing}
                  onClick={handleCancelOtp}
                  style={{ border: 'none', background: 'none', color: '#ef4444', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', padding: '6px' }}
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CheckoutPage;
