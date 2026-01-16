import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDocuments } from '../../hooks/useRecall';
import type { DocumentPoint } from '../../types/recall';

interface DocumentBrowserProps {
    collectionName: string;
}

// Memoized document card (Section 5.2)
const DocumentCard = memo(function DocumentCard({
    document,
    index,
}: {
    document: DocumentPoint;
    index: number;
}) {
    const [expanded, setExpanded] = useState(false);
    const payload = document.payload || {};
    const payloadKeys = Object.keys(payload).filter(k => k !== '_doc_id');
    const hasPayload = payloadKeys.length > 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, type: 'spring', damping: 20 }}
            className="document-card bg-white rounded-xl border border-cloud-300 overflow-hidden hover:border-cloud-400 hover:shadow-soft transition-all"
        >
            <div className="p-4">
                {/* Header with ID */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                        <span className="text-xs font-mono text-ink-50 truncate block">
                            {document.id}
                        </span>
                    </div>
                    {hasPayload && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="shrink-0 p-1.5 text-ink-50 hover:text-ink hover:bg-cloud-200 rounded-lg transition-colors"
                        >
                            <motion.svg
                                animate={{ rotate: expanded ? 180 : 0 }}
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </motion.svg>
                        </button>
                    )}
                </div>

                {/* Payload preview (first 3 fields) */}
                {hasPayload && !expanded && (
                    <div className="space-y-1">
                        {payloadKeys.slice(0, 3).map((key) => (
                            <div key={key} className="flex items-start gap-2 text-xs">
                                <span className="text-ink-50 font-medium shrink-0">{key}:</span>
                                <span className="text-ink-200 truncate">
                                    {typeof payload[key] === 'object'
                                        ? JSON.stringify(payload[key])
                                        : String(payload[key] as string | number | boolean)}
                                </span>
                            </div>
                        ))}
                        {payloadKeys.length > 3 && (
                            <span className="text-xs text-ink-50">
                                +{payloadKeys.length - 3} more fields
                            </span>
                        )}
                    </div>
                )}

                {/* Expanded payload view */}
                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <pre className="text-xs bg-cloud-100 p-3 rounded-lg overflow-x-auto font-mono text-ink-200">
                                {JSON.stringify(payload, null, 2)}
                            </pre>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
});

export function DocumentBrowser({ collectionName }: DocumentBrowserProps) {
    const [offset, setOffset] = useState(0);
    const limit = 20;

    const { data, isLoading, isFetching } = useDocuments(collectionName, limit, offset);

    const handleLoadMore = () => {
        setOffset((prev) => prev + limit);
    };

    const hasMore = data ? offset + data.documents.length < data.total : false;
    const totalLoaded = data ? Math.min(offset + data.documents.length, data.total) : 0;

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="h-6 w-32 bg-cloud-300 rounded animate-pulse" />
                    <div className="h-6 w-24 bg-cloud-300 rounded animate-pulse" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className="h-32 bg-cloud-200 rounded-xl animate-pulse"
                            style={{ animationDelay: `${i * 100}ms` }}
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (!data || data.documents.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-cloud-200 border border-cloud-300 flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-ink-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                    </svg>
                </div>
                <p className="text-ink-200 font-medium">No documents yet</p>
                <p className="text-xs text-ink-50 mt-1">Ingest documents to see them here</p>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-ink-100">
                    Showing <span className="text-apple font-medium">{totalLoaded}</span> of{' '}
                    <span className="text-ink font-medium">{data.total}</span> documents
                </p>
                {isFetching && (
                    <div className="flex items-center gap-2 text-xs text-ink-50">
                        <div className="w-3 h-3 border-2 border-apple border-t-transparent rounded-full animate-spin" />
                        Loading...
                    </div>
                )}
            </div>

            {/* Document grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                    {data.documents.map((doc, index) => (
                        <DocumentCard key={doc.id} document={doc} index={index} />
                    ))}
                </AnimatePresence>
            </div>

            {/* Load more button */}
            {hasMore && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-6 flex justify-center"
                >
                    <button
                        onClick={handleLoadMore}
                        disabled={isFetching}
                        className="px-6 py-3 bg-cloud-200 border border-cloud-400 text-ink-200 font-medium rounded-xl hover:bg-cloud-300 hover:border-cloud-400 hover:text-ink disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isFetching ? 'Loading...' : `Load More (${data.total - totalLoaded} remaining)`}
                    </button>
                </motion.div>
            )}
        </div>
    );
}
