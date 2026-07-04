import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';

export default function PostmanDashboard() {
  const { token, logout, user } = useAuth();
  const { t } = useLanguage();
  
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  
  // Offline Simulation State
  const [isOffline, setIsOffline] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState(() => {
    const saved = localStorage.getItem('postscan_offline_queue');
    return saved ? JSON.parse(saved) : [];
  });
  const [syncing, setSyncing] = useState(false);

  // States for delivery status modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [activeLetter, setActiveLetter] = useState(null);
  
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    fetchRoute();
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  // Save offline queue changes
  useEffect(() => {
    localStorage.setItem('postscan_offline_queue', JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  const fetchRoute = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/routing/postman`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        // Overlay any locally cached offline updates so the UI shows them immediately
        let updatedRoute = [...data.route];
        offlineQueue.forEach(item => {
          updatedRoute = updatedRoute.map(l => 
            l._id === item.letterId ? { ...l, status: item.status, isCachedLocal: true } : l
          );
        });
        
        setRouteData({ ...data, route: updatedRoute });
      }
    } catch (err) {
      console.error('Error fetching route:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sync offline updates back online
  const handleToggleOffline = async (e) => {
    const checked = e.target.checked;
    setIsOffline(checked);

    if (!checked && offlineQueue.length > 0) {
      // Transitioning offline -> online: Sync queue
      setSyncing(true);
      console.log(`Syncing ${offlineQueue.length} cached updates online...`);
      
      for (const item of offlineQueue) {
        try {
          await fetch(`${API_URL}/letters/${item.letterId}/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: item.status })
          });
        } catch (err) {
          console.error(`Failed to sync letter status online:`, err.message);
        }
      }

      setOfflineQueue([]);
      setSyncing(false);
      fetchRoute();
    }
  };

  // Leaflet routing map initialization
  useEffect(() => {
    if (!routeData || routeData.routeLength === 0 || !mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const { origin, route } = routeData;
    // Filters out completed deliveries from map representation
    const activeStops = route.filter(l => l.status !== 'delivered' && l.status !== 'returned_to_office');
    
    if (activeStops.length === 0) return;

    const map = L.map(mapRef.current).setView([origin.coordinates.lat, origin.coordinates.lng], 13);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Starting PO Hub Marker
    const hubIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: var(--ip-red); width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.5)"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    L.marker([origin.coordinates.lat, origin.coordinates.lng], { icon: hubIcon })
      .addTo(map)
      .bindPopup(`<b>${origin.name}</b><br/>(Dispatch Hub)`);

    const lineCoords = [[origin.coordinates.lat, origin.coordinates.lng]];

    activeStops.forEach((pkg, index) => {
      const lat = pkg.coordinates.lat;
      const lng = pkg.coordinates.lng;
      lineCoords.push([lat, lng]);

      const beatColor = pkg.beatId?.colorHex || '#3b82f6';

      const markerIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div style="
            background-color: ${beatColor}; 
            width: 20px; 
            height: 20px; 
            border-radius: 50%; 
            border: 2px solid white; 
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            display: flex;
            justify-content: center;
            align-items: center;
            color: white;
            font-size: 10px;
            font-weight: bold;
          ">${index + 1}</div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      L.marker([lat, lng], { icon: markerIcon })
        .addTo(map)
        .bindPopup(`
          <strong>Stop ${index + 1}: ${pkg.recipientName}</strong><br/>
          Address: ${pkg.address.fullAddress}<br/>
          Status: ${pkg.status.toUpperCase()}
        `);
    });

    if (lineCoords.length > 1) {
      const pathLine = L.polyline(lineCoords, {
        color: 'var(--ip-red)',
        weight: 3,
        opacity: 0.6,
        dashArray: '5, 5'
      }).addTo(map);

      map.fitBounds(pathLine.getBounds(), { padding: [30, 30] });
    }

  }, [routeData]);

  const openStatusUpdateModal = (letter) => {
    setActiveLetter(letter);
    setShowStatusModal(true);
  };

  const handleStatusSubmit = async (statusOption) => {
    if (!activeLetter) return;

    if (isOffline) {
      // Simulate Caching Locally
      const newUpdate = { letterId: activeLetter._id, status: statusOption };
      
      // Update cache
      setOfflineQueue(prev => {
        const filtered = prev.filter(item => item.letterId !== activeLetter._id);
        return [...filtered, newUpdate];
      });

      // Update UI immediately
      setRouteData(prev => {
        const updated = prev.route.map(l => 
          l._id === activeLetter._id ? { ...l, status: statusOption, isCachedLocal: true } : l
        );
        return { ...prev, route: updated };
      });

      setShowStatusModal(false);
      setActiveLetter(null);
      return;
    }

    // Live mode update
    setUpdatingId(activeLetter._id);
    try {
      const res = await fetch(`${API_URL}/letters/${activeLetter._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: statusOption })
      });

      const data = await res.json();
      if (data.success) {
        setShowStatusModal(false);
        setActiveLetter(null);
        fetchRoute();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId('');
    }
  };

  // Distance computation (mock sequence steps length)
  const remainingStops = routeData ? routeData.route.filter(l => l.status !== 'delivered' && l.status !== 'returned_to_office') : [];
  const completedStops = routeData ? routeData.route.filter(l => l.status === 'delivered') : [];
  const failedStops = routeData ? routeData.route.filter(l => !['pending', 'assigned', 'out_for_delivery', 'delivered'].includes(l.status)) : [];

  return (
    <div className="mobile-frame-container">
      <div className="simulated-mobile" style={{ background: '#f4f5f8' }}>
        
        {/* Emblem bar top */}
        <div className="flag-emblem-bar"></div>

        {/* Header bar */}
        <header className="gov-header" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src="/src/assets/logo.jpg" alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid white' }} />
              <div>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'white' }}>Postman Portal</h2>
                <span style={{ fontSize: '0.65rem', color: 'var(--ip-yellow)', fontWeight: 'bold', display: 'block' }}>{user?.name || 'Ramesh Kumar'}</span>
              </div>
            </div>
            <button onClick={logout} className="gov-btn gov-btn-yellow" style={{ padding: '4px 8px', fontSize: '0.7rem' }}>
              {t('logout')}
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', width: '100%', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '6px' }}>
            <LanguageSelector />
          </div>
        </header>

        {/* Screen Scrollable Body */}
        <div className="mobile-screen-content" style={{ padding: '12px' }}>
          
          {/* Offline simulator switch */}
          <div className="gov-card" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-sub)' }}>
              Status: {t('offline_active')}
            </span>
            <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '36px', height: '20px' }}>
              <input 
                type="checkbox" 
                checked={isOffline} 
                onChange={handleToggleOffline} 
                style={{ width: 0, height: 0, opacity: 0 }}
              />
              <span style={{
                position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: isOffline ? 'var(--ip-red)' : '#cbd5e1',
                borderRadius: '20px', transition: '0.3s'
              }}>
                <span style={{
                  position: 'absolute', content: '""', height: '14px', width: '14px', left: isOffline ? '18px' : '4px', bottom: '3px',
                  backgroundColor: 'white', borderRadius: '50%', transition: '0.3s'
                }}></span>
              </span>
            </label>
          </div>

          {/* Sync status loader */}
          {syncing && (
            <div className="gov-card" style={{ textAlign: 'center', background: 'var(--color-warning-bg)', border: '1px solid var(--ip-yellow)', padding: '12px' }}>
              <div className="spinner" style={{ color: 'var(--ip-yellow-dark)', margin: '0 auto 8px' }}></div>
              <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>{t('syncing')}</span>
            </div>
          )}

          {/* Offline Warning banner */}
          {isOffline && (
            <div className="gov-card" style={{ background: 'var(--color-error-bg)', color: 'var(--color-error)', border: '1px solid rgba(185, 28, 28, 0.2)', padding: '10px 14px', fontSize: '0.8rem', textAlign: 'center', fontWeight: '600' }}>
              Attention: {t('offline_active')}
            </div>
          )}

          {/* Statistics summary row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            <div className="gov-card" style={{ padding: '8px', textAlign: 'center', background: 'white' }}>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-light)', display: 'block' }}>{t('pending')}</span>
              <strong style={{ fontSize: '1.25rem', color: 'var(--ip-red)' }}>{remainingStops.length}</strong>
            </div>
            <div className="gov-card" style={{ padding: '8px', textAlign: 'center', background: 'white' }}>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-light)', display: 'block' }}>{t('delivered')}</span>
              <strong style={{ fontSize: '1.25rem', color: 'var(--color-success)' }}>{completedStops.length}</strong>
            </div>
            <div className="gov-card" style={{ padding: '8px', textAlign: 'center', background: 'white' }}>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-light)', display: 'block' }}>{t('failures')}</span>
              <strong style={{ fontSize: '1.25rem', color: 'var(--color-warning)' }}>{failedStops.length}</strong>
            </div>
          </div>

          {/* Leaflet Optimized Polyline Map */}
          <div className="gov-card" style={{ display: 'flex', flexDirection: 'column', height: '240px', padding: '8px' }}>
            <div ref={mapRef} style={{ flex: '1', borderRadius: '6px', background: '#e2e8f0', zIndex: 1 }} />
          </div>

          {/* Sorted sequence list */}
          <div className="gov-card" style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', padding: '12px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
              {t('route_sequence')}
            </h3>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}><div className="spinner"></div></div>
            ) : remainingStops.length === 0 ? (
              <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-light)', padding: '24px 0' }}>
                {t('delivered')} - complete!
              </p>
            ) : (
              remainingStops.map((letter, index) => {
                const isCached = letter.isCachedLocal;
                const hasWarning = letter.weather && letter.weather.warning !== 'None';
                
                return (
                  <div 
                    key={letter._id} 
                    style={{
                      padding: '10px',
                      background: '#f8fafc',
                      border: isCached ? '1px dashed var(--color-warning)' : '1px solid var(--border-color)',
                      borderRadius: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}
                  >
                    <div className="flex-between">
                      <div>
                        <span style={{ background: 'var(--ip-red)', color: 'white', fontSize: '0.65rem', padding: '1px 5px', borderRadius: '3px', fontWeight: '700', marginRight: '6px' }}>
                          STOP {index + 1}
                        </span>
                        <strong style={{ fontSize: '0.85rem' }}>{letter.recipientName}</strong>
                      </div>
                      
                      {letter.weather && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>
                          ⛅ {letter.weather.temp}°C
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>
                      {letter.address.fullAddress}
                    </p>

                    {/* Weather warning alert tag */}
                    {hasWarning && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-error)', fontWeight: 'bold' }}>
                        Warning: {t('weather_warnings')}: {letter.weather.warning}
                      </span>
                    )}

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                      
                      {/* Google Maps redirect simulation button */}
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${letter.coordinates.lat},${letter.coordinates.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="gov-btn gov-btn-yellow"
                        style={{ padding: '4px 8px', fontSize: '0.7rem', textDecoration: 'none' }}
                      >
                        {t('nav_maps')}
                      </a>

                      <button
                        onClick={() => openStatusUpdateModal(letter)}
                        disabled={updatingId === letter._id}
                        className="gov-btn gov-btn-red"
                        style={{ padding: '4px 10px', fontSize: '0.7rem' }}
                      >
                        {t('update_status')}
                      </button>
                    </div>

                    {isCached && (
                      <span style={{ fontSize: '0.65rem', color: 'var(--color-warning)', fontWeight: 'bold', alignSelf: 'flex-end' }}>
                        ✓ {t('offline_active')}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>

      {/* Status override selection modal */}
      {showStatusModal && activeLetter && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100,
          padding: '16px'
        }}>
          <div className="gov-card" style={{ width: '100%', maxWidth: '340px', padding: '20px' }}>
            <h4 style={{ fontSize: '0.95rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '6px', marginBottom: '12px' }}>
              Select Delivery Action
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { code: 'delivered', label: 'Delivered' },
                { code: 'house_locked', label: 'House Locked' },
                { code: 'address_not_found', label: 'Address Not Found' },
                { code: 'shifted', label: 'Shifted Address' },
                { code: 'recipient_not_available', label: 'Recipient Not Available' },
                { code: 'returned_to_office', label: 'Returned to Office' }
              ].map(opt => (
                <button
                  key={opt.code}
                  onClick={() => handleStatusSubmit(opt.code)}
                  className="gov-btn gov-btn-outline"
                  style={{ justifyContent: 'flex-start', fontSize: '0.8rem', padding: '8px 12px' }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button 
              onClick={() => { setShowStatusModal(false); setActiveLetter(null); }}
              className="gov-btn gov-btn-block" 
              style={{ background: '#e2e8f0', color: 'var(--text-sub)', fontSize: '0.8rem', padding: '6px', marginTop: '12px' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
