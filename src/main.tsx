import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { LucentProvider } from './lib/lucent-state.tsx';
import './index.css';
import './dashboard/styles/dashboard.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter><LucentProvider><App /></LucentProvider></BrowserRouter>
  </StrictMode>,
);
