import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/app/utils/cn';

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    loading?: boolean;
    loadingText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
}

/**
 * Sprint 3 Phase 2: LoadingButton Component
 * 
 * A button that shows loading state with spinner.
 * Prevents double-clicks and provides visual feedback.
 * 
 * @example
 * <LoadingButton 
 *   loading={isSubmitting}
 *   loadingText="Processing..."
 *   onClick={handleSubmit}
 * >
 *   Place Order
 * </LoadingButton>
 */
export function LoadingButton({
    loading = false,
    loadingText,
    children,
    disabled,
    className,
    leftIcon,
    rightIcon,
    variant = 'primary',
    size = 'md',
    ...props
}: LoadingButtonProps) {
    const variantStyles = {
        primary: 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white hover:from-fuchsia-700 hover:to-pink-700',
        secondary: 'bg-gray-600 text-white hover:bg-gray-700',
        outline: 'border-2 border-fuchsia-600 text-fuchsia-600 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/20',
        ghost: 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
    };

    const sizeStyles = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2',
        lg: 'px-6 py-3 text-lg'
    };

    return (
        <button
            type="button"
            disabled={loading || disabled}
            className={cn(
                'relative inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all',
                'focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'shadow-lg hover:shadow-xl',
                variantStyles[variant],
                sizeStyles[size],
                className
            )}
            {...props}
        >
            {loading ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{loadingText || children}</span>
                </>
            ) : (
                <>
                    {leftIcon && <span>{leftIcon}</span>}
                    <span>{children}</span>
                    {rightIcon && <span>{rightIcon}</span>}
                </>
            )}
        </button>
    );
}

export default LoadingButton;
