import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function DashboardLayout() {
  return (
    <div className="dashboard-root">
      <Sidebar />

      <div className="dashboard-main">
        <Navbar />

        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}