import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function RoleSelection({ onSelectRole }) {
  const { t } = useLanguage();

  return (
    <div className="mobile-frame-container">
      <div className="simulated-mobile" style={{ background: '#f4f5f8' }}>
        
        {/* National flag emblem top bar */}
        <div className="flag-emblem-bar"></div>

        {/* Small header logo panel */}
        <div style={{ background: 'var(--ip-red)', padding: '20px 16px', borderBottom: '4px solid var(--ip-yellow)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <img src="/src/assets/logo.jpg" alt="Logo" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid white' }} />
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em', margin: 0 }}>{t('title')}</h2>
            <span style={{ fontSize: '0.65rem', color: 'var(--ip-yellow)', fontWeight: 'bold', display: 'block' }}>{t('tagline')}</span>
          </div>
        </div>

        <div className="mobile-screen-content" style={{ justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>{t('select_role')}</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '4px' }}>{t('select_role_sub')}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Office Staff Card */}
            <div 
              onClick={() => onSelectRole('office_staff')}
              className="gov-card" 
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                borderLeft: '5px solid var(--ip-red)'
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 'bold', background: '#fef2f2', padding: '10px', borderRadius: '8px', color: 'var(--ip-red)' }}>OFFICE</div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem' }}>{t('office_staff')} Portal</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Scan letters, verify addresses, auto-allocate beats</span>
              </div>
            </div>

            {/* Postman Card */}
            <div 
              onClick={() => onSelectRole('postman')}
              className="gov-card" 
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                borderLeft: '5px solid var(--ip-yellow)'
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 'bold', background: '#fffbeb', padding: '10px', borderRadius: '8px', color: '#b45309' }}>FIELD</div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem' }}>{t('postman')} Portal</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>View deliveries route, check weather warnings, update status</span>
              </div>
            </div>

            {/* Admin Card */}
            <div 
              onClick={() => onSelectRole('admin')}
              className="gov-card" 
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                borderLeft: '5px solid #8b5cf6'
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 'bold', background: '#f5f3ff', padding: '10px', borderRadius: '8px', color: '#6d28d9' }}>ADMIN</div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem' }}>{t('admin')} Portal</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Manage postmen, beats, offices, and review logs/KPIs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Flag Bar & GOI footer */}
        <div style={{ padding: '16px', textAlign: 'center', background: '#ffffff', borderTop: '1px solid var(--border-color)' }}>
          <div className="flag-emblem-center" style={{ justifyContent: 'center' }}>
            <div className="chakra-wheel"></div>
            <span>National Address Routing Database</span>
          </div>
        </div>

      </div>
    </div>
  );
}
