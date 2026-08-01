import React, { useState } from 'react';
import { Languages, Check, Search, HelpCircle } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../constants/languages';

interface LanguageSelectorProps {
  selectedLanguages: string[];
  onChange: (languages: string[]) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguages,
  onChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showMore, setShowMore] = useState(false);

  const toggleLanguage = (code: string) => {
    if (selectedLanguages.includes(code)) {
      // Don't allow deselecting all languages
      if (selectedLanguages.length === 1) return;
      onChange(selectedLanguages.filter((l) => l !== code));
    } else {
      onChange([...selectedLanguages, code]);
    }
  };

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const popularLanguages = SUPPORTED_LANGUAGES.filter((l) => l.popular);

  return (
    <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4 sm:p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <Languages className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 uppercase tracking-wider font-mono">
            OCR Recognition Languages
          </h3>
        </div>
        <span className="text-xs text-stone-500 font-mono">
          Selected: <strong className="text-amber-600 dark:text-amber-400">{selectedLanguages.join(', ')}</strong>
        </span>
      </div>

      {/* Language Chips */}
      <div className="flex flex-wrap gap-2">
        {popularLanguages.map((lang) => {
          const isSelected = selectedLanguages.includes(lang.code);
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => toggleLanguage(lang.code)}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                isSelected
                  ? 'border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900 shadow-sm'
                  : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:border-stone-400'
              }`}
            >
              {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
              <span>{lang.name}</span>
              <span className="opacity-60 text-[10px] font-mono">({lang.nativeName})</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setShowMore(!showMore)}
          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-dashed border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 text-xs font-medium hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
        >
          {showMore ? 'Show Fewer Languages' : '+ More Languages...'}
        </button>
      </div>

      {/* Expanded Language Search Dropdown */}
      {showMore && (
        <div className="pt-2 border-t border-stone-200 dark:border-stone-800 space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              placeholder="Search language (e.g. Urdu, Arabic, Spanish...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="max-h-36 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-1">
            {filteredLanguages.map((lang) => {
              const isSelected = selectedLanguages.includes(lang.code);
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => toggleLanguage(lang.code)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs text-left transition-colors ${
                    isSelected
                      ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 font-semibold'
                      : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  <span className="truncate">{lang.name}</span>
                  {isSelected && <Check className="w-3 h-3 text-amber-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed font-mono">
        <HelpCircle className="w-3 h-3 inline mr-1 text-amber-500" />
        Selected language models download once on-device & remain cached locally in your browser. Select all languages present in your document.
      </p>
    </div>
  );
};
