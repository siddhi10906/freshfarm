import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, PackageCheck, Truck, Navigation, Home, Clock } from 'lucide-react';

const DeliveryTimeline = ({ currentStatus, updatedAt }) => {
  const { t } = useTranslation();

  const steps = [
    { key: 'Order Placed', label: t('delivery.placed'), icon: CheckCircle2 },
    { key: 'Packed', label: t('delivery.packed'), icon: PackageCheck },
    { key: 'Shipped', label: t('delivery.shipped'), icon: Truck },
    { key: 'Out for Delivery', label: t('delivery.outForDelivery'), icon: Navigation },
    { key: 'Delivered', label: t('delivery.delivered'), icon: Home }
  ];

  const currentIndex = steps.findIndex(s => s.key === currentStatus);
  const activeStep = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div style={{ padding: '24px 10px', width: '100%' }}>
      {/* Step Nodes Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        {/* Background Connecting Line */}
        <div style={{
          position: 'absolute',
          top: '24px',
          left: '10%',
          right: '10%',
          height: '4px',
          background: '#e2e8f0',
          zIndex: 1
        }} />

        {/* Active Progress Line */}
        <div style={{
          position: 'absolute',
          top: '24px',
          left: '10%',
          width: `${(activeStep / (steps.length - 1)) * 80}%`,
          height: '4px',
          background: '#2e7d32',
          transition: 'width 0.4s ease-in-out',
          zIndex: 2
        }} />

        {/* Nodes */}
        {steps.map((step, index) => {
          const IconComponent = step.icon;
          const isCompleted = index <= activeStep;
          const isCurrent = index === activeStep;

          return (
            <div
              key={step.key}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 3,
                flex: 1,
                textAlign: 'center'
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: isCompleted ? '#2e7d32' : '#ffffff',
                color: isCompleted ? '#ffffff' : '#94a3b8',
                border: isCurrent ? '4px solid #ff9800' : '2px solid ' + (isCompleted ? '#2e7d32' : '#cbd5e1'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isCurrent ? '0 0 0 4px rgba(255, 152, 0, 0.2)' : 'none',
                transition: 'all 0.3s ease'
              }}>
                <IconComponent size={22} />
              </div>

              <span style={{
                fontSize: '0.82rem',
                fontWeight: isCompleted ? '700' : '500',
                color: isCompleted ? '#1e293b' : '#94a3b8',
                marginTop: '10px'
              }}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Status Footer Timestamp */}
      {updatedAt && (
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Clock size={14} color="#ff9800" /> {t('delivery.trackTitle')}: {new Date(updatedAt).toLocaleString('en-IN')}
        </div>
      )}
    </div>
  );
};

export default DeliveryTimeline;
