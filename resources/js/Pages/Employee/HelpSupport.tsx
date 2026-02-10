import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Head } from '@inertiajs/react';
import {
    HelpCircle,
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
import { useLanguage } from '@/app/context/LanguageContext';

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
    const { t, locale } = useLanguage();
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
            const res = await apiGet('/api/employee/support-tickets') as any;
            return res.data;
        },
        enabled: activeTab === 'tickets',
    });

    // Create Ticket Mutation
    const createTicketMutation = useMutation({
        mutationFn: (data: typeof form) => apiPost('/api/employee/support-tickets', data),
        onSuccess: () => {
            toastSuccess(t('employee.help.ticket_created'));
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

    const getCategoryLabel = (category: string) => {
        const key = `employee.help.form.category_options.${category}`;
        const label = t(key) as string;
        return label === key ? category : label;
    };

    const getStatusLabel = (status: string) => {
        const key = `employee.help.status.${status}`;
        const label = t(key) as string;
        return label === key ? status.replace('_', ' ') : label;
    };

    const getPriorityLabel = (priority: string) => {
        const key = `employee.help.priority_short.${priority}`;
        const label = t(key) as string;
        return label === key ? priority : label;
    };

    return (
        <EmployeeLayout>
            <Head title={t('employee.help.title')} />
            <div className="space-y-6 relative min-h-screen">
                {/* Background Decoration */}
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>

                <div className="max-w-4xl mx-auto p-4 sm:p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm p-6 rounded-2xl border border-white/20 dark:border-white/10 shadow-sm mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-fuchsia-600 flex items-center justify-center text-white shadow-lg shadow-fuchsia-600/20">
                                <HelpCircle className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                                    {t('employee.help.title')}
                                </h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                    {t('employee.help.contact')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex gap-2 mb-8 overflow-x-auto pb-2 custom-scrollbar">
                        {[
                            { id: 'faq', label: t('employee.help.faq'), icon: Search },
                            { id: 'tickets', label: t('employee.help.tabs.my_tickets'), icon: FileText },
                            { id: 'new', label: t('employee.help.tabs.new_ticket'), icon: Plus },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap border-2",
                                    activeTab === tab.id
                                        ? "bg-fuchsia-600 border-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/25"
                                        : "bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                                )}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-white/10 p-8 min-h-[500px]">

                        {/* FAQ TAB */}
                        {activeTab === 'faq' && (
                            <div className="space-y-4">
                                <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">{t('employee.help.faq_title')}</h2>
                                {faqs(t).map((faq, index) => (
                                    <div
                                        key={index}
                                        className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden transition-all hover:border-fuchsia-300 dark:hover:border-fuchsia-900"
                                    >
                                        <button
                                            onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                                            className="w-full flex items-center justify-between p-5 text-left bg-slate-50/50 dark:bg-slate-800/50 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/10 transition-colors"
                                        >
                                            <span className="font-semibold text-slate-900 dark:text-white">{faq.question}</span>
                                            {openFaqIndex === index ? <ChevronUp className="w-5 h-5 text-fuchsia-500" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                                        </button>
                                        {openFaqIndex === index && (
                                            <div className="p-5 bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 leading-relaxed">
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
                                <div className="flex justify-between items-center mb-8">
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('employee.help.track_requests')}</h2>
                                    <Button size="sm" onClick={() => setActiveTab('new')} variant="outline" className="rounded-xl border-fuchsia-200 dark:border-fuchsia-900">
                                        <Plus className="w-4 h-4 mr-2" />
                                        {t('employee.help.tabs.new_ticket')}
                                    </Button>
                                </div>

                                {ticketsLoading ? (
                                    <div className="flex justify-center py-20">
                                        <Loader2 className="w-10 h-10 animate-spin text-fuchsia-500" />
                                    </div>
                                ) : tickets?.length === 0 ? (
                                    <div className="text-center py-20 text-slate-500 bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                                        <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                        <p className="text-lg font-medium">{t('employee.help.no_tickets')}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {tickets?.map((ticket) => (
                                            <div key={ticket.id} className="p-6 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl hover:shadow-lg transition-all hover:-translate-y-1">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h3 className="font-bold text-slate-900 dark:text-white text-xl mb-1">{ticket.subject}</h3>
                                                        <p className="text-xs font-bold text-fuchsia-600 dark:text-fuchsia-400 uppercase tracking-widest">{getCategoryLabel(ticket.category)} • {new Date(ticket.created_at).toLocaleDateString(locale)}</p>
                                                    </div>
                                                    <span className={cn("px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter", getStatusColor(ticket.status))}>
                                                        {getStatusLabel(ticket.status)}
                                                    </span>
                                                </div>
                                                <p className="text-slate-600 dark:text-slate-300 text-sm mb-4 line-clamp-2 leading-relaxed">{ticket.description}</p>
                                                <div className="flex justify-between items-center text-xs border-t border-slate-100 dark:border-slate-800 pt-4">
                                                    <span className={cn("font-bold", getPriorityColor(ticket.priority))}>
                                                        {t('employee.help.priority_label', { priority: getPriorityLabel(ticket.priority) })}
                                                    </span>
                                                    {ticket.admin_notes && (
                                                        <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg font-bold">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                                            {t('employee.help.one_response')}
                                                        </span>
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
                                <h2 className="text-2xl font-bold mb-8 text-slate-900 dark:text-white">{t('employee.help.new_ticket_title')}</h2>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">{t('employee.help.form.category')}</label>
                                            <select
                                                value={form.category}
                                                onChange={e => setForm({ ...form, category: e.target.value })}
                                                className="w-full rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-fuchsia-500 focus:border-fuchsia-500 p-3"
                                            >
                                                <option value="it_support">{t('employee.help.form.category_options.it_support')}</option>
                                                <option value="hr">{t('employee.help.form.category_options.hr')}</option>
                                                <option value="maintenance">{t('employee.help.form.category_options.maintenance')}</option>
                                                <option value="operations">{t('employee.help.form.category_options.operations')}</option>
                                                <option value="other">{t('employee.help.form.category_options.other')}</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">{t('employee.help.form.priority')}</label>
                                            <select
                                                value={form.priority}
                                                onChange={e => setForm({ ...form, priority: e.target.value })}
                                                className="w-full rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-fuchsia-500 focus:border-fuchsia-500 p-3"
                                            >
                                                <option value="low">{t('employee.help.form.priority_options.low')}</option>
                                                <option value="medium">{t('employee.help.form.priority_options.medium')}</option>
                                                <option value="high">{t('employee.help.form.priority_options.high')}</option>
                                                <option value="critical">{t('employee.help.form.priority_options.critical')}</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">{t('employee.help.form.subject')}</label>
                                        <input
                                            type="text"
                                            required
                                            value={form.subject}
                                            onChange={e => setForm({ ...form, subject: e.target.value })}
                                            className="w-full rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-fuchsia-500 focus:border-fuchsia-500 p-3"
                                            placeholder={t('employee.help.form.subject_placeholder')}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">{t('employee.help.form.description')}</label>
                                        <textarea
                                            required
                                            rows={5}
                                            value={form.description}
                                            onChange={e => setForm({ ...form, description: e.target.value })}
                                            className="w-full rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-fuchsia-500 focus:border-fuchsia-500 p-4 leading-relaxed"
                                            placeholder={t('employee.help.form.description_placeholder')}
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3 pt-6">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => setActiveTab('faq')}
                                            className="rounded-xl font-bold"
                                        >
                                            {t('employee.common.cancel')}
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={createTicketMutation.isPending}
                                            className="bg-fuchsia-600 hover:bg-fuchsia-700 rounded-xl font-bold px-8 shadow-lg shadow-fuchsia-600/20"
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
