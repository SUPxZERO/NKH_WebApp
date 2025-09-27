import type { InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & { label?: string };

export default function SearchInput({ label, className = '', ...props }: Props) {
  return (
    <div className="relative">
      <input
        type="search"
        className={`w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-sm focus:ring-2 focus:ring-primary/50 bg-white dark:bg-gray-900 ${className}`}
        placeholder={label || 'Search...'}
        {...props}
      />
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔎</span>
    </div>
  );
}
