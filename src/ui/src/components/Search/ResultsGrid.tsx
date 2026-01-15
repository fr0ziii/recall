import { motion, AnimatePresence } from 'framer-motion';
import type { SearchResult } from '../../types/recall';

interface ResultsGridProps {
  results: SearchResult[];
  query: string;
  isLoading?: boolean;
  modality: 'text' | 'image';
}

function ResultCard({ result, index, modality }: { result: SearchResult; index: number; modality: 'text' | 'image' }) {
  const scorePercent = Math.round(result.score * 100);
  const isHighScore = result.score > 0.8;
  const isMediumScore = result.score > 0.5;

  const imageUrl = result.payload?.['image_url'] as string | undefined;
  const isImage = modality === 'image' && !!imageUrl;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05, type: 'spring', damping: 20 }}
      className="relative group"
      style={{ '--glow-intensity': result.score } as React.CSSProperties}
    >
      <div
        className={`absolute inset-0 rounded-xl blur-xl transition-opacity duration-500 ${
          isHighScore ? 'bg-cyan/30' : isMediumScore ? 'bg-cyan/15' : 'bg-cyan/5'
        } opacity-0 group-hover:opacity-100`}
      />

      <div
        className={`relative glass rounded-xl overflow-hidden transition-all duration-300 ${
          isHighScore
            ? 'border-cyan/40 hover:border-cyan/60'
            : isMediumScore
            ? 'border-cyan/20 hover:border-cyan/40'
            : 'border-void-300 hover:border-void-200'
        }`}
      >
        {isImage && imageUrl && (
          <div className="aspect-video bg-void-200 overflow-hidden">
            <img
              src={imageUrl}
              alt="Result"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        <div className="p-4">
          <div className="flex items-start justify-between gap-4 mb-3">
            <span className="text-xs font-mono text-slate-500 truncate flex-1">
              {result.id}
            </span>
            <div className="flex items-center gap-2">
              <div className="relative w-12 h-1.5 bg-void-300 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${scorePercent}%` }}
                  transition={{ delay: index * 0.05 + 0.2, duration: 0.5 }}
                  className={`absolute inset-y-0 left-0 rounded-full ${
                    isHighScore ? 'bg-cyan' : isMediumScore ? 'bg-cyan/70' : 'bg-cyan/40'
                  }`}
                />
              </div>
              <span
                className={`text-xs font-mono ${
                  isHighScore ? 'text-cyan' : isMediumScore ? 'text-cyan/70' : 'text-slate-500'
                }`}
              >
                {scorePercent}%
              </span>
            </div>
          </div>

          {result.payload && Object.keys(result.payload).length > 0 && (
            <div className="space-y-1.5">
              {Object.entries(result.payload)
                .filter(([key]) => key !== 'image_url')
                .slice(0, 5)
                .map(([key, value]) => (
                  <div key={key} className="flex items-start gap-2 text-xs">
                    <span className="text-slate-500 font-mono shrink-0">{key}:</span>
                    <span className="text-slate-300 truncate">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value as string | number | boolean)}
                    </span>
                  </div>
                ))}
              {Object.keys(result.payload).filter((k) => k !== 'image_url').length > 5 && (
                <span className="text-xs text-slate-600">
                  +{Object.keys(result.payload).filter((k) => k !== 'image_url').length - 5} more fields
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function ResultsGrid({ results, query, isLoading, modality }: ResultsGridProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative">
          <div className="absolute inset-0 bg-cyan/20 rounded-full blur-xl animate-pulse" />
          <motion.div
            className="relative w-16 h-16 border-2 border-cyan border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </div>
        <p className="mt-4 text-sm text-slate-400 font-mono">Searching semantic space...</p>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-void-200 border border-void-300 flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <p className="text-slate-400">Enter a query to begin searching</p>
        <p className="text-xs text-slate-600 mt-1">Results will appear here</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-void-200 border border-void-300 flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-slate-400">No results found</p>
        <p className="text-xs text-slate-600 mt-1">Try adjusting your query or filters</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-400">
          <span className="text-cyan font-mono">{results.length}</span> results for{' '}
          <span className="text-slate-300">"{query}"</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {results.map((result, index) => (
            <ResultCard key={result.id} result={result} index={index} modality={modality} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
