import React, { useEffect } from 'react';

export default function Splash({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="mobile-frame-container">
      <div className="simulated-mobile" style={{ background: '#ffffff', justifyContent: 'center', alignItems: 'center' }}>
        
        {/* Emblem bar top */}
        <div className="flag-emblem-bar" style={{ position: 'absolute', top: 0, left: 0, width: '100%' }}></div>
        
        <div style={{ textAlign: 'center', padding: '20px' }}>
          {/* India Post Emblem Logo */}
          <div style={{
            width: '100px',
            height: '100px',
            backgroundColor: 'var(--ip-red)',
            borderRadius: '50%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 4px 12px rgba(193, 39, 45, 0.25)',
            border: '4px solid var(--ip-yellow)'
          }}>
            <svg viewBox="0 0 24 24" width="56" height="56" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
          </div>

          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--ip-red)', letterSpacing: '-0.02em', marginBottom: '8px' }}>
            POSTSCAN
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '40px' }}>
            India Post Delivery System
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div className="spinner" style={{ color: 'var(--ip-red)', width: '28px', height: '28px', borderSize: '3px' }}></div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: '500' }}>Initializing digital hub...</span>
          </div>
        </div>

        {/* Flag Bar & GOI footer */}
        <div style={{ position: 'absolute', bottom: '24px', textAlign: 'center', width: '100%' }}>
          <div className="flag-emblem-center" style={{ justifyContent: 'center' }}>
            <div className="chakra-wheel"></div>
            <span>Government of India Digital Product</span>
          </div>
        </div>

      </div>
    </div>
  );
}
