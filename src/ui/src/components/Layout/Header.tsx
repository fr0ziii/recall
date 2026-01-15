import { motion } from 'framer-motion';
import { useHealthCheck } from '../../hooks/useRecall';

export function Header() {
  const { data: health, isError } = useHealthCheck();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-cyan rounded-full blur-lg opacity-30" />
            <svg className="relative w-8 h-8" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="25" fill="none" stroke="#00f0ff" strokeWidth="2" />
              <circle cx="50" cy="50" r="8" fill="#00f0ff" />
              <circle cx="35" cy="35" r="3" fill="#ffb347" />
              <circle cx="70" cy="40" r="2" fill="#a78bfa" />
              <circle cx="60" cy="70" r="2.5" fill="#ffb347" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">Recall</h1>
            <p className="text-xs text-slate-500 font-mono">Semantic Search Engine</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isError ? 'bg-red-500' : health?.status === 'healthy' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <span className="text-xs font-mono text-slate-500">
              {isError ? 'Disconnected' : health?.status === 'healthy' ? 'Connected' : 'Connecting...'}
            </span>
          </div>
        </motion.div>
      </div>
    </header>
  );
}
