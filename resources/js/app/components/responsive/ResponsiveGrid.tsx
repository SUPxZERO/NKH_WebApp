import React from 'react';
import { cn } from '@/app/utils/cn';

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  gap?: string;
}

/**
 * Responsive grid component with sensible defaults
 * Defaults: 1 col mobile, 2 cols tablet, 3 cols desktop, 4 cols xl+
 */
export function ResponsiveGrid({
  children,
  className,
  cols = { xs: 1, sm: 2, md: 2, lg: 3, xl: 4 },
  gap = '4'
}: ResponsiveGridProps) {
  const getColClass = () => {
    const classes = [];

    if (cols.xs) classes.push(`grid-cols-${cols.xs}`);
    if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`);
    if (cols.md) classes.push(`md:grid-cols-${cols.md}`);
    if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`);
    if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`);
    if (cols['2xl']) classes.push(`2xl:grid-cols-${cols['2xl']}`);

    return classes.join(' ');
  };

  return (
    <div className={cn('grid', getColClass(), `gap-${gap}`, className)}>
      {children}
    </div>
  );
}
