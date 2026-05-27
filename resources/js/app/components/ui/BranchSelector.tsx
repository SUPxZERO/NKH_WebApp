import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building, ChevronDown, Check, Globe } from 'lucide-react';
import { cn } from '@/app/utils/cn';
import { useLanguage } from '@/app/context/LanguageContext';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { router } from '@inertiajs/react';

interface Branch {
  id: number;
  name: string;
  code: string | null;
}

interface BranchSelectorProps {
  branches: Branch[];
  activeBranchId: number | null;
  canSwitchBranch: boolean;
  className?: string;
}

export default function BranchSelector({
  branches,
  activeBranchId,
  canSwitchBranch,
  className,
}: BranchSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitch = async (branchId: number | null) => {
    if (branchId === activeBranchId || switching) return;
    setSwitching(true);
    setIsOpen(false);

    try {
      await axios.post('/api/admin/branch/switch', { branch_id: branchId });
      // Invalidate all React Query caches so data refetches with new branch scope
      queryClient.invalidateQueries();
      // Full page visit to reload all Inertia props with new branch data
      router.visit(window.location.href, { preserveState: false });
    } catch (error) {
      console.error('Failed to switch branch:', error);
      setSwitching(false);
    }
  };

  const activeBranch = branches.find(b => b.id === activeBranchId);
  const displayName = activeBranch
    ? activeBranch.name
    : (canSwitchBranch ? t('layout.admin.branch.all_branches') || 'All Branches' : '—');

  // If the user only has one branch and can't switch, show as a badge only
  if (!canSwitchBranch && branches.length <= 1) {
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl",
        "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300",
        "text-sm font-medium",
        className
      )}>
        <Building className="w-4 h-4" />
        <span className="hidden sm:inline truncate max-w-[120px]">{displayName}</span>
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={switching}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200",
          "bg-gradient-to-r from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20",
          "border border-purple-200/50 dark:border-purple-700/30",
          "text-purple-700 dark:text-purple-300 hover:shadow-md hover:shadow-purple-200/30",
          "text-sm font-medium",
          switching && "opacity-50 cursor-wait"
        )}
      >
        <Building className="w-4 h-4 flex-shrink-0" />
        <span className="hidden sm:inline truncate max-w-[140px]">{displayName}</span>
        <ChevronDown className={cn(
          "w-3.5 h-3.5 transition-transform duration-200 flex-shrink-0",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              "absolute right-0 top-full mt-2 z-50 min-w-[220px] max-w-[280px]",
              "bg-white dark:bg-gray-800 rounded-xl shadow-xl shadow-gray-200/50 dark:shadow-black/30",
              "border border-gray-100 dark:border-gray-700 overflow-hidden"
            )}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('layout.admin.branch.select') || 'Select Branch'}
              </p>
            </div>

            {/* Options */}
            <div className="py-1 max-h-[280px] overflow-y-auto">
              {/* "All Branches" option - only for admin/super-admin */}
              {canSwitchBranch && (
                <button
                  onClick={() => handleSwitch(null)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                    activeBranchId === null
                      ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 font-medium"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  )}
                >
                  <Globe className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left truncate">
                    {t('layout.admin.branch.all_branches') || 'All Branches'}
                  </span>
                  {activeBranchId === null && (
                    <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  )}
                </button>
              )}

              {/* Individual branches */}
              {branches.map(branch => (
                <button
                  key={branch.id}
                  onClick={() => handleSwitch(branch.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                    activeBranchId === branch.id
                      ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 font-medium"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  )}
                >
                  <Building className="w-4 h-4 flex-shrink-0 opacity-60" />
                  <div className="flex-1 text-left min-w-0">
                    <span className="block truncate">{branch.name}</span>
                    {branch.code && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">{branch.code}</span>
                    )}
                  </div>
                  {activeBranchId === branch.id && (
                    <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
