
import React from 'react';
import { motion } from 'framer-motion';
import { LoadingLogo } from '@/Components/brand';

interface LoadingScreenProps {
    message?: string;
    fullScreen?: boolean;
    className?: string;
}

export default function LoadingScreen({
    message = "Preparing your experience...",
    fullScreen = true,
    className
}: LoadingScreenProps) {
    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-900/90 backdrop-blur-md">
                <LoadingLogo message={message} />
            </div>
        );
    }

    return (
        <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
            <LoadingLogo message={message} />
        </div>
    );
}
