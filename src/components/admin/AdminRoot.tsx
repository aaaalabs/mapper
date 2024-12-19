import React from 'react';
import { AdminThemeProvider } from './providers/AdminThemeProvider';
import { AdminLayout } from './layout/AdminLayout';

export function AdminRoot() {
  return (
    <AdminThemeProvider>
      <AdminLayout />
    </AdminThemeProvider>
  );
}
