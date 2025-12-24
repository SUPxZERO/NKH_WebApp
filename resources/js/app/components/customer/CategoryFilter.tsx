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
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className="h-9 w-16 sm:w-20 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse flex-shrink-0"
                    />
                ))}
            </div>
        );
    }

    return (
        <motion.div
            className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
        >
            <motion.button
                onClick={() => onSelectCategory(undefined)}
                className={cn(
                    'px-3 sm:px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all flex-shrink-0',
                    !selectedCategory
                        ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/25'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                All
            </motion.button>

            {categories.map((category, index) => (
                <motion.button
                    key={category.id}
                    onClick={() => onSelectCategory(category.id)}
                    className={cn(
                        'px-3 sm:px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all flex-shrink-0 flex items-center gap-1',
                        selectedCategory === category.id
                            ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/25'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                >
                    <span>{category.name}</span>
                    {category.menu_items_count !== undefined && category.menu_items_count > 0 && (
                        <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-md",
                            selectedCategory === category.id
                                ? "bg-white/20"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                        )}>
                            {category.menu_items_count}
                        </span>
                    )}
                </motion.button>
            ))}
        </motion.div>
    );
}

export default CategoryFilter;
