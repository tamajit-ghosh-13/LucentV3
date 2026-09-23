import React from "react";
import { ExternalLink, Globe, Clock3 } from "lucide-react";

export interface ActivityItem {
  id: number | string;
  website: string;
  page?: string;
  action?: string;
  feature?: string;
  time: string;
  duration?: string;
  url?: string;
  count?: number;
  latestAt?: string;
}

interface ActivityTableProps {
  activities: ActivityItem[];
}

export default function ActivityTable({
  activities,
}: ActivityTableProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">

      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800">
        <h2 className="text-lg font-semibold text-white">
          Recent Activity
        </h2>

        <p className="text-sm text-slate-400 mt-1">
          Websites adapted by Lucent during your browsing sessions
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">

          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="text-left px-6 py-4 font-medium w-3/4">
                Website
              </th>

              <th className="text-left px-6 py-4 font-medium w-1/4 whitespace-nowrap">
                Time Stamps
              </th>
            </tr>
          </thead>

          <tbody>
            {activities.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  className="px-6 py-10 text-center text-slate-500"
                >
                  No activity recorded yet. Visit any external website with Lucent enabled to see browsing history.
                </td>
              </tr>
            ) : (
              activities.map((activity) => {
                let targetUrl = activity.url?.trim() || "";
                if (!targetUrl && activity.website && activity.website.includes(".")) {
                  targetUrl = `https://${activity.website.trim()}`;
                }
                const isClickable = Boolean(
                  targetUrl &&
                  (targetUrl.startsWith("http://") || targetUrl.startsWith("https://"))
                );

                return (
                  <tr
                    key={activity.id}
                    className="border-b border-slate-800/60 hover:bg-slate-800/40 transition group"
                  >
                    {/* Website Column */}
                    <td className="px-6 py-4">
                      {isClickable ? (
                        <a
                          href={targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2.5 text-left text-white hover:text-emerald-400 transition-colors group/link cursor-pointer max-w-full"
                          title={`Open ${targetUrl}`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 group-hover/link:bg-emerald-500/20 transition-colors">
                            <Globe size={16} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-slate-100 group-hover/link:text-emerald-400 transition-colors truncate">
                                {activity.website}
                              </span>
                              <ExternalLink
                                size={13}
                                className="text-slate-500 group-hover/link:text-emerald-400 shrink-0 transition-colors"
                              />
                              {activity.count && activity.count > 1 ? (
                                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60 shrink-0">
                                  {activity.count} events
                                </span>
                              ) : null}
                            </div>
                            {activity.url && activity.url !== activity.website && (
                              <p className="text-xs text-slate-500 group-hover/link:text-slate-400 truncate mt-0.5 max-w-xl transition-colors">
                                {activity.url}
                              </p>
                            )}
                          </div>
                        </a>
                      ) : (
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/50 flex items-center justify-center text-slate-400 shrink-0">
                            <Globe size={16} />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-slate-200">
                              {activity.website}
                            </p>
                            {activity.url && (
                              <p className="text-xs text-slate-500 mt-0.5">
                                {activity.url}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Time Stamps Column */}
                    <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <Clock3 size={14} className="text-slate-500 shrink-0" />
                        <span>{activity.time}</span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

        </table>
      </div>
    </div>
  );
}