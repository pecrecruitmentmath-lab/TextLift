import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { DropZone } from './components/DropZone';
import { LanguageSelector } from './components/LanguageSelector';
import { ExtractionSettings } from './components/ExtractionSettings';
import { BatchQueue } from './components/BatchQueue';
import { DocumentViewer } from './components/DocumentViewer';
import { DocumentItem, ExtractionOptions } from './types';
import { detectFileTypeCategory, processDocument } from './services/documentProcessor';
import { backgroundKeepAlive, createOptimizedProgressCallback } from './utils/backgroundKeepAlive';
import { Cpu, ShieldCheck, Zap, Sparkles, Layers, Globe } from 'lucide-react';

export default function App() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [isProcessingAny, setIsProcessingAny] = useState(false);

  const [options, setOptions] = useState<ExtractionOptions>({
    engine: 'local',
    mode: 'auto',
    languages: ['eng'],
    preprocessImage: true,
    scaleFactor: 2.2,
    autoFormat: true,
    minTextThreshold: 25,
    ignoreWatermarks: true,
    concurrencyLimit: 2,
  });

  const handleFilesSelected = (files: File[]) => {
    const newDocs: DocumentItem[] = files.map((file) => {
      const typeCategory = detectFileTypeCategory(file);
      return {
        id: Math.random().toString(36).substring(2, 9),
        file,
        name: file.name,
        size: file.size,
        typeCategory,
        mimeType: file.type,
        status: 'idle',
        progress: 0,
        progressMessage: 'Queued',
        pages: [],
        fullText: '',
        ocrPageCount: 0,
        textLayerPageCount: 0,
        totalPages: 0,
      };
    });

    setDocuments((prev) => [...prev, ...newDocs]);

    // Automatically process if single file added or non-processing
    if (newDocs.length === 1 && !isProcessingAny) {
      processSingleDocument(newDocs[0], options);
    }
  };

  const processSingleDocument = async (doc: DocumentItem, currentOptions: ExtractionOptions) => {
    setIsProcessingAny(true);
    backgroundKeepAlive.start();

    // Update doc status to processing
    setDocuments((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...d, status: 'processing', progress: 0.05, progressMessage: 'Starting...' } : d))
    );

    const onOptimizedProgress = createOptimizedProgressCallback((progress, message) => {
      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, progress, progressMessage: message } : d))
      );
    });

    try {
      const result = await processDocument(doc, currentOptions, onOptimizedProgress);

      setDocuments((prev) =>
        prev.map((d) =>
          d.id === doc.id
            ? {
                ...d,
                status: 'completed',
                progress: 1.0,
                progressMessage: 'Completed',
                pages: result.pages,
                fullText: result.fullText,
                ocrPageCount: result.ocrPageCount,
                textLayerPageCount: result.textLayerPageCount,
                totalPages: result.totalPages,
                thumbnailUrl: result.thumbnailUrl,
                extractedAt: Date.now(),
              }
            : d
        )
      );

      setActiveDocId(doc.id);
    } catch (err: any) {
      console.error(`Error extracting document ${doc.name}:`, err);
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === doc.id
            ? {
                ...d,
                status: 'error',
                error: err?.message || 'Failed to extract document',
                progressMessage: 'Failed',
              }
            : d
        )
      );
    } finally {
      setIsProcessingAny(false);
      backgroundKeepAlive.stop();
    }
  };

  const handleProcessDoc = (id: string) => {
    const doc = documents.find((d) => d.id === id);
    if (doc) {
      processSingleDocument(doc, options);
    }
  };

  const handleProcessAll = async () => {
    const pending = documents.filter((d) => d.status === 'idle' || d.status === 'error');
    if (pending.length === 0) return;

    setIsProcessingAny(true);
    try {
      for (const doc of pending) {
        await processSingleDocument(doc, options);
      }
    } finally {
      setIsProcessingAny(false);
    }
  };

  const handleRemoveDoc = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    if (activeDocId === id) {
      const remaining = documents.filter((d) => d.id !== id);
      setActiveDocId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleClearAll = () => {
    setDocuments([]);
    setActiveDocId(null);
  };

  const handleUpdateFullText = (docId: string, newText: string) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, fullText: newText } : d))
    );
  };

  const activeDoc = documents.find((d) => d.id === activeDocId) || documents.find((d) => d.status === 'completed');

  const totalProcessedDocs = documents.filter((d) => d.status === 'completed').length;
  const totalExtractedPages = documents.reduce((acc, d) => acc + (d.totalPages || 0), 0);

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-stone-950">
      <Navbar
        processedCount={totalProcessedDocs}
        totalPageCount={totalExtractedPages}
        onClearAll={handleClearAll}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Intro Banner */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-xs font-mono font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
            <Zap className="w-3.5 h-3.5 inline" />
            <span>01 / Client-Side Document & OCR Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100">
            Extract Text from PDFs, Images & Documents
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-3xl leading-relaxed">
            Pulls digital text layers from native PDFs and automatically runs high-accuracy WebAssembly Tesseract OCR on scanned pages, book photos, and images. Runs 100% in your browser — zero server API keys needed, zero data uploaded.
          </p>
        </div>

        {/* Configuration Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <LanguageSelector
            selectedLanguages={options.languages}
            onChange={(langs) => setOptions({ ...options, languages: langs })}
          />
          <ExtractionSettings
            options={options}
            onChange={(newOptions) => setOptions(newOptions)}
          />
        </div>

        {/* Upload Drop Zone */}
        <DropZone
          onFilesSelected={handleFilesSelected}
          isProcessing={isProcessingAny}
        />

        {/* Queue of Files */}
        <BatchQueue
          documents={documents}
          activeDocId={activeDoc?.id || null}
          onSelectDoc={(id) => setActiveDocId(id)}
          onRemoveDoc={handleRemoveDoc}
          onProcessDoc={handleProcessDoc}
          onProcessAll={handleProcessAll}
          isProcessingAny={isProcessingAny}
        />

        {/* Active Document View */}
        {activeDoc && activeDoc.status === 'completed' && (
          <div className="pt-2">
            <DocumentViewer
              document={activeDoc}
              onUpdateFullText={handleUpdateFullText}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-850 py-6 bg-white dark:bg-stone-900 text-stone-500 text-xs font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-amber-500" />
            <span>TextLift — Browser Document & OCR Extraction</span>
          </div>
          <div>Free & Private • 100% Client-Side</div>
        </div>
      </footer>
    </div>
  );
}
