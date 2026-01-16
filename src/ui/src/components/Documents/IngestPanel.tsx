import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlowButton } from '../Shared/GlowButton';
import { TaskProgress } from './TaskProgress';
import { useIngestDocuments } from '../../hooks/useRecall';
import type { Document, IngestResponse } from '../../types/recall';

interface IngestPanelProps {
  collectionName: string;
  isOpen: boolean;
  onClose: () => void;
}

type InputMode = 'text' | 'json' | 'urls';

export function IngestPanel({ collectionName, isOpen, onClose }: IngestPanelProps) {
  const [mode, setMode] = useState<InputMode>('text');
  const [textContent, setTextContent] = useState('');
  const [jsonContent, setJsonContent] = useState('');
  const [urlsContent, setUrlsContent] = useState('');
  const [result, setResult] = useState<IngestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { mutateAsync: ingest, isPending } = useIngestDocuments(collectionName);

  const parseDocuments = (): Document[] | null => {
    try {
      if (mode === 'text') {
        const lines = textContent.split('\n').filter((l) => l.trim());
        return lines.map((line, i) => ({
          id: crypto.randomUUID(),
          content_raw: line.trim(),
          payload: { line_number: i + 1 },
        }));
      }

      if (mode === 'json') {
        const parsed = JSON.parse(jsonContent);
        const docs = Array.isArray(parsed) ? parsed : [parsed];
        return docs.map((doc) => ({
          id: doc.id || crypto.randomUUID(),
          content_raw: doc.content_raw || doc.content || doc.text,
          content_uri: doc.content_uri || doc.uri || doc.url,
          payload: doc.payload || doc.metadata || {},
        }));
      }

      if (mode === 'urls') {
        const urls = urlsContent.split('\n').filter((l) => l.trim());
        return urls.map((url) => ({
          id: crypto.randomUUID(),
          content_uri: url.trim(),
          payload: { source_url: url.trim() },
        }));
      }

      return null;
    } catch {
      return null;
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setResult(null);

    const documents = parseDocuments();
    if (!documents || documents.length === 0) {
      setError('No valid documents to ingest');
      return;
    }

    try {
      const response = await ingest({ documents });
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ingestion failed');
    }
  };

  const getDocumentCount = (): number => {
    const docs = parseDocuments();
    return docs?.length || 0;
  };

  const handleReset = () => {
    setTextContent('');
    setJsonContent('');
    setUrlsContent('');
    setResult(null);
    setError(null);
  };

  const handleTaskComplete = () => {
    // Could invalidate queries or show a notification here
  };

  const handleIngestMore = () => {
    handleReset();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-white border-l border-cloud-300 shadow-soft-xl z-50 flex flex-col"
          >
            <div className="p-6 border-b border-cloud-300">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-ink font-display">Ingest Documents</h2>
                  <p className="text-sm text-ink-100 mt-1">
                    Add documents to <span className="text-apple font-medium">{collectionName}</span>
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-ink-50 hover:text-ink-200 hover:bg-cloud-200 rounded-lg transition-all"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-6">
                <label className="text-sm text-ink-200 block mb-3 font-medium">Input Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: 'text', label: 'Plain Text', icon: '📝' },
                    { id: 'json', label: 'JSON', icon: '{ }' },
                    { id: 'urls', label: 'URLs', icon: '🔗' },
                  ] as const).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMode(m.id)}
                      className={`p-3 rounded-xl border text-center transition-all ${mode === m.id
                        ? 'bg-apple-50 border-apple text-apple'
                        : 'bg-cloud-100 border-cloud-400 text-ink-200 hover:border-ink-50'
                        }`}
                    >
                      <span className="block text-lg mb-1">{m.icon}</span>
                      <span className="text-xs font-medium">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <AnimatePresence mode="wait">
                {mode === 'text' && (
                  <motion.div
                    key="text"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <label className="text-sm text-ink-200 block mb-2 font-medium">
                      Text Content <span className="text-ink-50 font-normal">(one document per line)</span>
                    </label>
                    <textarea
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      placeholder="Enter text content, one document per line...&#10;&#10;The quick brown fox jumps over the lazy dog.&#10;Machine learning is transforming industries.&#10;Vector databases enable semantic search."
                      className="input-glow w-full h-64 font-mono text-sm resize-none"
                    />
                  </motion.div>
                )}

                {mode === 'json' && (
                  <motion.div
                    key="json"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <label className="text-sm text-ink-200 block mb-2 font-medium">
                      JSON Documents <span className="text-ink-50 font-normal">(array or single object)</span>
                    </label>
                    <textarea
                      value={jsonContent}
                      onChange={(e) => setJsonContent(e.target.value)}
                      placeholder={`[
  {
    "id": "doc-1",
    "content_raw": "Document text content",
    "payload": { "category": "example", "priority": 1 }
  },
  {
    "id": "doc-2",
    "content_uri": "https://example.com/image.jpg",
    "payload": { "category": "image" }
  }
]`}
                      className="input-glow w-full h-64 font-mono text-sm resize-none"
                    />
                  </motion.div>
                )}

                {mode === 'urls' && (
                  <motion.div
                    key="urls"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <label className="text-sm text-ink-200 block mb-2 font-medium">
                      Content URLs <span className="text-ink-50 font-normal">(one URL per line)</span>
                    </label>
                    <textarea
                      value={urlsContent}
                      onChange={(e) => setUrlsContent(e.target.value)}
                      placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg&#10;https://example.com/document.txt"
                      className="input-glow w-full h-64 font-mono text-sm resize-none"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl"
                >
                  <p className="text-sm text-red-600">{error}</p>
                </motion.div>
              )}

              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  <TaskProgress
                    taskId={result.task_id}
                    onComplete={handleTaskComplete}
                    onClose={handleIngestMore}
                  />
                </motion.div>
              )}
            </div>

            <div className="p-6 border-t border-cloud-300 bg-cloud-100">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-ink-100">
                  <span className="text-apple font-medium">{getDocumentCount()}</span> documents ready
                </span>
                <button
                  onClick={handleReset}
                  className="text-xs text-ink-50 hover:text-ink-200 font-medium transition-colors"
                >
                  Clear all
                </button>
              </div>
              <GlowButton
                variant="apple"
                size="md"
                onClick={handleSubmit}
                disabled={isPending || getDocumentCount() === 0}
                className="w-full"
              >
                {isPending ? 'Queuing...' : `Ingest ${getDocumentCount()} Documents`}
              </GlowButton>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
