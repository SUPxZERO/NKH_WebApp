import React from 'react';
import { cn } from '@/app/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || props.name || `input-${Math.random().toString(36).slice(2)}`;

    return (
      <div className="w-full">
        {label ? (
          <label htmlFor={inputId} className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        ) : null}
        <div
          className={cn(
            'relative flex items-center rounded-2xl backdrop-blur-md border transition-all duration-200',
            'bg-white/70 dark:bg-white/5 border-black/10 dark:border-white/10',
            'focus-within:border-fuchsia-400/60 focus-within:shadow-[0_0_0_3px_rgba(232,121,249,0.2)]'
          )}
        >
          {leftIcon ? <span className="pl-3 text-gray-400">{leftIcon}</span> : null}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full bg-transparent outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500',
              'text-gray-900 dark:text-gray-100 px-4 py-3',
              leftIcon ? 'pl-2' : '',
              rightIcon ? 'pr-2' : '',
              'rounded-2xl',
              className
            )}
            {...props}
          />
          {rightIcon ? <span className="pr-3 text-gray-400">{rightIcon}</span> : null}
        </div>
        {hint && !error ? (
          <p className="mt-1 text-xs text-gray-500">{hint}</p>
        ) : null}
        {error ? <p className="mt-1 text-xs text-rose-400">{error}</p> : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
