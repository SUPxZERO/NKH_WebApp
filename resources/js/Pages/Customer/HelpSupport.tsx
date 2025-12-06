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

interface FAQ {
    id: string;
    question: string;
    answer: string;
    category: string;
}

const faqs: FAQ[] = [
    {
        id: '1',
        question: 'How do I place an order?',
        answer: 'You can place an order by browsing our menu, adding items to your cart, and proceeding to checkout. You can choose between delivery or pickup options.',
        category: 'ordering',
    },
    {
        id: '2',
        question: 'What payment methods do you accept?',
        answer: 'We accept credit/debit cards (Visa, Mastercard), digital wallets, and cash on delivery. All online payments are securely processed.',
        category: 'payment',
    },
    {
        id: '3',
        question: 'How long does delivery take?',
        answer: 'Delivery typically takes 30-45 minutes depending on your location and order volume. You can track your order in real-time after placing it.',
        category: 'delivery',
    },
    {
        id: '4',
        question: 'Can I modify or cancel my order?',
        answer: 'You can modify or cancel your order within 5 minutes of placing it. After that, please contact our support team for assistance.',
        category: 'ordering',
    },
    {
        id: '5',
        question: 'How do loyalty points work?',
        answer: 'You earn 1 point for every $1 spent. Points can be redeemed for discounts on future orders. Check your loyalty balance in the app.',
        category: 'rewards',
    },
    {
        id: '6',
        question: 'What is your refund policy?',
        answer: 'If you are unsatisfied with your order, please contact us within 24 hours. We offer refunds or replacements for quality issues.',
        category: 'payment',
    },
    {
        id: '7',
        question: 'How do I update my delivery address?',
        answer: 'Go to Profile → My Addresses to add, edit, or remove delivery addresses. You can also add a new address during checkout.',
        category: 'account',
    },
    {
        id: '8',
        question: 'Do you cater for dietary restrictions?',
        answer: 'Yes! Menu items are labeled with dietary information (vegetarian, vegan, gluten-free, etc.). You can also add special instructions when ordering.',
        category: 'ordering',
    },
];

const categories = [
    { id: 'all', label: 'All Topics', icon: HelpCircle },
    { id: 'ordering', label: 'Ordering', icon: ShoppingBag },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'delivery', label: 'Delivery', icon: Truck },
    { id: 'rewards', label: 'Rewards', icon: Gift },
    { id: 'account', label: 'Account', icon: User },
];

export default function HelpSupport() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
    const [contactForm, setContactForm] = useState({
        subject: '',
        message: '',
    });

    // Filter FAQs
    const filteredFaqs = faqs.filter((faq) => {
        const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
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
            toastSuccess('Message sent! We will get back to you soon.');
            setContactForm({ subject: '', message: '' });
        },
        onError: () => {
            toastError('Failed to send message. Please try again.');
        },
    });

    const handleSubmitContact = (e: React.FormEvent) => {
        e.preventDefault();
        if (!contactForm.subject.trim() || !contactForm.message.trim()) {
            toastError('Please fill in all fields');
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
                        Help & Support
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xl mx-auto">
                        Find answers to common questions or get in touch with our support team
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
                                placeholder="Search for help..."
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
                            <h3 className="font-semibold text-lg">Call Us</h3>
                            <p className="text-white/80 text-sm mt-1">Available 9AM - 10PM</p>
                            <a href="tel:+855123456789" className="mt-3 inline-flex items-center gap-2 text-sm font-medium hover:underline">
                                +855 12 345 6789
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-fuchsia-500 to-pink-500 border-0">
                        <CardContent className="p-6 text-white">
                            <Mail className="w-8 h-8 mb-3" />
                            <h3 className="font-semibold text-lg">Email Us</h3>
                            <p className="text-white/80 text-sm mt-1">We reply within 24 hours</p>
                            <a href="mailto:support@nkhrestaurant.com" className="mt-3 inline-flex items-center gap-2 text-sm font-medium hover:underline">
                                support@nkhrestaurant.com
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-500 to-indigo-500 border-0">
                        <CardContent className="p-6 text-white">
                            <MessageCircle className="w-8 h-8 mb-3" />
                            <h3 className="font-semibold text-lg">Live Chat</h3>
                            <p className="text-white/80 text-sm mt-1">Chat with our team</p>
                            <button className="mt-3 inline-flex items-center gap-2 text-sm font-medium hover:underline">
                                Start Chat
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
                            <h3 className="font-semibold text-gray-900 dark:text-white px-3 py-2">Categories</h3>
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
                            Frequently Asked Questions
                        </h2>

                        {filteredFaqs.length === 0 ? (
                            <Card hover={false}>
                                <CardContent className="p-8 text-center">
                                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-500 dark:text-gray-400">No results found for "{searchQuery}"</p>
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
                                                        {faq.question}
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
                                                                {faq.answer}
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
                            Still need help? Contact Us
                        </h2>
                        <form onSubmit={handleSubmitContact} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Subject
                                </label>
                                <input
                                    type="text"
                                    value={contactForm.subject}
                                    onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                                    placeholder="What do you need help with?"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-fuchsia-500/50 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Message
                                </label>
                                <textarea
                                    value={contactForm.message}
                                    onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                                    placeholder="Describe your issue or question in detail..."
                                    rows={5}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-fuchsia-500/50 focus:outline-none resize-none"
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
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Send Message
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
                            Visit Us
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-xl bg-fuchsia-100 dark:bg-fuchsia-900/30">
                                    <MapPin className="w-5 h-5 text-fuchsia-600 dark:text-fuchsia-400" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900 dark:text-white">Address</h3>
                                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                                        123 Food Street, Phnom Penh<br />
                                        Cambodia
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-xl bg-fuchsia-100 dark:bg-fuchsia-900/30">
                                    <Clock className="w-5 h-5 text-fuchsia-600 dark:text-fuchsia-400" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900 dark:text-white">Opening Hours</h3>
                                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                                        Mon - Fri: 9:00 AM - 10:00 PM<br />
                                        Sat - Sun: 10:00 AM - 11:00 PM
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
