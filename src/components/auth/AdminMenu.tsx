import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Settings } from 'lucide-react';

export function AdminMenu() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem('is_admin');
    navigate('/');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-500 hover:text-gray-700"
        title="Admin Menu"
      >
        <Settings size={20} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/insights');
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Analytics Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
