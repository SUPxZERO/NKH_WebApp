import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import {
    HelpCircle,
    MessageCircle,
    Phone,
    Mail,
    MapPin,
    Clock,
    ChevronDown,
    ChevronUp,
    Search,
    Send,
    ExternalLink,
    FileText,
    ShoppingBag,
    CreditCard,
    Truck,
    Gift,
    User,
    AlertCircle,
    CheckCircle,
    Loader2,
} from 'lucide-react';
import CustomerLayout from '@/app/layouts/CustomerLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { cn } from '@/app/utils/cn';
import { apiPost } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { useTranslation } from '@/app/hooks/useTranslation';

interface FAQ {
    id: string;
    questionKey: string;
    answerKey: string;
    category: string;
}

// FAQs will be loaded from translations

export default function HelpSupport() {
    const translationContext = useTranslation();
    const t = translationContext?.t || ((key: string) => key);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
    const [contactForm, setContactForm] = useState({
        subject: '',
        message: '',
    });

    // Categories from translations
    const categories = [
        { id: 'all', label: t('customer.help.categories.all'), icon: HelpCircle },
        { id: 'ordering', label: t('customer.help.categories.ordering'), icon: ShoppingBag },
        { id: 'payment', label: t('customer.help.categories.payment'), icon: CreditCard },
        { id: 'delivery', label: t('customer.help.categories.delivery'), icon: Truck },
        { id: 'rewards', label: t('customer.help.categories.rewards'), icon: Gift },
        { id: 'account', label: t('customer.help.categories.account'), icon: User },
    ];

    // FAQs from translations
    const faqs: FAQ[] = [
        { id: '1', questionKey: 'customer.help.faq.questions.q1.question', answerKey: 'customer.help.faq.questions.q1.answer', category: 'ordering' },
        { id: '2', questionKey: 'customer.help.faq.questions.q2.question', answerKey: 'customer.help.faq.questions.q2.answer', category: 'payment' },
        { id: '3', questionKey: 'customer.help.faq.questions.q3.question', answerKey: 'customer.help.faq.questions.q3.answer', category: 'delivery' },
        { id: '4', questionKey: 'customer.help.faq.questions.q4.question', answerKey: 'customer.help.faq.questions.q4.answer', category: 'ordering' },
        { id: '5', questionKey: 'customer.help.faq.questions.q5.question', answerKey: 'customer.help.faq.questions.q5.answer', category: 'rewards' },
        { id: '6', questionKey: 'customer.help.faq.questions.q6.question', answerKey: 'customer.help.faq.questions.q6.answer', category: 'payment' },
        { id: '7', questionKey: 'customer.help.faq.questions.q7.question', answerKey: 'customer.help.faq.questions.q7.answer', category: 'account' },
        { id: '8', questionKey: 'customer.help.faq.questions.q8.question', answerKey: 'customer.help.faq.questions.q8.answer', category: 'ordering' },
    ];

    // Filter FAQs
    const filteredFaqs = faqs.filter((faq) => {
        const question = t(faq.questionKey);
        const answer = t(faq.answerKey);
        const matchesSearch = (typeof question === 'string' && question.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (typeof answer === 'string' && answer.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Contact form submission
    const contactMutation = useMutation({
        mutationFn: async (data: typeof contactForm) => {
            // Simulate API call - replace with actual endpoint
            await new Promise(resolve => setTimeout(resolve, 1500));
            return { success: true };
        },
        onSuccess: () => {
            toastSuccess(t('customer.help.messages.success'));
            setContactForm({ subject: '', message: '' });
        },
        onError: () => {
            toastError(t('customer.help.messages.error'));
        },
    });

    const handleSubmitContact = (e: React.FormEvent) => {
        e.preventDefault();
        if (!contactForm.subject.trim() || !contactForm.message.trim()) {
            toastError(t('customer.help.messages.fill_fields'));
            return;
        }
        contactMutation.mutate(contactForm);
    };

    return (
        <CustomerLayout>
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-pink-500 mb-4"
                    >
                        <HelpCircle className="w-8 h-8 text-white" />
                    </motion.div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
                        {t('customer.help.title')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xl mx-auto">
                        {t('customer.help.subtitle')}
                    </p>
                </div>

                {/* Search */}
                <Card hover={false}>
                    <CardContent className="p-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('customer.help.search_placeholder')}
                                className="w-full pl-12 pr-4 py-4 rounded-xl bg-gray-100 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-fuchsia-500/50 focus:outline-none text-gray-900 dark:text-white placeholder-gray-500"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Contact Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 border-0">
                        <CardContent className="p-6 text-white">
                            <Phone className="w-8 h-8 mb-3" />
                            <h3 className="font-semibold text-lg">{t('customer.help.quick_contact.call.title')}</h3>
                            <p className="text-white/80 text-sm mt-1">{t('customer.help.quick_contact.call.subtitle')}</p>
                            <a href="tel:+855123456789" className="mt-3 inline-flex items-center gap-2 text-sm font-medium hover:underline">
                                +855 12 345 6789
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-fuchsia-500 to-pink-500 border-0">
                        <CardContent className="p-6 text-white">
                            <Mail className="w-8 h-8 mb-3" />
                            <h3 className="font-semibold text-lg">{t('customer.help.quick_contact.email.title')}</h3>
                            <p className="text-white/80 text-sm mt-1">{t('customer.help.quick_contact.email.subtitle')}</p>
                            <a href="mailto:support@nkhrestaurant.com" className="mt-3 inline-flex items-center gap-2 text-sm font-medium hover:underline">
                                support@nkhrestaurant.com
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-500 to-indigo-500 border-0">
                        <CardContent className="p-6 text-white">
                            <MessageCircle className="w-8 h-8 mb-3" />
                            <h3 className="font-semibold text-lg">{t('customer.help.quick_contact.chat.title')}</h3>
                            <p className="text-white/80 text-sm mt-1">{t('customer.help.quick_contact.chat.subtitle')}</p>
                            <button className="mt-3 inline-flex items-center gap-2 text-sm font-medium hover:underline">
                                {t('customer.help.quick_contact.chat.action')}
                                <ExternalLink className="w-4 h-4" />
                            </button>
                        </CardContent>
                    </Card>
                </div>

                {/* FAQ Section */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Category Filter */}
                    <Card hover={false} className="lg:col-span-1 h-fit">
                        <CardContent className="p-3">
                            <h3 className="font-semibold text-gray-900 dark:text-white px-3 py-2">{t('customer.help.categories_title')}</h3>
                            <nav className="space-y-1">
                                {categories.map((cat) => {
                                    const Icon = cat.icon;
                                    const isActive = selectedCategory === cat.id;
                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => setSelectedCategory(cat.id)}
                                            className={cn(
                                                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left',
                                                isActive
                                                    ? 'bg-fuchsia-100 dark:bg-fuchsia-900/20 text-fuchsia-600 dark:text-fuchsia-400'
                                                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                                            )}
                                        >
                                            <Icon className="w-4 h-4" />
                                            <span className="text-sm font-medium">{cat.label}</span>
                                        </button>
                                    );
                                })}
                            </nav>
                        </CardContent>
                    </Card>

                    {/* FAQ List */}
                    <div className="lg:col-span-3 space-y-3">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-fuchsia-500" />
                            {t('customer.help.faq.title')}
                        </h2>

                        {filteredFaqs.length === 0 ? (
                            <Card hover={false}>
                                <CardContent className="p-8 text-center">
                                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-500 dark:text-gray-400">{t('customer.help.faq.no_results', { query: searchQuery })}</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {filteredFaqs.map((faq) => (
                                    <Card key={faq.id} hover={false}>
                                        <button
                                            onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                                            className="w-full text-left"
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between gap-4">
                                                    <h3 className="font-medium text-gray-900 dark:text-white">
                                                        {t(faq.questionKey)}
                                                    </h3>
                                                    {expandedFaq === faq.id ? (
                                                        <ChevronUp className="w-5 h-5 text-fuchsia-500 flex-shrink-0" />
                                                    ) : (
                                                        <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                                    )}
                                                </div>
                                                <AnimatePresence>
                                                    {expandedFaq === faq.id && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.2 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <p className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-400">
                                                                {t(faq.answerKey)}
                                                            </p>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </CardContent>
                                        </button>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Contact Form */}
                <Card hover={false}>
                    <CardContent className="p-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Mail className="w-5 h-5 text-fuchsia-500" />
                            {t('customer.help.contact_form.title')}
                        </h2>
                        <form onSubmit={handleSubmitContact} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    {t('customer.help.contact_form.subject_label')}
                                </label>
                                <input
                                    type="text"
                                    value={contactForm.subject}
                                    onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                                    placeholder={t('customer.help.contact_form.subject_placeholder')}
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-fuchsia-500/50 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    {t('customer.help.contact_form.message_label')}
                                </label>
                                <textarea
                                    value={contactForm.message}
                                    onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                                    placeholder={t('customer.help.contact_form.message_placeholder')}
                                    rows={5}
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-fuchsia-500/50 focus:outline-none resize-none"
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={contactMutation.isPending}
                                className="w-full sm:w-auto bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white"
                            >
                                {contactMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        {t('customer.help.contact_form.sending')}
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        {t('customer.help.contact_form.send_button')}
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Restaurant Info */}
                <Card hover={false}>
                    <CardContent className="p-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            {t('customer.help.visit.title')}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-xl bg-fuchsia-100 dark:bg-fuchsia-900/30">
                                    <MapPin className="w-5 h-5 text-fuchsia-600 dark:text-fuchsia-400" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900 dark:text-white">{t('customer.help.visit.address')}</h3>
                                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                                        {t('customer.help.visit.address_line1')}<br />
                                        {t('customer.help.visit.address_line2')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-xl bg-fuchsia-100 dark:bg-fuchsia-900/30">
                                    <Clock className="w-5 h-5 text-fuchsia-600 dark:text-fuchsia-400" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900 dark:text-white">{t('customer.help.visit.hours')}</h3>
                                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                                        {t('customer.help.visit.hours_weekday')}<br />
                                        {t('customer.help.visit.hours_weekend')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </CustomerLayout>
    );
}
