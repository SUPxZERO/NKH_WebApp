import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTelegramAuth } from '../hooks/useTelegramAuth';

interface User {
  id: number;
  name: string;
  email: string;
  role: string; // Standardized to single string role
  permissions?: string[];
  phone?: string;
  email_verified_at?: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
  // Role-specific fields
  employee_id?: string;
  department?: string;
  restaurant_location?: string;
  // Telegram fields
  is_telegram_user?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasRole: (role: string | string[]) => boolean;
  hasPermission: (permission: string) => boolean;
  redirectToDashboard: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { props } = usePage();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);

  // SPRINT P16: Integrate Telegram Auth
  const { backendUser, isAuthenticated: isTelegramAuth, isLoading: isTelegramLoading, isInTelegram } = useTelegramAuth();

  // Get user from Inertia props OR from Telegram Auth
  const user = (props.auth?.user as User) || (isTelegramAuth ? backendUser : null);
  const isAuthenticated = !!user;

  // Combined loading state - wait for both initial mount AND Telegram auth if in Telegram context
  // This prevents premature redirects to login before Telegram session is established
  const combinedLoading = isLoading || (isInTelegram && isTelegramLoading);

  useEffect(() => {
    // Initialize auth state
    setIsLoading(false);
  }, []);

  // Check if user has specific role
  const hasRole = (role: string | string[]) => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  };

  // Check if user has permission
  const hasPermission = (permission: string) => {
    if (!user) return false;

    const explicitPermissions = user.permissions;
    if (Array.isArray(explicitPermissions)) {
      // Check for specific permission or universal bypass
      return explicitPermissions.includes(permission) || explicitPermissions.includes('*');
    }

    return false;
  };

  // Redirect to appropriate dashboard based on role
  const redirectToDashboard = () => {
    if (!user) {
      router.visit('/login');
      return;
    }

    const role = user.role;
    // Map roles to dashboard paths
    if (role === 'admin' || role === 'super-admin' || role.includes('manager')) {
      router.visit('/admin/dashboard');
    } else if (role === 'employee' || role === 'chef' || role === 'waiter') {
      router.visit('/employee/pos');
    } else {
      router.visit('/dashboard');
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    return new Promise<void>((resolve) => {
      router.post('/logout', {}, {
        onSuccess: () => {
          // Clear all cached data
          queryClient.clear();
          toast.success('Logged out successfully');
          router.visit('/login');
          resolve();
        },
        onError: () => {
          toast.error('Failed to logout');
          resolve();
        },
        onFinish: () => resolve(),
      });
    });
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    isLoading: combinedLoading,
    hasRole,
    hasPermission,
    redirectToDashboard,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Higher-order component for route protection
interface RequireAuthProps {
  children: React.ReactNode;
  roles?: string[];
  permissions?: string[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function RequireAuth({
  children,
  roles,
  permissions,
  fallback,
  redirectTo = '/login'
}: RequireAuthProps) {
  const { user, isAuthenticated, hasRole, hasPermission, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast.error('Please sign in to access this page');
      router.visit(redirectTo);
    }
  }, [isAuthenticated, isLoading, redirectTo]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500"></div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return fallback || null;
  }

  // Check roles
  if (roles && !hasRole(roles)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400 mb-4">You don't have permission to access this page.</p>
          <button
            onClick={() => router.visit('/')}
            className="px-4 py-2 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Check permissions
  if (permissions && !permissions.some(permission => hasPermission(permission))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Insufficient Permissions</h1>
          <p className="text-gray-400 mb-4">You don't have the required permissions to access this resource.</p>
          <button
            onClick={() => router.visit('/')}
            className="px-4 py-2 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Hook for role-based rendering
export function useRoleAccess() {
  const { hasRole, hasPermission } = useAuth();

  const canAccess = (roles?: string[], permissions?: string[]) => {
    if (roles && !hasRole(roles)) return false;
    if (permissions && !permissions.some(permission => hasPermission(permission))) return false;
    return true;
  };

  return { canAccess, hasRole, hasPermission };
}
