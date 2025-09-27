import React from 'react';
import { cn } from '@/app/utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({ className, hover = true, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl',
        'shadow-[0_10px_30px_-15px_rgba(0,0,0,0.25)] dark:shadow-[0_10px_30px_-20px_rgba(0,0,0,0.6)]',
        hover && 'transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-20px_rgba(168,85,247,0.35)]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-6 border-b border-black/5 dark:border-white/10', className)} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-6 border-t border-black/5 dark:border-white/10', className)} {...props}>
      {children}
    </div>
  );
}

export default Card;
