import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    MessageSquare,
    Star,
    Send,
    ThumbsUp,
    Calendar,
    User,
    CheckCircle
} from 'lucide-react';
import CustomerLayout from '@/app/layouts/CustomerLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { apiGet, apiPost } from '@/app/utils/api';
import { cn } from '@/app/utils/cn';

const RATING_CATEGORIES = [
    { key: 'overall_rating', label: 'Overall Experience', icon: Star },
    { key: 'food_rating', label: 'Food Quality', icon: '🍽️' },
    { key: 'service_rating', label: 'Service', icon: User },
    { key: 'ambiance_rating', label: 'Ambiance', icon: '✨' },
];

export default function Feedback() {
    const queryClient = useQueryClient();
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [ratings, setRatings] = useState({
        overall_rating: 0,
        food_rating: 0,
        service_rating: 0,
        ambiance_rating: 0,
    });
    const [comment, setComment] = useState('');

    // Fetch orders for feedback
    const { data: ordersData } = useQuery({
        queryKey: ['customer', 'orders'],
        queryFn: () => apiGet('/api/customer/orders')
    });

    // Fetch existing feedback
    const { data: feedbackData } = useQuery({
        queryKey: ['customer', 'history'],
        queryFn: () => apiGet('/api/customer/history')
    });

    const orders = ordersData?.data || [];
    const feedbackList = feedbackData?.data?.feedback || [];

    // Submit feedback mutation
    const submitFeedbackMutation = useMutation({
        mutationFn: (data: any) => apiPost('/api/feedback', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer', 'history'] });
            setShowFeedbackModal(false);
            resetForm();
        }
    });

    const resetForm = () => {
        setRatings({
            overall_rating: 0,
            food_rating: 0,
            service_rating: 0,
            ambiance_rating: 0,
        });
        setComment('');
        setSelectedOrder(null);
    };

    const handleSubmitFeedback = () => {
        if (!selectedOrder) return;

        submitFeedbackMutation.mutate({
            order_id: selectedOrder.id,
            ...ratings,
            comment,
        });
    };

    const handleStartFeedback = (order: any) => {
        setSelectedOrder(order);
        setShowFeedbackModal(true);
    };

    const StarRating = ({ rating, onRate }: { rating: number; onRate: (rating: number) => void }) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        onClick={() => onRate(star)}
                        className="transition-transform hover:scale-110"
                    >
                        <Star
                            className={cn(
                                "w-8 h-8 transition-colors",
                                star <= rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300 dark:text-gray-600"
                            )}
                        />
                    </button>
                ))}
            </div>
        );
    };

    return (
        <CustomerLayout>
            <div className="p-6 max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <MessageSquare className="w-8 h-8 text-purple-600" />
                        Feedback & Reviews
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Share your experience and help us improve
                    </p>
                </div>

                {/* Orders Awaiting Feedback */}
                <Card>
                    <CardContent className="p-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            Rate Your Recent Orders
                        </h2>

                        {orders.length > 0 ? (
                            <div className="space-y-3">
                                {orders.slice(0, 5).map((order: any) => {
                                    const hasFeedback = feedbackList.some((f: any) => f.order_id === order.id);

                                    return (
                                        <div
                                            key={order.id}
                                            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                                        Order #{order.id}
                                                    </h3>
                                                    <span className="text-sm text-gray-500">
                                                        {new Date(order.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                    ${parseFloat(order.total || 0).toFixed(2)} • {order.items?.length || 0} items
                                                </p>
                                            </div>

                                            {hasFeedback ? (
                                                <div className="flex items-center gap-2 text-green-600">
                                                    <CheckCircle className="w-5 h-5" />
                                                    <span className="text-sm font-medium">Reviewed</span>
                                                </div>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleStartFeedback(order)}
                                                >
                                                    <Star className="w-4 h-4 mr-2" />
                                                    Leave Feedback
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 dark:text-gray-400">
                                    No orders to review yet. Place an order first!
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Previous Feedback */}
                {feedbackList.length > 0 && (
                    <Card>
                        <CardContent className="p-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                Your Reviews
                            </h2>

                            <div className="space-y-4">
                                {feedbackList.map((feedback: any) => (
                                    <div
                                        key={feedback.id}
                                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                                    Order #{feedback.order_id}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(feedback.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                                <span className="font-semibold text-gray-900 dark:text-white">
                                                    {feedback.overall_rating}/5
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                                            {RATING_CATEGORIES.slice(1).map((category) => (
                                                <div key={category.key} className="text-sm">
                                                    <span className="text-gray-600 dark:text-gray-400">
                                                        {category.label}:
                                                    </span>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                        <span className="font-medium">
                                                            {feedback[category.key] || 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {feedback.comment && (
                                            <p className="text-gray-700 dark:text-gray-300 text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded">
                                                "{feedback.comment}"
                                            </p>
                                        )}

                                        {feedback.response && (
                                            <div className="mt-3 pl-4 border-l-2 border-purple-500">
                                                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                                                    Restaurant Response:
                                                </p>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                                    {feedback.response}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Feedback Modal */}
                {showFeedbackModal && selectedOrder && (
                    <>
                        <div
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                            onClick={() => setShowFeedbackModal(false)}
                        />
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div
                                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="p-6 space-y-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                            Rate Your Experience
                                        </h2>
                                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                                            Order #{selectedOrder.id} • ${parseFloat(selectedOrder.total || 0).toFixed(2)}
                                        </p>
                                    </div>

                                    {/* Rating Categories */}
                                    <div className="space-y-4">
                                        {RATING_CATEGORIES.map((category) => (
                                            <div key={category.key}>
                                                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                                                    {category.label}
                                                </label>
                                                <StarRating
                                                    rating={ratings[category.key as keyof typeof ratings]}
                                                    onRate={(rating) => setRatings({ ...ratings, [category.key]: rating })}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    {/* Comment */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                                            Your Comments (Optional)
                                        </label>
                                        <textarea
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            rows={4}
                                            placeholder="Tell us about your experience..."
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowFeedbackModal(false)}
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleSubmitFeedback}
                                            disabled={ratings.overall_rating === 0 || submitFeedbackMutation.isPending}
                                            className="flex-1"
                                        >
                                            {submitFeedbackMutation.isPending ? (
                                                'Submitting...'
                                            ) : (
                                                <>
                                                    <Send className="w-4 h-4 mr-2" />
                                                    Submit Feedback
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </div>
        </CustomerLayout>
    );
}
