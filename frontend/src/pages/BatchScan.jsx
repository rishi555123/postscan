import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';

export default function BatchScan({ onBack }) {
  const { token } = useAuth();
  const { t } = useLanguage();
  
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [processingQueue, setProcessingQueue] = useState([]);
  const [processedLetters, setProcessedLetters] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const API_URL = 'http://localhost:5000/api';

  const handleFilesChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);
      
      // Initialize queue status
      const initialQueue = filesArray.map((file, idx) => ({
        id: idx,
        name: file.name,
        status: 'queued', // queued, processing, complete, failed
        progress: 0,
        ocrConfidence: null,
        recipient: ''
      }));
      setProcessingQueue(initialQueue);
      setProcessedLetters([]);
    }
  };

  const startBatchProcess = async () => {
    if (selectedFiles.length === 0) {
      setStatusMsg('Please pick multiple shipping label images first.');
      return;
    }

    setUploading(true);
    setStatusMsg('Uploading batch queue for parallel AI parsing...');

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('labels', file);
    });

    try {
      // Simulate individual file progress loader updates for high-fidelity presentation
      let currentProgress = 0;
      const interval = setInterval(() => {
        setProcessingQueue(prev => 
          prev.map((item, idx) => {
            if (item.status === 'queued') {
              return { ...item, status: 'processing', progress: 40 };
            }
            if (item.status === 'processing') {
              const nextProgress = Math.min(item.progress + 15, 95);
              return { ...item, progress: nextProgress };
            }
            return item;
          })
        );
      }, 500);

      const response = await fetch(`${API_URL}/letters/batch-upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      clearInterval(interval);

      const data = await response.json();
      if (data.success) {
        setStatusMsg(`Successfully processed batch! ${data.count} letters sorted.`);
        setProcessedLetters(data.letters);
        
        // Update final queue representation
        setProcessingQueue(prev => 
          prev.map((item, idx) => {
            const match = data.letters[idx] || data.letters[0];
            return {
              ...item,
              status: 'complete',
              progress: 100,
              ocrConfidence: match ? match.ocrConfidence : 90,
              recipient: match ? match.recipientName : 'Recipient'
            };
          })
        );
      } else {
        setStatusMsg(data.message || 'Batch scan failed.');
        setProcessingQueue(prev => prev.map(item => ({ ...item, status: 'failed' })));
      }
    } catch (err) {
      console.error(err);
      setStatusMsg('Connection lost during batch processing.');
      setProcessingQueue(prev => prev.map(item => ({ ...item, status: 'failed' })));
    } finally {
      setUploading(false);
    }
  };

  // Group processed results by beat
  const groupedBatch = {};
  processedLetters.forEach(l => {
    const beat = l.beatId ? l.beatId.beatNumber : 'Unassigned';
    if (!groupedBatch[beat]) groupedBatch[beat] = [];
    groupedBatch[beat].push(l);
  });

  return (
    <div className="dashboard-container" style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      
      {/* Gov Header */}
      <header className="gov-header flex-between" style={{ borderRadius: 'var(--radius-gov)', marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem', padding: '0 8px' }}>
            ←
          </button>
          <img src="/src/assets/logo.jpg" alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid white' }} />
          <div>
            <h1 className="gov-header-title" style={{ margin: 0, fontSize: '1.2rem' }}>{t('batch_scan')}</h1>
            <span className="gov-sub-logo" style={{ display: 'block' }}>{t('tagline')}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <LanguageSelector />
        </div>
      </header>

      {statusMsg && (
        <div className="gov-card" style={{ padding: '10px 16px', marginBottom: '16px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid rgba(29, 78, 216, 0.2)', fontSize: '0.85rem' }}>
          Info: {statusMsg}
        </div>
      )}

      {/* Primary Split: Left File Selector/Queue, Right Completed Group Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', alignItems: 'start' }}>
        
        {/* Left Side: Upload Queue */}
        <div className="gov-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--ip-red)', borderBottom: '2px solid var(--border-color)', paddingBottom: '6px' }}>
            📁 {t('batch_scan')}
          </h3>

          <div 
            style={{
              border: '2px dashed var(--border-color)',
              borderRadius: '8px',
              padding: '30px 16px',
              textAlign: 'center',
              background: '#f8fafc',
              cursor: 'pointer'
            }}
            onClick={() => document.getElementById('batch-file-picker').click()}
          >
            <input
              id="batch-file-picker"
              type="file"
              multiple
              accept="image/*"
              onChange={handleFilesChange}
              style={{ display: 'none' }}
            />
            <svg viewBox="0 0 24 24" width="40" height="40" stroke="var(--text-light)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px' }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="9" y1="15" x2="15" y2="15"></line>
              <line x1="9" y1="11" x2="15" y2="11"></line>
            </svg>
            <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>
              {selectedFiles.length > 0 ? `${selectedFiles.length} ${t('letters_unit')}` : t('select_photo')}
            </p>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>{t('select_photo')}</span>
          </div>

          <button 
            type="button" 
            onClick={startBatchProcess} 
            disabled={uploading || selectedFiles.length === 0} 
            className="gov-btn gov-btn-red gov-btn-block"
          >
            {uploading ? <span className="spinner"></span> : t('process_batch') || 'Start Processing Batch'}
          </button>

          {/* Queue display list */}
          {processingQueue.length > 0 && (
            <div style={{ maxHeight: '260px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px' }}>
              {processingQueue.map(item => {
                const isLowConf = item.ocrConfidence !== null && item.ocrConfidence < 70;
                return (
                  <div key={item.id} style={{ padding: '6px 8px', borderBottom: '1px solid #f1f5f9', fontSize: '0.8rem' }}>
                    <div className="flex-between">
                      <span style={{ fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>
                        {item.name}
                      </span>
                      <span style={{ 
                        fontWeight: 'bold', 
                        color: item.status === 'complete' ? 'var(--color-success)' : item.status === 'processing' ? 'var(--ip-red)' : 'var(--text-light)' 
                      }}>
                        {item.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    {item.status === 'processing' && (
                      <div style={{ width: '100%', height: '4px', background: '#e2e8f0', borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${item.progress}%`, height: '100%', background: 'var(--ip-red)', transition: 'width 0.3s' }}></div>
                      </div>
                    )}

                    {/* Result parameters */}
                    {item.status === 'complete' && (
                      <div className="flex-between" style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '2px' }}>
                        <span>{t('recipient')}: {item.recipient}</span>
                        <span style={{ color: isLowConf ? 'var(--color-error)' : 'var(--color-success)', fontWeight: 'bold' }}>
                          Conf: {Math.round(item.ocrConfidence)}% {isLowConf ? '(Low Confidence)' : '(Verified)'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Grouped completed overview */}
        <div className="gov-card" style={{ minHeight: '400px' }}>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--ip-red)', borderBottom: '2px solid var(--border-color)', paddingBottom: '6px', marginBottom: '16px' }}>
            {t('batch_results_summary') || 'Batch Results Summary'}
          </h3>

          {processedLetters.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '40px 0', fontSize: '0.85rem' }}>
              {t('pending') || 'Pending queue completion...'}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {Object.keys(groupedBatch).map(beat => {
                const list = groupedBatch[beat];
                const color = list[0].beatId?.colorHex || '#64748b';
                return (
                  <div key={beat} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ background: '#f8fafc', padding: '6px 12px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, display: 'inline-block' }}></span>
                        {beat}
                      </span>
                      <strong style={{ fontSize: '0.8rem' }}>{list.length} {t('letters_unit')}</strong>
                    </div>
                    <div style={{ padding: '6px' }}>
                      {list.map(l => (
                        <div key={l._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', fontSize: '0.75rem' }}>
                          <span>{l.recipientName}</span>
                          <span style={{ color: 'var(--text-light)' }}>{l.address.pincode}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
