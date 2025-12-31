import {
    Dialog,
    DialogPanel,
    DialogBackdrop,
} from '@headlessui/react';
import { PropsWithChildren } from 'react';

export default function Modal({
    children,
    show = false,
    maxWidth = '2xl',
    closeable = true,
    onClose = () => { },
}: PropsWithChildren<{
    show: boolean;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    closeable?: boolean;
    onClose: CallableFunction;
}>) {
    const close = () => {
        if (closeable) {
            onClose();
        }
    };

    const maxWidthClass = {
        sm: 'sm:max-w-sm',
        md: 'sm:max-w-md',
        lg: 'sm:max-w-lg',
        xl: 'sm:max-w-xl',
        '2xl': 'sm:max-w-2xl',
    }[maxWidth];

    // Ensure we are in the browser
    if (typeof window === 'undefined') return null;

    return (
        <Dialog
            open={show}
            onClose={close}
            transition
            className="relative z-[100]"
        >
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-gray-500/75 transition-opacity duration-300 ease-out data-[closed]:opacity-0"
            />

            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                    <DialogPanel
                        transition
                        className={`relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all duration-300 ease-out data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95 ${maxWidthClass}`}
                    >
                        {children}
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    );
}
