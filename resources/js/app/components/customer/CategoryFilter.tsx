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
                    <div
                        key={i}
                        className="h-10 w-24 sm:w-28 md:w-32 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse flex-shrink-0"
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <motion.button
                onClick={() => onSelectCategory(undefined)}
                className={cn(
                    'px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all flex-shrink-0',
                    !selectedCategory
                        ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-lg shadow-fuchsia-500/25'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                All Items
            </motion.button>

            {categories.map((category) => (
                <motion.button
                    key={category.id}
                    onClick={() => onSelectCategory(category.id)}
                    className={cn(
                        'px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all flex-shrink-0 flex items-center gap-2',
                        selectedCategory === category.id
                            ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-lg shadow-fuchsia-500/25'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <span>{category.name}</span>
                    {category.menu_items_count !== undefined && category.menu_items_count > 0 && (
                        <span className={cn(
                            "text-xs px-1.5 py-0.5 rounded-md",
                            selectedCategory === category.id
                                ? "bg-white/20"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                        )}>
                            {category.menu_items_count}
                        </span>
                    )}
                </motion.button>
            ))}
        </div>
    );
}

export default CategoryFilter;
