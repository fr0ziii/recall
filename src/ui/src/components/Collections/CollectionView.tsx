import { useState } from 'react';
import { motion } from 'framer-motion';
import { SearchInterface } from '../Search/SearchInterface';
import { IngestPanel } from '../Documents/IngestPanel';
import { GlowButton } from '../Shared/GlowButton';
import { LoadingOverlay } from '../Shared/LoadingSpinner';
import { useCollection, useDeleteCollection } from '../../hooks/useRecall';

interface CollectionViewProps {
  collectionName: string;
  onBack: () => void;
}

export function CollectionView({ collectionName, onBack }: CollectionViewProps) {
  const [showIngest, setShowIngest] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const { data: collection, isLoading, isError } = useCollection(collectionName);
  const { mutateAsync: deleteCollection, isPending: isDeleting } = useDeleteCollection();

  const handleDelete = async () => {
    try {
      await deleteCollection(collectionName);
      onBack();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="relative min-h-[400px]">
        <LoadingOverlay message="Loading collection..." />
      </div>
    );
  }

  if (isError || !collection) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-slate-400 mb-4">Failed to load collection</p>
        <GlowButton variant="cyan" size="sm" onClick={onBack}>
          Go Back
        </GlowButton>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute top-0 right-0 flex items-center gap-2">
        <GlowButton variant="amber" size="sm" onClick={() => setShowIngest(true)}>
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Ingest
          </span>
        </GlowButton>
        <button
          onClick={() => setShowDelete(true)}
          className="p-2 text-slate-500 hover:text-red-400 transition-colors"
          title="Delete collection"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <SearchInterface collection={collection} onBack={onBack} />

      <IngestPanel
        collectionName={collectionName}
        isOpen={showIngest}
        onClose={() => setShowIngest(false)}
      />

      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-void/80 backdrop-blur-sm"
            onClick={() => setShowDelete(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative glass rounded-2xl p-6 max-w-md w-full"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-100">Delete Collection</h3>
                <p className="text-sm text-slate-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 mb-6">
              Are you sure you want to delete{' '}
              <span className="text-red-400 font-mono">{collectionName}</span>? All documents and
              vectors will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDelete(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="btn-danger flex-1"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
