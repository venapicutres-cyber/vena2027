import React from 'react';

export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

export interface ModernBadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
  primary: {
    bg: 'bg-[#ECF2FF]',
    text: 'text-[#5D87FF]',
    dot: 'bg-[#5D87FF]',
  },
  secondary: {
    bg: 'bg-[#E8F7FF]',
    text: 'text-[#49BEFF]',
    dot: 'bg-[#49BEFF]',
  },
  success: {
    bg: 'bg-[#E6FFFA]',
    text: 'text-[#13DEB9]',
    dot: 'bg-[#13DEB9]',
  },
  warning: {
    bg: 'bg-[#FEF5E5]',
    text: 'text-[#FFAE1F]',
    dot: 'bg-[#FFAE1F]',
  },
  error: {
    bg: 'bg-[#FDEDE8]',
    text: 'text-[#FA896B]',
    dot: 'bg-[#FA896B]',
  },
  info: {
    bg: 'bg-[#EBF3FE]',
    text: 'text-[#539BFF]',
    dot: 'bg-[#539BFF]',
  },
};

const sizeStyles = {
  sm: 'text-[9px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 font-semibold',
  md: 'text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 font-semibold',
  lg: 'text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1.5 font-bold',
};

/**
 * Modernize Badge Component (Tailwind CSS implementation)
 * Features signature soft pastel background with vibrant foreground text.
 */
export const ModernBadge: React.FC<ModernBadgeProps> = ({
  variant = 'primary',
  children,
  size = 'md',
  className = '',
  dot = false,
}) => {
  const styles = variantStyles[variant] || variantStyles.primary;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        rounded-full
        ${styles.bg}
        ${styles.text}
        ${sizeStyles[size]}
        leading-tight
        whitespace-nowrap
        select-none
        ${className}
      `}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />}
      {children}
    </span>
  );
};

export default ModernBadge;
