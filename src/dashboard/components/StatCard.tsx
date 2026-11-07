import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}

export default function StatCard({
  title,
  value,
  description,
  icon,
}: StatCardProps) {
  return (
    <div className="dashboard-stat-card">
      <div className="dashboard-stat-top">
        <div className="dashboard-stat-icon">
          {icon}
        </div>
      </div>

      <div className="dashboard-stat-value">
        {value}
      </div>

      <div className="dashboard-stat-title">
        {title}
      </div>

      <div className="dashboard-stat-description">
        {description}
      </div>
    </div>
  );
}