import { motion } from 'framer-motion';
import { useHealthCheck } from '../../hooks/useRecall';

export function Header() {
  const { data: health, isError } = useHealthCheck();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/70 backdrop-blur-xl border-b border-cloud-300/50 shadow-soft">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="relative">
            <svg className="relative w-8 h-8" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="25" fill="none" stroke="#007AFF" strokeWidth="2.5" />
              <circle cx="50" cy="50" r="8" fill="#007AFF" />
              <circle cx="35" cy="35" r="3.5" fill="#FF9500" />
              <circle cx="70" cy="40" r="2.5" fill="#AF52DE" />
              <circle cx="60" cy="70" r="3" fill="#FF9500" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink tracking-tight font-display">Recall</h1>
            <p className="text-xs text-ink-50 font-medium">Semantic Search Engine</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cloud-200">
            <div
              className={`w-2 h-2 rounded-full ${isError ? 'bg-red-500' : health?.status === 'healthy' ? 'bg-emerald-500' : 'bg-apricot'
                }`}
            />
            <span className="text-xs font-medium text-ink-100">
              {isError ? 'Disconnected' : health?.status === 'healthy' ? 'Connected' : 'Connecting...'}
            </span>
          </div>
        </motion.div>
      </div>
    </header>
  );
}
