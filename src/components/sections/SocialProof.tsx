import React from 'react';
import { Users, Globe2, Share2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const stats = [
  {
    icon: Users,
    value: '5,000+',
    label: 'Community Members',
    description: 'Mapped across our platform'
  },
  {
    icon: Globe2,
    value: '80+',
    label: 'Countries',
    description: 'Global reach and counting'
  },
  {
    icon: Share2,
    value: '1,000+',
    label: 'Maps Created',
    description: 'By communities like yours'
  }
];

const testimonials = [
  {
    quote: "This tool transformed how we visualize our global alumni network. It's incredibly easy to use and looks professional.",
    author: "Sarah Chen",
    role: "Alumni Relations Director",
    organization: "Tech Academy International"
  },
  {
    quote: "We needed a quick way to map our remote team across time zones. This solution was perfect - took less than 5 minutes to set up.",
    author: "Marcus Weber",
    role: "Head of Remote",
    organization: "DistributedTech Inc"
  },
  {
    quote: "The ability to share an interactive map with our community instantly made our impact report much more engaging.",
    author: "Priya Patel",
    role: "Community Lead",
    organization: "Global Innovators Network"
  }
];

export function SocialProof() {
  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div 
              key={stat.label}
              className={cn(
                "text-center p-6 rounded-xl",
                "bg-background-white border border-gray-100",
                "transform hover:-translate-y-1 transition-transform duration-200"
              )}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 text-accent mb-4">
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="text-3xl font-bold text-primary mb-1">
                {stat.value}
              </div>
              <div className="font-medium text-secondary mb-2">
                {stat.label}
              </div>
              <div className="text-sm text-tertiary">
                {stat.description}
              </div>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">
            Trusted by Communities Worldwide
          </h2>
          <p className="text-xl text-secondary max-w-2xl mx-auto">
            See how other communities are using our platform to bring their networks to life.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={testimonial.author}
              className={cn(
                "p-6 rounded-xl",
                "bg-background-white border border-gray-100",
                "transform hover:-translate-y-1 transition-transform duration-200"
              )}
            >
              <div className="flex flex-col h-full">
                <div className="flex-1">
                  <blockquote className="text-secondary mb-6">
                    "{testimonial.quote}"
                  </blockquote>
                </div>
                <div>
                  <div className="font-medium text-primary">
                    {testimonial.author}
                  </div>
                  <div className="text-sm text-tertiary">
                    {testimonial.role}
                  </div>
                  <div className="text-sm text-accent">
                    {testimonial.organization}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="mt-16 text-center">
          <p className="text-sm font-medium text-tertiary mb-4">
            TRUSTED BY ORGANIZATIONS FROM
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {['MIT', 'Stanford', 'Harvard', 'Berkeley', 'Oxford'].map((org) => (
              <span key={org} className="text-lg font-semibold text-tertiary">
                {org}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 