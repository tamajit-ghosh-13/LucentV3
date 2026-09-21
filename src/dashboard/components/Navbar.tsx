import {
  Search,
  Bell,
  ChevronDown,
} from "lucide-react";

export default function Navbar() {
  return (
    <header className="dashboard-navbar">

      {/* SEARCH */}
      <div className="dashboard-navbar-search">
        <Search size={18} />

        <input
          type="text"
          placeholder="Search..."
        />

        <span className="search-shortcut">
          ⌘ K
        </span>
      </div>


      {/* RIGHT SIDE */}
      <div className="dashboard-navbar-right">

        {/* NOTIFICATION */}
        <button
          className="dashboard-icon-button"
          aria-label="Notifications"
        >
          <Bell size={19} />

          <span className="notification-dot" />
        </button>


        {/* USER */}
        <div className="dashboard-user">

          <div className="dashboard-user-avatar">
            D
          </div>

          <div className="dashboard-user-info">
            <strong>Debadrita</strong>
            <span>Student</span>
          </div>

          <ChevronDown
            size={16}
            className="dashboard-user-chevron"
          />

        </div>

      </div>

    </header>
  );
}