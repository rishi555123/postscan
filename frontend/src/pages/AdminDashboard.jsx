import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';

export default function AdminDashboard() {
  const { token, logout, user } = useAuth();
  const { t } = useLanguage();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  
  // New User Creation Form states
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('postman');
  const [newHubId, setNewHubId] = useState('');

  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/analytics/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (err) {
      console.error(err);
      showStatus('error', 'Failed to retrieve system analytics.');
    } finally {
      setLoading(false);
    }
  };

  const showStatus = (type, text) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg({ type: '', text: '' }), 5000);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUsername || !newPassword || !newName) {
      showStatus('error', 'Please fill in all user profile details.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          name: newName,
          role: newRole,
          postOfficeId: newHubId || null
        })
      });

      const data = await response.json();
      if (data.success) {
        showStatus('success', `Account created successfully: ${newName} (${newRole.toUpperCase()})`);
        setNewUsername('');
        setNewPassword('');
        setNewName('');
        fetchAnalytics();
      } else {
        showStatus('error', data.message || 'Creation failed.');
      }
    } catch (err) {
      console.error(err);
      showStatus('error', 'Failed to connect to server.');
    }
  };

  const handleResetDemo = async () => {
    if (!window.confirm('Are you sure you want to restore the default 12 demo letters? This will clear manually added entries.')) {
      return;
    }

    setResetting(true);
    showStatus('info', 'Restoring database to default demo seed...');

    try {
      const res = await fetch(`${API_URL}/letters/reset`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showStatus('success', 'Database reset successful!');
        fetchAnalytics();
      } else {
        showStatus('error', data.message || 'Reset failed.');
      }
    } catch (err) {
      console.error(err);
      showStatus('error', 'Connection error during database reset.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="dashboard-container" style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Gov Header */}
      <header className="gov-header flex-between" style={{ borderRadius: 'var(--radius-gov)', marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/src/assets/logo.jpg" alt="Logo" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid white' }} />
          <div>
            <h1 className="gov-header-title" style={{ margin: 0, fontSize: '1.4rem' }}>{t('admin')} Hub</h1>
            <span className="gov-sub-logo" style={{ display: 'block' }}>National Delivery System Administration</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <LanguageSelector />
          <button onClick={logout} className="gov-btn gov-btn-yellow" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
            {t('logout')}
          </button>
        </div>
      </header>

      {statusMsg.text && (
        <div className="gov-card" style={{
          padding: '10px 16px',
          marginBottom: '16px',
          background: statusMsg.type === 'error' ? 'var(--color-error-bg)' : statusMsg.type === 'success' ? 'var(--color-success-bg)' : '#eff6ff',
          color: statusMsg.type === 'error' ? 'var(--color-error)' : statusMsg.type === 'success' ? 'var(--color-success)' : '#1d4ed8',
          border: '1px solid currentColor',
          borderRadius: '6px',
          fontSize: '0.85rem'
        }}>
          {statusMsg.text}
        </div>
      )}

      {loading || !analytics ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner"></div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Stats Cards Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="gov-card" style={{ textAlign: 'center', borderLeft: '5px solid var(--ip-red)' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-light)', display: 'block', fontWeight: 'bold' }}>{t('scanned_letters')}</span>
              <p style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--ip-red)', marginTop: '4px' }}>{analytics.totalLetters}</p>
            </div>
            <div className="gov-card" style={{ textAlign: 'center', borderLeft: '5px solid var(--color-success)' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-light)', display: 'block', fontWeight: 'bold' }}>{t('success_deliveries')}</span>
              <p style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--color-success)', marginTop: '4px' }}>{analytics.deliveredCount}</p>
            </div>
            <div className="gov-card" style={{ textAlign: 'center', borderLeft: '5px solid var(--color-warning)' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-light)', display: 'block', fontWeight: 'bold' }}>{t('failures')}</span>
              <p style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--color-warning)', marginTop: '4px' }}>{analytics.failedCount}</p>
            </div>
            <div className="gov-card" style={{ textAlign: 'center', borderLeft: '5px solid var(--color-success)' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-light)', display: 'block', fontWeight: 'bold' }}>{t('ocr_accuracy')}</span>
              <p style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--color-success)', marginTop: '4px' }}>{analytics.ocrAccuracy}%</p>
            </div>
          </div>

          {/* Core Content Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', alignItems: 'start' }}>
            
            {/* Left: User Creation Form */}
            <div className="gov-card">
              <h3 style={{ fontSize: '1.05rem', color: 'var(--ip-red)', borderBottom: '2px solid var(--border-color)', paddingBottom: '6px', marginBottom: '16px' }}>
                {t('add_user')}
              </h3>

              <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="gov-form-group" style={{ marginBottom: '0' }}>
                  <label>{t('full_name')}</label>
                  <input
                    type="text"
                    className="gov-input"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={t('full_name')}
                  />
                </div>
                <div className="gov-form-group" style={{ marginBottom: '0' }}>
                  <label>{t('username')}</label>
                  <input
                    type="text"
                    className="gov-input"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder={t('username')}
                  />
                </div>
                <div className="gov-form-group" style={{ marginBottom: '0' }}>
                  <label>{t('password')}</label>
                  <input
                    type="password"
                    className="gov-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('password')}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="gov-form-group" style={{ marginBottom: '0' }}>
                    <label>{t('role_label')}</label>
                    <select
                      className="gov-input"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                    >
                      <option value="postman">{t('postman')}</option>
                      <option value="office_staff">{t('office_staff')}</option>
                    </select>
                  </div>
                  <div className="gov-form-group" style={{ marginBottom: '0' }}>
                    <label>{t('choose_hub')}</label>
                    <select
                      className="gov-input"
                      value={newHubId}
                      onChange={(e) => setNewHubId(e.target.value)}
                    >
                      <option value="">{t('choose_hub')}</option>
                      <option value="6682f6f168f1c8f1c8f1c8a1">Begumpet Sub-Post Office</option>
                      <option value="6682f6f168f1c8f1c8f1c8a2">Madhapur Post Office</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="gov-btn gov-btn-red gov-btn-block" style={{ marginTop: '10px' }}>
                  {t('add_user_btn')}
                </button>
              </form>
            </div>

            {/* Right: Daily Stats Chart and Demo Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* CSS Grid Column Chart */}
              <div className="gov-card">
                <h3 style={{ fontSize: '1.05rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '6px', marginBottom: '16px' }}>
                  {t('weekly_stats')}
                </h3>

                <div style={{
                  height: '140px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  padding: '10px 20px',
                  background: '#f8fafc',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  marginBottom: '10px'
                }}>
                  {analytics.dailyStats.map(s => {
                    const lettersHeight = Math.min((s.letters / 30) * 100, 100);
                    return (
                      <div key={s.day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '32px' }}>
                        <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '100px', width: '100%' }}>
                          {/* Total letters processed bar */}
                          <div style={{ height: `${lettersHeight}%`, width: '12px', backgroundColor: 'var(--ip-red)', borderRadius: '2px' }}></div>
                        </div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-light)', marginTop: '4px' }}>
                          {s.day}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '0.7rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '10px', height: '10px', backgroundColor: 'var(--ip-red)', borderRadius: '2px' }}></span> {t('scanned_letters')}
                  </span>
                </div>
              </div>

              {/* Demo reset controller */}
              <div className="gov-card">
                <h3 style={{ fontSize: '1.05rem', color: 'var(--ip-red)', borderBottom: '2px solid var(--border-color)', paddingBottom: '6px', marginBottom: '12px' }}>
                  🔄 {t('reset_demo')}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-sub)', marginBottom: '16px' }}>
                  {t('reset_desc')}
                </p>
                <button 
                  onClick={handleResetDemo}
                  disabled={resetting}
                  className="gov-btn gov-btn-yellow gov-btn-block"
                >
                  {resetting ? t('syncing') : t('restore_db')}
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
