import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchInterface } from '../Search/SearchInterface';
import { IngestPanel } from '../Documents/IngestPanel';
import { DocumentBrowser } from '../Documents/DocumentBrowser';
import { GlowButton } from '../Shared/GlowButton';
import { LoadingOverlay } from '../Shared/LoadingSpinner';
import { useCollection, useDeleteCollection } from '../../hooks/useRecall';

interface CollectionViewProps {
  collectionName: string;
  onBack: () => void;
}

type ViewTab = 'search' | 'browse';

export function CollectionView({ collectionName, onBack }: CollectionViewProps) {
  const [activeTab, setActiveTab] = useState<ViewTab>('search');
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
        <div className="w-20 h-20 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-ink-200 mb-4 font-medium">Failed to load collection</p>
        <GlowButton variant="apple" size="sm" onClick={onBack}>
          Go Back
        </GlowButton>
      </div>
    );
  }

  const modality = collection.embedding_config.modality;
  const isText = modality === 'text';

  return (
    <div className="relative">
      {/* Header with back button, collection info, and actions */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
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

        <div className="flex items-center justify-between">
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

          <div className="flex items-center gap-2">
            <GlowButton variant="apricot" size="sm" onClick={() => setShowIngest(true)}>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Ingest
              </span>
            </GlowButton>
            <button
              onClick={() => setShowDelete(true)}
              className="p-2 text-ink-50 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              title="Delete collection"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Tab navigation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="flex gap-1 bg-cloud-200 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('search')}
            className={`tab-button ${activeTab === 'search' ? 'active' : ''}`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              Search
            </span>
          </button>
          <button
            onClick={() => setActiveTab('browse')}
            className={`tab-button ${activeTab === 'browse' ? 'active' : ''}`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Browse
            </span>
          </button>
        </div>
      </motion.div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === 'search' ? (
          <motion.div
            key="search"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <SearchInterface collection={collection} onBack={onBack} />
          </motion.div>
        ) : (
          <motion.div
            key="browse"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <DocumentBrowser collectionName={collectionName} />
          </motion.div>
        )}
      </AnimatePresence>

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
            className="absolute inset-0 bg-ink/20 backdrop-blur-sm"
            onClick={() => setShowDelete(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white rounded-2xl p-6 max-w-md w-full shadow-soft-xl border border-cloud-300"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-ink font-display">Delete Collection</h3>
                <p className="text-sm text-ink-50">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-ink-200 mb-6">
              Are you sure you want to delete{' '}
              <span className="text-red-500 font-medium">{collectionName}</span>? All documents and
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
