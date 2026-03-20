import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { ShieldAlert, MapPin, Users, Activity } from 'lucide-react';

/** Memoized priority badge component */
const PriorityBadge = React.memo(({ priority }) => {
  const p = (priority || '').toLowerCase();
  let badgeClass = 'badge ';
  if (p.includes('critical')) badgeClass += 'critical';
  else if (p.includes('high')) badgeClass += 'high';
  else if (p.includes('medium')) badgeClass += 'medium';
  else badgeClass += 'low';
  return <span className={badgeClass} role="status" aria-label={`Priority level: ${priority}`}>{priority}</span>;
});
PriorityBadge.displayName = 'PriorityBadge';
PriorityBadge.propTypes = {
  priority: PropTypes.string.isRequired
};

/** Memoized resource list */
const ResourceList = React.memo(({ items, label }) => (
  <ul className="list-items" aria-label={label}>
    {items.map((item, i) => <li key={i}>{item}</li>)}
  </ul>
));
ResourceList.displayName = 'ResourceList';
ResourceList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.string).isRequired,
  label: PropTypes.string.isRequired
};

/** Memoized action steps list */
const ActionStepsList = React.memo(({ steps }) => (
  <ul className="list-items" style={{ gap: '0.5rem' }} aria-label="Critical Action Steps">
    {steps.map((step, i) => (
      <li key={i} style={{ borderLeftColor: 'var(--border-subtle)', background: 'transparent', padding: '0.25rem 0', display: 'flex', gap: '1rem' }}>
        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{(i+1).toString().padStart(2, '0')}</span>
        <span>{step}</span>
      </li>
    ))}
  </ul>
));
ActionStepsList.displayName = 'ActionStepsList';
ActionStepsList.propTypes = {
  steps: PropTypes.arrayOf(PropTypes.string).isRequired
};

/** 
 * Modular, purely-functional dashboard component. 
 * Code-split from main bundle to maximize rendering efficiency.
 */
const Dashboard = ({ result, isAnalyzing }) => {
  /** Memoize the Google Maps embed URL to prevent iframe re-renders */
  const mapsEmbedUrl = useMemo(() => {
    if (result?.mapsSearchQuery) {
      return `https://www.google.com/maps?q=${encodeURIComponent(result.mapsSearchQuery)}&output=embed`;
    }
    return null;
  }, [result?.mapsSearchQuery]);

  if (!result && !isAnalyzing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', textAlign: 'center' }}>
        <ShieldAlert size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} aria-hidden="true" />
        <p style={{ fontWeight: 500, color: 'var(--text-main)' }}>Awaiting Signal...</p>
        <p style={{ fontSize: '0.85rem' }}>The structured action plan will appear here.</p>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--accent-blue)', gap: '1rem' }} role="status">
        <div className="loader" style={{ width: '40px', height: '40px', borderWidth: '4px', borderColor: 'rgba(59, 130, 246, 0.2)', borderTopColor: 'var(--accent-blue)' }} aria-hidden="true"></div>
        <p style={{ fontWeight: 500 }}>Synthesizing Neural Response...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h2 style={{ marginTop: 0, marginBottom: '0.25rem', fontSize: '1.5rem' }}>Incident Dashboard</h2>
          <div className="data-value" style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{result.incidentType}</div>
        </div>
        <PriorityBadge priority={result.priority} />
      </div>

      <div className="data-row" style={{ flexDirection: 'row', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '2rem' }}>
        <MapPin size={20} color="var(--accent-blue)" style={{ marginTop: '0.25rem' }} aria-hidden="true" />
        <div style={{ flex: 1 }}>
          <div className="data-label">Extracted Location</div>
          <div className="data-value">{result.location}</div>
          
          {mapsEmbedUrl && (
            <div style={{ marginTop: '1rem', width: '100%', height: '220px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
              <iframe
                title={`Google Maps showing ${result.mapsSearchQuery}`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={mapsEmbedUrl}
              ></iframe>
            </div>
          )}
        </div>
      </div>

      <div className="data-row">
        <div className="data-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Users size={16} aria-hidden="true" /> Required Resource Allocations
        </div>
        <ResourceList items={result.resourcesRequired} label="Required Resources" />
      </div>

      <div className="data-row" style={{ marginTop: '2rem' }}>
        <div className="data-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Activity size={16} aria-hidden="true" /> Critical Action Steps
        </div>
        <ActionStepsList steps={result.actionSteps} />
      </div>
    </div>
  );
};

Dashboard.propTypes = {
  result: PropTypes.shape({
    incidentType: PropTypes.string.isRequired,
    priority: PropTypes.string.isRequired,
    location: PropTypes.string.isRequired,
    mapsSearchQuery: PropTypes.string,
    resourcesRequired: PropTypes.arrayOf(PropTypes.string).isRequired,
    actionSteps: PropTypes.arrayOf(PropTypes.string).isRequired
  }),
  isAnalyzing: PropTypes.bool.isRequired
};

export default Dashboard;
