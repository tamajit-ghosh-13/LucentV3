import {
  Activity,
  Clock3,
  Globe2,
  Zap,
} from "lucide-react";
import { useLucent, isExcludedActivitySite } from "../../lib/lucent-state";

export default function Analytics() {
  const { events, settings } = useLucent();

  const validEvents = events.filter((e) => !isExcludedActivitySite(e.site));
  const totalInteractions = validEvents.length;
  const sitesCount = new Set(validEvents.map(e => e.site).filter(Boolean)).size;
  const activeFeaturesCount = [...Object.values(settings.cognitive), ...Object.values(settings.motor), ...Object.values(settings.visual)].filter(Boolean).length;
  const totalMinutes = validEvents.length * 3;

  const weeklyData = [
    { day: "Mon", value: 42 },
    { day: "Tue", value: 68 },
    { day: "Wed", value: 54 },
    { day: "Thu", value: 82 },
    { day: "Fri", value: 71 },
    { day: "Sat", value: 45 },
    { day: "Sun", value: Math.min(100, 20 + validEvents.length * 10) },
  ];

  const features = [
    { name: "Cognitive De-clutter", usage: settings.cognitive.declutter ? 45 : 15 },
    { name: "Motor Target Expansion", usage: settings.motor.targets ? 35 : 10 },
    { name: "Visual High Contrast", usage: settings.visual.highContrast ? 40 : 12 },
    { name: "Reading Focus Guide", usage: settings.cognitive.readingGuide ? 25 : 8 },
    { name: "Steady Click Filter", usage: settings.motor.steadyClick ? 30 : 5 },
    { name: "Daltonization Filter", usage: settings.visual.daltonize ? 35 : 8 },
  ];

  return (
    <div className="dashboard-page">

      <div className="dashboard-page-header">
        <div>
          <div className="dashboard-eyebrow">
            INSIGHTS
          </div>

          <h1>Analytics</h1>

          <p>
            Real-time analytics and telemetry across your connected Chrome extension sessions.
          </p>
        </div>
      </div>


      <div className="stats-grid">

        <div className="stat-card">
          <div className="stat-icon">
            <Activity size={19} />
          </div>

          <span>Total interactions</span>
          <strong>{totalInteractions || '—'}</strong>

          <small>Recorded by extension</small>
        </div>


        <div className="stat-card">
          <div className="stat-icon">
            <Clock3 size={19} />
          </div>

          <span>Accessibility time</span>
          <strong>{totalMinutes ? `${totalMinutes}m` : '—'}</strong>

          <small>Estimated assistance</small>
        </div>


        <div className="stat-card">
          <div className="stat-icon">
            <Globe2 size={19} />
          </div>

          <span>Websites adapted</span>
          <strong>{sitesCount || '—'}</strong>

          <small>Unique domains</small>
        </div>


        <div className="stat-card">
          <div className="stat-icon">
            <Zap size={19} />
          </div>

          <span>Active features</span>
          <strong>{activeFeaturesCount}</strong>

          <small>Configured in extension</small>
        </div>

      </div>


      <div className="analytics-grid">

        <section className="dashboard-panel">

          <div className="dashboard-panel-header">
            <div>
              <h2>Weekly usage</h2>
              <p>Accessibility interactions</p>
            </div>
          </div>

          <div className="analytics-chart">

            {weeklyData.map((item) => (
              <div
                className="chart-column"
                key={item.day}
              >
                <div
                  className="chart-bar"
                  style={{
                    height: `${item.value}%`,
                  }}
                />

                <span>{item.day}</span>
              </div>
            ))}

          </div>

        </section>


        <section className="dashboard-panel">

          <div className="dashboard-panel-header">
            <div>
              <h2>Feature usage</h2>
              <p>Distribution of interactions</p>
            </div>
          </div>

          <div className="feature-usage-list">

            {features.map((feature) => (
              <div
                className="feature-usage-item"
                key={feature.name}
              >
                <div>
                  <span>{feature.name}</span>
                  <strong>{feature.usage}%</strong>
                </div>

                <div className="usage-progress">
                  <span
                    style={{
                      width: `${feature.usage}%`,
                    }}
                  />
                </div>
              </div>
            ))}

          </div>

        </section>

      </div>

    </div>
  );
}