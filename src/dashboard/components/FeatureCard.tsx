import React from 'react';
import { Check } from 'lucide-react';

interface FeatureCardProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  onToggle: () => void;
}

export default function FeatureCard({
  name,
  description,
  icon,
  enabled,
  onToggle,
}: FeatureCardProps) {
  return (
    <div className="feature-card">
      <div className="feature-card-icon">
        {icon}
      </div>

      <div className="feature-card-content">
        <h3>{name}</h3>
        <p>{description}</p>
      </div>

      <button
        className={`feature-toggle ${
          enabled ? 'feature-toggle-enabled' : ''
        }`}
        onClick={onToggle}
        aria-label={`Toggle ${name}`}
      >
        <span className="feature-toggle-circle">
          {enabled && <Check size={13} />}
        </span>
      </button>
    </div>
  );
}