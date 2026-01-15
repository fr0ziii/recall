import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'apple' | 'apricot' | 'grape';
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

const colorClasses = {
  apple: 'border-apple',
  apricot: 'border-apricot',
  grape: 'border-grape',
};

export function LoadingSpinner({ size = 'md', color = 'apple' }: LoadingSpinnerProps) {
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
      className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-50 rounded-2xl"
    >
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-ink-100 font-medium text-sm">{message}</p>
    </motion.div>
  );
}
