import { motion } from 'framer-motion';

interface GlowButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'apple' | 'apricot' | 'grape';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}

const variantStyles = {
  apple: {
    base: 'bg-apple text-white',
    hover: 'hover:bg-apple-600',
    shadow: 'hover:shadow-soft-md',
  },
  apricot: {
    base: 'bg-apricot text-white',
    hover: 'hover:bg-apricot-600',
    shadow: 'hover:shadow-soft-md',
  },
  grape: {
    base: 'bg-cloud-200 text-ink-200 border border-cloud-400',
    hover: 'hover:bg-cloud-300 hover:text-ink',
    shadow: 'hover:shadow-soft',
  },
};

const sizeStyles = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export function GlowButton({
  children,
  onClick,
  variant = 'apple',
  size = 'md',
  disabled = false,
  type = 'button',
  className = '',
}: GlowButtonProps) {
  const styles = variantStyles[variant];

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.01 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`
        relative rounded-xl font-medium
        ${styles.base}
        ${!disabled && styles.hover} ${!disabled && styles.shadow}
        ${sizeStyles[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        transition-all duration-200
        ${className}
      `}
    >
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
