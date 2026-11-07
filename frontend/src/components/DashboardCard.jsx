import React from 'react';

const DashboardCard = ({ title, value, icon: Icon, color = 'green', subtext }) => {
  const colorMap = {
    green: { bg: '#e8f5e9', text: '#2e7d32' },
    orange: { bg: '#fff3e0', text: '#e65100' },
    blue: { bg: '#e0f2fe', text: '#0284c7' },
    purple: { bg: '#f3e8ff', text: '#7e22ce' }
  };

  const activeColor = colorMap[color] || colorMap.green;

  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '14px',
        background: activeColor.bg,
        color: activeColor.text,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {Icon && <Icon size={28} />}
      </div>
      <div>
        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
          {title}
        </span>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b', lineHeight: '1.2' }}>
          {value}
        </h2>
        {subtext && (
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px', display: 'block' }}>
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
};

export default DashboardCard;
