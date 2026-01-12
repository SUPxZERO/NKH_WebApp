import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react'; // Add router import here
import AdminLayout from '@/app/layouts/AdminLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings,
    Grid,
    Truck,
    CreditCard,
    Award,
    Edit2,
    Save,
    X,
    Check,
    ToggleLeft,
    ToggleRight,
    Plus
} from 'lucide-react';
import { cn } from '@/app/utils/cn';
import { Button } from '@/app/components/ui/Button';

// Types
interface LookupItem {
    id: number;
    code?: string;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    display_order: number;
    is_active: boolean;
    [key: string]: any;
}

interface PageProps {
    orderTypes: LookupItem[];
    orderStatuses: LookupItem[];
    paymentStatuses: LookupItem[];
    loyaltyTiers: LookupItem[];
}

export default function ConfigurationIndex({ orderTypes, orderStatuses, paymentStatuses, loyaltyTiers }: PageProps) {
    const [activeTab, setActiveTab] = useState<'order_types' | 'order_statuses' | 'payment_statuses' | 'loyalty_tiers'>('order_types');
    const [editingItem, setEditingItem] = useState<LookupItem | null>(null);

    const tabs = [
        { id: 'order_types', label: 'Order Types', icon: Truck, color: 'text-blue-500' },
        { id: 'order_statuses', label: 'Order Statuses', icon: Grid, color: 'text-orange-500' },
        { id: 'payment_statuses', label: 'Payment Statuses', icon: CreditCard, color: 'text-green-500' },
        { id: 'loyalty_tiers', label: 'Loyalty Tiers', icon: Award, color: 'text-purple-500' },
    ];

    const getData = () => {
        switch (activeTab) {
            case 'order_types': return orderTypes;
            case 'order_statuses': return orderStatuses;
            case 'payment_statuses': return paymentStatuses;
            case 'loyalty_tiers': return loyaltyTiers;
            default: return [];
        }
    };

    const EditModal = ({ item, onClose }: { item: LookupItem; onClose: () => void }) => {
        // Explicitly type the form data to avoid recursion issues
        interface FormData {
            name: string;
            icon: string;
            color: string;
            display_order: number;
            is_active: boolean;
            // Explicitly list all dynamic props
            allows_delivery?: boolean;
            allows_pickup?: boolean;
            allows_table?: boolean;
            workflow_position?: number;
            is_terminal?: boolean;
            show_to_customer?: boolean;
            is_successful?: boolean;
            min_spent?: number;
            max_spent?: number | null;
            discount_percent?: number;
            points_multiplier?: number;
        }

        const { data, setData, put, processing, errors } = useForm<FormData>({
            name: item.name,
            icon: item.icon || '',
            color: item.color || '#000000',
            display_order: item.display_order,
            is_active: item.is_active,
            // Explicitly map dynamic fields based on active type to avoid spread issues
            allows_delivery: item.allows_delivery,
            allows_pickup: item.allows_pickup,
            allows_table: item.allows_table,
            workflow_position: item.workflow_position,
            is_terminal: item.is_terminal,
            show_to_customer: item.show_to_customer,
            is_successful: item.is_successful,
            min_spent: item.min_spent,
            max_spent: item.max_spent,
            discount_percent: item.discount_percent,
            points_multiplier: item.points_multiplier,
        });

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            const routeName = `admin.configuration.${activeTab.replace('_', '-')}.update`;

            // Cast routeName to string to satisfy TS if needed, though usually route() handles it.
            // Using window.route or just route() from Ziggy
            put(route(routeName, item.id), {
                onSuccess: () => onClose(),
            });
        };

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg overflow-hidden"
                >
                    <div className="flex items-center justify-between p-4 border-b border-border bg-muted/50">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Edit2 className="w-4 h-4" />
                            Edit {item.name}
                        </h3>
                        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Icon (Lucide)</label>
                                <input
                                    type="text"
                                    value={data.icon || ''}
                                    onChange={e => setData('icon', e.target.value)}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Color (Hex)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={data.color || '#000000'}
                                        onChange={e => setData('color', e.target.value)}
                                        className="h-10 w-10 rounded border border-input bg-background cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={data.color || ''}
                                        onChange={e => setData('color', e.target.value)}
                                        className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Display Order</label>
                                <input
                                    type="number"
                                    value={data.display_order}
                                    onChange={e => setData('display_order', parseInt(e.target.value))}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                />
                            </div>

                            <div className="col-span-2 flex items-center gap-2">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={data.is_active}
                                        onChange={e => setData('is_active', e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                    <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">Active</span>
                                </label>
                            </div>

                            {/* Specific Fields per Type */}
                            {activeTab === 'order_types' && (
                                <div className="col-span-2 space-y-2 border-t border-border pt-4 mt-2">
                                    <h4 className="font-medium text-sm text-muted-foreground">Capabilities</h4>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 text-sm">
                                            <input type="checkbox" checked={data.allows_delivery} onChange={e => setData('allows_delivery', e.target.checked)} className="rounded border-input text-blue-600" />
                                            Allows Delivery
                                        </label>
                                        <label className="flex items-center gap-2 text-sm">
                                            <input type="checkbox" checked={data.allows_pickup} onChange={e => setData('allows_pickup', e.target.checked)} className="rounded border-input text-blue-600" />
                                            Allows Pickup
                                        </label>
                                        <label className="flex items-center gap-2 text-sm">
                                            <input type="checkbox" checked={data.allows_table} onChange={e => setData('allows_table', e.target.checked)} className="rounded border-input text-blue-600" />
                                            Allows Table
                                        </label>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'order_statuses' && (
                                <div className="col-span-2 space-y-2 border-t border-border pt-4 mt-2">
                                    <h4 className="font-medium text-sm text-muted-foreground">Workflow</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Workflow Position (1-10)</label>
                                            <input type="number" value={data.workflow_position} onChange={e => setData('workflow_position', parseInt(e.target.value))} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                        </div>
                                        <div className="flex flex-col gap-2 pt-6">
                                            <label className="flex items-center gap-2 text-sm">
                                                <input type="checkbox" checked={data.is_terminal} onChange={e => setData('is_terminal', e.target.checked)} className="rounded border-input text-blue-600" />
                                                Terminal State (End)
                                            </label>
                                            <label className="flex items-center gap-2 text-sm">
                                                <input type="checkbox" checked={data.show_to_customer} onChange={e => setData('show_to_customer', e.target.checked)} className="rounded border-input text-blue-600" />
                                                Show to Customer
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'payment_statuses' && (
                                <div className="col-span-2 space-y-2 border-t border-border pt-4 mt-2">
                                    <h4 className="font-medium text-sm text-muted-foreground">Attributes</h4>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 text-sm">
                                            <input type="checkbox" checked={data.is_successful} onChange={e => setData('is_successful', e.target.checked)} className="rounded border-input text-green-600" />
                                            Is Successful
                                        </label>
                                        <label className="flex items-center gap-2 text-sm">
                                            <input type="checkbox" checked={data.is_terminal} onChange={e => setData('is_terminal', e.target.checked)} className="rounded border-input text-blue-600" />
                                            Is Terminal
                                        </label>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'loyalty_tiers' && (
                                <div className="col-span-2 space-y-2 border-t border-border pt-4 mt-2">
                                    <h4 className="font-medium text-sm text-muted-foreground">Rules & Rewards</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Min Spent ($)</label>
                                            <input type="number" step="0.01" value={data.min_spent} onChange={e => setData('min_spent', parseFloat(e.target.value))} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Max Spent ($)</label>
                                            <input type="number" step="0.01" value={data.max_spent || ''} onChange={e => setData('max_spent', e.target.value ? parseFloat(e.target.value) : null)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Unlimited" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Discount %</label>
                                            <input type="number" step="0.1" value={data.discount_percent} onChange={e => setData('discount_percent', parseFloat(e.target.value))} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Points Multiplier</label>
                                            <input type="number" step="0.1" value={data.points_multiplier} onChange={e => setData('points_multiplier', parseFloat(e.target.value))} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t border-border">
                            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                            <Button type="submit" disabled={processing} className="bg-blue-600 hover:bg-blue-700 text-white">
                                <Save className="w-4 h-4 mr-2" /> Save Changes
                            </Button>
                        </div>
                    </form>
                </motion.div>
            </div>
        );
    };

    return (
        <AdminLayout>
            <Head title="System Configuration" />
            <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                            <Settings className="w-8 h-8 text-purple-500" />
                            System Configuration
                        </h1>
                        <p className="text-muted-foreground mt-2">Manage dynamic lookup tables and system definitions.</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all whitespace-nowrap",
                                activeTab === tab.id
                                    ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                                    : "text-muted-foreground hover:bg-muted/50"
                            )}
                        >
                            <tab.icon className={cn("w-5 h-5", tab.color)} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="bg-card border border-border rounded-xl shadow-sm overflow-hidden"
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                                    <tr>
                                        <th className="px-6 py-4">Display Order</th>
                                        <th className="px-6 py-4">Name / Code</th>
                                        <th className="px-6 py-4">Visuals</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Attributes</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {getData().map(item => (
                                        <tr key={item.id} className="bg-card hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-4 font-mono text-muted-foreground">{item.display_order}</td>

                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-foreground">{item.name}</div>
                                                <div className="text-xs text-muted-foreground font-mono">{item.code}</div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {item.icon && (
                                                        <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                                                            {/* We render icon name as text here, in real app consider DynamicIcon component */}
                                                            <span className="text-xs">{item.icon}</span>
                                                        </div>
                                                    )}
                                                    {item.color && (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full border border-border" style={{ backgroundColor: item.color }} />
                                                            <span className="text-xs text-muted-foreground uppercase">{item.color}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className={cn(
                                                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                                                    item.is_active
                                                        ? "bg-green-500/10 text-green-600 border-green-500/20"
                                                        : "bg-red-500/10 text-red-600 border-red-500/20"
                                                )}>
                                                    {item.is_active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                                    {item.is_active ? 'Active' : 'Inactive'}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {/* Order Types */}
                                                    {item.allows_delivery !== undefined && item.allows_delivery && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Delivery</span>}
                                                    {item.allows_pickup !== undefined && item.allows_pickup && <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">Pickup</span>}
                                                    {item.allows_table !== undefined && item.allows_table && <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">Table</span>}

                                                    {/* Order Statuses */}
                                                    {item.is_terminal !== undefined && item.is_terminal && <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded border border-gray-200">Terminal</span>}
                                                    {item.workflow_position !== undefined && <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">Pos: {item.workflow_position}</span>}

                                                    {/* Payment Statuses */}
                                                    {item.is_successful !== undefined && item.is_successful && <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Success</span>}

                                                    {/* Loyalty Tiers */}
                                                    {item.min_spent !== undefined && (
                                                        <div className="flex flex-col gap-1 text-xs">
                                                            <span className="text-muted-foreground">Spend: ${item.min_spent} - {item.max_spent ? `$${item.max_spent}` : '∞'}</span>
                                                            <span className="text-green-600">{item.discount_percent}% Off</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <Button variant="ghost" size="sm" onClick={() => setEditingItem(item)}>
                                                    <Edit2 className="w-4 h-4 text-blue-600" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Edit Modal */}
                {editingItem && (
                    <EditModal
                        item={editingItem}
                        onClose={() => setEditingItem(null)}
                    />
                )}

            </div>
        </AdminLayout>
    );
}
