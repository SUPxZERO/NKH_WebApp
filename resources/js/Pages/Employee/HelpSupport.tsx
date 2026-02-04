import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Head } from '@inertiajs/react'; // Correct import for Inertia Head
import {
    HelpCircle,
    MessageSquare,
    Plus,
    Search,
    FileText,
    ChevronDown,
    ChevronUp,
    Send,
    Loader2
} from 'lucide-react';
import EmployeeLayout from '@/app/layouts/EmployeeLayout';
import { Button } from '@/app/components/ui/Button';
import { apiGet, apiPost } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';
import { Badge } from '@/app/components/ui/Badge';
import { useLanguage } from '@/app/context/LanguageContext'; // You might need to create or import this if it exists, otherwise standard span

// Types
interface Ticket {
    id: number;
    subject: string;
    category: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    created_at: string;
    description: string;
    admin_notes?: string;
}

const faqs = (t: (key: string, replacements?: Record<string, any>) => any) => ([
    {
        question: t('employee.help.faqs.swap.question'),
        answer: t('employee.help.faqs.swap.answer')
    },
    {
        question: t('employee.help.faqs.pos.question'),
        answer: t('employee.help.faqs.pos.answer')
    },
    {
        question: t('employee.help.faqs.time_off.question'),
        answer: t('employee.help.faqs.time_off.answer')
    },
    {
        question: t('employee.help.faqs.pay.question'),
        answer: t('employee.help.faqs.pay.answer')
    }
]);

export default function HelpSupport() {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'faq' | 'tickets' | 'new'>('faq');
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

    // New Ticket Form State
    const [form, setForm] = useState({
        subject: '',
        category: 'it_support',
        priority: 'low',
        description: '',
    });

    // Fetch Tickets
    const { data: tickets, isLoading: ticketsLoading } = useQuery<Ticket[]>({
        queryKey: ['myTickets'],
        queryFn: async () => {
            const res = await apiGet('/api/employee/support-tickets') as any; // Adjust type based on real response wrapper
            return res.data;
        },
        enabled: activeTab === 'tickets',
    });

    // Create Ticket Mutation
    const createTicketMutation = useMutation({
        mutationFn: (data: typeof form) => apiPost('/api/employee/support-tickets', data),
        onSuccess: () => {
            toastSuccess(t('employee.help.contact'));
            setForm({ subject: '', category: 'it_support', priority: 'low', description: '' });
            setActiveTab('tickets');
            queryClient.invalidateQueries({ queryKey: ['myTickets'] });
        },
        onError: () => toastError(t('employee.common.error')),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createTicketMutation.mutate(form);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            case 'in_progress': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
            case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            case 'closed': return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return 'text-red-600 font-bold';
            case 'high': return 'text-orange-500 font-semibold';
            case 'medium': return 'text-amber-500';
            case 'low': return 'text-green-500';
            default: return 'text-slate-500';
        }
    };

    return (
        <EmployeeLayout>
            <Head title={t('employee.help.title')} />
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            <HelpCircle className="w-8 h-8 text-fuchsia-500" />
                            {t('employee.help.title')}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                            {t('employee.help.contact')}
                        </p>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                        {[
                            { id: 'faq', label: t('employee.help.faq'), icon: Search },
                            { id: 'tickets', label: t('employee.help.tabs.my_tickets'), icon: FileText },
                            { id: 'new', label: t('employee.help.tabs.new_ticket'), icon: Plus },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap",
                                    activeTab === tab.id
                                        ? "bg-fuchsia-600 text-white shadow-md"
                                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                                )}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 min-h-[400px]">

                        {/* FAQ TAB */}
                        {activeTab === 'faq' && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">{t('employee.help.faq_title')}</h2>
                                {faqs(t).map((faq, index) => (
                                    <div
                                        key={index}
                                        className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
                                    >
                                        <button
                                            onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                                            className="w-full flex items-center justify-between p-4 text-left bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors"
                                        >
                                            <span className="font-medium text-slate-900 dark:text-white">{faq.question}</span>
                                            {openFaqIndex === index ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </button>
                                        {openFaqIndex === index && (
                                            <div className="p-4 bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700">
                                                {faq.answer}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* MY TICKETS TAB */}
                        {activeTab === 'tickets' && (
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t('employee.help.track_requests')}</h2>
                                    <Button size="sm" onClick={() => setActiveTab('new')} variant="outline">{t('employee.common.next')}</Button>
                                </div>

                                {ticketsLoading ? (
                                    <div className="flex justify-center py-12">
                                        <Loader2 className="w-8 h-8 animate-spin text-fuchsia-500" />
                                    </div>
                                ) : tickets?.length === 0 ? (
                                    <div className="text-center py-12 text-slate-500">
                                        {t('employee.help.no_tickets')}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {tickets?.map((ticket) => (
                                            <div key={ticket.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h3 className="font-semibold text-slate-900 dark:text-white text-lg">{ticket.subject}</h3>
                                                        <p className="text-xs text-slate-500 uppercase tracking-wider">{ticket.category} • {new Date(ticket.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium capitalize", getStatusColor(ticket.status))}>
                                                        {ticket.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <p className="text-slate-600 dark:text-slate-300 text-sm mb-3 line-clamp-2">{ticket.description}</p>
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className={cn("capitalize", getPriorityColor(ticket.priority))}>
                                                        {t('employee.help.priority_label', { priority: ticket.priority })}
                                                    </span>
                                                    {ticket.admin_notes && (
                                                        <span className="text-blue-600 dark:text-blue-400 font-medium">{t('employee.help.one_response')}</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* NEW TICKET TAB */}
                        {activeTab === 'new' && (
                            <div className="max-w-2xl mx-auto">
                                <h2 className="text-xl font-semibold mb-6 text-slate-900 dark:text-white">{t('employee.help.new_ticket_title')}</h2>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('employee.help.form.category')}</label>
                                            <select
                                                value={form.category}
                                                onChange={e => setForm({ ...form, category: e.target.value })}
                                                className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                                            >
                                                <option value="it_support">{t('employee.help.form.category_options.it_support')}</option>
                                                <option value="hr">{t('employee.help.form.category_options.hr')}</option>
                                                <option value="maintenance">{t('employee.help.form.category_options.maintenance')}</option>
                                                <option value="operations">{t('employee.help.form.category_options.operations')}</option>
                                                <option value="other">{t('employee.help.form.category_options.other')}</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('employee.help.form.priority')}</label>
                                            <select
                                                value={form.priority}
                                                onChange={e => setForm({ ...form, priority: e.target.value })}
                                                className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                                            >
                                                <option value="low">{t('employee.help.form.priority_options.low')}</option>
                                                <option value="medium">{t('employee.help.form.priority_options.medium')}</option>
                                                <option value="high">{t('employee.help.form.priority_options.high')}</option>
                                                <option value="critical">{t('employee.help.form.priority_options.critical')}</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('employee.help.form.subject')}</label>
                                        <input
                                            type="text"
                                            required
                                            value={form.subject}
                                            onChange={e => setForm({ ...form, subject: e.target.value })}
                                            className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                                            placeholder={t('employee.help.form.subject_placeholder')}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('employee.help.form.description')}</label>
                                        <textarea
                                            required
                                            rows={5}
                                            value={form.description}
                                            onChange={e => setForm({ ...form, description: e.target.value })}
                                            className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 p-3"
                                            placeholder={t('employee.help.form.description_placeholder')}
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => setActiveTab('faq')}
                                        >
                                            {t('employee.common.cancel')}
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={createTicketMutation.isPending}
                                            className="bg-fuchsia-600 hover:bg-fuchsia-700"
                                        >
                                            {createTicketMutation.isPending ? t('employee.common.submitting') : t('employee.help.contact')}
                                            <Send className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </EmployeeLayout>
    );
}
