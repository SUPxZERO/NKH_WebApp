import React from 'react';
import { cn } from '@/app/utils/cn';

interface ResponsiveStackProps {
  children: React.ReactNode;
  className?: string;
  direction?: {
    xs?: 'vertical' | 'horizontal';
    sm?: 'vertical' | 'horizontal';
    md?: 'vertical' | 'horizontal';
    lg?: 'vertical' | 'horizontal';
  };
  gap?: string;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
}

/**
 * Responsive stack component that switches between vertical and horizontal layouts
 * Default: vertical on mobile, horizontal on desktop
 */
export function ResponsiveStack({
  children,
  className,
  direction = { xs: 'vertical', md: 'horizontal' },
  gap = '4',
  align = 'start',
  justify = 'start'
}: ResponsiveStackProps) {
  const getDirectionClasses = () => {
    const classes = [];

    // Base direction (xs)
    if (direction.xs === 'vertical') {
      classes.push('flex-col');
    } else {
      classes.push('flex-row');
    }

    // Responsive direction
    if (direction.sm) {
      classes.push(direction.sm === 'vertical' ? 'sm:flex-col' : 'sm:flex-row');
    }
    if (direction.md) {
      classes.push(direction.md === 'vertical' ? 'md:flex-col' : 'md:flex-row');
    }
    if (direction.lg) {
      classes.push(direction.lg === 'vertical' ? 'lg:flex-col' : 'lg:flex-row');
    }

    return classes.join(' ');
  };

  const getAlignClass = () => {
    const alignMap = {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
    };
    return alignMap[align];
  };

  const getJustifyClass = () => {
    const justifyMap = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
    };
    return justifyMap[justify];
  };

  return (
    <div className={cn(
      'flex',
      getDirectionClasses(),
      getAlignClass(),
      getJustifyClass(),
      `gap-${gap}`,
      className
    )}>
      {children}
    </div>
  );
}
