import { motion } from 'framer-motion';
import { useCollections } from '../../hooks/useRecall';
import { LoadingSpinner } from '../Shared/LoadingSpinner';

interface SidebarProps {
  selectedCollection: string | null;
  onSelectCollection: (name: string | null) => void;
  onCreateCollection: () => void;
}

export function Sidebar({ selectedCollection, onSelectCollection, onCreateCollection }: SidebarProps) {
  const { data: collections, isLoading, isError } = useCollections();

  return (
    <aside className="fixed left-0 top-[73px] bottom-0 w-64 glass border-r border-white/5 overflow-hidden flex flex-col z-30">
      <div className="p-4 border-b border-white/5">
        <button
          onClick={onCreateCollection}
          className="w-full btn-primary flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Collection
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-3">
          Collections
        </h3>

        {isLoading && (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="sm" />
          </div>
        )}

        {isError && (
          <div className="text-center py-8">
            <p className="text-sm text-red-400">Failed to load collections</p>
          </div>
        )}

        {collections && collections.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-slate-500">No collections yet</p>
            <p className="text-xs text-slate-600 mt-1">Create one to get started</p>
          </div>
        )}

        <div className="space-y-1">
          {collections?.map((name, index) => (
            <motion.button
              key={name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelectCollection(selectedCollection === name ? null : name)}
              className={`
                w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200
                flex items-center gap-3 group
                ${selectedCollection === name
                  ? 'bg-cyan/10 border border-cyan/30 text-cyan'
                  : 'hover:bg-void-200/50 text-slate-400 hover:text-slate-200 border border-transparent'
                }
              `}
            >
              <div
                className={`
                  w-2 h-2 rounded-full transition-colors
                  ${selectedCollection === name ? 'bg-cyan' : 'bg-slate-600 group-hover:bg-slate-400'}
                `}
              />
              <span className="font-mono text-sm truncate">{name}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-white/5">
        <div className="text-xs text-slate-600 font-mono">
          {collections?.length ?? 0} collection{(collections?.length ?? 0) !== 1 ? 's' : ''}
        </div>
      </div>
    </aside>
  );
}
