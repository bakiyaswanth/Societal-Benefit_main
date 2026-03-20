import React, { useState, useEffect, useRef, useCallback } from 'react';
import { parseEmergencyInput } from './lib/gemini';
import { trackEvent } from './lib/firebase';
import { ShieldAlert, Activity, MapPin, Users, Settings, Plus, LayoutDashboard, Mic, Image as ImageIcon, X } from 'lucide-react';

function App() {
  const [apiKey, setApiKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [input, setInput] = useState('');
  const [images, setImages] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setIsConfigured(true);
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            setInput((prev) => prev + (prev.length > 0 ? ' ' : '') + transcript);
          } else {
            currentTranscript += transcript;
          }
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const handleSaveKey = useCallback((e) => {
    e.preventDefault();
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
      setIsConfigured(true);
      trackEvent('api_key_configured');
    }
  }, [apiKey]);

  const toggleRecording = useCallback(() => {
    if (!recognitionRef.current) {
      setError("Speech recognition is not supported in this browser. Try Chrome.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      trackEvent('voice_dictation_stopped');
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
      setError('');
      trackEvent('voice_dictation_started');
    }
  }, [isRecording]);

  const handleImageUpload = useCallback((e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages(prev => [...prev, reader.result]);
        };
        reader.readAsDataURL(file);
        trackEvent('image_uploaded', { fileType: file.type });
      }
    });
  }, []);

  const removeImage = useCallback((index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!input.trim() && images.length === 0) {
      setError('Please provide emergency text data or upload an image.');
      return;
    }
    
    setError('');
    setIsAnalyzing(true);
    setResult(null);
    trackEvent('triage_analysis_started', { hasImages: images.length > 0, hasText: input.trim().length > 0 });

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    try {
      const parsedData = await parseEmergencyInput(apiKey, input, images);
      setResult(parsedData);
      trackEvent('triage_analysis_completed', { priority: parsedData.priority, incidentType: parsedData.incidentType });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to parse the input. Please ensure your API key is valid.');
      trackEvent('triage_analysis_failed', { error: err.message });
    } finally {
      setIsAnalyzing(false);
    }
  }, [apiKey, input, images, isRecording]);

  const renderBadge = (priority) => {
    const p = (priority || '').toLowerCase();
    let badgeClass = 'badge ';
    if (p.includes('critical')) badgeClass += 'critical';
    else if (p.includes('high')) badgeClass += 'high';
    else if (p.includes('medium')) badgeClass += 'medium';
    else badgeClass += 'low';

    return <span className={badgeClass}>{priority}</span>;
  };

  if (!isConfigured) {
    return (
      <>
        <a href="#config-section" className="skip-link">Skip to main content</a>
        <main className="app-container" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
          <section id="config-section" className="glass-card" style={{ maxWidth: '500px', width: '100%' }} aria-labelledby="config-title">
            <h1 id="config-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
              <ShieldAlert size={36} color="var(--accent-blue)" aria-hidden="true" />
              TriageOS.
            </h1>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Universal bridge between human intent and crisis response.
            </p>
            
            <form onSubmit={handleSaveKey} className="input-group">
              <label htmlFor="apiKey">Google Gemini API Key</label>
              <input 
                id="apiKey"
                type="password" 
                placeholder="AIzaSy..." 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
                aria-required="true"
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: 1.4 }}>
                Required to process unstructured data. Key is stored securely in local storage and transmitted only to Google.
              </p>
              <button type="submit" style={{ marginTop: '1rem' }} aria-label="Save API Key and start system">
                <Settings size={18} aria-hidden="true" /> Configure System
              </button>
            </form>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <div className="app-container">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={36} color="var(--accent-blue)" aria-hidden="true" />
              TriageOS
            </h1>
            <p className="subtitle">AI-Powered Rapid Incident Response</p>
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem('gemini_api_key');
              setIsConfigured(false);
              setApiKey('');
              setResult(null);
              setInput('');
              setImages([]);
              trackEvent('api_key_reset');
            }}
            style={{ width: 'auto', background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}
            aria-label="Reset System and remove API Key"
          >
            Reset Key
          </button>
        </header>

        <main id="main-content" className="triage-grid">
          <section className="glass-card" aria-label="Data Input Section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                 <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0, marginBottom: '0.25rem', fontSize: '1.5rem' }}>
                  <Plus size={24} color="var(--accent-blue)" aria-hidden="true" /> Multi-Modal Stream
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                  Paste text, dictate voice, or upload messy photos/records.
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="icon-btn"
                  aria-label="Upload evidence photos or medical records"
                  title="Upload Photo / Medical Record"
                >
                  <ImageIcon size={20} aria-hidden="true" />
                </button>
                <button 
                  type="button"
                  onClick={toggleRecording}
                  className={`icon-btn ${isRecording ? 'recording' : ''}`}
                  aria-label={isRecording ? "Stop dictation" : "Start live voice dictation"}
                  title="Dictate Voice / Transcript"
                >
                  <Mic size={20} aria-hidden="true" />
                </button>
              </div>
            </div>

            <label htmlFor="emergency-input" className="sr-only">Emergency input field</label>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              multiple 
              style={{ display: 'none' }} 
              aria-hidden="true"
            />

            <div className="input-group">
              <textarea 
                id="emergency-input"
                placeholder="e.g. 'Massive pileup on I-95 North...'"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className={isRecording ? 'recording-active' : ''}
                aria-live="polite"
              />
            </div>

            {images.length > 0 && (
              <div className="image-preview-container" aria-label="Uploaded images preview">
                {images.map((imgUrl, idx) => (
                  <div key={idx} className="image-thumbnail">
                    <img src={imgUrl} alt={`Upload preview ${idx + 1}`} />
                    <button type="button" onClick={() => removeImage(idx)} className="remove-img-btn" aria-label={`Remove image ${idx + 1}`}>
                      <X size={14} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {error && <div className="error-msg" role="alert">{error}</div>}

            <button onClick={handleAnalyze} disabled={isAnalyzing} style={{ marginTop: '1rem' }} className="analyze-btn">
              {isAnalyzing ? <div className="loader" aria-hidden="true"></div> : <LayoutDashboard size={20} aria-hidden="true" />}
              {isAnalyzing ? 'Processing Intelligence...' : 'Extract & Triage Action Plan'}
            </button>
          </section>

          <section className="glass-card" style={{ minHeight: '400px' }} aria-live="polite" role="region" aria-label="Analysis Dashboard">
            {!result && !isAnalyzing && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', textAlign: 'center' }}>
                <ShieldAlert size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} aria-hidden="true" />
                <p style={{ fontWeight: 500, color: 'var(--text-main)' }}>Awaiting Signal...</p>
                <p style={{ fontSize: '0.85rem' }}>The structured action plan will appear here.</p>
              </div>
            )}

            {isAnalyzing && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--accent-blue)', gap: '1rem' }}>
                <div className="loader" style={{ width: '40px', height: '40px', borderWidth: '4px', borderColor: 'rgba(59, 130, 246, 0.2)', borderTopColor: 'var(--accent-blue)' }} aria-hidden="true"></div>
                <p style={{ fontWeight: 500 }}>Synthesizing Neural Response...</p>
              </div>
            )}

            {result && !isAnalyzing && (
              <div className="dashboard">
                <div className="dashboard-header">
                  <div>
                    <h2 style={{ marginTop: 0, marginBottom: '0.25rem', fontSize: '1.5rem' }}>Incident Dashboard</h2>
                    <div className="data-value" style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{result.incidentType}</div>
                  </div>
                  {renderBadge(result.priority)}
                </div>

                <div className="data-row" style={{ flexDirection: 'row', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '2rem' }}>
                  <MapPin size={20} color="var(--accent-blue)" style={{ marginTop: '0.25rem' }} aria-hidden="true" />
                  <div style={{ flex: 1 }}>
                    <div className="data-label">Extracted Location</div>
                    <div className="data-value">{result.location}</div>
                    
                    {result.mapsSearchQuery && (
                      <div style={{ marginTop: '1rem', width: '100%', height: '220px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                        <iframe
                          title={`Google Maps showing ${result.mapsSearchQuery}`}
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          loading="lazy"
                          allowFullScreen
                          referrerPolicy="no-referrer-when-downgrade"
                          src={`https://www.google.com/maps?q=${encodeURIComponent(result.mapsSearchQuery)}&output=embed`}
                        ></iframe>
                      </div>
                    )}
                  </div>
                </div>

                <div className="data-row">
                  <div className="data-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <Users size={16} aria-hidden="true" /> Required Resource Allocations
                  </div>
                  <ul className="list-items" aria-label="Required Resources">
                    {result.resourcesRequired.map((res, i) => (
                      <li key={i}>{res}</li>
                    ))}
                  </ul>
                </div>

                <div className="data-row" style={{ marginTop: '2rem' }}>
                  <div className="data-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <Activity size={16} aria-hidden="true" /> Critical Action Steps
                  </div>
                  <ul className="list-items" style={{ gap: '0.5rem' }} aria-label="Critical Action Steps">
                    {result.actionSteps.map((step, i) => (
                      <li key={i} style={{ borderLeftColor: 'var(--border-subtle)', background: 'transparent', padding: '0.25rem 0', display: 'flex', gap: '1rem' }}>
                        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{(i+1).toString().padStart(2, '0')}</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </>
  );
}

export default App;
