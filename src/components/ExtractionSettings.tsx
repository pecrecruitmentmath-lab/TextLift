import React from 'react';
import { Sliders, Zap, Sparkles, Layers, EyeOff, FastForward } from 'lucide-react';
import { ExtractionMode, ExtractionOptions } from '../types';

interface ExtractionSettingsProps {
  options: ExtractionOptions;
  onChange: (options: ExtractionOptions) => void;
}

export const ExtractionSettings: React.FC<ExtractionSettingsProps> = ({
  options,
  onChange,
}) => {
  const setMode = (mode: ExtractionMode) => {
    onChange({ ...options, mode });
  };

  const togglePreprocess = () => {
    onChange({ ...options, preprocessImage: !options.preprocessImage });
  };

  const toggleAutoFormat = () => {
    onChange({ ...options, autoFormat: !options.autoFormat });
  };

  const toggleIgnoreWatermarks = () => {
    onChange({ ...options, ignoreWatermarks: !options.ignoreWatermarks });
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 uppercase tracking-wider font-mono">
            OCR & Extraction Strategy
          </h3>
        </div>
        <div className="flex items-center space-x-1.5 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
          <FastForward className="w-3 h-3 inline" />
          <span>High-Speed Buffer Active</span>
        </div>
      </div>

      {/* OCR Engine Selection (Local Wasm vs Gemini AI) */}
      <div className="bg-stone-50 dark:bg-stone-850 p-3 rounded-lg border border-stone-200 dark:border-stone-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 flex items-center space-x-1.5">
            <span>OCR Processing Engine</span>
          </span>
          <span className="text-[10px] font-mono text-stone-500">Choose extraction technology</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...options, engine: 'local' })}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-start space-x-2.5 ${
              options.engine === 'local' || !options.engine
                ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 ring-1 ring-emerald-500/50'
                : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 opacity-70 hover:opacity-100'
            }`}
          >
            <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-stone-900 dark:text-stone-100 flex items-center space-x-1.5">
                <span>Local Engine (Tesseract Wasm)</span>
                <span className="px-1.5 py-0.2 text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 rounded">100% Free</span>
              </div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400 leading-tight mt-0.5">
                Runs entirely in your browser offline. Zero server calls or API usage.
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onChange({ ...options, engine: 'gemini' })}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-start space-x-2.5 ${
              options.engine === 'gemini'
                ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/30 ring-1 ring-amber-500/50'
                : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 opacity-70 hover:opacity-100'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-stone-900 dark:text-stone-100 flex items-center space-x-1.5">
                <span>Gemini AI Vision Engine</span>
                <span className="px-1.5 py-0.2 text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 rounded">AI Powered</span>
              </div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400 leading-tight mt-0.5">
                Highest precision like Gemini Chat. Perfect for scanned docs, Urdu & complex layouts.
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <button
          type="button"
          onClick={() => setMode('auto')}
          className={`flex flex-col p-3 rounded-lg border text-left transition-all cursor-pointer ${
            options.mode === 'auto'
              ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-stone-900 dark:text-stone-100 ring-1 ring-amber-500/50'
              : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-850 text-stone-600 dark:text-stone-400 hover:border-stone-300'
          }`}
        >
          <div className="flex items-center space-x-1.5 font-medium text-xs text-stone-900 dark:text-stone-100">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Auto Mode (Recommended)</span>
          </div>
          <span className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 leading-snug">
            Extracts embedded text first; automatically runs OCR on scanned/image-only pages.
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMode('always')}
          className={`flex flex-col p-3 rounded-lg border text-left transition-all cursor-pointer ${
            options.mode === 'always'
              ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-stone-900 dark:text-stone-100 ring-1 ring-amber-500/50'
              : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-850 text-stone-600 dark:text-stone-400 hover:border-stone-300'
          }`}
        >
          <div className="flex items-center space-x-1.5 font-medium text-xs text-stone-900 dark:text-stone-100">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>Always OCR All Pages</span>
          </div>
          <span className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 leading-snug">
            Forces full OCR scan on every page. Best for photo books & mixed scanned textbooks.
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMode('never')}
          className={`flex flex-col p-3 rounded-lg border text-left transition-all cursor-pointer ${
            options.mode === 'never'
              ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-stone-900 dark:text-stone-100 ring-1 ring-amber-500/50'
              : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-850 text-stone-600 dark:text-stone-400 hover:border-stone-300'
          }`}
        >
          <div className="flex items-center space-x-1.5 font-medium text-xs text-stone-900 dark:text-stone-100">
            <Layers className="w-3.5 h-3.5 text-blue-500" />
            <span>Text Layer Only</span>
          </div>
          <span className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 leading-snug">
            Instant digital text extraction without image OCR. Ultra-fast for native PDFs.
          </span>
        </button>
      </div>

      {/* Pre-processing, Watermark & Formatting Toggles */}
      <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs">
        <label className="flex items-center space-x-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={options.ignoreWatermarks !== false}
            onChange={toggleIgnoreWatermarks}
            className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
          />
          <span className="text-stone-800 dark:text-stone-200 font-medium flex items-center space-x-1">
            <EyeOff className="w-3.5 h-3.5 text-amber-500" />
            <span>Ignore Watermarks & Background Stamps</span>
          </span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={options.preprocessImage}
            onChange={togglePreprocess}
            className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
          />
          <span className="text-stone-800 dark:text-stone-200 font-medium">
            Contrast Enhancement & Grayscale
          </span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={options.autoFormat}
            onChange={toggleAutoFormat}
            className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
          />
          <span className="text-stone-800 dark:text-stone-200 font-medium">
            Auto-Fix Line Breaks & Hyphens
          </span>
        </label>
      </div>

      {/* Custom Watermark Pattern optional input */}
      {options.ignoreWatermarks !== false && (
        <div className="pt-1 flex items-center space-x-2 text-xs">
          <span className="text-stone-500 font-mono text-[11px] shrink-0">Custom Watermark to ignore:</span>
          <input
            type="text"
            placeholder="e.g. CONFIDENTIAL, DRAFT, www.example.com"
            value={options.customWatermarkPattern || ''}
            onChange={(e) => onChange({ ...options, customWatermarkPattern: e.target.value })}
            className="flex-1 px-2.5 py-1 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500 font-mono"
          />
        </div>
      )}
    </div>
  );
};
