import React from 'react';
import {
  Activity,
  Sparkles,
  Accessibility,
  Clock3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

import StatCard from '../components/StatCard';
import ActivityTable, {
  ActivityItem,
} from '../components/ActivityTable';

const usageData = [
  { day: 'Mon', usage: 18 },
  { day: 'Tue', usage: 32 },
  { day: 'Wed', usage: 27 },
  { day: 'Thu', usage: 44 },
  { day: 'Fri', usage: 38 },
  { day: 'Sat', usage: 52 },
  { day: 'Sun', usage: 46 },
];

const recentActivities: ActivityItem[] = [
  {
    id: 1,
    website: 'youtube.com',
    page: 'Java Tutorial',
    feature: 'Text-to-Speech',
    duration: '12 min',
    time: '10:32 PM',
  },
  {
    id: 2,
    website: 'wikipedia.org',
    page: 'Accessibility',
    feature: 'Simplify Page',
    duration: '8 min',
    time: '09:41 PM',
  },
  {
    id: 3,
    website: 'gmail.com',
    page: 'Inbox',
    feature: 'Voice Navigation',
    duration: '4 min',
    time: '08:15 PM',
  },
  {
    id: 4,
    website: 'google.com',
    page: 'Search',
    feature: 'High Contrast',
    duration: '6 min',
    time: '07:20 PM',
  },
];

export default function Dashboard() {
  return (
    <div className="dashboard-page">
      {/* Page heading */}
      <div className="dashboard-page-header">
        <div>
          <p className="dashboard-eyebrow">
            ACCESSIBILITY OVERVIEW
          </p>

          <h1>Good evening</h1>

          <p>
            Here's an overview of how Lucent is helping
            you navigate the web.
          </p>
        </div>

        <div className="dashboard-status">
          <span className="dashboard-status-dot" />
          Extension Active
        </div>
      </div>

      {/* Statistics */}
      <div className="dashboard-stats-grid">
        <StatCard
          title="Extension Sessions"
          value="124"
          description="+12% from last week"
          icon={<Activity size={20} />}
        />

        <StatCard
          title="AI Interactions"
          value="38"
          description="Across 14 websites"
          icon={<Sparkles size={20} />}
        />

        <StatCard
          title="Active Features"
          value="5"
          description="Currently enabled"
          icon={<Accessibility size={20} />}
        />

        <StatCard
          title="Usage Time"
          value="12.4h"
          description="This week"
          icon={<Clock3 size={20} />}
        />
      </div>

      {/* Charts */}
      <div className="dashboard-chart-grid">
        <section className="dashboard-panel dashboard-chart-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>Usage Overview</h2>
              <p>Extension activity over the last 7 days</p>
            </div>

            <select className="dashboard-select">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
          </div>

          <div className="dashboard-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={usageData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1f2937"
                />

                <XAxis
                  dataKey="day"
                  stroke="#64748b"
                />

                <YAxis
                  stroke="#64748b"
                />

                <Tooltip
                  contentStyle={{
                    background: '#101713',
                    border: '1px solid #24352c',
                    borderRadius: '10px',
                    color: '#fff',
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="usage"
                  stroke="#6ee7a8"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="dashboard-panel dashboard-insight-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>Quick Insight</h2>
              <p>Your accessibility activity</p>
            </div>
          </div>

          <div className="dashboard-insight">
            <div className="dashboard-insight-number">
              73%
            </div>

            <h3>
              of your sessions used an AI-powered feature.
            </h3>

            <p>
              Text-to-Speech and Simplify Page are currently
              your most frequently used features.
            </p>
          </div>
        </section>
      </div>

      {/* Recent activity */}
      <section className="dashboard-panel">
        <div className="dashboard-panel-header">
          <div>
            <h2>Recent Activity</h2>
            <p>Your latest accessibility interactions</p>
          </div>

          <a href="/dashboard/activity">
            View all
          </a>
        </div>

        <ActivityTable activities={recentActivities} />
      </section>
    </div>
  );
}