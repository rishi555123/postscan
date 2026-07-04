import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import Splash from './pages/Splash';
import RoleSelection from './pages/RoleSelection';
import Login from './pages/Login';
import OfficeDashboard from './pages/OfficeDashboard';
import PostmanDashboard from './pages/PostmanDashboard';
import AdminDashboard from './pages/AdminDashboard';
import BatchScan from './pages/BatchScan';

function MainApp() {
  const { user, loading, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  
  // Navigation Routing States: 'splash' | 'role_selection' | 'login' | 'dashboard' | 'batch_scan'
  const [currentView, setCurrentView] = useState('splash');
  const [selectedRole, setSelectedRole] = useState(null);

  // Sync auth state with view state
  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        setCurrentView('dashboard');
      } else {
        if (currentView === 'dashboard') {
          setCurrentView('role_selection');
          setSelectedRole(null);
        }
      }
    }
  }, [isAuthenticated, loading]);

  if (loading) {
    return (
      <div className="mobile-frame-container">
        <div className="simulated-mobile" style={{ background: '#ffffff', justifyContent: 'center', alignItems: 'center' }}>
          <div className="flag-emblem-bar" style={{ position: 'absolute', top: 0, left: 0, width: '100%' }}></div>
          <div className="spinner" style={{ color: 'var(--ip-red)', width: '28px', height: '28px' }}></div>
          <p style={{ color: 'var(--text-light)', marginTop: '12px', fontSize: '0.85rem', fontWeight: '500' }}>Loading security systems...</p>
        </div>
      </div>
    );
  }

  // --- Router Flow ---

  if (currentView === 'splash') {
    return <Splash onComplete={() => setCurrentView('role_selection')} />;
  }

  if (currentView === 'role_selection' && !isAuthenticated) {
    return (
      <RoleSelection 
        onSelectRole={(role) => {
          setSelectedRole(role);
          setCurrentView('login');
        }} 
      />
    );
  }

  if (currentView === 'login' && !isAuthenticated) {
    return (
      <Login 
        role={selectedRole} 
        onBack={() => {
          setSelectedRole(null);
          setCurrentView('role_selection');
        }} 
      />
    );
  }

  // User is authenticated, route to dashboards
  if (isAuthenticated && user) {
    switch (user.role) {
      case 'admin':
        return <AdminDashboard />;
        
      case 'office_staff':
        if (currentView === 'batch_scan') {
          return <BatchScan onBack={() => setCurrentView('dashboard')} />;
        }
        return <OfficeDashboard onNavigateToBatch={() => setCurrentView('batch_scan')} />;
        
      case 'postman':
        return <PostmanDashboard />;
        
      default:
        return (
          <div className="mobile-frame-container">
            <div className="simulated-mobile" style={{ padding: '24px', justifyContent: 'center', alignItems: 'center' }}>
              <h3 style={{ color: 'var(--color-error)' }}>Account Role Error</h3>
              <p style={{ color: 'var(--text-light)', fontSize: '0.8rem', textAlign: 'center', margin: '12px 0' }}>
                Your account role settings do not match the system requirements.
              </p>
              <button onClick={() => window.location.reload()} className="gov-btn gov-btn-red">
                Reload Portal
              </button>
            </div>
          </div>
        );
    }
  }

  // Fallback to role selection
  return <RoleSelection onSelectRole={(role) => { setSelectedRole(role); setCurrentView('login'); }} />;
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <MainApp />
      </LanguageProvider>
    </AuthProvider>
  );
}
