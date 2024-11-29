import React from 'react';

const footerLinks = {
  Product: ['Features', 'Pricing', 'Demo'],
  Company: ['About', 'Blog', 'Contact'],
  Legal: ['Privacy', 'Terms'],
  Connect: ['Twitter', 'LinkedIn', 'GitHub']
};

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-white font-semibold mb-4">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="hover:text-white transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p>&copy; {new Date().getFullYear()} VoiceLoop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}