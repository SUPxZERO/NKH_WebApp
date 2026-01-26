import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/app/utils/cn';
import { ChevronDown, ChevronRight, ArrowRight, Minus, Plus } from 'lucide-react';

interface DiffViewerProps {
    before?: Record<string, any>;
    after?: Record<string, any>;
    changeSummary?: string;
    mode?: 'inline' | 'side-by-side';
    className?: string;
}

type ChangeType = 'added' | 'removed' | 'modified' | 'unchanged';

interface FieldChange {
    key: string;
    type: ChangeType;
    before?: any;
    after?: any;
}

function getChanges(before?: Record<string, any>, after?: Record<string, any>): FieldChange[] {
    const changes: FieldChange[] = [];
    const allKeys = new Set([
        ...Object.keys(before || {}),
        ...Object.keys(after || {})
    ]);

    allKeys.forEach(key => {
        const beforeVal = before?.[key];
        const afterVal = after?.[key];

        if (beforeVal === undefined && afterVal !== undefined) {
            changes.push({ key, type: 'added', after: afterVal });
        } else if (beforeVal !== undefined && afterVal === undefined) {
            changes.push({ key, type: 'removed', before: beforeVal });
        } else if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
            changes.push({ key, type: 'modified', before: beforeVal, after: afterVal });
        } else {
            changes.push({ key, type: 'unchanged', before: beforeVal, after: afterVal });
        }
    });

    // Sort: modified first, then added, removed, unchanged
    const order: Record<ChangeType, number> = { modified: 0, added: 1, removed: 2, unchanged: 3 };
    return changes.sort((a, b) => order[a.type] - order[b.type]);
}

function formatValue(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
}

const ChangeRow: React.FC<{ change: FieldChange }> = ({ change }) => {
    const [expanded, setExpanded] = useState(change.type !== 'unchanged');

    const typeStyles: Record<ChangeType, { bg: string; border: string; icon: React.ReactNode }> = {
        added: {
            bg: 'bg-emerald-500/5',
            border: 'border-l-emerald-500',
            icon: <Plus className="w-3 h-3 text-emerald-500" />
        },
        removed: {
            bg: 'bg-red-500/5',
            border: 'border-l-red-500',
            icon: <Minus className="w-3 h-3 text-red-500" />
        },
        modified: {
            bg: 'bg-amber-500/5',
            border: 'border-l-amber-500',
            icon: <ArrowRight className="w-3 h-3 text-amber-500" />
        },
        unchanged: {
            bg: 'bg-muted/30',
            border: 'border-l-muted-foreground/20',
            icon: null
        }
    };

    const style = typeStyles[change.type];

    return (
        <div
            className={cn(
                'border-l-2 rounded-r-lg transition-all',
                style.bg,
                style.border,
                change.type === 'unchanged' && !expanded && 'opacity-60'
            )}
        >
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5"
            >
                {expanded ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
                {style.icon}
                <span className="font-medium text-sm text-foreground">{change.key}</span>
                {!expanded && change.type === 'modified' && (
                    <span className="text-xs text-muted-foreground ml-auto truncate max-w-[200px]">
                        {formatValue(change.before)} → {formatValue(change.after)}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-3 pb-3 pl-9 space-y-2">
                            {(change.type === 'removed' || change.type === 'modified') && (
                                <div className="flex items-start gap-2">
                                    <span className="text-xs text-red-500 font-medium shrink-0 mt-0.5">Before:</span>
                                    <pre className="text-xs text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-1 rounded overflow-x-auto max-w-full">
                                        {formatValue(change.before)}
                                    </pre>
                                </div>
                            )}
                            {(change.type === 'added' || change.type === 'modified') && (
                                <div className="flex items-start gap-2">
                                    <span className="text-xs text-emerald-500 font-medium shrink-0 mt-0.5">After:</span>
                                    <pre className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded overflow-x-auto max-w-full">
                                        {formatValue(change.after)}
                                    </pre>
                                </div>
                            )}
                            {change.type === 'unchanged' && (
                                <pre className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded overflow-x-auto">
                                    {formatValue(change.after)}
                                </pre>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const DiffViewer: React.FC<DiffViewerProps> = ({
    before,
    after,
    changeSummary,
    className
}) => {
    const [showUnchanged, setShowUnchanged] = useState(false);

    if (!before && !after) {
        return (
            <div className={cn('text-sm text-muted-foreground italic py-4 text-center', className)}>
                No data changes recorded
            </div>
        );
    }

    const changes = getChanges(before, after);
    const changedFields = changes.filter(c => c.type !== 'unchanged');
    const unchangedFields = changes.filter(c => c.type === 'unchanged');

    return (
        <div className={cn('space-y-3', className)}>
            {changeSummary && (
                <p className="text-sm text-muted-foreground italic bg-muted/50 px-3 py-2 rounded-lg">
                    {changeSummary}
                </p>
            )}

            <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-muted-foreground">Added</span>
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-muted-foreground">Removed</span>
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-muted-foreground">Modified</span>
                </span>
            </div>

            <div className="space-y-1 max-h-80 overflow-y-auto custom-scrollbar">
                {changedFields.map(change => (
                    <ChangeRow key={change.key} change={change} />
                ))}

                {unchangedFields.length > 0 && (
                    <button
                        onClick={() => setShowUnchanged(!showUnchanged)}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 py-2"
                    >
                        {showUnchanged ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        {unchangedFields.length} unchanged fields
                    </button>
                )}

                {showUnchanged && unchangedFields.map(change => (
                    <ChangeRow key={change.key} change={change} />
                ))}
            </div>
        </div>
    );
};

export default DiffViewer;
