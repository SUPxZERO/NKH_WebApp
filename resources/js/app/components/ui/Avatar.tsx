import React, { useMemo } from 'react';
import { cn } from '@/app/utils/cn';
import { User } from 'lucide-react';

interface AvatarProps {
    src?: string | null;
    alt?: string;
    name?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    className?: string;
    fallbackColor?: 'purple' | 'blue' | 'emerald' | 'amber' | 'rose' | 'slate' | 'default';
}

const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
    '2xl': 'w-32 h-32 text-4xl',
};

const colorClasses = {
    purple: 'from-purple-500 to-indigo-500',
    blue: 'from-blue-500 to-cyan-500',
    emerald: 'from-emerald-500 to-teal-500',
    amber: 'from-amber-500 to-orange-500',
    rose: 'from-rose-500 to-pink-500',
    slate: 'from-slate-500 to-gray-500',
    default: 'from-gray-400 to-gray-600',
};

export default function Avatar({
    src,
    alt,
    name,
    size = 'md',
    className,
    fallbackColor = 'default'
}: AvatarProps) {

    const initials = useMemo(() => {
        if (!name) return '?';
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }, [name]);

    const gradientClass = useMemo(() => {
        if (fallbackColor !== 'default') return colorClasses[fallbackColor];

        // Hash string to pick a consistent color if default
        if (!name) return colorClasses.default;
        const colors = Object.keys(colorClasses).filter(k => k !== 'default') as (keyof typeof colorClasses)[];
        const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colorClasses[colors[hash % colors.length]];
    }, [name, fallbackColor]);

    return (
        <div
            className={cn(
                'relative rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 font-bold text-white shadow-sm',
                sizeClasses[size],
                !src && `bg-gradient-to-br ${gradientClass}`,
                className
            )}
        >
            {src ? (
                <img
                    src={src}
                    alt={alt || name || 'Avatar'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        // Fallback to initials on error by hiding img
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement?.classList.add(...`bg-gradient-to-br ${gradientClass}`.split(' '));
                        const span = document.createElement('span');
                        span.innerText = initials;
                        e.currentTarget.parentElement?.appendChild(span);
                    }}
                />
            ) : (
                <span>{initials}</span>
            )}
        </div>
    );
}
