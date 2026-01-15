import { motion, AnimatePresence } from 'framer-motion';
import { CollectionCard } from './CollectionCard';
import { LoadingSpinner } from '../Shared/LoadingSpinner';
import { useCollections, useCollection, useDeleteCollection } from '../../hooks/useRecall';

interface CollectionGridProps {
  onSelectCollection: (name: string) => void;
  onCreateCollection: () => void;
}

function CollectionOrb({
  name,
  onSelect,
  onDelete,
}: {
  name: string;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const { data: collection, isLoading } = useCollection(name);

  if (isLoading || !collection) {
    return (
      <div className="bg-white rounded-2xl p-6 animate-pulse border border-cloud-300 shadow-soft">
        <div className="w-12 h-12 rounded-xl bg-cloud-200 mb-4" />
        <div className="h-5 bg-cloud-200 rounded w-3/4 mb-2" />
        <div className="h-3 bg-cloud-200 rounded w-1/2" />
      </div>
    );
  }

  return <CollectionCard collection={collection} onSelect={onSelect} onDelete={onDelete} />;
}

export function CollectionGrid({ onSelectCollection, onCreateCollection }: CollectionGridProps) {
  const { data: collections, isLoading, isError } = useCollections();
  const { mutateAsync: deleteCollection } = useDeleteCollection();

  const handleDelete = async (name: string) => {
    if (confirm(`Delete collection "${name}"? This cannot be undone.`)) {
      await deleteCollection(name);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-ink-100 font-medium text-sm">Loading collections...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-20 h-20 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-ink-200 mb-2 font-medium">Failed to load collections</p>
        <p className="text-xs text-ink-50">Make sure the API server is running</p>
      </div>
    );
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-ink mb-2 font-display">Collections</h1>
        <p className="text-ink-100">
          Manage your semantic search collections and explore the vector space
        </p>
      </motion.div>

      {collections && collections.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-24"
        >
          <div className="relative mb-8">
            <div className="relative w-32 h-32 rounded-full bg-cloud-200 border-2 border-dashed border-cloud-400 flex items-center justify-center">
              <svg className="w-12 h-12 text-ink-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-ink mb-2 font-display">No collections yet</h2>
          <p className="text-ink-100 mb-6 text-center max-w-md">
            Create your first collection to start storing and searching through your data using
            semantic embeddings.
          </p>
          <motion.button
            onClick={onCreateCollection}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Collection
          </motion.button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {collections?.map((name) => (
              <CollectionOrb
                key={name}
                name={name}
                onSelect={() => onSelectCollection(name)}
                onDelete={() => handleDelete(name)}
              />
            ))}
          </AnimatePresence>

          <motion.button
            layout
            onClick={onCreateCollection}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="relative group min-h-[200px] rounded-2xl border-2 border-dashed border-cloud-400 hover:border-apple transition-all duration-200 flex flex-col items-center justify-center bg-cloud-100 hover:bg-apple-50"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-cloud-200 border border-cloud-400 group-hover:border-apple-200 group-hover:bg-apple-100 flex items-center justify-center mb-4 transition-all">
                <svg
                  className="w-8 h-8 text-ink-50 group-hover:text-apple transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-ink-100 group-hover:text-apple transition-colors font-medium">
                New Collection
              </p>
            </div>
          </motion.button>
        </div>
      )}
    </div>
  );
}
