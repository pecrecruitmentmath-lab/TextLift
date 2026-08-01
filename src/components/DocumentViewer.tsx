import React, { useState } from 'react';
import {
  Copy,
  Download,
  FileText,
  Search,
  Check,
  Split,
  Layers,
  Sparkles,
  Wand2,
  FileJson,
  FileCode,
  ArrowLeft,
  ArrowRight,
  ZoomIn,
  RefreshCw,
  Languages,
} from 'lucide-react';
import { DocumentItem, ExtractedPage } from '../types';
import { cleanTextFormatting } from '../services/pdfExtractor';
import { repairUrduCursiveText, getUrduTextStyle, isUrduOrRtlText } from '../utils/urduFormatter';
import { extractTextWithGeminiAI } from '../services/geminiOcrService';

interface DocumentViewerProps {
  document: DocumentItem;
  onUpdateFullText: (docId: string, newText: string) => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document: docItem,
  onUpdateFullText,
}) => {
  const [viewMode, setViewMode] = useState<'full' | 'page' | 'split'>('split');
  const [selectedPageNum, setSelectedPageNum] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [imageZoom, setImageZoom] = useState(false);
  const [urduFontSize, setUrduFontSize] = useState<number>(22);
  const [urduFontStyle, setUrduFontStyle] = useState<'nastaliq' | 'sans_arabic' | 'mono'>('sans_arabic');
  const [isGeminiExtracting, setIsGeminiExtracting] = useState(false);

  const currentPage = docItem.pages.find((p) => p.pageNumber === selectedPageNum) || docItem.pages[0];

  const handleGeminiAiExtract = async () => {
    if (!currentPage || isGeminiExtracting) return;
    setIsGeminiExtracting(true);

    try {
      let base64Image = currentPage.dataUrl;

      if (!base64Image && docItem.file.type.startsWith('image/')) {
        const arrayBuffer = await docItem.file.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: docItem.file.type });
        base64Image = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }

      if (!base64Image) {
        alert('Page image is not available for Gemini AI extraction.');
        setIsGeminiExtracting(false);
        return;
      }

      const result = await extractTextWithGeminiAI(
        base64Image,
        'image/png',
        isUrduOrRtlText(currentPage.text) ? 'urdu, arabic' : 'english'
      );

      if (result.text) {
        currentPage.text = result.text;
        currentPage.engine = 'gemini';
        currentPage.source = 'ocr';

        const newFullText = docItem.pages
          .map((p) => `--- Page ${p.pageNumber} (${p.engine === 'gemini' ? 'Gemini AI' : p.source === 'ocr' ? 'OCR' : 'Text Layer'}) ---\n${p.text}`)
          .join('\n\n');

        onUpdateFullText(docItem.id, newFullText);
      }
    } catch (err: any) {
      alert(`Gemini AI Extraction Error: ${err.message || 'Failed to extract text with Gemini'}`);
    } finally {
      setIsGeminiExtracting(false);
    }
  };

  // Search matches count
  const getSearchMatchCount = (text: string) => {
    if (!searchQuery.trim()) return 0;
    try {
      const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = text.match(regex);
      return matches ? matches.length : 0;
    } catch {
      return 0;
    }
  };

  const fullTextMatches = getSearchMatchCount(docItem.fullText);

  // Copy handler
  const handleCopy = async () => {
    const textToCopy = viewMode === 'page' ? currentPage?.text : docItem.fullText;
    try {
      await navigator.clipboard.writeText(textToCopy || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy || '';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  // Download handlers
  const handleDownloadTxt = () => {
    if (typeof document === 'undefined' || typeof document.createElement !== 'function') return;
    const blob = new Blob([docItem.fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docItem.name.replace(/\.[^/.]+$/, '')}_extracted.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMd = () => {
    if (typeof document === 'undefined' || typeof document.createElement !== 'function') return;
    const mdContent = `# ${docItem.name}\nExtracted via TextLift OCR\n\n` + docItem.fullText;
    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docItem.name.replace(/\.[^/.]+$/, '')}_extracted.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    if (typeof document === 'undefined' || typeof document.createElement !== 'function') return;
    const jsonObj = {
      filename: docItem.name,
      extractedAt: new Date().toISOString(),
      totalPages: docItem.totalPages,
      ocrPageCount: docItem.ocrPageCount,
      textLayerPageCount: docItem.textLayerPageCount,
      pages: docItem.pages.map((p) => ({
        pageNumber: p.pageNumber,
        source: p.source,
        confidence: p.confidence,
        wordCount: p.wordCount,
        charCount: p.charCount,
        text: p.text,
      })),
    };

    const blob = new Blob([JSON.stringify(jsonObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docItem.name.replace(/\.[^/.]+$/, '')}_extracted.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Text formatting tools
  const handleCleanHyphens = () => {
    const cleaned = cleanTextFormatting(docItem.fullText);
    onUpdateFullText(docItem.id, cleaned);
  };

  const handleRemoveExtraLinebreaks = () => {
    const cleaned = docItem.fullText.replace(/\n{2,}/g, '\n\n').trim();
    onUpdateFullText(docItem.id, cleaned);
  };

  const handleTrimWhitespace = () => {
    const cleaned = docItem.fullText
      .split('\n')
      .map((line) => line.trim())
      .join('\n');
    onUpdateFullText(docItem.id, cleaned);
  };

  const handleRepairUrduCursive = () => {
    const cleaned = repairUrduCursiveText(docItem.fullText);
    docItem.pages.forEach((p) => {
      p.text = repairUrduCursiveText(p.text);
    });
    onUpdateFullText(docItem.id, cleaned);
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden flex flex-col">
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-850 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Document Details */}
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 truncate max-w-md">
              {docItem.name}
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
              {docItem.totalPages} page{docItem.totalPages > 1 ? 's' : ''}
            </span>
            {docItem.ocrPageCount > 0 && (
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-semibold">
                {docItem.ocrPageCount} OCR'd
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3 text-xs text-stone-500 dark:text-stone-400 mt-1 font-mono">
            <span>{docItem.fullText.split(/\s+/).filter(Boolean).length.toLocaleString()} words</span>
            <span>•</span>
            <span>{docItem.fullText.length.toLocaleString()} characters</span>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-1 bg-stone-200 dark:bg-stone-800 p-1 rounded-lg self-start md:self-auto text-xs">
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
              viewMode === 'split'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <Split className="w-3.5 h-3.5 text-amber-500" />
            <span>Side-by-Side</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('page')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
              viewMode === 'page'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-500" />
            <span>Page by Page</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('full')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
              viewMode === 'full'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-500" />
            <span>Full Document</span>
          </button>
        </div>
      </div>

      {/* Toolbar: Search & Export actions */}
      <div className="px-4 py-3 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            placeholder="Search text in document..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-12 py-1.5 bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500 text-xs"
          />
          {searchQuery && (
            <span className="absolute right-2.5 top-2 text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold">
              {fullTextMatches}
            </span>
          )}
        </div>

        {/* Text formatting presets dropdown / buttons */}
        <div className="flex items-center space-x-2 flex-wrap">
          <div className="flex items-center space-x-1 text-stone-400 text-[11px] font-mono mr-1">
            <Wand2 className="w-3 h-3 text-amber-500" />
            <span>Format:</span>
          </div>

          <button
            type="button"
            onClick={handleCleanHyphens}
            title="Fix words split across line breaks (e.g. 'docu- ment')"
            className="px-2 py-1 rounded border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-[11px] cursor-pointer"
          >
            Fix Hyphens
          </button>

          <button
            type="button"
            onClick={handleRemoveExtraLinebreaks}
            title="Normalize multiple blank lines"
            className="px-2 py-1 rounded border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-[11px] cursor-pointer"
          >
            Trim Lines
          </button>

          <button
            type="button"
            onClick={handleRepairUrduCursive}
            title="Re-join broken Urdu script letters into continuous readable words"
            className="px-2.5 py-1 rounded border border-amber-300 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-[11px] font-semibold flex items-center space-x-1 cursor-pointer"
          >
            <Languages className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Fix Urdu Words</span>
          </button>

          <button
            type="button"
            onClick={handleGeminiAiExtract}
            disabled={isGeminiExtracting}
            title="Re-extract this page using Gemini AI Vision model for highest accuracy (like Gemini chat)"
            className="px-2.5 py-1 rounded border border-amber-400 dark:border-amber-700 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-[11px] font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 text-amber-100 ${isGeminiExtracting ? 'animate-spin' : ''}`} />
            <span>{isGeminiExtracting ? 'Gemini Extracting...' : 'Extract with Gemini AI'}</span>
          </button>

          {/* Typography Controls for Urdu / RTL Readability */}
          <div className="flex items-center space-x-1 border-l border-stone-200 dark:border-stone-800 pl-2">
            <span className="text-[10px] font-mono text-stone-400">Font:</span>
            <select
              value={urduFontStyle}
              onChange={(e) => setUrduFontStyle(e.target.value as any)}
              className="px-2 py-1 text-[11px] font-medium bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded text-stone-800 dark:text-stone-200 focus:outline-none cursor-pointer"
            >
              <option value="sans_arabic">Noto Sans Arabic (Clear)</option>
              <option value="nastaliq">Nastaliq Script</option>
              <option value="mono">Monospace</option>
            </select>

            <div className="flex items-center space-x-0.5 ml-1 bg-stone-100 dark:bg-stone-800 rounded p-0.5 border border-stone-200 dark:border-stone-700">
              <button
                type="button"
                onClick={() => setUrduFontSize((s) => Math.max(12, s - 2))}
                className="px-1.5 py-0.5 text-[10px] font-bold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer"
                title="Decrease font size"
              >
                A-
              </button>
              <span className="text-[10px] font-mono px-1 text-amber-600 dark:text-amber-400 font-bold">{urduFontSize}px</span>
              <button
                type="button"
                onClick={() => setUrduFontSize((s) => Math.min(36, s + 2))}
                className="px-1.5 py-0.5 text-[10px] font-bold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer"
                title="Increase font size"
              >
                A+
              </button>
            </div>
          </div>

          {/* Export Actions */}
          <div className="flex items-center space-x-1.5 border-l border-stone-200 dark:border-stone-800 pl-2">
            <button
              type="button"
              onClick={handleCopy}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadTxt}
              title="Download plain text file"
              className="px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center space-x-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-500" />
              <span>.txt</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadMd}
              title="Download Markdown file"
              className="px-2 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center space-x-1 cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5 text-blue-500" />
              <span>.md</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadJson}
              title="Download structured JSON with page metrics"
              className="px-2 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center space-x-1 cursor-pointer"
            >
              <FileJson className="w-3.5 h-3.5 text-purple-500" />
              <span>.json</span>
            </button>
          </div>
        </div>
      </div>

      {/* Page Selector Bar for Page-by-Page & Side-by-Side Modes */}
      {(viewMode === 'page' || viewMode === 'split') && docItem.pages.length > 1 && (
        <div className="px-4 py-2 bg-stone-100 dark:bg-stone-850 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-stone-500">Page:</span>
            <div className="flex items-center space-x-1 overflow-x-auto max-w-md py-0.5">
              {docItem.pages.map((p) => (
                <button
                  key={p.pageNumber}
                  type="button"
                  onClick={() => setSelectedPageNum(p.pageNumber)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-colors cursor-pointer ${
                    p.pageNumber === selectedPageNum
                      ? 'bg-amber-500 text-stone-950'
                      : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
                  }`}
                >
                  {p.pageNumber}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-1 text-stone-500">
            <button
              type="button"
              disabled={selectedPageNum === 1}
              onClick={() => setSelectedPageNum(Math.max(1, selectedPageNum - 1))}
              className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-800 disabled:opacity-30 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs">
              {selectedPageNum} / {docItem.pages.length}
            </span>
            <button
              type="button"
              disabled={selectedPageNum === docItem.pages.length}
              onClick={() => setSelectedPageNum(Math.min(docItem.pages.length, selectedPageNum + 1))}
              className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-800 disabled:opacity-30 cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="min-h-[420px] max-h-[650px] overflow-y-auto">
        {/* VIEW MODE: Side-by-Side (Split) */}
        {viewMode === 'split' && (
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-stone-200 dark:divide-stone-800 h-full">
            {/* Left: Original Scanned Page Preview */}
            <div className="p-4 bg-stone-100 dark:bg-stone-950/60 flex flex-col items-center justify-start overflow-y-auto">
              <div className="w-full flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-semibold text-stone-500 uppercase">
                  Original Document (Page {currentPage?.pageNumber || 1})
                </span>
                {currentPage?.dataUrl && (
                  <button
                    type="button"
                    onClick={() => setImageZoom(!imageZoom)}
                    className="text-xs text-amber-600 dark:text-amber-400 font-mono flex items-center space-x-1 hover:underline cursor-pointer"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>{imageZoom ? 'Normal View' : 'Zoom In'}</span>
                  </button>
                )}
              </div>

              {currentPage?.dataUrl ? (
                <div className={`transition-all duration-200 ${imageZoom ? 'w-full scale-105' : 'max-w-full'}`}>
                  <img
                    src={currentPage.dataUrl}
                    alt={`Page ${currentPage.pageNumber}`}
                    className="rounded shadow-md border border-stone-300 dark:border-stone-800 bg-white max-h-[550px] object-contain mx-auto"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center text-stone-400">
                  <FileText className="w-12 h-12 stroke-[1.5] mb-2 opacity-40" />
                  <p className="text-xs font-mono">No image preview available for this page</p>
                </div>
              )}
            </div>

            {/* Right: Extracted Page Text */}
            <div className="p-4 flex flex-col h-full bg-stone-50/30 dark:bg-stone-900">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-semibold text-stone-500 uppercase flex items-center space-x-2">
                  <span>Extracted Text</span>
                  {currentPage?.source === 'ocr' ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      OCR ({currentPage.confidence ?? 95}% confidence)
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      Text Layer
                    </span>
                  )}
                </span>
                <span className="text-[11px] font-mono text-stone-400">
                  {currentPage?.wordCount || 0} words
                </span>
              </div>

              <textarea
                value={currentPage?.text || ''}
                dir="auto"
                onChange={(e) => {
                  const newPageText = e.target.value;
                  // Update page text
                  currentPage.text = newPageText;
                  // Rebuild document full text
                  const newFullText = docItem.pages
                    .map((p) => `--- Page ${p.pageNumber} (${p.source === 'ocr' ? 'OCR' : 'Text Layer'}) ---\n${p.text}`)
                    .join('\n\n');
                  onUpdateFullText(docItem.id, newFullText);
                }}
                className="w-full flex-1 min-h-[420px] p-4 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none resize-none shadow-inner"
                style={getUrduTextStyle(currentPage?.text || '', { fontSize: urduFontSize, fontStyle: urduFontStyle })}
                spellCheck={false}
              />
            </div>
          </div>
        )}

        {/* VIEW MODE: Page by Page */}
        {viewMode === 'page' && (
          <div className="p-4 sm:p-6 bg-stone-50/30 dark:bg-stone-900">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-semibold text-stone-500">
                Page {currentPage?.pageNumber} of {docItem.pages.length} • Source: {currentPage?.source === 'ocr' ? 'OCR Engine' : 'Digital Text Layer'}
              </span>
              <span className="text-xs font-mono text-stone-400">
                {currentPage?.wordCount} words | {currentPage?.charCount} characters
              </span>
            </div>

            <textarea
              value={currentPage?.text || ''}
              dir="auto"
              onChange={(e) => {
                const newPageText = e.target.value;
                currentPage.text = newPageText;
                const newFullText = docItem.pages
                  .map((p) => `--- Page ${p.pageNumber} (${p.source === 'ocr' ? 'OCR' : 'Text Layer'}) ---\n${p.text}`)
                  .join('\n\n');
                onUpdateFullText(docItem.id, newFullText);
              }}
              className="w-full min-h-[460px] p-5 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none resize-y shadow-inner"
              style={getUrduTextStyle(currentPage?.text || '', { fontSize: urduFontSize, fontStyle: urduFontStyle })}
              spellCheck={false}
            />
          </div>
        )}

        {/* VIEW MODE: Full Combined Document */}
        {viewMode === 'full' && (
          <div className="p-4 sm:p-6 bg-stone-50/30 dark:bg-stone-900">
            <textarea
              value={docItem.fullText}
              dir="auto"
              onChange={(e) => onUpdateFullText(docItem.id, e.target.value)}
              placeholder="Extracted document text will appear here..."
              className="w-full min-h-[480px] p-5 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none resize-y shadow-inner"
              style={getUrduTextStyle(docItem.fullText, { fontSize: urduFontSize, fontStyle: urduFontStyle })}
              spellCheck={false}
            />
          </div>
        )}
      </div>
    </div>
  );
};
