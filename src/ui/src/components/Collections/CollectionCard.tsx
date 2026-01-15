import { motion } from 'framer-motion';
import type { Collection } from '../../types/recall';

interface CollectionCardProps {
  collection: Collection;
  onSelect: () => void;
  onDelete: () => void;
}

export function CollectionCard({ collection, onSelect, onDelete }: CollectionCardProps) {
  const isText = collection.embedding_config.modality === 'text';
  const accentColor = isText ? 'cyan' : 'amber';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      className="group relative"
    >
      <div
        className={`absolute inset-0 bg-${accentColor}/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300`}
      />
      <div className="relative glass rounded-2xl p-6 cursor-pointer" onClick={onSelect}>
        <div className="flex items-start justify-between mb-4">
          <div
            className={`w-12 h-12 rounded-xl bg-${accentColor}/10 border border-${accentColor}/30 flex items-center justify-center`}
          >
            {isText ? (
              <svg className={`w-6 h-6 text-${accentColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
              </svg>
            ) : (
              <svg className={`w-6 h-6 text-${accentColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        <h3 className="text-lg font-semibold text-slate-100 mb-2 truncate">{collection.name}</h3>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500">Model:</span>
            <span className={`text-xs font-mono text-${accentColor}`}>
              {collection.embedding_config.model}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500">Modality:</span>
            <span
              className={`px-2 py-0.5 text-xs font-mono rounded-full bg-${accentColor}/10 text-${accentColor} border border-${accentColor}/30`}
            >
              {collection.embedding_config.modality}
            </span>
          </div>
          {Object.keys(collection.index_schema).length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500">Fields:</span>
              <span className="text-xs font-mono text-slate-400">
                {Object.keys(collection.index_schema).length}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
