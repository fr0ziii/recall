import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'cyan' | 'amber' | 'violet';
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

const colorClasses = {
  cyan: 'border-cyan',
  amber: 'border-amber',
  violet: 'border-violet',
};

export function LoadingSpinner({ size = 'md', color = 'cyan' }: LoadingSpinnerProps) {
  return (
    <motion.div
      className={`${sizeClasses[size]} border-2 ${colorClasses[color]} border-t-transparent rounded-full`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  );
}

export function LoadingOverlay({ message = 'Loading...' }: { message?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center bg-void/80 backdrop-blur-sm z-50"
    >
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-slate-400 font-mono text-sm">{message}</p>
    </motion.div>
  );
}
