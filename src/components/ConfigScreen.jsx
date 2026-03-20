import React from 'react';
import PropTypes from 'prop-types';
import { ShieldAlert, Settings } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

/**
 * ConfigScreen handles the initial application configuration.
 * It strictly requires a valid API key and optionally allows Google Authentication
 * to log deep Google Cloud Services integration.
 */
const ConfigScreen = ({ apiKey, setApiKey, handleSaveKey, error, onGoogleLoginSuccess }) => {
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
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
             <GoogleLogin
              onSuccess={credentialResponse => {
                if(onGoogleLoginSuccess) onGoogleLoginSuccess(credentialResponse);
              }}
              onError={() => {
                console.warn('Google Login Failed (Expected in demo mode without valid client ID)');
              }}
              useOneTap
              theme="filled_black"
              shape="pill"
            />
          </div>

          <div style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--border-subtle)' }}>
            <span style={{ padding: '0 10px', background: 'var(--bg-card)', position: 'relative', top: '-10px', fontSize: '0.85rem' }}>OR CONFIGURE ANONYMOUSLY</span>
            <hr style={{ borderColor: 'var(--border-subtle)', marginTop: '-20px', zIndex: -1 }} />
          </div>
          
          <form onSubmit={handleSaveKey} className="input-group" noValidate>
            <label htmlFor="apiKey">Google Gemini API Key</label>
            <input 
              id="apiKey"
              type="password" 
              placeholder="AIzaSy..." 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
              aria-required="true"
              autoComplete="off"
            />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: 1.4 }}>
              Required to process unstructured data. Key is stored securely in local storage and transmitted only to Google.
            </p>
            {error && <div className="error-msg" role="alert">{error}</div>}
            <button type="submit" style={{ marginTop: '1rem' }} aria-label="Save API Key and start system">
              <Settings size={18} aria-hidden="true" /> Configure System
            </button>
          </form>
        </section>
      </main>
    </>
  );
};

ConfigScreen.propTypes = {
  apiKey: PropTypes.string.isRequired,
  setApiKey: PropTypes.func.isRequired,
  handleSaveKey: PropTypes.func.isRequired,
  error: PropTypes.string,
  onGoogleLoginSuccess: PropTypes.func
};

export default ConfigScreen;
