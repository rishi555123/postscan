import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageSelector() {
  const { currentLanguage, setLanguage, languages } = useLanguage();

  return (
    <div className="language-selector-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}>
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="2" y1="12" x2="22" y2="12"></line>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
      </svg>
      <select
        value={currentLanguage}
        onChange={(e) => setLanguage(e.target.value)}
        style={{
          background: 'rgba(10, 12, 17, 0.7)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-glass)',
          borderRadius: '8px',
          padding: '6px 12px',
          fontSize: '0.85rem',
          fontFamily: 'inherit',
          cursor: 'pointer',
          outline: 'none',
          transition: 'var(--transition-smooth)'
        }}
        onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
        onBlur={(e) => e.target.style.borderColor = 'var(--border-glass)'}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code} style={{ background: 'var(--bg-dark)' }}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}
