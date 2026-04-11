import React from 'react';
import { Search, MapPin, History, Car, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Suggestion {
  id: string;
  text: string;
  type: 'vehicle' | 'location' | 'history' | 'combined';
  subtext?: string;
  state?: string;
}

interface SearchSuggestionsProps {
  suggestions: Suggestion[];
  onSelect: (suggestion: Suggestion) => void;
  query: string;
  isVisible: boolean;
}

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({ 
  suggestions, 
  onSelect, 
  query,
  isVisible 
}) => {
  if (!isVisible || (query.length === 0 && suggestions.length === 0)) return null;

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => (
          <span 
            key={i} 
            className={part.toLowerCase() === highlight.toLowerCase() ? "text-primary font-bold" : ""}
          >
            {part}
          </span>
        ))}
      </span>
    );
  };

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="max-h-[400px] overflow-y-auto no-scrollbar">
        {suggestions.length > 0 ? (
          <div className="py-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => onSelect(suggestion)}
                className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  {suggestion.type === 'vehicle' && <Car size={18} />}
                  {suggestion.type === 'location' && <MapPin size={18} />}
                  {suggestion.type === 'history' && <History size={18} />}
                  {suggestion.type === 'combined' && <Search size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">
                    {highlightText(suggestion.text, query)}
                  </div>
                  {suggestion.subtext && (
                    <div className="text-xs text-slate-500 truncate">
                      {suggestion.subtext}
                    </div>
                  )}
                </div>
                <ArrowUpRight size={16} className="text-slate-300 group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        ) : query.length > 0 ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <Search size={24} />
            </div>
            <p className="text-sm font-medium text-slate-900">No matches found</p>
            <p className="text-xs text-slate-500">Try searching for brands like "Maruti" or "Swift"</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SearchSuggestions;
