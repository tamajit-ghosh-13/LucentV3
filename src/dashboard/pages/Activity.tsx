import React, { useState } from 'react';
import { Search } from 'lucide-react';
import ActivityTable, {
  ActivityItem,
} from '../components/ActivityTable';

const activities: ActivityItem[] = [
  {
    id: 1,
    website: 'Wikipedia',
    url: 'wikipedia.org',
    feature: 'Text Simplification',
    action: 'Simplified article content',
    time: 'Today, 9:42 PM',
    duration: '12 min',
  },
  {
    id: 2,
    website: 'Government Portal',
    url: 'gov.in',
    feature: 'Motor Assistance',
    action: 'Expanded clickable targets',
    time: 'Today, 8:31 PM',
    duration: '7 min',
  },
  {
    id: 3,
    website: 'YouTube',
    url: 'youtube.com',
    feature: 'Visual Assistance',
    action: 'Enabled high contrast',
    time: 'Yesterday, 10:15 PM',
    duration: '23 min',
  },
];

export default function Activity() {
  const [search, setSearch] = useState('');

 const filteredActivities = activities.filter(
  (activity) =>
    activity.website
      .toLowerCase()
      .includes(search.toLowerCase()) ||
    (activity.url?.toLowerCase() ?? '').includes(search.toLowerCase()) ||
    activity.feature
      .toLowerCase()
      .includes(search.toLowerCase())
);

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <div>
          <p className="dashboard-eyebrow">
            HISTORY
          </p>

          <h1>Activity</h1>

          <p>
            Review your recent accessibility activity.
          </p>
        </div>
      </div>

      <section className="dashboard-panel">
        <div className="activity-toolbar">
          <div className="activity-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search activity..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <select className="dashboard-select">
            <option>All Features</option>
            <option>Text-to-Speech</option>
            <option>Voice Navigation</option>
            <option>Simplify Page</option>
            <option>High Contrast</option>
          </select>

          <select className="dashboard-select">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>All time</option>
          </select>
        </div>

        <ActivityTable
          activities={filteredActivities}
        />
      </section>
    </div>
  );
}