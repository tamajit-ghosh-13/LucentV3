import { Navigate, Route, Routes } from 'react-router-dom';

import Dashboard from './dashboard/pages/Dashboard';
import Activity from './dashboard/pages/Activity';
import Features from './dashboard/pages/Features';
import Analytics from './dashboard/pages/Analytics';
import Settings from './dashboard/pages/Settings';

import DashboardLayout from './dashboard/layouts/DashboardLayout';
import LucentDemo from './LucentDemo';

export default function App() {
  return (
    <Routes>

      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />

      <Route element={<DashboardLayout />}>

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/dashboard/features"
          element={<Features />}
        />

        <Route
          path="/activity"
          element={<Activity />}
        />

        <Route
          path="/dashboard/analytics"
          element={<Analytics />}
        />

        <Route
          path="/dashboard/settings"
          element={<Settings />}
        />

      </Route>


      <Route
        path="/demo"
        element={<LucentDemo />}
      />

    </Routes>
  );
}