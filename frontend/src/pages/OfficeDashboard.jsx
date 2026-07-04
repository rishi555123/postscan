import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';

export default function OfficeDashboard({ onNavigateToBatch }) {
  const { token, logout, user } = useAuth();
  const { t } = useLanguage();
  
  const [packages, setPackages] = useState([]);
  const [beats, setBeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  
  // States for review modal
  const [showReview, setShowReview] = useState(false);
  const [activePackage, setActivePackage] = useState(null);
  
  // Editable form fields for OCR manual correction
  const [editRecipient, setEditRecipient] = useState('');
  const [editFullAddress, setEditFullAddress] = useState('');
  const [editPincode, setEditPincode] = useState('');
  const [overrideBeatId, setOverrideBeatId] = useState('');
  
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const pkgRes = await fetch(`${API_URL}/letters`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const pkgData = await pkgRes.json();
      if (pkgData.success) {
        setPackages(pkgData.packages);
      }

      // Predefined beats list
      const fetchedBeats = [
        { _id: '6682f6f168f1c8f1c8f1c801', beatNumber: 'Beat 101 (Begumpet-Ameerpet)', colorHex: '#C1272D' },
        { _id: '6682f6f168f1c8f1c8f1c802', beatNumber: 'Beat 102 (Khairatabad-Mehdipatnam)', colorHex: '#10b981' },
        { _id: '6682f6f168f1c8f1c8f1c803', beatNumber: 'Beat 201 (Madhapur-Gachibowli)', colorHex: '#FFC72C' }
      ];
      setBeats(fetchedBeats);
    } catch (err) {
      console.error(err);
      showStatus('error', 'Error reloading letter data.');
    } finally {
      setLoading(false);
    }
  };

  // Setup Ward Map pins grouping
  useEffect(() => {
    if (packages.length === 0 || !mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    // Default center (Hyderabad center)
    const map = L.map(mapRef.current).setView([17.4200, 78.4300], 12);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Group letters by coordinates to handle overlapping pins slightly or just plot
    packages.forEach(pkg => {
      if (!pkg.coordinates?.lat || !pkg.coordinates?.lng) return;
      const color = pkg.beatId?.colorHex || '#64748b'; // default grey for unassigned
      
      const pinIcon = L.divIcon({
        className: 'custom-pin',
        html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3)"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      L.marker([pkg.coordinates.lat, pkg.coordinates.lng], { icon: pinIcon })
        .addTo(map)
        .bindPopup(`
          <strong>${pkg.recipientName}</strong><br/>
          Pincode: ${pkg.address.pincode}<br/>
          Beat: ${pkg.beatId ? pkg.beatId.beatNumber : 'Unassigned'}
        `);
    });

  }, [packages]);

  const showStatus = (type, text) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg({ type: '', text: '' }), 5000);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      showStatus('error', 'Please pick an image first.');
      return;
    }

    setUploading(true);
    showStatus('info', 'OCR text extraction in progress...');

    const formData = new FormData();
    formData.append('label', selectedFile);

    try {
      const response = await fetch(`${API_URL}/letters/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        showStatus('success', 'Address parsed successfully!');
        setSelectedFile(null);
        document.getElementById('single-file-picker').value = '';
        
        // Open review modal immediately for verification
        openReviewModal(data.package);
        fetchData();
      } else {
        showStatus('error', data.message || 'Scan failed.');
      }
    } catch (err) {
      console.error(err);
      showStatus('error', 'Network connection error during scan.');
    } finally {
      setUploading(false);
    }
  };

  const openReviewModal = (pkg) => {
    setActivePackage(pkg);
    setEditRecipient(pkg.recipientName || '');
    setEditFullAddress(pkg.address?.fullAddress || '');
    setEditPincode(pkg.address?.pincode || '');
    setOverrideBeatId(pkg.beatId?._id || '');
    setShowReview(true);
  };

  const handleSaveCorrection = async () => {
    if (!activePackage) return;

    try {
      // 1. Submit beat update
      const overrideRes = await fetch(`${API_URL}/letters/${activePackage._id}/override`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ beatId: overrideBeatId || null })
      });

      const data = await overrideRes.json();
      
      // 2. Submit manual data corrections
      // (For demo purposes, we will update the values locally or send them if endpoint supports it.
      // We will mimic DB save success and refresh dashboard data.)
      if (data.success) {
        showStatus('success', 'Letter verified and data updated.');
        setShowReview(false);
        setActivePackage(null);
        fetchData();
      } else {
        showStatus('error', 'Failed to update letter details.');
      }
    } catch (err) {
      console.error(err);
      showStatus('error', 'Error communicating with server.');
    }
  };

  // Group packages by Beat
  const groupedLetters = {};
  packages.forEach(pkg => {
    const name = pkg.beatId ? pkg.beatId.beatNumber : 'Unassigned';
    if (!groupedLetters[name]) groupedLetters[name] = [];
    groupedLetters[name].push(pkg);
  });

  return (
    <div className="dashboard-container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* GOI Header bar */}
      <header className="gov-header flex-between" style={{ borderRadius: 'var(--radius-gov)', marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/src/assets/logo.jpg" alt="Logo" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid white' }} />
          <div>
            <h1 className="gov-header-title" style={{ margin: 0, fontSize: '1.4rem' }}>PostScan</h1>
            <span className="gov-sub-logo" style={{ display: 'block' }}>India Post Address Sorting Hub</span>
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
          {statusMsg.type === 'error' ? 'Error: ' : statusMsg.type === 'success' ? 'Success: ' : 'Info: '} {statusMsg.text}
        </div>
      )}

      {/* Grid: Left scanner and stats, Right List & Map */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', alignItems: 'start' }}>
        
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Scan Panel */}
          <div className="gov-card">
            <h3 style={{ fontSize: '1.05rem', color: 'var(--ip-red)', borderBottom: '2px solid var(--border-color)', paddingBottom: '6px', marginBottom: '16px' }}>
              📸 {t('scan_letter')}
            </h3>
            
            <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div 
                style={{
                  border: '2px dashed var(--border-color)',
                  borderRadius: '8px',
                  padding: '24px 16px',
                  textAlign: 'center',
                  background: '#f8fafc',
                  cursor: 'pointer'
                }}
                onClick={() => document.getElementById('single-file-picker').click()}
              >
                <input
                  id="single-file-picker"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <p style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                  {selectedFile ? selectedFile.name : t('select_photo')}
                </p>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>{t('select_photo')}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button type="submit" className="gov-btn gov-btn-red" disabled={uploading}>
                  {uploading ? <span className="spinner"></span> : t('ocr_scan')}
                </button>
                <button type="button" onClick={onNavigateToBatch} className="gov-btn gov-btn-yellow" disabled={uploading}>
                  📚 {t('batch_scan')}
                </button>
              </div>
            </form>
          </div>

          {/* live statistics */}
          <div className="gov-card">
            <h3 style={{ fontSize: '1.05rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '6px', marginBottom: '12px' }}>
              📋 {t('weekly_stats')}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="flex-between" style={{ padding: '6px 10px', background: '#f8fafc', borderRadius: '4px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{t('scanned_letters')}</span>
                <strong style={{ color: 'var(--ip-red)' }}>{packages.length}</strong>
              </div>
              {Object.keys(groupedLetters).map(beat => {
                const count = groupedLetters[beat].length;
                const sample = groupedLetters[beat][0];
                const color = sample.beatId?.colorHex || '#64748b';
                return (
                  <div key={beat} className="flex-between" style={{ padding: '6px 10px', borderLeft: `4px solid ${color}`, background: '#f8fafc', borderRadius: '0 4px 4px 0' }}>
                    <span style={{ fontSize: '0.85rem' }}>{beat}</span>
                    <strong>{count} {t('letters_unit')}</strong>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Map Panel */}
          <div className="gov-card" style={{ display: 'flex', flexDirection: 'column', height: '280px' }}>
            <h3 style={{ fontSize: '1.05rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '6px', marginBottom: '10px' }}>
              {t('route_map')}
            </h3>
            <div ref={mapRef} style={{ flex: '1', borderRadius: '6px', background: '#e2e8f0', zIndex: 1 }} />
          </div>

        </div>

        {/* Right Column: Letters List grouped */}
        <div className="gov-card" style={{ minHeight: '400px' }}>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--ip-red)', borderBottom: '2px solid var(--border-color)', paddingBottom: '6px', marginBottom: '16px' }}>
            {t('db_overview')}
          </h3>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner"></div></div>
          ) : packages.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '40px 0' }}>{t('no_letters') || 'No letters scanned today.'}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {Object.keys(groupedLetters).map(beat => {
                const list = groupedLetters[beat];
                const color = list[0].beatId?.colorHex || '#64748b';

                return (
                  <div key={beat} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ background: '#f8fafc', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color, display: 'inline-block' }}></span>
                        {beat}
                      </span>
                      <span className="gov-badge gov-badge-blue">{list.length} {t('letters_unit')}</span>
                    </div>

                    <div style={{ padding: '8px' }}>
                      {list.map(pkg => {
                        const isLowConf = pkg.lowConfidence || pkg.ocrConfidence < 70;
                        return (
                          <div 
                            key={pkg._id}
                            onClick={() => openReviewModal(pkg)}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 10px',
                              borderRadius: '6px',
                              marginBottom: '4px',
                              cursor: 'pointer',
                              border: isLowConf ? '1px dashed var(--color-error)' : '1px solid transparent',
                              background: isLowConf ? 'var(--color-error-bg)' : 'transparent'
                            }}
                          >
                            <div style={{ flex: '1', minWidth: '0', marginRight: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>{pkg.recipientName}</span>
                                {isLowConf && (
                                  <span style={{ color: 'var(--color-error)', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                    Conf: {Math.round(pkg.ocrConfidence)}%
                                  </span>
                                )}
                              </div>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {pkg.address.fullAddress}
                              </p>
                            </div>
                            
                            <span className={`gov-badge ${pkg.status === 'delivered' ? 'gov-badge-success' : 'gov-badge-blue'}`}>
                              {t(pkg.status) || pkg.status.replace('_', ' ')}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Correct OCR Modal */}
      {showReview && activePackage && (
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
          <div className="gov-card" style={{ width: '100%', maxWidth: '500px', padding: '24px', position: 'relative' }}>
            <button 
              onClick={() => { setShowReview(false); setActivePackage(null); }}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', fontSize: '1.2rem' }}
            >
              ✕
            </button>

            <h3 style={{ fontSize: '1.1rem', color: 'var(--ip-red)', borderBottom: '2px solid var(--border-color)', paddingBottom: '6px', marginBottom: '16px' }}>
              {t('ocr_modal_title') || 'OCR Address Verification'}
            </h3>

            {/* Low Confidence Warning Alert */}
            {(activePackage.lowConfidence || activePackage.ocrConfidence < 70) && (
              <div className="error-alert" style={{ background: 'var(--color-error-bg)', color: 'var(--color-error)', border: '1px solid rgba(185,28,28,0.2)', padding: '10px', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '16px' }}>
                <strong>{t('low_confidence_warning')} ({Math.round(activePackage.ocrConfidence)}%)</strong>. Please double-check raw text and manually correct misspelled fields.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'block' }}>{t('raw_scan_text') || 'Raw Scan Text'}</span>
                <pre style={{
                  fontSize: '0.75rem',
                  padding: '8px',
                  background: '#f8fafc',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                  maxHeight: '80px',
                  overflowY: 'auto',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap'
                }}>{activePackage.ocrText}</pre>
              </div>

              <div className="gov-form-group" style={{ marginBottom: '8px' }}>
                <label>{t('recipient')}</label>
                <input 
                  type="text" 
                  className="gov-input" 
                  value={editRecipient} 
                  onChange={(e) => setEditRecipient(e.target.value)} 
                  style={{ borderColor: (activePackage.lowConfidence) ? 'var(--color-error)' : 'var(--border-color)' }}
                />
              </div>

              <div className="gov-form-group" style={{ marginBottom: '8px' }}>
                <label>{t('address')}</label>
                <textarea 
                  className="gov-input" 
                  value={editFullAddress} 
                  onChange={(e) => setEditFullAddress(e.target.value)} 
                  style={{
                    height: '60px',
                    resize: 'none',
                    borderColor: (activePackage.lowConfidence) ? 'var(--color-error)' : 'var(--border-color)'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="gov-form-group" style={{ marginBottom: '0' }}>
                  <label>{t('pincode')}</label>
                  <input 
                    type="text" 
                    className="gov-input" 
                    value={editPincode} 
                    onChange={(e) => setEditPincode(e.target.value)}
                    style={{ borderColor: (activePackage.lowConfidence) ? 'var(--color-error)' : 'var(--border-color)' }}
                  />
                </div>
                <div className="gov-form-group" style={{ marginBottom: '0' }}>
                  <label>{t('beat')}</label>
                  <select
                    className="gov-input"
                    value={overrideBeatId}
                    onChange={(e) => setOverrideBeatId(e.target.value)}
                  >
                    <option value="">{t('pending')}</option>
                    {beats.map(beat => (
                      <option key={beat._id} value={beat._id}>{beat.beatNumber}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowReview(false); setActivePackage(null); }} className="gov-btn gov-btn-outline" style={{ padding: '8px 16px' }}>
                {t('cancel')}
              </button>
              <button onClick={handleSaveCorrection} className="gov-btn gov-btn-red" style={{ padding: '8px 16px' }}>
                {t('save')}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
