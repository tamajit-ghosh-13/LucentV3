import React, { useState, useMemo } from 'react';
import { Search, Radio } from 'lucide-react';
import ActivityTable, { ActivityItem } from '../components/ActivityTable';
import { useLucent, isExcludedActivitySite } from '../../lib/lucent-state';

export default function Activity() {
  const { events, extensionAvailable } = useLucent();
  const [search, setSearch] = useState('');
  const [featureFilter, setFeatureFilter] = useState('All Features');

  const items: ActivityItem[] = useMemo(() => {
    const validEvents = events.filter((e) => !isExcludedActivitySite(e.site));
    if (!validEvents.length) {
      return [];
    }

    // Group events by website to mirror real browser history behavior
    const siteMap = new Map<string, {
      site: string;
      url: string;
      latestAt: Date;
      count: number;
      features: Set<string>;
      actions: string[];
    }>();

    for (const e of validEvents) {
      const siteKey = (e.site || 'Web Browser').trim().toLowerCase();
      const eventDate = new Date(e.at);
      const existing = siteMap.get(siteKey);
      const eventUrl = e.url || (e.site && e.site.includes('.') ? `https://${e.site}` : '');

      if (!existing) {
        siteMap.set(siteKey, {
          site: e.site || 'Web Browser',
          url: eventUrl,
          latestAt: eventDate,
          count: 1,
          features: new Set(e.feature ? [e.feature] : []),
          actions: e.action ? [e.action] : []
        });
      } else {
        existing.count += 1;
        if (e.feature) existing.features.add(e.feature);
        if (e.action) existing.actions.push(e.action);
        if (eventDate.getTime() > existing.latestAt.getTime()) {
          existing.latestAt = eventDate;
          if (eventUrl) existing.url = eventUrl;
        }
      }
    }

    // Sort by latest timestamp descending (most recently active website at the top)
    const sortedSites = Array.from(siteMap.values()).sort(
      (a, b) => b.latestAt.getTime() - a.latestAt.getTime()
    );

    return sortedSites.map((item, index) => {
      const isToday = new Date().toDateString() === item.latestAt.toDateString();
      const timeStr = item.latestAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const timeFormatted = isToday
        ? `Today, ${timeStr}`
        : `${item.latestAt.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;

      return {
        id: index + 1,
        website: item.site,
        url: item.url,
        time: timeFormatted,
        count: item.count,
        latestAt: item.latestAt.toISOString(),
        feature: Array.from(item.features).join(', '),
        action: item.actions.join(', ')
      };
    });
  }, [events]);

  const filteredActivities = items.filter((activity) => {
    const matchesSearch =
      activity.website.toLowerCase().includes(search.toLowerCase()) ||
      (activity.url?.toLowerCase() ?? '').includes(search.toLowerCase());

    const matchesFeature =
      featureFilter === 'All Features' ||
      (activity.feature?.toLowerCase() ?? '').includes(featureFilter.toLowerCase());

    return matchesSearch && matchesFeature;
  });

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <div>
          <p className="dashboard-eyebrow">
            {extensionAvailable ? 'LIVE TELEMETRY STREAM' : 'HISTORY'}
          </p>

          <h1>Activity</h1>

          <p>
            Real-time audit log of adaptations and interactions across your browsing sessions.
          </p>
        </div>

        {extensionAvailable && (
          <div className="dashboard-status" style={{ background: 'rgba(34, 197, 94, 0.15)', borderColor: 'rgba(34, 197, 94, 0.4)', color: '#4ade80' }}>
            <Radio size={14} style={{ marginRight: 6 }} />
            Live Extension Stream
          </div>
        )}
      </div>

      <section className="dashboard-panel">
        <div className="activity-toolbar">
          <div className="activity-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search live activity..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            className="dashboard-select"
            value={featureFilter}
            onChange={(e) => setFeatureFilter(e.target.value)}
          >
            <option>All Features</option>
            <option>Master Switch</option>
            <option>Cognitive & ADHD</option>
            <option>Motor & Tremor</option>
            <option>Visual & Low Vision</option>
            <option>Profile Switcher</option>
            <option>Scanner</option>
            <option>In-Page Widget</option>
          </select>
        </div>

        <ActivityTable activities={filteredActivities} />
      </section>
    </div>
  );
}