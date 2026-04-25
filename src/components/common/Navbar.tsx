import { FC } from 'react';

interface NavbarProps {
  activeTab: 'beam' | 'truss';
  onChangeTab: (tab: 'beam' | 'truss') => void;
}

export const Navbar: FC<NavbarProps> = ({ activeTab, onChangeTab }) => {
  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            </div>
            <span className="font-bold text-xl tracking-tight text-white">Firmitas</span>
          </div>
          <div className="flex gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => onChangeTab('beam')}
              className={`px-4 py-2 rounded-md transition-all text-sm font-medium ${
                activeTab === 'beam' 
                  ? 'bg-indigo-500 text-white shadow-md' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              Beam Calculator
            </button>
            {/*
            <button
              onClick={() => onChangeTab('truss')}
              className={`px-4 py-2 rounded-md transition-all text-sm font-medium ${
                activeTab === 'truss' 
                  ? 'bg-indigo-500 text-white shadow-md' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              Truss Calculator
            </button>
            */}
          </div>
        </div>
      </div>
    </nav>
  );
};
