import React from 'react';
import { FileText, Cpu, ShieldCheck, Zap } from 'lucide-react';

interface NavbarProps {
  processedCount: number;
  totalPageCount: number;
  onClearAll: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  processedCount,
  totalPageCount,
  onClearAll,
}) => {
  return (
    <header className="border-b border-stone-200 bg-stone-900 text-stone-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-sm">
            <FileText className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-lg tracking-tight text-white">TextLift</h1>
              <span className="px-2 py-0.5 text-[10px] font-mono tracking-wider uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full font-semibold">
                Client-Side OCR
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Accurate PDF & Image OCR Extractor • Serverless & API-Free
            </p>
          </div>
        </div>

        {/* Feature Badges & Stats */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-stone-800 rounded-md text-stone-300 border border-stone-700/60">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Background Tab Ready</span>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-stone-800 rounded-md text-stone-300 border border-stone-700/60">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>100% Private (No Uploads)</span>
          </div>

          {processedCount > 0 && (
            <div className="flex items-center space-x-2 border-l border-stone-700 pl-3">
              <span className="text-stone-400 font-mono text-[11px]">
                {processedCount} doc{processedCount > 1 ? 's' : ''} • {totalPageCount} page{totalPageCount > 1 ? 's' : ''}
              </span>
              <button
                onClick={onClearAll}
                className="text-amber-400 hover:text-amber-300 underline font-medium text-xs cursor-pointer transition-colors"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
