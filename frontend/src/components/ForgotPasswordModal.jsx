import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyRound, Mail, CheckCircle2, AlertCircle, X, Lock, RefreshCw, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import API from '../services/api';

const ForgotPasswordModal = ({ isOpen, onClose, role = 'customer', initialEmail = '' }) => {
  const { t } = useTranslation();

  const [step, setStep] = useState(1); // 1: Send OTP, 2: Verify OTP, 3: Reset Password, 4: Success
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(300); // 5 mins countdown

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setEmail(initialEmail || '');
      setOtp('');
      setDemoOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccessMsg('');
      setTimerSeconds(300);
    }
  }, [isOpen, initialEmail]);

  useEffect(() => {
    let interval = null;
    if (step === 2 && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && step === 2) {
      setError(t('forgotPassword.otpExpiredErr', 'OTP has expired. Please click Resend OTP.'));
    }
    return () => clearInterval(interval);
  }, [step, timerSeconds, t]);

  if (!isOpen) return null;

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // STEP 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) {
      setError(t('auth.emailRequired', 'Email is required.'));
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await API.post('/auth/forgot-password/send-otp', { email, role });
      
      setDemoOtp(res.data.otp || '');
      setStep(2);
      setTimerSeconds(300);
    } catch (err) {
      setError(err.response?.data?.message || t('common.error', 'Failed to send OTP code.'));
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      setError(t('forgotPassword.validOtpErr', 'Please enter a valid 6-digit OTP code.'));
      return;
    }

    try {
      setLoading(true);
      setError('');
      await API.post('/auth/forgot-password/verify-otp', { email, role, otp });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || t('forgotPassword.invalidOtp', 'Invalid OTP code.'));
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError(t('forgotPassword.passwordMinLength', 'Password must be at least 6 characters.'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('forgotPassword.passwordsDoNotMatch', 'Passwords do not match.'));
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await API.post('/auth/forgot-password/reset-password', {
        email,
        role,
        otp,
        newPassword
      });
      setSuccessMsg(res.data.message || t('forgotPassword.successDesc', 'Password reset successfully. Please login again.'));
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.message || t('common.error', 'Failed to reset password.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        maxWidth: '480px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Header Bar */}
        <div style={{
          background: 'linear-gradient(135deg, #065F46 0%, #0B6B3A 100%)',
          color: '#ffffff',
          padding: '24px 28px',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(255,255,255,0.18)', padding: '8px', borderRadius: '12px' }}>
              <KeyRound size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'Poppins', margin: 0 }}>
                {t('forgotPassword.title', 'Forgot Password')}
              </h3>
              <span style={{ fontSize: '0.78rem', opacity: 0.88, textTransform: 'capitalize' }}>
                FreshFarm {role} Portal
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '28px' }}>
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1.5px solid #fecaca',
              color: '#dc2626',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '0.85rem',
              fontWeight: '600',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* ================= STEP 1: REQUEST OTP ================= */}
          {step === 1 && (
            <form onSubmit={handleSendOTP}>
              <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '20px', lineHeight: '1.5' }}>
                {t('forgotPassword.enterEmailDesc', 'Enter your registered email address to receive a 6-digit verification OTP code.')}
              </p>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">{t('auth.email')}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    required
                    className="form-control"
                    placeholder="Enter your email address..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ paddingLeft: '40px' }}
                  />
                  <Mail size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', background: '#0B6B3A', borderRadius: '12px', fontSize: '0.92rem', fontWeight: '800' }}
              >
                {loading ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <RefreshCw size={16} className="spin-icon" /> {t('forgotPassword.sendingOtp', 'Sending OTP...')}
                  </span>
                ) : (
                  t('forgotPassword.sendOtp', 'Send OTP Code')
                )}
              </button>
            </form>
          )}

          {/* ================= STEP 2: VERIFY OTP ================= */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP}>
              <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '20px', lineHeight: '1.5' }}>
                {t('forgotPassword.otpNotice', "We've sent a 6-digit verification code to:")} <strong style={{ color: '#0f172a' }}>{email}</strong>
              </p>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">{t('forgotPassword.verifyTitle', 'Enter 6-Digit OTP')}</label>
                <input
                  type="text"
                  required
                  maxLength="6"
                  className="form-control"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  style={{
                    textAlign: 'center',
                    letterSpacing: '8px',
                    fontSize: '1.4rem',
                    fontWeight: '900',
                    color: '#0B6B3A'
                  }}
                />
              </div>

              {/* Expiry Timer & Resend */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', fontSize: '0.82rem' }}>
                <span style={{ color: timerSeconds < 60 ? '#dc2626' : '#64748b', fontWeight: '700' }}>
                  ⏱️ {t('forgotPassword.expiresIn', 'Expires in:')} {formatTimer(timerSeconds)}
                </span>
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={loading}
                  style={{ background: 'none', border: 'none', color: '#0B6B3A', fontWeight: '800', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {t('forgotPassword.resendOtp', 'Resend OTP')}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || timerSeconds === 0}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', background: '#0B6B3A', borderRadius: '12px', fontSize: '0.92rem', fontWeight: '800' }}
              >
                {loading ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <RefreshCw size={16} className="spin-icon" /> {t('forgotPassword.verifying', 'Verifying...')}
                  </span>
                ) : (
                  t('forgotPassword.verifyOtp', 'Verify OTP & Proceed')
                )}
              </button>
            </form>
          )}

          {/* ================= STEP 3: NEW PASSWORD ================= */}
          {step === 3 && (
            <form onSubmit={handleResetPassword}>
              <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '20px' }}>
                {t('forgotPassword.newPasswordTitle', 'Create a new secure password for your account.')}
              </p>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">{t('forgotPassword.newPassword', 'New Password')}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    minLength="6"
                    className="form-control"
                    placeholder="At least 6 characters..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}
                  >
                    {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">{t('forgotPassword.confirmPassword', 'Confirm New Password')}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    minLength="6"
                    className="form-control"
                    placeholder="Re-enter new password..."
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}
                  >
                    {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', background: '#0B6B3A', borderRadius: '12px', fontSize: '0.92rem', fontWeight: '800' }}
              >
                {loading ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <RefreshCw size={16} className="spin-icon" /> {t('forgotPassword.resetting', 'Updating Password...')}
                  </span>
                ) : (
                  t('forgotPassword.resetPassword', 'Reset Password Now')
                )}
              </button>
            </form>
          )}

          {/* ================= STEP 4: SUCCESS ================= */}
          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ background: '#e6f4ea', color: '#0B6B3A', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                <CheckCircle2 size={36} />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '900', color: '#0f172a', marginBottom: '8px', fontFamily: 'Poppins' }}>
                {t('forgotPassword.successTitle', 'Password Reset Successfully!')}
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '24px', lineHeight: '1.5' }}>
                {successMsg}
              </p>
              <button
                onClick={onClose}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', background: '#0B6B3A', borderRadius: '12px', fontSize: '0.92rem', fontWeight: '800' }}
              >
                {t('forgotPassword.backToLogin', 'Back to Login')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
