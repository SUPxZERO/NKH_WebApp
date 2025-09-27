import toast, { ToastOptions } from 'react-hot-toast';

export function toastSuccess(message: string, opts?: ToastOptions) {
  return toast.success(message, opts);
}

export function toastError(message: string, opts?: ToastOptions) {
  return toast.error(message, opts);
}

export function toastInfo(message: string, opts?: ToastOptions) {
  return toast(message, { icon: '💡', ...opts });
}

export function toastLoading<T>(promise: Promise<T>, messages: { loading: string; success: string; error: string }, opts?: ToastOptions) {
  return toast.promise(promise, messages, opts);
}
