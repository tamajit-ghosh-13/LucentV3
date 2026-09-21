import {
  Eye,
  Volume2,
  MousePointer2,
  Type,
  Contrast,
  Keyboard,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

const features = [
  {
    id: "visual",
    name: "Visual Assistance",
    description:
      "Enhance visual elements and improve readability across websites.",
    icon: Eye,
  },
  {
    id: "voice",
    name: "Voice Assistance",
    description:
      "Use voice-based interaction to navigate and interact with websites.",
    icon: Volume2,
  },
  {
    id: "cursor",
    name: "Enhanced Cursor",
    description:
      "Improve cursor visibility and make interactive elements easier to target.",
    icon: MousePointer2,
  },
  {
    id: "text",
    name: "Text Enhancement",
    description:
      "Adjust text size, spacing and readability for easier reading.",
    icon: Type,
  },
  {
    id: "contrast",
    name: "Contrast Mode",
    description:
      "Improve contrast between foreground and background elements.",
    icon: Contrast,
  },
  {
    id: "keyboard",
    name: "Keyboard Navigation",
    description:
      "Make website navigation easier using keyboard controls.",
    icon: Keyboard,
  },
];

export default function Features() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    visual: true,
    voice: false,
    cursor: true,
    text: true,
    contrast: false,
    keyboard: false,
  });

  const toggleFeature = (id: string) => {
    setEnabled((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="dashboard-page">

      <div className="dashboard-page-header">
        <div>
          <div className="dashboard-eyebrow">
            ACCESSIBILITY
          </div>

          <h1>My Features</h1>

          <p>
            Customize the accessibility tools available
            through your Lucent extension.
          </p>
        </div>

        <div className="dashboard-status">
          <span className="dashboard-status-dot" />
          Extension connected
        </div>
      </div>


      <div className="features-grid">

        {features.map((feature) => {
          const Icon = feature.icon;
          const isEnabled = enabled[feature.id];

          return (
            <div
              key={feature.id}
              className={`feature-card ${
                isEnabled ? "feature-card-active" : ""
              }`}
            >

              <div className="feature-card-top">

                <div className="feature-icon">
                  <Icon size={20} />
                </div>

                <button
                  className={`feature-toggle ${
                    isEnabled
                      ? "feature-toggle-active"
                      : ""
                  }`}
                  onClick={() =>
                    toggleFeature(feature.id)
                  }
                >
                  <span />
                </button>

              </div>

              <h3>{feature.name}</h3>

              <p>{feature.description}</p>

              <div className="feature-status">
                {isEnabled ? (
                  <>
                    <Sparkles size={13} />
                    Enabled
                  </>
                ) : (
                  "Disabled"
                )}
              </div>

            </div>
          );
        })}

      </div>
    </div>
  );
}