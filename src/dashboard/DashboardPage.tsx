// This is the main UI entry point for the User Dashboard (React/Next.js style page.tsx).
// It will wire up to the Python backend to fetch the user's historical telemetry and usage.
// It will display the usage history (e.g., 'Simplified text on Wikipedia', 'Expanded hitbox on Gov portal').
// It will also render the profile settings to configure the 3 impairment pipelines.
import './styles/dashboard.css';
import React, { useState } from 'react';

export default function Settings() {
  const [analytics, setAnalytics] = useState(true);
  const [history, setHistory] = useState(true);
  const [aiTracking, setAiTracking] = useState(true);

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <div>
          <p className="dashboard-eyebrow">
            CONFIGURATION
          </p>

          <h1>Settings</h1>

          <p>
            Manage your profile, preferences and privacy.
          </p>
        </div>
      </div>

      <section className="settings-section">
        <div className="settings-section-heading">
          <h2>Profile</h2>
          <p>Your account information.</p>
        </div>

        <div className="settings-card">
          <div className="settings-avatar">
            D
          </div>

          <div className="settings-fields">
            <label>
              Name
              <input
                type="text"
                defaultValue="User"
              />
            </label>

            <label>
              Email
              <input
                type="email"
                defaultValue="user@example.com"
              />
            </label>
          </div>
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section-heading">
          <h2>Privacy</h2>
          <p>
            Control what usage information Lucent stores.
          </p>
        </div>

        <div className="settings-card settings-options">
          <SettingToggle
            title="Usage Analytics"
            description="Allow Lucent to collect anonymous usage statistics."
            enabled={analytics}
            onToggle={() => setAnalytics(!analytics)}
          />

          <SettingToggle
            title="Page History"
            description="Store recently visited pages for your activity dashboard."
            enabled={history}
            onToggle={() => setHistory(!history)}
          />

          <SettingToggle
            title="AI Usage Tracking"
            description="Track AI-powered accessibility interactions."
            enabled={aiTracking}
            onToggle={() => setAiTracking(!aiTracking)}
          />
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section-heading">
          <h2>Data</h2>
          <p>Manage your Lucent data.</p>
        </div>

        <div className="settings-card settings-actions">
          <button className="settings-button">
            Export My Data
          </button>

          <button className="settings-button danger">
            Clear Activity History
          </button>
        </div>
      </section>
    </div>
  );
}

interface SettingToggleProps {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}

function SettingToggle({
  title,
  description,
  enabled,
  onToggle,
}: SettingToggleProps) {
  return (
    <div className="setting-toggle-row">
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      <button
        className={`feature-toggle ${
          enabled ? 'feature-toggle-enabled' : ''
        }`}
        onClick={onToggle}
      >
        <span className="feature-toggle-circle" />
      </button>
    </div>
  );
}