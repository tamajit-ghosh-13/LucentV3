import {
  Activity,
  Clock3,
  Globe2,
  Zap,
} from "lucide-react";

const weeklyData = [
  { day: "Mon", value: 42 },
  { day: "Tue", value: 68 },
  { day: "Wed", value: 54 },
  { day: "Thu", value: 82 },
  { day: "Fri", value: 71 },
  { day: "Sat", value: 45 },
  { day: "Sun", value: 63 },
];

const features = [
  { name: "Visual Assistance", usage: 42 },
  { name: "Text Enhancement", usage: 31 },
  { name: "Enhanced Cursor", usage: 18 },
  { name: "Contrast Mode", usage: 9 },
];

export default function Analytics() {
  return (
    <div className="dashboard-page">

      <div className="dashboard-page-header">
        <div>
          <div className="dashboard-eyebrow">
            INSIGHTS
          </div>

          <h1>Analytics</h1>

          <p>
            Understand how Lucent is being used across
            your browsing activity.
          </p>
        </div>
      </div>


      <div className="stats-grid">

        <div className="stat-card">
          <div className="stat-icon">
            <Activity size={19} />
          </div>

          <span>Total interactions</span>
          <strong>1,284</strong>

          <small>+18.4% this week</small>
        </div>


        <div className="stat-card">
          <div className="stat-icon">
            <Clock3 size={19} />
          </div>

          <span>Accessibility time</span>
          <strong>14h 32m</strong>

          <small>+12.7% this week</small>
        </div>


        <div className="stat-card">
          <div className="stat-icon">
            <Globe2 size={19} />
          </div>

          <span>Websites visited</span>
          <strong>47</strong>

          <small>8 new this week</small>
        </div>


        <div className="stat-card">
          <div className="stat-icon">
            <Zap size={19} />
          </div>

          <span>Features used</span>
          <strong>6</strong>

          <small>Across all sessions</small>
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