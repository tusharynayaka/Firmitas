import { useState } from 'react';
import { Navbar } from './components/common/Navbar';
import { BeamCalculator } from './components/beam/BeamCalculator';
import { TrussCalculator } from './components/truss/TrussCalculator';

export default function App() {
  const [activeTab, setActiveTab] = useState<'beam' | 'truss'>('beam');

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <Navbar activeTab={activeTab} onChangeTab={setActiveTab} />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            {activeTab === 'beam' ? 'Beam Analysis' : 'Truss Analysis'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {activeTab === 'beam' 
              ? 'Calculate shear, moment, and deflection for continuous beams.' 
              : 'Analyze internal forces and reactions for 2D trusses.'}
          </p>
        </div>

        {/* {activeTab === 'beam' ? <BeamCalculator /> : <TrussCalculator />} */}
        <BeamCalculator />
      </main>

      <footer className="bg-slate-900 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-slate-400 text-xs">
           <p>For educational and preliminary design use only. Verify all results with secondary methods. <br/>Not intended to replace certified engineering software.</p>
        </div>
      </footer>
    </div>
  );
}
