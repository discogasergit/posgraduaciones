import React from 'react';
import { GraduationCap } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-indigo-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => window.location.hash = ''}>
          <GraduationCap size={28} className="text-yellow-400" />
          <h1 className="text-xl font-bold tracking-tight">Graduación <span className="text-yellow-400">2026</span></h1>
        </div>
      </div>
    </header>
  );
};