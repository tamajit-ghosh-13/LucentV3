import {
  LayoutDashboard,
  Activity,
  Settings,
  LogOut,
  Sparkles,
  Accessibility,
  BarChart3,
} from "lucide-react";

import { NavLink } from "react-router-dom";

const navigation = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "My Features",
    path: "/dashboard/features",
    icon: Accessibility,
  },
  {
    name: "Activity",
    path: "/activity",
    icon: Activity,
  },
  {
    name: "Analytics",
    path: "/dashboard/analytics",
    icon: BarChart3,
  },
];

export default function Sidebar() {
  return (
    <aside className="dashboard-sidebar">

      {/* LOGO */}
      <div className="dashboard-logo">
        <div className="dashboard-logo-icon">
          <Sparkles size={19} />
        </div>

        <div className="dashboard-logo-text">
          <h1>LUCENT</h1>
          <span>Accessibility Layer</span>
        </div>
      </div>


      {/* NAVIGATION */}
      <nav className="dashboard-nav">

        <div className="dashboard-nav-label">
          MAIN MENU
        </div>

        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === "/dashboard"}
              className={({ isActive }) =>
                `dashboard-nav-item ${
                  isActive
                    ? "dashboard-nav-item-active"
                    : ""
                }`
              }
            >
              <Icon size={18} strokeWidth={2} />

              <span>{item.name}</span>
            </NavLink>
          );
        })}

      </nav>


      {/* BOTTOM */}
      <div className="dashboard-sidebar-bottom">

        <NavLink
          to="/dashboard/settings"
          className={({ isActive }) =>
            `dashboard-nav-item ${
              isActive
                ? "dashboard-nav-item-active"
                : ""
            }`
          }
        >
          <Settings size={18} />
          <span>Settings</span>
        </NavLink>


        <button className="dashboard-nav-item dashboard-logout">
          <LogOut size={18} />
          <span>Logout</span>
        </button>

      </div>

    </aside>
  );
}