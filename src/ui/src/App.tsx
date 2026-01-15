import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { ParticleField } from './components/Shared/ParticleField';
import { Header } from './components/Layout/Header';
import { CollectionGrid } from './components/Collections/CollectionGrid';
import { CollectionView } from './components/Collections/CollectionView';
import { CreateCollectionModal } from './components/Collections/CreateCollectionModal';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10000,
      retry: 1,
    },
  },
});

function AppContent() {
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="min-h-screen relative bg-cloud-100">
      <ParticleField />
      <div className="gradient-mesh fixed inset-0 pointer-events-none" />

      <Header />

      <main className="relative z-10 pt-[89px] px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {selectedCollection ? (
              <motion.div
                key="collection-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <CollectionView
                  collectionName={selectedCollection}
                  onBack={() => setSelectedCollection(null)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="collection-grid"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <CollectionGrid
                  onSelectCollection={setSelectedCollection}
                  onCreateCollection={() => setShowCreateModal(true)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <CreateCollectionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
