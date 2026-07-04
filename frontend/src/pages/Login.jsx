import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login({ role, onBack }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (selectedUser) => {
    setUsername(selectedUser);
    setPassword('password123');
    setError('');
    setSubmitting(true);
    try {
      await login(selectedUser, 'password123');
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mobile-frame-container">
      <div className="simulated-mobile" style={{ background: '#f4f5f8' }}>
        
        {/* Flag line top */}
        <div className="flag-emblem-bar"></div>

        {/* Branding header */}
        <div style={{ background: 'var(--ip-red)', padding: '16px', borderBottom: '4px solid var(--ip-yellow)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem', padding: '0 8px' }}>
              ←
            </button>
            <img src="/src/assets/logo.jpg" alt="Logo" style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1px solid white' }} />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, textTransform: 'uppercase', margin: 0 }}>PostScan</h2>
          </div>
          <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>
            {role.replace('_', ' ')}
          </span>
        </div>

        <div className="mobile-screen-content" style={{ justifyContent: 'center' }}>
          
          <div className="gov-card" style={{ padding: '24px' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Authorized Sign In</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '4px' }}>Enter credentials for role clearance</p>
            </div>
            {error && (
              <div className="error-alert" style={{ background: 'var(--color-error-bg)', color: 'var(--color-error)', border: '1px solid rgba(185,28,28,0.2)', padding: '10px', borderRadius: '6px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
                <span>Error: {error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="gov-form-group">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  className="gov-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  disabled={submitting}
                />
              </div>

              <div className="gov-form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  className="gov-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  disabled={submitting}
                />
              </div>

              <button type="submit" className="gov-btn gov-btn-red gov-btn-block" style={{ marginTop: '8px' }} disabled={submitting}>
                {submitting ? <span className="spinner"></span> : 'Sign In'}
              </button>
            </form>

            <div className="demo-helper" style={{ marginTop: '24px' }}>
              <div className="divider">
                <span>Stage Quick Login</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {role === 'office_staff' && (
                  <button 
                    type="button" 
                    className="gov-btn gov-btn-outline gov-btn-block" 
                    onClick={() => handleQuickLogin('staff')}
                    disabled={submitting}
                  >
                    Login as Radhika (Staff)
                  </button>
                )}
                {role === 'postman' && (
                  <button 
                    type="button" 
                    className="gov-btn gov-btn-outline gov-btn-block" 
                    onClick={() => handleQuickLogin('postman1')}
                    disabled={submitting}
                  >
                    Login as Ramesh (Postman)
                  </button>
                )}
                {role === 'admin' && (
                  <button 
                    type="button" 
                    className="gov-btn gov-btn-outline gov-btn-block" 
                    onClick={() => handleQuickLogin('admin')}
                    disabled={submitting}
                  >
                    Login as Admin
                  </button>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Flag Bar & GOI footer */}
        <div style={{ padding: '16px', textAlign: 'center', background: '#ffffff', borderTop: '1px solid var(--border-color)' }}>
          <div className="flag-emblem-center" style={{ justifyContent: 'center' }}>
            <div className="chakra-wheel"></div>
            <span>Government Address Database Login</span>
          </div>
        </div>

      </div>
    </div>
  );
}
