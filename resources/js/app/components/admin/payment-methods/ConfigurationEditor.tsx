import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Sliders } from 'lucide-react';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';

interface ConfigurationEditorProps {
    value: Record<string, any> | null;
    onChange: (value: Record<string, any>) => void;
    readOnly?: boolean;
}

interface ConfigItem {
    id: string; // Internal ID for list management
    key: string;
    value: string;
}

export function ConfigurationEditor({ value, onChange, readOnly = false }: ConfigurationEditorProps) {
    const [items, setItems] = useState<ConfigItem[]>([]);

    // Initialize items from props value
    useEffect(() => {
        if (!value) {
            setItems([]);
            return;
        }

        const newItems = Object.entries(value).map(([k, v]) => ({
            id: Math.random().toString(36).substring(7),
            key: k,
            value: String(v)
        }));
        setItems(newItems);
    }, [value]);

    // Handle local change and propagate to parent
    const updateParent = (currentItems: ConfigItem[]) => {
        const newValue = currentItems.reduce((acc, item) => {
            if (item.key.trim()) {
                acc[item.key.trim()] = item.value;
            }
            return acc;
        }, {} as Record<string, any>);

        onChange(newValue);
    };

    const handleAddItem = () => {
        const newItem = { id: Math.random().toString(36).substring(7), key: '', value: '' };
        const newItems = [...items, newItem];
        // Don't update parent immediately on add, wait for input? 
        // Actually for simplicity, we keep local state and only push valid updates or push on every change.
        // Let's push on every change to keep form state in sync.
        setItems(newItems);
        // We don't necessarily update parent with empty keys, but let's wait for user input.
    };

    const handleRemoveItem = (id: string) => {
        const newItems = items.filter(item => item.id !== id);
        setItems(newItems);
        updateParent(newItems);
    };

    const handleChange = (id: string, field: 'key' | 'value', text: string) => {
        const newItems = items.map(item =>
            item.id === id ? { ...item, [field]: text } : item
        );
        setItems(newItems);
        updateParent(newItems);
    };

    if (readOnly && items.length === 0) {
        return <div className="text-gray-400 italic text-sm">No configuration set</div>;
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Sliders className="w-4 h-4" />
                    Configuration
                </label>
                {!readOnly && (
                    <Button
                        type="button"
                        variant="secondary"
                        size="xs"
                        onClick={handleAddItem}
                        leftIcon={<Plus className="w-3 h-3" />}
                    >
                        Add Field
                    </Button>
                )}
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 space-y-2 border border-input">
                {items.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 text-sm">
                        No custom configuration. Click "Add Field" to define dynamic settings like API keys or Bank Accounts.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {items.map((item) => (
                            <div key={item.id} className="flex gap-2 items-start group">
                                <div className="flex-1">
                                    <Input
                                        placeholder="Key (e.g. bank_account)"
                                        value={item.key}
                                        onChange={(e) => handleChange(item.id, 'key', e.target.value)}
                                        disabled={readOnly}
                                        className="h-9 text-xs font-mono"
                                    />
                                </div>
                                <div className="flex-[2]">
                                    <Input
                                        placeholder="Value"
                                        value={item.value}
                                        onChange={(e) => handleChange(item.id, 'value', e.target.value)}
                                        disabled={readOnly}
                                        className="h-9 text-xs"
                                    />
                                </div>
                                {!readOnly && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveItem(item.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <p className="text-xs text-gray-500">
                Define dynamic settings required for this payment method. Keys must be unique.
            </p>
        </div>
    );
}
