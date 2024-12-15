import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import { SharedMap } from './pages/SharedMap';
import { EmbedMap } from './pages/EmbedMap';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HomePage } from './pages/HomePage';
import { InsightsPage } from './pages/InsightsPage';
import './index.css';

// Initialize theme
const initTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add('dark');
  }
};

initTheme();

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: '/insights',
        element: <InsightsPage />,
      }
    ]
  },
  {
    path: '/map/:id',
    element: <SharedMap />,
  },
  {
    path: '/map/:id/embed',
    element: <EmbedMap />,
  },
  {
    path: '/embed/:id',
    element: <EmbedMap />,
  }
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </StrictMode>
);
