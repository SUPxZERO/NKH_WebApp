import React from 'react';
import { cn } from '@/app/utils/cn';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  padding?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
  };
}

/**
 * Responsive container component with sensible padding
 * Default: 4 padding on mobile, 6 on tablet, 8 on desktop
 */
export function ResponsiveContainer({
  children,
  className,
  maxWidth = 'full',
  padding = { xs: '4', sm: '6', md: '8' }
}: ResponsiveContainerProps) {
  const getMaxWidthClass = () => {
    if (maxWidth === 'full') return 'w-full';
    return `max-w-screen-${maxWidth}`;
  };

  const getPaddingClasses = () => {
    const classes = [];

    if (padding.xs) classes.push(`px-${padding.xs}`);
    if (padding.sm) classes.push(`sm:px-${padding.sm}`);
    if (padding.md) classes.push(`md:px-${padding.md}`);
    if (padding.lg) classes.push(`lg:px-${padding.lg}`);

    return classes.join(' ');
  };

  return (
    <div className={cn(
      'mx-auto w-full',
      getMaxWidthClass(),
      getPaddingClasses(),
      className
    )}>
      {children}
    </div>
  );
}
