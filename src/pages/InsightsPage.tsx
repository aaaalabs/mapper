import React, { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { Lead } from '../services/leadService';
import { LeadsTable } from '../components/insights/LeadsTable';
import { useNavigate } from 'react-router-dom';

export function InsightsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== 'livingmydesign@gmail.com') { // Replace with your email
        navigate('/');
        return;
      }
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const { data, error } = await supabase
          .from('map_leads')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setLeads(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch leads');
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('map_leads')
        .update({ status: newStatus })
        .eq('id', leadId);

      if (error) throw error;

      setLeads(leads.map(lead => 
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      ));
    } catch (err) {
      console.error('Error updating lead status:', err);
      // You might want to show an error message to the user here
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading leads</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Insights Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Track and manage leads from beta waitlist and data extraction requests.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-purple-800">Total Leads</h3>
              <p className="text-3xl font-bold text-purple-900">{leads.length}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-blue-800">Beta Waitlist</h3>
              <p className="text-3xl font-bold text-blue-900">
                {leads.filter(l => l.lead_type === 'beta_waitlist').length}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-green-800">Data Extraction</h3>
              <p className="text-3xl font-bold text-green-900">
                {leads.filter(l => l.lead_type === 'data_extraction').length}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <LeadsTable 
            leads={leads}
            onStatusChange={handleStatusChange}
          />
        </div>
      </div>
    </div>
  );
}
