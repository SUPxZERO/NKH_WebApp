import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/app/utils/cn';
import { Check, ChevronDown, X, Building } from 'lucide-react';

interface Option {
    value: string | number;
    label: string;
}

interface MultiSelectProps {
    label?: string;
    options: Option[];
    value: (string | number)[];
    onChange: (value: (string | number)[]) => void;
    placeholder?: string;
    error?: string;
    className?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
    label,
    options,
    value,
    onChange,
    placeholder = 'Select options...',
    error,
    className
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (optionValue: string | number) => {
        const newValue = value.includes(optionValue)
            ? value.filter(v => v !== optionValue)
            : [...value, optionValue];
        onChange(newValue);
    };

    const removeOption = (optionValue: string | number, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(value.filter(v => v !== optionValue));
    };

    const selectedOptions = options.filter(opt => value.includes(opt.value));

    return (
        <div className={cn("w-full space-y-2", className)} ref={containerRef}>
            {label && (
                <label className="block text-sm font-semibold text-foreground">
                    {label}
                </label>
            )}

            <div className="relative">
                <div
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "flex flex-wrap items-center gap-2 px-3 py-2 min-h-[44px] rounded-xl border transition-all duration-200 cursor-pointer",
                        "bg-card border-border hover:border-primary/30",
                        isOpen && "border-primary ring-2 ring-primary/20",
                        error && "border-destructive hover:border-destructive"
                    )}
                >
                    {selectedOptions.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 ">
                            {selectedOptions.map(opt => (
                                <span
                                    key={opt.value}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-sm font-medium border border-primary/20"
                                >
                                    {opt.label}
                                    <button
                                        type="button"
                                        onClick={(e) => removeOption(opt.value, e)}
                                        className="hover:text-primary-foreground hover:bg-primary rounded-full p-0.5 transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    ) : (
                        <span className="text-muted-foreground/60 text-sm">{placeholder}</span>
                    )}

                    <div className="ml-auto flex items-center gap-2 text-muted-foreground">
                        {selectedOptions.length > 0 && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onChange([]);
                                }}
                                className="hover:text-destructive transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
                    </div>
                </div>

                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 z-50 max-h-60 overflow-y-auto rounded-xl border border-border bg-card shadow-lg animate-in fade-in zoom-in duration-200">
                        <div className="p-1">
                            {options.length > 0 ? (
                                options.map(option => (
                                    <div
                                        key={option.value}
                                        onClick={() => toggleOption(option.value)}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm",
                                            value.includes(option.value)
                                                ? "bg-primary/5 text-primary font-medium"
                                                : "text-foreground hover:bg-secondary/50"
                                        )}
                                    >
                                        <div className={cn(
                                            "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary transition-colors",
                                            value.includes(option.value) ? "bg-primary text-primary-foreground" : "bg-transparent"
                                        )}>
                                            {value.includes(option.value) && <Check className="h-3 w-3" />}
                                        </div>
                                        <Building className="w-4 h-4 opacity-40 shrink-0" />
                                        <span className="truncate">{option.label}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                    No options available
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <p className="text-xs text-destructive flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-destructive flex items-center justify-center text-[10px] text-destructive-foreground">!</span>
                    {error}
                </p>
            )}
        </div>
    );
};

export default MultiSelect;
