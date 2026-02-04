import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Head } from '@inertiajs/react';
import {
    MessageSquare,
    Star,
    Shield,
    ShieldOff,
    Send,
    ThumbsUp,
    Coffee
} from 'lucide-react';
import EmployeeLayout from '@/app/layouts/EmployeeLayout';
import { Button } from '@/app/components/ui/Button';
import { apiPost } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';
import { useLanguage } from '@/app/context/LanguageContext';

export default function Feedback() {
    const { t } = useLanguage();
    const [rating, setRating] = useState<number>(0);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [type, setType] = useState('general');
    const [comment, setComment] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);

    const submitFeedbackMutation = useMutation({
        mutationFn: (data: any) => apiPost('/api/employee/feedback', data),
        onSuccess: () => {
            toastSuccess(t('employee.feedback.messages.thank_you'));
            setRating(0);
            setComment('');
            setType('general');
        },
        onError: () => toastError(t('employee.common.error')),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        submitFeedbackMutation.mutate({
            type,
            comment,
            rating: type === 'shift_rating' || rating > 0 ? rating : null,
            is_anonymous: isAnonymous,
            shift_id: null, // Logic to get current shift ID would go here
        });
    };

    return (
        <EmployeeLayout>
            <Head title={t('employee.feedback.title')} />
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mb-4">
                            <MessageSquare className="w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                            {t('employee.feedback.submit')}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
                            {t('employee.feedback.messages.thank_you')}
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">

                        {/* Anonymous Toggle Banner */}
                        <div
                            className={cn(
                                "p-4 flex items-center justify-between border-b transition-colors duration-300",
                                isAnonymous
                                    ? "bg-slate-800 text-white border-slate-700"
                                    : "bg-purple-50 dark:bg-slate-800 text-purple-900 dark:text-slate-200 border-purple-100 dark:border-slate-700"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                {isAnonymous ? <Shield className="w-5 h-5 text-green-400" /> : <ShieldOff className="w-5 h-5 text-slate-400" />}
                                <div>
                                    <p className="font-semibold text-sm">
                                        {isAnonymous ? t('employee.feedback.anonymous') : t('employee.feedback.public_mode')}
                                    </p>
                                    <p className="text-xs opacity-80">
                                        {isAnonymous ? t('employee.feedback.identity_hidden') : t('employee.feedback.name_attached')}
                                    </p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isAnonymous}
                                    onChange={() => setIsAnonymous(!isAnonymous)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                            </label>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">

                            {/* Type Selector */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { id: 'general', label: t('employee.feedback.type.general') },
                                    { id: 'suggestion', label: t('employee.feedback.type.suggestion') },
                                    { id: 'complaint', label: t('employee.feedback.type.issue') },
                                    { id: 'shift_rating', label: t('employee.feedback.type.shift_rating') },
                                ].map((t) => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setType(t.id)}
                                        className={cn(
                                            "py-2 px-3 text-sm font-medium rounded-lg border transition-all",
                                            type === t.id
                                                ? "bg-purple-600 border-purple-600 text-white shadow-sm"
                                                : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600"
                                        )}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>

                            {/* Star Rating (Conditional) */}
                            {(type === 'shift_rating' || type === 'general') && (
                                <div className="text-center py-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                                        {t('employee.feedback.rate_prompt')}
                                    </label>
                                    <div className="flex justify-center gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                type="button"
                                                key={star}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                onClick={() => setRating(star)}
                                                className="focus:outline-none transition-transform hover:scale-110"
                                            >
                                                <Star
                                                    className={cn(
                                                        "w-10 h-10 transition-colors",
                                                        (hoverRating || rating) >= star
                                                            ? "fill-amber-400 text-amber-400"
                                                            : "text-slate-300 dark:text-slate-600"
                                                    )}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-sm font-medium text-slate-500 mt-2 h-5">
                                        {t(`employee.feedback.rating.${['none', 'very_poor', 'poor', 'average', 'good', 'excellent'][(hoverRating || rating)]}`)}
                                    </p>
                                </div>
                            )}

                            {/* Comment Area */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    {t('employee.feedback.message')}
                                </label>
                                <textarea
                                    className="w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-700 p-4 min-h-[120px] focus:ring-2 focus:ring-purple-500"
                                    placeholder={
                                        type === 'suggestion' ? t('employee.feedback.placeholders.suggestion') :
                                            type === 'complaint' ? t('employee.feedback.placeholders.complaint') :
                                                t('employee.feedback.placeholders.general')
                                    }
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={submitFeedbackMutation.isPending}
                                className="w-full h-12 text-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700"
                            >
                                {submitFeedbackMutation.isPending ? t('employee.common.submitting') : t('employee.feedback.submit')}
                                <Send className="w-5 h-5 ml-2" />
                            </Button>
                        </form>
                    </div>

                    <p className="text-center text-xs text-slate-400 mt-8">
                        {t('employee.feedback.footer')}
                    </p>
                </div>
            </div>
        </EmployeeLayout>
    );
}
