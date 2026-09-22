import React from 'react';
import { 
  Brain, 
  MousePointer2, 
  Eye, 
  CheckCircle2, 
  SlidersHorizontal 
} from 'lucide-react';
import { useLucent } from '../../lib/lucent-state';

interface AccessibilityFeature {
  id: string;
  name: string;
  description: string;
  category: string;
  benefit: string;
  howItWorks: string;
}

interface DisorderGroup {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accentColor: string;
  features: AccessibilityFeature[];
}

const disorderGroups: DisorderGroup[] = [
  {
    id: 'cognitive',
    title: 'Cognitive & Neurodivergent Adaptations',
    subtitle: 'Engineered for ADHD, dyslexia, autism spectrum, and cognitive overload. Reduces sensory distraction and optimizes reading retention.',
    tag: 'ADHD & Dyslexia',
    icon: Brain,
    accentColor: '#4ade80',
    features: [
      {
        id: 'cog-1',
        name: 'De-clutter Page',
        description: 'Suppresses intrusive sidebars, promotional popups, flashing banners, and cookie prompts to keep you focused strictly on core content.',
        category: 'Focus Preservation',
        benefit: 'Eliminates 90%+ of non-content screen clutter',
        howItWorks: 'Hides distracting layout nodes via scoped selector suppression'
      },
      {
        id: 'cog-2',
        name: 'Reading Guide Band',
        description: 'Projects a smooth horizontal amber focus band that follows your mouse pointer line by line to prevent eye drift and line jumping.',
        category: 'Attention Tracking',
        benefit: 'Maintains reading position without losing your place',
        howItWorks: 'Fixed-position pointer-tracking focus bar with high contrast borders'
      },
      {
        id: 'cog-3',
        name: 'Dyslexia-Friendly Typography',
        description: 'Transforms text into OpenDyslexic weighted typography with widened letter kerning, increased line height, and distinct letterforms.',
        category: 'Reading Ease',
        benefit: 'Prevents letter flipping and character confusion',
        howItWorks: 'Injects weighted bottom-heavy glyphs and 1.75 line-height'
      },
      {
        id: 'cog-4',
        name: 'Calm Sensory Mode',
        description: 'Halts distracting CSS animations, pauses autoplaying video reels/carousels, and removes rapid transition flickers across the page.',
        category: 'Sensory Comfort',
        benefit: 'Prevents sensory overstimulation and visual fatigue',
        howItWorks: 'Forces zero animation duration and pauses active tickers'
      },
      {
        id: 'cog-5',
        name: 'Comfortable Reading Width',
        description: 'Constrains unbounded edge-to-edge text paragraphs to an ergonomic 70-character column with balanced automatic margins.',
        category: 'Ergonomic Layout',
        benefit: 'Minimizes horizontal neck and eye scanning strain',
        howItWorks: 'Enforces optimal 70ch paragraph width limits'
      }
    ]
  },
  {
    id: 'motor',
    title: 'Motor & Dexterity Impairments',
    subtitle: 'Tailored for individuals with physical tremors, Parkinson’s, arthritis, cerebral palsy, or fine-motor precision challenges.',
    tag: 'Tremors & Mobility',
    icon: MousePointer2,
    accentColor: '#38bdf8',
    features: [
      {
        id: 'mot-1',
        name: '48 px Interactive Touch Targets',
        description: 'Scales up small buttons, links, form inputs, and clickable elements to meet standard WCAG AAA 48×48px accessible touch boundaries.',
        category: 'Target Sizing',
        benefit: 'Drastically reduces accidental misclicks on small targets',
        howItWorks: 'Applies min-width/min-height constraints and touch padding'
      },
      {
        id: 'mot-2',
        name: 'High-Visibility Focus Halo',
        description: 'Highlights whichever link or input currently has keyboard focus with an unmistakable 4px vibrant emerald glow and outer depth shadow.',
        category: 'Keyboard Navigation',
        benefit: 'Instantly locate active keyboard position across dense forms',
        howItWorks: 'Applies prominent multi-layered outline on :focus-visible'
      },
      {
        id: 'mot-3',
        name: 'Single-Key Number Shortcuts (1–9)',
        description: 'Labels on-screen primary links, buttons, and navigation elements with numeric badges 1–9 for instant activation with a single keypress.',
        category: 'Hands-Free Access',
        benefit: 'Activate actions without requiring precise pointer positioning',
        howItWorks: 'Numbered overlays triggered by top-row numeral keystrokes'
      },
      {
        id: 'mot-4',
        name: 'Steady Click Debounce Filter',
        description: 'Filters out rapid accidental repeat taps and involuntary tremor misfires by enforcing an intelligent 550ms cooldown between successive clicks.',
        category: 'Tremor Protection',
        benefit: 'Prevents double-submissions and erratic unintended navigation',
        howItWorks: 'Captures pointer events and suppresses repeat events < 550ms'
      },
      {
        id: 'mot-5',
        name: 'High-Visibility Large Cursor',
        description: 'Renders an enlarged, high-contrast tracked pointer dot across any website, ensuring your mouse pointer is never lost against busy backgrounds.',
        category: 'Pointer Tracking',
        benefit: 'Effortless visual localization of the mouse cursor',
        howItWorks: 'Hardware-accelerated emerald tracking dot overlaid on pointer coordinates'
      }
    ]
  },
  {
    id: 'visual',
    title: 'Visual Impairments & Low Visual Acuity',
    subtitle: 'Engineered for color blindness (Protanopia, Deuteranopia, Tritanopia), low visual acuity, cataracts, glare sensitivity, and partial sight.',
    tag: 'Color Blindness & Low Vision',
    icon: Eye,
    accentColor: '#fbbf24',
    features: [
      {
        id: 'vis-1',
        name: 'Daltonization Color-Blind Filters',
        description: 'Applies calibrated spectral color-matrix transformations for Protanopia (red-blind), Deuteranopia (green-blind), and Tritanopia (blue-blind) so charts, buttons, and graphics become clearly distinguishable.',
        category: 'Color Vision Deficiency',
        benefit: 'Restores color distinction across charts, maps, and infographics',
        howItWorks: 'Hardware-accelerated SVG feColorMatrix wavelength re-mapping'
      },
      {
        id: 'vis-2',
        name: 'Smart Solar High-Contrast Themes',
        description: 'Switches page surfaces into specialized high-contrast palettes (Yellow-on-Black, High-Contrast Dark, Inverted Monochrome, and Anti-Glare Warm Sepia) to eliminate blinding white backgrounds.',
        category: 'Glare & Cataract Relief',
        benefit: 'Guarantees 7:1+ WCAG AAA contrast while eliminating eye strain and glare',
        howItWorks: 'CSS surface token remapping with inverted image luminance preservation'
      },
      {
        id: 'vis-3',
        name: 'Real-Time Font Size Controller Slider',
        description: 'Enables real-time scaling of webpage typography from 12px up to 32px using a responsive slider that updates the text instantaneously as you drag.',
        category: 'Text Sizing & Acuity',
        benefit: 'Empowers users with low visual acuity or presbyopia to find their ideal reading scale immediately',
        howItWorks: 'Instantaneous dynamic CSS typography injection reacting directly to slider pointer movement'
      },
      {
        id: 'vis-4',
        name: 'Interactive Hover Magnifier Loupe',
        description: 'Projects an adjustable 2× to 4× floating optical magnification lens over small text, dense financial tables, and tiny icon controls without breaking responsive page layouts.',
        category: 'Low Visual Acuity',
        benefit: 'Inspect fine print and small details without distorting page flow',
        howItWorks: 'Dynamic optical magnification lens centered on cursor coordinates'
      },
      {
        id: 'vis-5',
        name: 'Bold Typography & Minimum Font Scale Anchor',
        description: 'Enforces an accessible minimum font floor (18px) and thickens hairline/thin web fonts (weights 200–300) into solid semi-bold weights for effortless reading.',
        category: 'Font Legibility',
        benefit: 'Eliminates razor-thin, faint fonts that fade into background colors',
        howItWorks: 'Global CSS typography floor with font-weight threshold enforcement'
      },
      {
        id: 'vis-6',
        name: 'Cursor Crosshairs & Radar Pulse Guide',
        description: 'Projects full-viewport horizontal and vertical guide crosshairs centered on the cursor, coupled with an expanding sonar beacon when moving the mouse after being idle.',
        category: 'Pointer Localization',
        benefit: 'Prevents losing track of the mouse pointer across large or high-DPI displays',
        howItWorks: 'High-contrast orthogonal guide lines with idle-wake motion trigger'
      },
      {
        id: 'vis-7',
        name: 'Click-to-Speech Instant Narrator',
        description: 'Lets you double-click or highlight any paragraph, article section, or table cell to immediately hear it read aloud using natural browser speech synthesis.',
        category: 'Auditory Augmentation',
        benefit: 'Relieves severe eye strain and provides instant reading reinforcement',
        howItWorks: 'Native Web Speech API integration triggered by click or keyboard focus'
      },
      {
        id: 'vis-8',
        name: 'Color-to-Pattern Texture & Status Reinforcement',
        description: 'Injects distinct geometric hatching (stripes, dots, cross-hatch) onto solid-colored chart bars and pie slices, and appends explicit glyphs ([✓], [!], [✕]) to color-only status badges.',
        category: 'Visual Disambiguation',
        benefit: 'Ensures critical form errors and data graphs never rely exclusively on color',
        howItWorks: 'Injects SVG texture patterns and symbolic text markers onto colored nodes'
      }
    ]
  }
];

export default function Features() {
  const { extensionAvailable } = useLucent();

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <div>
          <div className="dashboard-eyebrow">ACCESSIBILITY CAPABILITIES</div>
          <h1>My Features</h1>
          <p>
            Catalog of Lucent’s adaptive assistive technologies, categorized by disorder and functional need.
          </p>
        </div>
        <div className="dashboard-status">
          <span className="dashboard-status-dot" />
          {extensionAvailable ? 'Extension connected' : 'Extension ready'}
        </div>
      </div>

      <div className="features-info-banner">
        <div className="features-info-icon">
          <SlidersHorizontal size={20} />
        </div>
        <div className="features-info-content">
          <h4>Tab-Level Control Architecture</h4>
          <p>
            All Lucent adaptations are controlled directly on the active webpage tab using the 
            <strong> Lucent extension toolbar popup</strong> or the in-page 
            <strong> ✦ Lucent widget</strong>. Below is the complete catalog of tools segregated by target disorder.
          </p>
        </div>
      </div>

      <div className="disorder-groups-container">
        {disorderGroups.map((group) => {
          const GroupIcon = group.icon;
          return (
            <div key={group.id} className="disorder-group">
              <div className="disorder-group-header">
                <div className="disorder-group-title-row">
                  <div className="disorder-group-icon-wrap" style={{ color: group.accentColor }}>
                    <GroupIcon size={22} />
                  </div>
                  <div>
                    <div className="disorder-group-tag" style={{ color: group.accentColor }}>
                      {group.tag}
                    </div>
                    <h2>{group.title}</h2>
                  </div>
                </div>
                <p className="disorder-group-desc">{group.subtitle}</p>
              </div>

              <div className="disorder-features-list">
                {group.features.map((feature, index) => (
                  <div key={feature.id} className="disorder-feature-card">
                    <div className="disorder-feature-number">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="disorder-feature-body">
                      <div className="disorder-feature-top">
                        <h3>{feature.name}</h3>
                        <span className="disorder-feature-category">{feature.category}</span>
                      </div>
                      <p className="disorder-feature-desc">{feature.description}</p>
                      <div className="disorder-feature-footer">
                        <span className="disorder-feature-benefit">
                          <CheckCircle2 size={13} className="benefit-icon" />
                          {feature.benefit}
                        </span>
                        <span className="disorder-feature-mechanism">
                          {feature.howItWorks}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
