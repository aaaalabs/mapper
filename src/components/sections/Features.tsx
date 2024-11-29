import React from 'react';
import { Globe, Users, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';

const features = [
  {
    icon: Globe,
    title: 'Interactive Mapping',
    description: "Create beautiful, interactive maps showing your community's global distribution.",
    colorClass: {
      bg: 'bg-blue-50',
      text: 'text-blue-600'
    }
  },
  {
    icon: Users,
    title: 'Member Profiles',
    description: 'Display rich member profiles with photos and contact information.',
    colorClass: {
      bg: 'bg-purple-50',
      text: 'text-purple-600'
    }
  },
  {
    icon: Sparkles,
    title: 'Auto Processing',
    description: 'Automatically process LinkedIn profiles or CSV data to generate maps.',
    colorClass: {
      bg: 'bg-green-50',
      text: 'text-green-600'
    }
  }
];

export function Features() {
  return (
    <section id="features" className="py-20">
      <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto px-4">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className={clsx('w-12 h-12 rounded-lg flex items-center justify-center mb-4', feature.colorClass.bg)}>
                <Icon className={clsx('w-6 h-6', feature.colorClass.text)} />
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}