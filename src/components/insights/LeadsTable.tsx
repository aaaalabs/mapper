import React, { useState } from 'react';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, Mail, Link, FileDown, MessageSquare } from 'lucide-react';
import { Lead, LeadStatus } from '../../services/leadService';

interface LeadsTableProps {
  leads: Lead[];
  onStatusChange: (leadId: string, newStatus: LeadStatus) => void;
}

export function LeadsTable({ leads, onStatusChange }: LeadsTableProps) {
  const [sortField, setSortField] = useState<keyof Lead>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);

  const sortedLeads = [...leads].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    const direction = sortDirection === 'asc' ? 1 : -1;

    if (sortField === 'created_at') {
      return direction * (new Date(aValue as string).getTime() - new Date(bValue as string).getTime());
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return direction * aValue.localeCompare(bValue);
    }
    
    return 0;
  });

  const handleSort = (field: keyof Lead) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const renderSortIcon = (field: keyof Lead) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  const renderInteractionIcon = (type: string) => {
    switch (type) {
      case 'map_download':
        return <FileDown className="w-4 h-4 text-blue-500" />;
      case 'provided_feedback':
        return <MessageSquare className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('created_at')}
            >
              <div className="flex items-center gap-1">
                Date {renderSortIcon('created_at')}
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('name')}
            >
              <div className="flex items-center gap-1">
                Name {renderSortIcon('name')}
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('email')}
            >
              <div className="flex items-center gap-1">
                Email {renderSortIcon('email')}
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('lead_type')}
            >
              <div className="flex items-center gap-1">
                Type {renderSortIcon('lead_type')}
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('status')}
            >
              <div className="flex items-center gap-1">
                Status {renderSortIcon('status')}
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedLeads.map((lead) => (
            <React.Fragment key={lead.id}>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(lead.created_at!), 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="text-sm text-gray-900">{lead.email}</div>
                    <a 
                      href={`mailto:${lead.email}`}
                      className="ml-2 text-gray-400 hover:text-gray-600"
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                    ${lead.lead_type === 'beta_waitlist' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}
                  >
                    {lead.lead_type === 'beta_waitlist' ? 'Beta Waitlist' : 'Data Extraction'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={lead.status}
                    onChange={(e) => onStatusChange(lead.id!, e.target.value as LeadStatus)}
                    className="text-sm border-gray-300 rounded-md"
                  >
                    <option value="pending">Pending</option>
                    <option value="contacted">Contacted</option>
                    <option value="converted">Converted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    {lead.community_link && (
                      <a 
                        href={lead.community_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Link className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => setExpandedLeadId(expandedLeadId === lead.id ? null : (lead.id ?? null))}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {expandedLeadId === lead.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </td>
              </tr>
              {expandedLeadId === lead.id && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 bg-gray-50">
                    <div className="text-sm text-gray-600">
                      <h4 className="font-medium mb-2">Interactions</h4>
                      {(lead.metadata?.interactions ?? []).length > 0 ? (
                        <div className="space-y-2">
                          {lead.metadata?.interactions?.map((interaction: any, index: number) => (
                            <div key={index} className="flex items-center gap-2">
                              {renderInteractionIcon(interaction.type)}
                              <span>{interaction.type.replace('_', ' ')}</span>
                              <span className="text-gray-400">
                                {format(new Date(interaction.timestamp), 'MMM d, yyyy HH:mm')}
                              </span>
                              {interaction.rating && (
                                <span className="text-yellow-500">★ {interaction.rating}</span>
                              )}
                              {interaction.use_case && (
                                <span className="text-gray-500">({interaction.use_case})</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400">No interactions recorded</p>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
