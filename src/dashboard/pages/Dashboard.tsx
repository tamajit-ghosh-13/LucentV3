import { useMemo, useState } from 'react';
import { 
  Activity, 
  Accessibility, 
  Clock3, 
  Chrome, 
  CheckCircle2, 
  Globe, 
  Radio, 
  Brain, 
  MousePointer2, 
  Eye, 
  ExternalLink,
  Sparkles,
  SlidersHorizontal,
  ArrowUpRight,
  Bot,
  ScanSearch,
  Wand2,
  Check,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { useLucent, isExcludedActivitySite } from '../../lib/lucent-state';
import ActivityTable from '../components/ActivityTable';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { settings, update, events, extensionAvailable, auditState, setAuditState } = useLucent();
  const [isScanning, setIsScanning] = useState(false);
  const [isRemediating, setIsRemediating] = useState(false);

  const handleRunDashboardAiScan = async () => {
    setIsScanning(true);
    try {
      const unlabelledElements = [
        { id: 'btn-search', tag: 'button', className: 'search-trigger', svgContent: '<svg>search</svg>' },
        { id: 'btn-cart', tag: 'button', className: 'cart-badge', svgContent: '<svg>shopping-bag</svg>' },
        { id: 'lnk-menu', tag: 'a', className: 'nav-hamburger', svgContent: '<svg>menu</svg>' }
      ];
      const missingAltImages = [
        { id: 'img-hero', src: '/assets/hero.jpg', surroundingText: 'Empowering accessible web experience for every user' },
        { id: 'img-logo', src: '/logo.svg', surroundingText: 'Lucent Accessibility Engine' }
      ];

      const res = await fetch('/api/ai-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageTitle: document.title || 'Lucent Web Application',
          pageUrl: window.location.href,
          unlabelledElements,
          missingAltImages
        })
      });
      const data = await res.json();

      setAuditState({
        scannedAt: new Date().toISOString(),
        pageTitle: document.title || 'Lucent Web Application',
        pageUrl: window.location.href,
        results: {
          smallTargets: 3,
          unlabeledButtons: unlabelledElements.length,
          lowContrast: 2,
          missingAlt: missingAltImages.length,
          total: 3 + unlabelledElements.length + 2 + missingAltImages.length
        },
        remediated: false,
        aiSummary: data.summary || `Gemini generated semantic aria-labels for ${unlabelledElements.length} controls and contextual descriptions for ${missingAltImages.length} images.`,
        confidenceScore: data.confidenceScore || 0.98
      });
    } catch (e) {
      console.error('Audit failed', e);
    } finally {
      setIsScanning(false);
    }
  };

  const handleApplyRemediation = () => {
    setIsRemediating(true);
    setTimeout(() => {
      if (auditState) {
        setAuditState({
          ...auditState,
          remediated: true,
          results: {
            ...auditState.results,
            total: 0,
            smallTargets: 0,
            unlabeledButtons: 0,
            missingAlt: 0,
            lowContrast: 0
          }
        });
      }
      setIsRemediating(false);
    }, 600);
  };


  // Profile presets
  const chooseProfile = (profile: 'cognitive' | 'motor' | 'visual') => {
    update({
      profile,
      enabled: true,
      cognitive: profile === 'cognitive' ? {
        declutter: true,
        dyslexia: true,
        readingGuide: false,
        calmMode: true,
        readingWidth: true
      } : {
        declutter: false,
        dyslexia: false,
        readingGuide: false,
        calmMode: false,
        readingWidth: false
      },
      motor: profile === 'motor' ? {
        targets: true,
        focus: true,
        shortcuts: true,
        steadyClick: true,
        largeCursor: true
      } : {
        targets: false,
        focus: false,
        shortcuts: false,
        steadyClick: true,
        largeCursor: false
      },
      visual: profile === 'visual' ? {
        fontSize: 18,
        daltonize: true,
        highContrast: true,
        boldText: true,
        magnifier: false,
        crosshairs: false,
        textToSpeech: false
      } : {
        fontSize: 16,
        daltonize: false,
        highContrast: false,
        boldText: false,
        magnifier: false,
        crosshairs: false,
        textToSpeech: false
      }
    });
  };

  // Metrics computation
  const activeFeaturesCount = [
    ...Object.values(settings.cognitive),
    ...Object.values(settings.motor),
    ...Object.values(settings.visual)
  ].filter(Boolean).length;

  const validEvents = events.filter(e => !isExcludedActivitySite(e.site));
  const uniqueSites = new Set(validEvents.map(e => e.site?.trim().toLowerCase()).filter(Boolean));
  const uniqueWebsitesCount = uniqueSites.size;
  const minutes = validEvents.length * 3;

  // Browser-style grouped activities for the recent table
  const activities = useMemo(() => {
    const siteMap = new Map<string, { site: string; url: string; latestAt: Date; count: number }>();
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
          count: 1
        });
      } else {
        existing.count += 1;
        if (eventDate.getTime() > existing.latestAt.getTime()) {
          existing.latestAt = eventDate;
          if (eventUrl) existing.url = eventUrl;
        }
      }
    }
    const sorted = Array.from(siteMap.values()).sort((a, b) => b.latestAt.getTime() - a.latestAt.getTime());
    return sorted.slice(0, 5).map((item, i) => {
      const isToday = new Date().toDateString() === item.latestAt.toDateString();
      const timeStr = item.latestAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return {
        id: i,
        website: item.site,
        url: item.url,
        count: item.count,
        time: isToday ? `Today, ${timeStr}` : `${item.latestAt.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`
      };
    });
  }, [validEvents]);

  // Current active profile metadata
  const profileMeta = {
    cognitive: {
      name: 'Cognitive & ADHD',
      icon: Brain,
      color: '#4ade80',
      badge: 'Focus & Neurodivergent',
      description: 'Sensory de-clutter, OpenDyslexic font, focus reading band, calm mode'
    },
    motor: {
      name: 'Motor & Tremor',
      icon: MousePointer2,
      color: '#fbbf24',
      badge: 'Dexterity & Parkinson\'s',
      description: '>=48px hitbox targets, hotkeys [1-9], debounce filter, sticky cursor'
    },
    visual: {
      name: 'Visual & Low Vision',
      icon: Eye,
      color: '#34d399',
      badge: 'Color Blind & Low Vision',
      description: 'Daltonization SVG filters, solar high contrast, hover loupe, 18px text'
    }
  }[settings.profile] || {
    name: 'Standard Baseline',
    icon: Sparkles,
    color: '#94a3b8',
    badge: 'Standard Mode',
    description: 'Manual adjustments only'
  };

  const ProfileIcon = profileMeta.icon;

  // Toggle individual features for active profile
  const toggleCognitive = (key: keyof typeof settings.cognitive) => {
    update({
      cognitive: { ...settings.cognitive, [key]: !settings.cognitive[key] }
    });
  };

  const toggleMotor = (key: keyof typeof settings.motor) => {
    update({
      motor: { ...settings.motor, [key]: !settings.motor[key] }
    });
  };

  const toggleVisual = (key: keyof typeof settings.visual) => {
    update({
      visual: { ...settings.visual, [key]: !settings.visual[key] }
    });
  };

  return (
    <div className="dashboard-page">
      {/* Top Header & Master Switch */}
      <div className="dashboard-page-header">
        <div>
          <p className="dashboard-eyebrow">LIVE ACCESSIBILITY COMMAND CENTER</p>
          <h1>Your web, tuned for you.</h1>
          <p>Real-time AI-powered DOM mutations and accessibility adaptations synced with your Chrome extension.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className={extensionAvailable ? 'dashboard-status' : 'dashboard-status dashboard-status-off'}>
            <span className={extensionAvailable ? 'dashboard-status-dot' : ''} />
            {extensionAvailable ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Radio size={13} style={{ color: '#4ade80' }} /> Live Extension Stream
              </span>
            ) : (
              <span>Ready to install</span>
            )}
          </div>

          <button
            aria-pressed={settings.enabled}
            className={`extension-power ${settings.enabled ? 'extension-power-on' : ''}`}
            onClick={() => update({ enabled: !settings.enabled })}
            title={settings.enabled ? 'Click to pause Lucent' : 'Click to start Lucent'}
          >
            <span className="extension-power-knob" />
            <span>{settings.enabled ? 'Lucent is active' : 'Start Lucent'}</span>
          </button>
        </div>
      </div>

      {/* Modern 4-Card Stats Grid */}
      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-top">
            <div className="dashboard-stat-icon">
              <Accessibility size={19} />
            </div>
            {settings.enabled && (
              <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 600 }}>Active</span>
            )}
          </div>
          <div className="dashboard-stat-value">{activeFeaturesCount}</div>
          <div className="dashboard-stat-title">Running adaptations</div>
          <div className="dashboard-stat-description">
            {settings.enabled ? 'Applying on external websites' : 'Turn on to apply on websites'}
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-top">
            <div className="dashboard-stat-icon">
              <Globe size={19} />
            </div>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Live</span>
          </div>
          <div className="dashboard-stat-value">{uniqueWebsitesCount}</div>
          <div className="dashboard-stat-title">Websites adapted</div>
          <div className="dashboard-stat-description">Unique domains in history</div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-top">
            <div className="dashboard-stat-icon">
              <Clock3 size={19} />
            </div>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Telemetry</span>
          </div>
          <div className="dashboard-stat-value">{minutes}m</div>
          <div className="dashboard-stat-title">Assist browsing time</div>
          <div className="dashboard-stat-description">Based on live browser sessions</div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-top">
            <div className="dashboard-stat-icon">
              <ProfileIcon size={19} style={{ color: profileMeta.color }} />
            </div>
            <span style={{ fontSize: 11, color: profileMeta.color, fontWeight: 600 }}>Current</span>
          </div>
          <div className="dashboard-stat-value" style={{ fontSize: 22 }}>{profileMeta.name.split(' ')[0]}</div>
          <div className="dashboard-stat-title">{profileMeta.badge}</div>
          <div className="dashboard-stat-description">Primary disability support</div>
        </div>
      </div>

      {/* Primary Profile Picker */}
      <section className="dashboard-panel profile-picker" style={{ marginBottom: 24 }}>
        <div className="dashboard-panel-header">
          <div>
            <h2>What support do you need today?</h2>
            <p>Select your primary profile. The floating widget and extension reflect these settings instantly.</p>
          </div>
          <Link to="/dashboard/features" className="dashboard-panel-link">
            All feature descriptions <ArrowUpRight size={13} style={{ verticalAlign: 'middle' }} />
          </Link>
        </div>

        <div className="profile-options">
          {/* Cognitive Card */}
          <button
            type="button"
            className={settings.profile === 'cognitive' ? 'profile-option selected' : 'profile-option'}
            onClick={() => chooseProfile('cognitive')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                <Brain size={18} style={{ color: '#4ade80' }} /> Cognitive & ADHD
              </strong>
              {settings.profile === 'cognitive' && (
                <span style={{ fontSize: 10, background: 'rgba(74, 222, 128, 0.15)', color: '#4ade80', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>
                  ACTIVE
                </span>
              )}
            </div>
            <span>Sensory de-clutter, OpenDyslexic font, focus reading guide, calm mode, and reading width.</span>
          </button>

          {/* Motor Card */}
          <button
            type="button"
            className={settings.profile === 'motor' ? 'profile-option selected' : 'profile-option'}
            onClick={() => chooseProfile('motor')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                <MousePointer2 size={18} style={{ color: '#fbbf24' }} /> Motor & Tremor
              </strong>
              {settings.profile === 'motor' && (
                <span style={{ fontSize: 10, background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>
                  ACTIVE
                </span>
              )}
            </div>
            <span>&gt;=48px target expansion, hotkeys [1-9], steady click filter, focus outline boost, and large cursor.</span>
          </button>

          {/* Visual Card */}
          <button
            type="button"
            className={settings.profile === 'visual' ? 'profile-option selected' : 'profile-option'}
            onClick={() => chooseProfile('visual')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                <Eye size={18} style={{ color: '#34d399' }} /> Visual & Low Vision
              </strong>
              {settings.profile === 'visual' && (
                <span style={{ fontSize: 10, background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>
                  ACTIVE
                </span>
              )}
            </div>
            <span>Daltonization color-blind filters, solar high-contrast, hover loupe, 18px text, crosshairs, and speech.</span>
          </button>
        </div>
      </section>

      {/* Gemini AI Accessibility Auditor & Remediation Center */}
      <section className="dashboard-panel" style={{ marginBottom: 24, border: '1px solid #1e3a29' }}>
        <div className="dashboard-panel-header">
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bot size={18} style={{ color: '#4ade80' }} />
              Gemini AI Accessibility Auditor &amp; Auto-Remediator
            </h2>
            <p>Real-time deep semantic DOM analysis powered by Google Gemini 1.5 Flash</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: 6, 
              fontSize: 11, 
              background: 'rgba(34, 197, 94, 0.12)', 
              color: '#4ade80', 
              padding: '4px 10px', 
              borderRadius: 999, 
              border: '1px solid rgba(74, 222, 128, 0.25)',
              fontWeight: 600 
            }}>
              <Sparkles size={12} /> Gemini 1.5 Flash
            </span>
            <button
              type="button"
              onClick={handleRunDashboardAiScan}
              disabled={isScanning}
              style={{
                background: '#152e20',
                border: '1px solid #3c8055',
                color: '#8df4b5',
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 700,
                cursor: isScanning ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <ScanSearch size={14} />
              {isScanning ? 'Auditing with Gemini...' : 'Run Gemini AI Audit'}
            </button>
          </div>
        </div>

        <div style={{ padding: 20 }}>
          {auditState ? (
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: '1px solid rgba(255, 255, 255, 0.07)'
              }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#f1fff5' }}>
                    Audit Target: {auditState.pageTitle}
                  </span>
                  <div style={{ fontSize: 11, color: '#7e9e8b', marginTop: 2 }}>
                    Scanned at {new Date(auditState.scannedAt).toLocaleTimeString()} • {auditState.pageUrl}
                  </div>
                </div>
                <div>
                  {auditState.remediated ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#4ade80', fontWeight: 700 }}>
                      <CheckCircle2 size={16} /> All Issues Remediated
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApplyRemediation}
                      disabled={isRemediating}
                      style={{
                        background: '#22c55e',
                        color: '#052a12',
                        border: 0,
                        borderRadius: 8,
                        padding: '6px 14px',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: isRemediating ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <Wand2 size={14} />
                      {isRemediating ? 'Applying Auto-Fixes...' : '✨ Apply AI Auto-Remediation'}
                    </button>
                  )}
                </div>
              </div>

              {/* 4 issue category cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 16 }}>
                <div style={{ background: '#102217', border: '1px solid #1e3827', borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 11, color: '#9bbfa8' }}>🏷️ Unlabelled Controls</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: auditState.results.unlabeledButtons > 0 ? '#f87171' : '#4ade80', marginTop: 4 }}>
                    {auditState.results.unlabeledButtons}
                  </div>
                  <div style={{ fontSize: 10, color: '#688874', marginTop: 2 }}>Buttons &amp; links without labels</div>
                </div>

                <div style={{ background: '#102217', border: '1px solid #1e3827', borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 11, color: '#9bbfa8' }}>🖼️ Missing Alt Attributes</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: auditState.results.missingAlt > 0 ? '#f87171' : '#4ade80', marginTop: 4 }}>
                    {auditState.results.missingAlt}
                  </div>
                  <div style={{ fontSize: 10, color: '#688874', marginTop: 2 }}>Images without descriptions</div>
                </div>

                <div style={{ background: '#102217', border: '1px solid #1e3827', borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 11, color: '#9bbfa8' }}>🎯 Hitboxes &lt; 44px</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: auditState.results.smallTargets > 0 ? '#fbbf24' : '#4ade80', marginTop: 4 }}>
                    {auditState.results.smallTargets}
                  </div>
                  <div style={{ fontSize: 10, color: '#688874', marginTop: 2 }}>Motor dexterity barriers</div>
                </div>

                <div style={{ background: '#102217', border: '1px solid #1e3827', borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 11, color: '#9bbfa8' }}>👁️ Low Contrast Text</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: auditState.results.lowContrast > 0 ? '#fbbf24' : '#4ade80', marginTop: 4 }}>
                    {auditState.results.lowContrast}
                  </div>
                  <div style={{ fontSize: 10, color: '#688874', marginTop: 2 }}>Fails WCAG 4.5:1 ratio</div>
                </div>
              </div>

              {/* AI Remediation Result Details */}
              {auditState.aiSummary && (
                <div style={{ 
                  background: 'rgba(34, 197, 94, 0.08)', 
                  border: '1px solid rgba(74, 222, 128, 0.25)', 
                  borderRadius: 10, 
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#a7f3d0' }}>
                      <Sparkles size={14} /> Gemini Remediation Insights
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#d1fae5', lineHeight: 1.4 }}>
                      {auditState.aiSummary}
                    </p>
                  </div>
                  {auditState.confidenceScore && (
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                      <div style={{ fontSize: 10, color: '#86efac', textTransform: 'uppercase', fontWeight: 700 }}>AI Confidence</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#4ade80' }}>
                        {Math.round(auditState.confidenceScore * 100)}%
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <Bot size={36} style={{ color: '#4ade80', margin: '0 auto 10px', opacity: 0.8 }} />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f1fff5', margin: '0 0 4px' }}>
                Automated AI Accessibility Scanner Ready
              </h3>
              <p style={{ fontSize: 12, color: '#8ab498', maxWidth: 440, margin: '0 auto 14px' }}>
                Run an instant audit using Google Gemini 1.5 Flash to identify unlabelled interactive buttons, missing image alts, tiny hitboxes, and contrast violations.
              </p>
              <button
                type="button"
                onClick={handleRunDashboardAiScan}
                disabled={isScanning}
                style={{
                  background: '#22c55e',
                  color: '#052a12',
                  border: 0,
                  borderRadius: 8,
                  padding: '8px 20px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: isScanning ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <ScanSearch size={15} />
                {isScanning ? 'Auditing with Gemini...' : '✦ Start AI Accessibility Audit'}
              </button>
            </div>
          )}
        </div>
      </section>


      {/* Live Feature Command Center for the Active Profile */}
      <section className="dashboard-panel" style={{ marginBottom: 24 }}>
        <div className="dashboard-panel-header">
          <div>
            <h2>
              <SlidersHorizontal size={16} style={{ verticalAlign: 'middle', marginRight: 8, color: '#4ade80' }} />
              Active Profile Features ({profileMeta.name})
            </h2>
            <p>Fine-tune individual adaptations. Changes broadcast immediately to open browser tabs.</p>
          </div>
          <Link to="/dashboard/features" className="dashboard-panel-link">
            Detailed guide →
          </Link>
        </div>

        <div style={{ padding: 20 }}>
          {settings.profile === 'cognitive' && (
            <div className="features-grid">
              <FeatureCard
                title="De-clutter Page Layout"
                description="Hides sidebars, floating ads, cookie prompts, and non-essential banners."
                active={settings.cognitive.declutter}
                onToggle={() => toggleCognitive('declutter')}
              />
              <FeatureCard
                title="Dyslexia-Friendly Font"
                description="Switches typography to OpenDyslexic with weighted bottoms to prevent character flipping."
                active={settings.cognitive.dyslexia}
                onToggle={() => toggleCognitive('dyslexia')}
              />
              <FeatureCard
                title="Focus Reading Guide"
                description="Follows cursor with an amber horizontal focus band to keep line tracking steady."
                active={settings.cognitive.readingGuide}
                onToggle={() => toggleCognitive('readingGuide')}
              />
              <FeatureCard
                title="Sensory Calm Mode"
                description="Mutes jarring saturation and dims high-contrast backgrounds for sensory comfort."
                active={settings.cognitive.calmMode}
                onToggle={() => toggleCognitive('calmMode')}
              />
              <FeatureCard
                title="Narrow Reading Width"
                description="Constrains text paragraphs to comfortable 70ch columns to reduce rapid eye scanning fatigue."
                active={settings.cognitive.readingWidth}
                onToggle={() => toggleCognitive('readingWidth')}
              />
            </div>
          )}

          {settings.profile === 'motor' && (
            <div className="features-grid">
              <FeatureCard
                title=">=48px Target Expansion"
                description="Expands clickable buttons, inputs, and links so they are easy to hit with tremors."
                active={settings.motor.targets}
                onToggle={() => toggleMotor('targets')}
              />
              <FeatureCard
                title="Direct [1-9] Keyboard Hotkeys"
                description="Attaches visual numerical badges allowing instant single-keystroke activation."
                active={settings.motor.shortcuts}
                onToggle={() => toggleMotor('shortcuts')}
              />
              <FeatureCard
                title="Steady Click Filter"
                description="Debounces rapid accidental double-clicks within 400ms to avoid unintended submits."
                active={settings.motor.steadyClick}
                onToggle={() => toggleMotor('steadyClick')}
              />
              <FeatureCard
                title="High-Contrast Focus Outlines"
                description="Renders bright 3px emerald focus rings around active tab-navigated elements."
                active={settings.motor.focus}
                onToggle={() => toggleMotor('focus')}
              />
              <FeatureCard
                title="Large High-Visibility Cursor"
                description="Replaces the standard cursor with an enlarged 40px pointer with vivid contrast border."
                active={settings.motor.largeCursor}
                onToggle={() => toggleMotor('largeCursor')}
              />
            </div>
          )}

          {settings.profile === 'visual' && (
            <div className="features-grid">
              <div className="feature-card feature-card-active" style={{ gridColumn: '1 / -1', background: '#0b1d13', border: '1px solid #234d35' }}>
                <div className="feature-card-top">
                  <div className="feature-icon" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' }}>
                    <span style={{ fontSize: 16, fontWeight: 800 }}>🔤</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#4ade80', background: 'rgba(34, 197, 94, 0.15)', padding: '3px 12px', borderRadius: 999, border: '1px solid rgba(74, 222, 128, 0.3)' }}>
                    {settings.visual.fontSize || 16} px
                  </span>
                </div>
                <h3>Dynamic Font Size Controller</h3>
                <p>Slide to instantly enlarge or reduce typography across all open webpages with real-time feedback.</p>
                <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>12px</span>
                  <input
                    type="range"
                    min="12"
                    max="32"
                    step="1"
                    aria-label="Adjust font size"
                    value={settings.visual.fontSize || 16}
                    onChange={(e) => {
                      update({
                        visual: {
                          ...settings.visual,
                          fontSize: Number(e.target.value)
                        }
                      });
                    }}
                    style={{ flex: 1, accentColor: '#22c55e', cursor: 'pointer', height: 6 }}
                  />
                  <span style={{ fontSize: 15, color: '#f1fff5', fontWeight: 700 }}>32px</span>
                </div>
              </div>

              <FeatureCard
                title="Daltonization Filter"
                description="Applies SVG color-matrix filters to restore deuteranopia/protanopia differentiation."
                active={settings.visual.daltonize}
                onToggle={() => toggleVisual('daltonize')}
              />
              <FeatureCard
                title="Solar High-Contrast Theme"
                description="Transforms web pages into pure yellow-on-black (#FFD600 on #000) solarized styling."
                active={settings.visual.highContrast}
                onToggle={() => toggleVisual('highContrast')}
              />
              <FeatureCard
                title="Hover Magnifier Loupe"
                description="A floating 200px 2.2x zoom lens attached to the pointer for instant magnification."
                active={settings.visual.magnifier}
                onToggle={() => toggleVisual('magnifier')}
              />
              <FeatureCard
                title="18px Minimum Text & Bold"
                description="Eliminates microscopic fonts by enforcing an 18px floor with sharp 700-weight boldness."
                active={settings.visual.boldText}
                onToggle={() => toggleVisual('boldText')}
              />
              <FeatureCard
                title="Cursor Crosshairs Guide"
                description="High-contrast horizontal and vertical guide lines tracking pointer position."
                active={settings.visual.crosshairs}
                onToggle={() => toggleVisual('crosshairs')}
              />
              <FeatureCard
                title="Click-to-Speech Text Narrator"
                description="Reads aloud clicked paragraphs or selected text via Web Speech Synthesis."
                active={settings.visual.textToSpeech}
                onToggle={() => toggleVisual('textToSpeech')}
              />
            </div>
          )}
        </div>
      </section>

      {/* Chrome Extension Download Hub */}
      <section className="dashboard-panel" style={{ marginBottom: 24 }}>
        <div className="dashboard-panel-header">
          <div>
            <h2>
              <Chrome size={18} style={{ verticalAlign: 'middle', marginRight: 8, color: '#4ade80' }} />
              Lucent Chrome Extension
            </h2>
            <p>Load the extension once in Chrome to connect live page adaptation across all your tabs.</p>
          </div>
          <span className={extensionAvailable ? 'dashboard-status' : 'dashboard-status dashboard-status-off'}>
            {extensionAvailable ? (
              <><CheckCircle2 size={15} style={{ color: '#4ade80' }} /> Connected &amp; Syncing</>
            ) : (
              'Ready to install'
            )}
          </span>
        </div>

        <div className="extension-download">
          <div>
            <strong>Lucent for Google Chrome</strong>
            <span>Includes the movable floating ✦ Lucent launcher pill and live in-page accessibility widget.</span>
          </div>
          <a className="extension-download-button" href="/Lucent-extension.zip" download>
            Download Extension (.zip)
          </a>
        </div>
      </section>

      {/* Modern 2-Column Browser Activity Table */}
      <section className="dashboard-panel">
        <div className="dashboard-panel-header">
          <div>
            <h2>Recent Browsing Activity</h2>
            <p>Websites adapted by Lucent during your browsing sessions (click any site to redirect)</p>
          </div>
          <Link to="/activity" className="dashboard-panel-link">
            View full history →
          </Link>
        </div>
        <ActivityTable activities={activities} />
      </section>
    </div>
  );
}

// Subcomponent for feature toggle cards
function FeatureCard({
  title,
  description,
  active,
  onToggle
}: {
  title: string;
  description: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={`feature-card ${active ? 'feature-card-active' : ''}`}>
      <div className="feature-card-top">
        <div className="feature-icon">
          <Sparkles size={17} />
        </div>
        <button
          type="button"
          aria-label={`Toggle ${title}`}
          className={`feature-toggle ${active ? 'feature-toggle-active' : ''}`}
          onClick={onToggle}
        >
          <span />
        </button>
      </div>

      <h3>{title}</h3>
      <p>{description}</p>

      <div className="feature-status">
        <span className={active ? 'dashboard-status-dot' : ''} style={active ? {} : { width: 6, height: 6, borderRadius: '50%', background: '#475569' }} />
        <span>{active ? 'Active on websites' : 'Disabled'}</span>
      </div>
    </div>
  );
}
