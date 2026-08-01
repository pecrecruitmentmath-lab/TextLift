import React from 'react';
import { FileText, Image as ImageIcon, FileCode, CheckCircle2, AlertCircle, Loader2, Trash2, Eye, Play } from 'lucide-react';
import { DocumentItem } from '../types';

interface BatchQueueProps {
  documents: DocumentItem[];
  activeDocId: string | null;
  onSelectDoc: (id: string) => void;
  onRemoveDoc: (id: string) => void;
  onProcessDoc: (id: string) => void;
  onProcessAll: () => void;
  isProcessingAny: boolean;
}

export const BatchQueue: React.FC<BatchQueueProps> = ({
  documents,
  activeDocId,
  onSelectDoc,
  onRemoveDoc,
  onProcessDoc,
  onProcessAll,
  isProcessingAny,
}) => {
  if (documents.length === 0) return null;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const idleOrErrorDocs = documents.filter((d) => d.status === 'idle' || d.status === 'error');

  return (
    <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4 sm:p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 uppercase tracking-wider font-mono flex items-center space-x-2">
          <span>Document Queue ({documents.length})</span>
        </h3>

        {idleOrErrorDocs.length > 0 && (
          <button
            type="button"
            onClick={onProcessAll}
            disabled={isProcessingAny}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-stone-950 font-semibold text-xs shadow-sm transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Extract All ({idleOrErrorDocs.length})</span>
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {documents.map((doc) => {
          const isActive = doc.id === activeDocId;

          return (
            <div
              key={doc.id}
              onClick={() => onSelectDoc(doc.id)}
              className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all cursor-pointer ${
                isActive
                  ? 'border-stone-900 dark:border-stone-100 bg-stone-50 dark:bg-stone-800 shadow-sm'
                  : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50/70 dark:hover:bg-stone-850'
              }`}
            >
              {/* Left File Info */}
              <div className="flex items-start space-x-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0 border border-stone-200 dark:border-stone-700">
                  {doc.typeCategory === 'pdf' && <FileText className="w-5 h-5 text-red-500" />}
                  {doc.typeCategory === 'image' && <ImageIcon className="w-5 h-5 text-blue-500" />}
                  {doc.typeCategory === 'text' && <FileCode className="w-5 h-5 text-emerald-500" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">
                      {doc.name}
                    </h4>
                    <span className="text-[10px] font-mono text-stone-400">
                      ({formatSize(doc.size)})
                    </span>
                  </div>

                  {/* Status indicator message */}
                  <div className="flex items-center space-x-2 text-[11px] mt-0.5">
                    {doc.status === 'idle' && (
                      <span className="text-stone-500 dark:text-stone-400 font-mono">
                        Ready to extract
                      </span>
                    )}

                    {doc.status === 'processing' && (
                      <span className="text-amber-600 dark:text-amber-400 font-mono flex items-center space-x-1">
                        <Loader2 className="w-3 h-3 animate-spin inline" />
                        <span className="truncate max-w-xs">{doc.progressMessage || 'Processing...'}</span>
                      </span>
                    )}

                    {doc.status === 'completed' && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono flex items-center space-x-1 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 inline" />
                        <span>
                          {doc.totalPages} page{doc.totalPages > 1 ? 's' : ''} ({doc.ocrPageCount} OCR'd)
                        </span>
                      </span>
                    )}

                    {doc.status === 'error' && (
                      <span className="text-red-600 dark:text-red-400 font-mono flex items-center space-x-1">
                        <AlertCircle className="w-3.5 h-3.5 inline" />
                        <span className="truncate max-w-xs">{doc.error || 'Failed'}</span>
                      </span>
                    )}
                  </div>

                  {/* Progress bar during processing */}
                  {doc.status === 'processing' && (
                    <div className="w-full bg-stone-200 dark:bg-stone-700 h-1 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="bg-amber-500 h-full transition-all duration-200"
                        style={{ width: `${Math.round(doc.progress * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Right Action Buttons */}
              <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                {doc.status === 'idle' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onProcessDoc(doc.id);
                    }}
                    disabled={isProcessingAny}
                    className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-semibold cursor-pointer"
                  >
                    Extract
                  </button>
                )}

                {doc.status === 'completed' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDoc(doc.id);
                    }}
                    className="px-2.5 py-1 rounded border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-medium flex items-center space-x-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Text</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveDoc(doc.id);
                  }}
                  title="Remove document"
                  className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-950/50 text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
