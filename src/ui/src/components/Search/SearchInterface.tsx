import { useState } from 'react';
import { motion } from 'framer-motion';
import { QueryInput } from './QueryInput';
import { FilterBuilder } from './FilterBuilder';
import { ResultsGrid } from './ResultsGrid';
import { useSearch } from '../../hooks/useRecall';
import type { Collection, FilterCondition, SearchResponse } from '../../types/recall';

interface SearchInterfaceProps {
  collection: Collection;
  onBack: () => void;
}

export function SearchInterface({ collection, onBack }: SearchInterfaceProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterCondition | null>(null);
  const [limit, setLimit] = useState(10);
  const [results, setResults] = useState<SearchResponse | null>(null);

  const { mutateAsync: search, isPending } = useSearch(collection.name);

  const handleSearch = async () => {
    if (!query.trim()) return;

    try {
      const response = await search({
        query: query.trim(),
        filter: filter || undefined,
        limit,
        with_payload: true,
      });
      setResults(response);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const modality = collection.embedding_config.modality;
  const isText = modality === 'text';

  return (
    <div className="min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-ink-100 hover:text-ink transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Back to collections</span>
        </button>

        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${isText
                ? 'bg-apple-50 border border-apple-100'
                : 'bg-apricot-50 border border-apricot-100'
              }`}
          >
            {modality === 'text' ? (
              <svg className="w-6 h-6 text-apple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-apricot" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ink font-display">{collection.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-xs font-medium ${isText ? 'text-apple' : 'text-apricot'}`}>
                {collection.embedding_config.model}
              </span>
              <span className="text-xs text-ink-50">|</span>
              <span className="text-xs font-medium text-ink-100">
                {modality} embeddings
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <QueryInput
          value={query}
          onChange={setQuery}
          onSubmit={handleSearch}
          isLoading={isPending}
          modality={modality}
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1 space-y-4"
        >
          <FilterBuilder
            schema={collection.index_schema}
            filter={filter}
            onChange={setFilter}
          />

          <div className="bg-white rounded-xl p-4 border border-cloud-300 shadow-soft">
            <h3 className="text-sm font-medium text-ink-200 mb-3">Options</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-ink-50 block mb-1 font-medium">Results limit</label>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="input-glow w-full text-sm py-2"
                >
                  {[5, 10, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n} results
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-3"
        >
          <ResultsGrid
            results={results?.results || []}
            query={results?.query || ''}
            isLoading={isPending}
            modality={modality}
          />
        </motion.div>
      </div>
    </div>
  );
}
