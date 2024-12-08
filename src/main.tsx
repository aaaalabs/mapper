import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App.tsx';
import { SharedMap } from './pages/SharedMap.tsx';
import { EmbedMap } from './pages/EmbedMap.tsx';
import './index.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/map/:id',
    element: <SharedMap />,
  },
  {
    path: '/map/:id/embed',
    element: <EmbedMap />,
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
