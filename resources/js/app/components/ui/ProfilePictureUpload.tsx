import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/app/components/ui/Button';
import { Camera, X, Loader2, Trash2, User } from 'lucide-react';
import { apiPost, apiDelete } from '@/app/libs/apiClient';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';
import { router } from '@inertiajs/react';

interface ProfilePictureUploadProps {
    currentAvatar?: string | null;
    name: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    onUploadSuccess?: (newUrl: string) => void;
    onDeleteSuccess?: () => void;
    showDelete?: boolean;
}

export default function ProfilePictureUpload({
    currentAvatar,
    name,
    className,
    size = 'lg',
    onUploadSuccess,
    onDeleteSuccess,
    showDelete = true
}: ProfilePictureUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        // Only set previewUrl when currentAvatar changes and is not null/undefined
        if (currentAvatar) {
            setPreviewUrl(currentAvatar);
        } else if (previewUrl === null && !currentAvatar) {
            // Keep null if no avatar
        }
    }, [currentAvatar]);

    const sizeClasses = {
        sm: 'w-10 h-10 text-xs',
        md: 'w-14 h-14 text-sm',
        lg: 'w-20 h-20 text-lg',
        xl: 'w-24 h-24 sm:w-32 sm:h-32 text-2xl sm:text-3xl'
    };

    const iconSizes = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5',
        xl: 'w-5 h-5 sm:w-6 sm:h-6'
    };

    const buttonSizes = {
        sm: 'p-1.5',
        md: 'p-2',
        lg: 'p-2.5',
        xl: 'p-2.5 sm:p-3'
    };

    const getInitials = (name: string) => {
        if (!name) return '?';
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validations
        if (!file.type.startsWith('image/')) {
            toastError('Please select an image file');
            return;
        }

        if (file.size > 2 * 1024 * 1024) { // 2MB
            toastError('Image size should be less than 2MB');
            return;
        }

        // Preview
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        // Upload
        const formData = new FormData();
        formData.append('avatar', file);

        setIsUploading(true);
        try {
            // Don't set Content-Type header - axios sets it automatically for FormData
            // Use /customer/avatar route which supports both Auth and Telegram guests (Sprint P15)
            const response = await apiPost('customer/avatar', formData) as any;

            toastSuccess('Profile picture updated');
            if (response.avatar_url) {
                setPreviewUrl(response.avatar_url);
                if (onUploadSuccess) onUploadSuccess(response.avatar_url);

                // Force reload to update all instances (header, etc)
                router.reload();
            }
        } catch (error: any) {
            console.error(error);
            toastError(error.response?.data?.message || 'Failed to upload image');
            // Revert preview on error
            setPreviewUrl(currentAvatar || null);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async () => {
        if (!previewUrl) return;

        if (!confirm('Are you sure you want to remove your profile picture?')) return;

        setIsDeleting(true);
        try {
            // Use /customer/avatar route which supports both Auth and Telegram guests (Sprint P15)
            await apiDelete('customer/avatar');
            toastSuccess('Profile picture removed');
            setPreviewUrl(null);
            if (onDeleteSuccess) onDeleteSuccess();
            router.reload();
        } catch (error: any) {
            console.error(error);
            toastError(error.response?.data?.message || 'Failed to remove image');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className={cn('relative group inline-flex flex-col items-center', className)}>
            <div className={cn(
                'rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg relative bg-gray-100 dark:bg-gray-800 flex items-center justify-center',
                sizeClasses[size]
            )}>
                {previewUrl ? (
                    <img
                        src={previewUrl}
                        alt={name || 'Profile'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            // Fallback to initials if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = `<span class="font-bold text-gray-400 ${sizeClasses[size].split(' ')[2]}">${getInitials(name)}</span>`;
                        }}
                    />
                ) : (
                    <span className={cn(
                        'font-bold text-gray-400 flex items-center justify-center',
                        sizeClasses[size].split(' ')[2]
                    )}>
                        {getInitials(name)}
                    </span>
                )}

                {(isUploading || isDeleting) && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className={cn('text-white animate-spin', iconSizes[size])} />
                    </div>
                )}
            </div>

            {/* Action buttons - positioned at bottom-right corner of avatar */}
            <div className="absolute -bottom-1 -right-1 w-full justify-around sm:bottom-0 sm:right-0 flex gap-1">
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || isDeleting}
                    className={cn(
                        'rounded-full bg-purple-600 text-white hover:bg-purple-700 shadow-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 w-6 h-6 sm:w-9 sm:h-9 flex items-center justify-center p-0',
                        // buttonSizes[size] // Overriding size padding for custom sizes
                    )}
                    aria-label="Upload profile picture"
                >
                    <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>

                {showDelete && previewUrl && (
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isUploading || isDeleting}
                        className={cn(
                            'rounded-full bg-red-600 text-white hover:bg-red-700 shadow-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 w-6 h-6 sm:w-9 sm:h-9 flex items-center justify-center p-0',
                            // buttonSizes[size] // Overriding size padding for custom sizes
                        )}
                        aria-label="Delete profile picture"
                    >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/png, image/jpeg, image/jpg, image/gif"
                onChange={handleFileChange}
            />
        </div>
    );
}

