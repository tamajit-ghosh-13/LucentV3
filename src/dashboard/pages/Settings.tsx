import {
  User,
  Bell,
  Moon,
  Shield,
  Puzzle,
} from "lucide-react";
import { useState } from "react";

export default function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [autoEnable, setAutoEnable] = useState(true);

  return (
    <div className="dashboard-page">

      <div className="dashboard-page-header">
        <div>
          <div className="dashboard-eyebrow">
            PREFERENCES
          </div>

          <h1>Settings</h1>

          <p>
            Manage your Lucent account and extension
            preferences.
          </p>
        </div>
      </div>


      <div className="settings-container">

        <section className="settings-section">

          <div className="settings-section-title">
            <User size={19} />

            <div>
              <h2>Profile</h2>
              <p>Your account information</p>
            </div>
          </div>


          <div className="settings-fields">

            <div className="settings-field">
              <label>Name</label>

              <input
                type="text"
                defaultValue="Debadrita"
              />
            </div>


            <div className="settings-field">
              <label>Email</label>

              <input
                type="email"
                defaultValue="user@example.com"
                disabled
              />
            </div>

          </div>

        </section>


        <section className="settings-section">

          <div className="settings-section-title">
            <Puzzle size={19} />

            <div>
              <h2>Extension</h2>
              <p>Control extension behaviour</p>
            </div>
          </div>


          <SettingToggle
            icon={<Bell size={18} />}
            title="Notifications"
            description="Receive accessibility and activity notifications."
            enabled={notifications}
            onToggle={() =>
              setNotifications(!notifications)
            }
          />


          <SettingToggle
            icon={<Shield size={18} />}
            title="Automatic accessibility"
            description="Automatically enable accessibility features when needed."
            enabled={autoEnable}
            onToggle={() =>
              setAutoEnable(!autoEnable)
            }
          />

        </section>


        <section className="settings-section">

          <div className="settings-section-title">
            <Moon size={19} />

            <div>
              <h2>Appearance</h2>
              <p>Customize the dashboard appearance</p>
            </div>
          </div>


          <div className="appearance-options">

            <button className="appearance-option appearance-option-active">
              Dark
            </button>

            <button className="appearance-option">
              Light
            </button>

          </div>

        </section>

      </div>

    </div>
  );
}


function SettingToggle({
  icon,
  title,
  description,
  enabled,
  onToggle,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="setting-toggle-row">

      <div className="setting-toggle-icon">
        {icon}
      </div>

      <div className="setting-toggle-text">
        <strong>{title}</strong>
        <span>{description}</span>
      </div>

      <button
        className={`feature-toggle ${
          enabled ? "feature-toggle-active" : ""
        }`}
        onClick={onToggle}
      >
        <span />
      </button>

    </div>
  );
}