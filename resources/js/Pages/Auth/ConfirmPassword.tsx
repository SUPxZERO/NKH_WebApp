import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors } = useForm({
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.confirm'));
    };

    return (
        <>
            <Head title="Confirm Password" />
            <div className="flex min-h-screen items-center justify-center">
                <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-md">
                    <p className="mb-4 text-sm text-gray-600">
                        This is a secure area. Please confirm your password before continuing.
                    </p>
                    <form onSubmit={submit}>
                        <div className="mb-4">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="mt-1 block w-full rounded border-gray-300 shadow-sm"
                                autoFocus
                            />
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            Confirm
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
