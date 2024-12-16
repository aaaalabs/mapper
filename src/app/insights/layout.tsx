import React from 'react';

export default function InsightsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}

export const metadata = {
  title: 'Analytics Dashboard | Mapper',
  description: 'Comprehensive analytics and insights for your mapping platform',
};
