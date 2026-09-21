import React from "react";

export interface ActivityItem {
  id: number;
  website: string;
  page?: string;      // Added field
  action?: string;    // Optional if not provided in array items
  feature: string;
  time: string;
  duration: string;
  url?: string;       // Optional if not provided in array items
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
          Your recent accessibility activity across websites
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">

          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="text-left px-6 py-4 font-medium">
                Website
              </th>

              <th className="text-left px-6 py-4 font-medium">
                Feature
              </th>

              <th className="text-left px-6 py-4 font-medium">
                Action
              </th>

              <th className="text-left px-6 py-4 font-medium">
                Time
              </th>

              <th className="text-left px-6 py-4 font-medium">
                Duration
              </th>
            </tr>
          </thead>

          <tbody>
            {activities.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-slate-500"
                >
                  No activity recorded yet.
                </td>
              </tr>
            ) : (
              activities.map((activity) => (
                <tr
                  key={activity.id}
                  className="border-b border-slate-800/60 hover:bg-slate-800/40 transition"
                >
                  {/* Website */}
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-white">
                        {activity.website}
                      </p>

                      <p className="text-xs text-slate-500 mt-1">
                        {activity.url}
                      </p>
                    </div>
                  </td>

                  {/* Feature */}
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                      {activity.feature}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="px-6 py-4 text-slate-300">
                    {activity.action}
                  </td>

                  {/* Time */}
                  <td className="px-6 py-4 text-slate-400">
                    {activity.time}
                  </td>

                  {/* Duration */}
                  <td className="px-6 py-4 text-slate-400">
                    {activity.duration}
                  </td>
                </tr>
              ))
            )}
          </tbody>

        </table>
      </div>
    </div>
  );
}