import { Sparkles, ChevronDown, ChevronUp, Users, Award, ShieldCheck, Play } from 'lucide-react';

export const HackathonBanner: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 border-b border-indigo-900/40 text-slate-300 text-xs px-4 py-2 select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="bg-indigo-600 text-white font-black text-[10px] px-2 py-0.5 rounded tracking-wider uppercase flex items-center gap-1">
            <Award size={12} />
            Global Innovation 2030
          </span>
          <span className="font-semibold text-slate-200 hidden sm:inline">
            A User-Centric Accessibility Layer for the Modern Web
          </span>
          <span className="text-slate-500 hidden md:inline">
            • Warner & Spencer
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="https://youtu.be/DA1tLGGaov0"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] bg-red-600 hover:bg-red-500 text-white font-semibold px-2 py-0.5 rounded transition-colors shadow-sm"
            title="Watch full walkthrough video on YouTube"
          >
            <Play size={10} className="fill-current" />
            <span>Watch Demo Video</span>
          </a>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-[11px] text-indigo-300 hover:text-indigo-100 font-medium transition-colors"
          >
            <Users size={13} />
            <span>Team & Problem</span>
            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1.5 animate-fade-in">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-slate-300 font-semibold">Team Members:</span>
            <span>Debadrita Bhattacharyya</span>
            <span>•</span>
            <span>Reetabrata Mandal</span>
            <span>•</span>
            <span>Prathama Biswas</span>
            <span>•</span>
            <span>Enaakshi Sen</span>
            <span>•</span>
            <span>Tamajit Ghosh</span>
            <span>•</span>
            <span>Shreyan Dasgupta</span>
          </div>
          <p className="text-slate-400">
            <strong>Problem:</strong> 1.3 Billion people (16% of world population) face severe digital barriers; 96% of top 1M websites fail basic WCAG contrast and missing ARIA tags. Existing static overlays require website code changes and fail on dynamic SPAs.
          </p>
          <p className="text-indigo-300">
            <strong>Solution:</strong> Manifest V3 Chrome Extension combining real-time DOM mutation, Multimodal Gemini AI vision understanding, and an online Reinforcement Learning loop that optimizes UI constraints to individual user abilities.
          </p>
          <p className="text-slate-300 pt-1">
            <strong>Video Walkthrough:</strong>{' '}
            <a
              href="https://youtu.be/DA1tLGGaov0"
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-400 hover:text-red-300 underline font-medium"
            >
              Watch the full feature walkthrough on YouTube (https://youtu.be/DA1tLGGaov0) ↗
            </a>
          </p>
        </div>
      )}
    </div>
  );
};
