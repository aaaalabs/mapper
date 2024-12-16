'use client';

import React from 'react';
import { DashboardContent } from '@/components/insights/DashboardContent';
import { ErrorTracking } from '@/components/insights/ErrorTracking';
import { FeatureEngagement } from '@/components/insights/FeatureEngagement';
import { SystemLogs } from '@/components/insights/SystemLogs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function InsightsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Analytics Dashboard</h1>
        <div className="flex items-center space-x-4">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            Export Report
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
            Share Dashboard
          </button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white border-b">
          <TabsTrigger value="overview" className="px-4 py-2">Overview</TabsTrigger>
          <TabsTrigger value="errors" className="px-4 py-2">Error Tracking</TabsTrigger>
          <TabsTrigger value="features" className="px-4 py-2">Feature Usage</TabsTrigger>
          <TabsTrigger value="logs" className="px-4 py-2">System Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <DashboardContent />
        </TabsContent>

        <TabsContent value="errors" className="space-y-6">
          <ErrorTracking />
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <FeatureEngagement />
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <SystemLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
}
