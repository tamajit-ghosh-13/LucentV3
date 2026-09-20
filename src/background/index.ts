// This is the Manifest V3 Service Worker for the Chrome Extension.
// It will act as the background relay between the content scripts and the Python ML backend.
// It handles cross-origin requests securely, attaches Supabase Auth JWT tokens to API calls,
// and manages background telemetry syncing for the dashboard.
