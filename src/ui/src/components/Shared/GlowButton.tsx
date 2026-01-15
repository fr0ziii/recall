import { motion } from 'framer-motion';

interface GlowButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'cyan' | 'amber' | 'violet';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}

const variantStyles = {
  cyan: {
    bg: 'bg-cyan/10',
    border: 'border-cyan/30',
    text: 'text-cyan',
    hoverBg: 'hover:bg-cyan/20',
    hoverBorder: 'hover:border-cyan/50',
    shadow: 'hover:shadow-glow-cyan',
    glow: 'bg-cyan',
  },
  amber: {
    bg: 'bg-amber/10',
    border: 'border-amber/30',
    text: 'text-amber',
    hoverBg: 'hover:bg-amber/20',
    hoverBorder: 'hover:border-amber/50',
    shadow: 'hover:shadow-glow-amber',
    glow: 'bg-amber',
  },
  violet: {
    bg: 'bg-violet/10',
    border: 'border-violet/30',
    text: 'text-violet',
    hoverBg: 'hover:bg-violet/20',
    hoverBorder: 'hover:border-violet/50',
    shadow: 'hover:shadow-glow-violet',
    glow: 'bg-violet',
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
  variant = 'cyan',
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
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`
        relative rounded-lg font-medium border
        ${styles.bg} ${styles.border} ${styles.text}
        ${!disabled && styles.hoverBg} ${!disabled && styles.hoverBorder} ${!disabled && styles.shadow}
        ${sizeStyles[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        transition-all duration-200
        ${className}
      `}
    >
      <span className="relative z-10">{children}</span>
      <motion.div
        className={`absolute inset-0 ${styles.glow} rounded-lg opacity-0 blur-xl`}
        initial={false}
        whileHover={{ opacity: disabled ? 0 : 0.15 }}
        transition={{ duration: 0.2 }}
      />
    </motion.button>
  );
}
