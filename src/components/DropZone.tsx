import React, { useRef, useState } from 'react';
import { UploadCloud, FileCode2, Image as ImageIcon, FileText, Sparkles, CheckCircle2 } from 'lucide-react';
import { createSampleImageCanvasFile, createSamplePdfFile, createSampleTextFile } from './SampleDocs';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFilesSelected, isProcessing }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
      e.target.value = ''; // Reset input
    }
  };

  const handleSamplePdf = () => {
    onFilesSelected([createSamplePdfFile()]);
  };

  const handleSampleImage = async () => {
    const file = await createSampleImageCanvasFile();
    onFilesSelected([file]);
  };

  const handleSampleText = () => {
    onFilesSelected([createSampleTextFile()]);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative overflow-hidden rounded-xl border-2 border-dashed p-8 sm:p-10 text-center transition-all cursor-pointer group select-none ${
          isDragOver
            ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-md scale-[1.005]'
            : 'border-stone-300 dark:border-stone-700 bg-stone-50/80 dark:bg-stone-900/60 hover:border-amber-500/70 hover:bg-stone-100/70 dark:hover:bg-stone-850'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept=".pdf,image/*,.txt,.md,.csv,.json,.log,.html,.xml,.doc,.docx"
          className="hidden"
        />

        {/* Scanning Sweep Animation Effect when processing */}
        {isProcessing && (
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent animate-pulse" />
        )}

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
            <UploadCloud className="w-7 h-7 stroke-[2]" />
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-semibold text-stone-900 dark:text-stone-100">
              Drop PDFs, Images, or Documents here
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1 max-w-md mx-auto">
              Extract text accurately from scanned books, photographed documents, PDFs, PNGs, JPEGs & plain text files.
            </p>
          </div>

          {/* Supported Format Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-mono font-medium">
              <FileText className="w-3.5 h-3.5 text-red-500" />
              <span>PDF (Digital & Scanned)</span>
            </span>
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-mono font-medium">
              <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
              <span>PNG, JPG, WEBP, BMP</span>
            </span>
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-mono font-medium">
              <FileCode2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>TXT, MD, CSV, Code</span>
            </span>
          </div>
        </div>
      </div>

      {/* Quick Test Samples */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-stone-500 dark:text-stone-400">
        <span className="flex items-center space-x-1 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Need a test file? Try sample:</span>
        </span>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleSamplePdf}
            className="px-2.5 py-1 rounded bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-mono transition-colors cursor-pointer"
          >
            + Sample PDF
          </button>
          <button
            type="button"
            onClick={handleSampleImage}
            className="px-2.5 py-1 rounded bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-mono transition-colors cursor-pointer"
          >
            + Sample Scanned Image
          </button>
          <button
            type="button"
            onClick={handleSampleText}
            className="px-2.5 py-1 rounded bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-mono transition-colors cursor-pointer"
          >
            + Sample Text Doc
          </button>
        </div>
      </div>
    </div>
  );
};
