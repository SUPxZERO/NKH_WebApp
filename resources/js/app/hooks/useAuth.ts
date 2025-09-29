import { usePage, router } from '@inertiajs/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'employee' | 'customer';
  phone?: string;
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface LoginCredentials extends Record<string, any> {
  email: string;
  password: string;
  role: 'admin' | 'employee' | 'customer';
  remember?: boolean;
}

interface RegisterData extends Record<string, any> {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: 'admin' | 'employee' | 'customer';
  phone: string;
  terms: boolean;
  // Role-specific fields
  employee_id?: string;
  department?: string;
  admin_code?: string;
  restaurant_location?: string;
}

export function useAuth() {
  const { props } = usePage();
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);

  // Get user from Inertia props
  const user = (props.auth?.user as User) || null;
  const isAuthenticated = !!user;

  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      return new Promise((resolve, reject) => {
        router.post('/login', credentials, {
          onSuccess: (page) => {
            const user = page.props.auth?.user as User;
            if (user) {
              // Role-based redirect
              const redirectPaths = {
                admin: '/admin/dashboard',
                employee: '/employee/pos',
                customer: '/dashboard',
              };
              
              toast.success(`Welcome back, ${user.name}!`);
              router.visit(redirectPaths[user.role]);
              resolve(user);
            }
          },
          onError: (errors) => {
            const errorMessage = typeof errors === 'object' && errors !== null
              ? Object.values(errors)[0] as string
              : 'Invalid credentials';
            toast.error(errorMessage);
            reject(new Error(errorMessage));
          },
        });
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      return new Promise((resolve, reject) => {
        router.post('/register', data, {
          onSuccess: () => {
            toast.success('Account created successfully! Please check your email to verify your account.');
            router.visit('/login');
            resolve(true);
          },
          onError: (errors) => {
            const errorMessage = typeof errors === 'object' && errors !== null
              ? Object.values(errors)[0] as string
              : 'Registration failed';
            toast.error(errorMessage);
            reject(new Error(errorMessage));
          },
        });
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return new Promise<void>((resolve) => {
        router.post('/logout', {}, {
          onSuccess: () => {
            queryClient.clear();
            toast.success('Logged out successfully');
            router.visit('/login');
            resolve();
          },
          onFinish: () => resolve(),
        });
      });
    },
  });

  // Forgot password mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      return new Promise((resolve, reject) => {
        router.post('/forgot-password', { email }, {
          onSuccess: () => {
            toast.success('Password reset link sent to your email!');
            resolve(true);
          },
          onError: (errors) => {
            const errorMessage = typeof errors === 'object' && errors !== null
              ? Object.values(errors)[0] as string
              : 'Failed to send reset link';
            toast.error(errorMessage);
            reject(new Error(errorMessage));
          },
        });
      });
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { token: string; email: string; password: string; password_confirmation: string }) => {
      return new Promise((resolve, reject) => {
        router.post('/reset-password', data, {
          onSuccess: () => {
            toast.success('Password reset successfully! Please sign in with your new password.');
            router.visit('/login');
            resolve(true);
          },
          onError: (errors) => {
            const errorMessage = typeof errors === 'object' && errors !== null
              ? Object.values(errors)[0] as string
              : 'Failed to reset password';
            toast.error(errorMessage);
            reject(new Error(errorMessage));
          },
        });
      });
    },
  });

  // Email verification mutation
  const resendVerificationMutation = useMutation({
    mutationFn: async () => {
      return new Promise((resolve, reject) => {
        router.post('/email/verification-notification', {}, {
          onSuccess: () => {
            toast.success('Verification email sent!');
            resolve(true);
          },
          onError: (errors) => {
            const errorMessage = typeof errors === 'object' && errors !== null
              ? Object.values(errors)[0] as string
              : 'Failed to send verification email';
            toast.error(errorMessage);
            reject(new Error(errorMessage));
          },
        });
      });
    },
  });

  // Check if user has specific role
  const hasRole = (role: string | string[]) => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  };

  // Check if user has permission (you can extend this based on your permission system)
  const hasPermission = (permission: string) => {
    if (!user) return false;
    
    // Basic role-based permissions
    const rolePermissions = {
      admin: ['*'], // Admin has all permissions
      employee: ['pos', 'orders', 'tables'],
      customer: ['orders', 'profile'],
    };

    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  };

  // Redirect to appropriate dashboard based on role
  const redirectToDashboard = () => {
    if (!user) {
      router.visit('/login');
      return;
    }

    const redirectPaths = {
      admin: '/admin/dashboard',
      employee: '/employee/pos',
      customer: '/dashboard',
    };

    router.visit(redirectPaths[user.role]);
  };

  return {
    // State
    user,
    isAuthenticated,
    isLoading: !isInitialized || loginMutation.isPending || logoutMutation.isPending,
    isInitialized,

    // Actions
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    forgotPassword: forgotPasswordMutation.mutateAsync,
    resetPassword: resetPasswordMutation.mutateAsync,
    resendVerification: resendVerificationMutation.mutateAsync,

    // Mutation states
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isSendingResetLink: forgotPasswordMutation.isPending,
    isResettingPassword: resetPasswordMutation.isPending,
    isResendingVerification: resendVerificationMutation.isPending,

    // Utilities
    hasRole,
    hasPermission,
    redirectToDashboard,
  };
}
