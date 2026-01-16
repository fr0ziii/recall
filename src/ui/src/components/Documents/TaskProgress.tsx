import { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStatus } from '../../hooks/useRecall';
import type { JobStatus, JobStatusType } from '../../types/recall';

interface TaskProgressProps {
    taskId: string;
    onComplete?: () => void;
    onClose?: () => void;
}

const statusConfig: Record<JobStatusType, { color: string; bg: string; icon: string }> = {
    queued: { color: 'text-ink-50', bg: 'bg-cloud-300', icon: '○' },
    in_progress: { color: 'text-apple', bg: 'bg-apple-50', icon: '◐' },
    complete: { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: '✓' },
    failed: { color: 'text-red-500', bg: 'bg-red-50', icon: '✗' },
    not_found: { color: 'text-ink-50', bg: 'bg-cloud-200', icon: '?' },
};

// Memoized job item to skip re-render when job unchanged (Section 5.2)
const JobStatusItem = memo(function JobStatusItem({
    job,
    index
}: {
    job: JobStatus;
    index: number;
}) {
    const config = statusConfig[job.status];

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.02 }}
            className={`flex items-center gap-3 p-2 rounded-lg ${config.bg}`}
        >
            <span className={`text-sm font-medium ${config.color}`}>
                {config.icon}
            </span>
            <span className="text-xs font-mono text-ink-200 truncate flex-1">
                {job.doc_id}
            </span>
            <span className={`text-xs font-medium ${config.color}`}>
                {job.status.replace('_', ' ')}
            </span>
        </motion.div>
    );
});

export function TaskProgress({ taskId, onComplete, onClose }: TaskProgressProps) {
    // Lazy initialization for expanded state (Section 5.5)
    const [expanded, setExpanded] = useState(() => false);

    const { data, isLoading, isFetching } = useTaskStatus(taskId);

    // Narrow dependencies: trigger onComplete only when complete count changes (Section 5.3)
    const completeCount = data?.summary.complete ?? 0;
    const failedCount = data?.summary.failed ?? 0;
    const totalCount = data?.summary.total ?? 0;
    const isFinished = totalCount > 0 && completeCount + failedCount >= totalCount;

    useEffect(() => {
        if (isFinished && onComplete) {
            onComplete();
        }
    }, [isFinished, onComplete]);

    if (isLoading) {
        return (
            <div className="p-4 bg-cloud-100 rounded-xl border border-cloud-300">
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-apple border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-ink-200">Loading task status...</span>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                <p className="text-sm text-red-600">Failed to load task status</p>
            </div>
        );
    }

    const { summary, jobs } = data;
    const progress = totalCount > 0 ? ((completeCount + failedCount) / totalCount) * 100 : 0;
    const hasFailures = failedCount > 0;
    const allComplete = completeCount === totalCount && totalCount > 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-cloud-100 rounded-xl border border-cloud-300"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    {isFinished ? (
                        allComplete ? (
                            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        ) : (
                            <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01" />
                                </svg>
                            </div>
                        )
                    ) : (
                        <div className="w-5 h-5 border-2 border-apple border-t-transparent rounded-full animate-spin" />
                    )}
                    <span className="text-sm font-medium text-ink">
                        {isFinished
                            ? (allComplete ? 'Ingestion Complete' : 'Ingestion Finished with Errors')
                            : 'Processing Documents'
                        }
                    </span>
                </div>
                {isFetching && !isFinished && (
                    <span className="text-xs text-ink-50 animate-pulse">Updating...</span>
                )}
            </div>

            {/* Progress bar */}
            <div className="relative h-2 bg-cloud-300 rounded-full overflow-hidden mb-3">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={`absolute inset-y-0 left-0 rounded-full ${hasFailures ? 'bg-amber-500' : 'bg-apple'
                        }`}
                />
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="text-center p-2 bg-white rounded-lg border border-cloud-300">
                    <span className="text-lg font-semibold text-ink">{summary.total}</span>
                    <p className="text-xs text-ink-50">Total</p>
                </div>
                <div className="text-center p-2 bg-white rounded-lg border border-cloud-300">
                    <span className="text-lg font-semibold text-apple">{summary.queued + summary.in_progress}</span>
                    <p className="text-xs text-ink-50">Pending</p>
                </div>
                <div className="text-center p-2 bg-white rounded-lg border border-cloud-300">
                    <span className="text-lg font-semibold text-emerald-600">{summary.complete}</span>
                    <p className="text-xs text-ink-50">Complete</p>
                </div>
                <div className="text-center p-2 bg-white rounded-lg border border-cloud-300">
                    <span className={`text-lg font-semibold ${summary.failed > 0 ? 'text-red-500' : 'text-ink-50'}`}>
                        {summary.failed}
                    </span>
                    <p className="text-xs text-ink-50">Failed</p>
                </div>
            </div>

            {/* Expandable job list */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-2 text-sm text-ink-100 hover:text-ink hover:bg-cloud-200 rounded-lg transition-colors"
            >
                <span>{expanded ? 'Hide' : 'Show'} job details</span>
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

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                            {jobs.map((job, index) => (
                                <JobStatusItem key={job.doc_id} job={job} index={index} />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Close button when finished */}
            {isFinished && onClose && (
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={onClose}
                    className="mt-3 w-full py-2 px-4 bg-apple text-white text-sm font-medium rounded-xl hover:bg-apple-600 transition-colors"
                >
                    Done
                </motion.button>
            )}
        </motion.div>
    );
}
