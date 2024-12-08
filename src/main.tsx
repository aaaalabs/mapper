import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App.tsx';
import { SharedMap } from './pages/SharedMap.tsx';
import { EmbedMap } from './pages/EmbedMap.tsx';
import { InsightsDashboard } from './pages/InsightsDashboard.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorBoundary><App /></ErrorBoundary>
  },
  {
    path: '/map/:id',
    element: <SharedMap />,
    errorElement: <ErrorBoundary><SharedMap /></ErrorBoundary>
  },
  {
    path: '/map/:id/embed',
    element: <EmbedMap />,
    errorElement: <ErrorBoundary><EmbedMap /></ErrorBoundary>
  },
  {
    path: '/insights',
    element: <InsightsDashboard />,
    errorElement: <ErrorBoundary><InsightsDashboard /></ErrorBoundary>
  }
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </StrictMode>
);
