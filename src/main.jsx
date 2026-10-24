import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import App from './App.jsx';
import { backendUrl } from './api.js';
import './styles.css';

const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 30_000 } } });

async function startApp() {
  const url = new URL(window.location.href);
  const authCode = new URLSearchParams(url.hash.slice(1)).get('authCode');
  if (authCode) {
    window.history.replaceState(null, '', `${url.pathname}${url.search}`);
    try {
      const { data } = await axios.post(`${backendUrl}/api/auth/exchange`, { code: authCode });
      sessionStorage.setItem('access_token', data.accessToken);
    } catch {
      sessionStorage.removeItem('access_token');
      window.location.replace('/login?error=oauth');
      return;
    }
  }

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>,
  );
}

startApp();
