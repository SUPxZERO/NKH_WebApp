import React from 'react';
import { motion } from 'framer-motion';
import { Category } from '@/app/types/domain';
import { cn } from '@/app/utils/cn';

interface CategoryFilterProps {
    categories: Category[];
    selectedCategory?: number;
    onSelectCategory: (categoryId?: number) => void;
    loading?: boolean;
}

export function CategoryFilter({
    categories,
    selectedCategory,
    onSelectCategory,
    loading
}: CategoryFilterProps) {
    if (loading) {
        return (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-10 w-24 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse flex-shrink-0" />
                ))}
            </div>
        );
    }

    return (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <motion.button
                onClick={() => onSelectCategory(undefined)}
                className={cn(
                    'px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all flex-shrink-0',
                    !selectedCategory
                        ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-lg shadow-fuchsia-500/30'
                        : 'bg-white/60 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10 border border-white/20'
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                All Items
            </motion.button>

            {categories.map((category) => (
                <motion.button
                    key={category.id}
                    onClick={() => onSelectCategory(category.id)}
                    className={cn(
                        'px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all flex-shrink-0',
                        selectedCategory === category.id
                            ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-lg shadow-fuchsia-500/30'
                            : 'bg-white/60 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10 border border-white/20'
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {category.name}
                    {category.menu_items && (
                        <span className="ml-2 text-xs opacity-70">({category.menu_items.length})</span>
                    )}
                </motion.button>
            ))}
        </div>
    );
}

export default CategoryFilter;
