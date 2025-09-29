import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'employee' | 'customer';
  phone?: string;
  email_verified_at?: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
  // Role-specific fields
  employee_id?: string;
  department?: string;
  restaurant_location?: string;
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

  // Get user from Inertia props
  const user = (props.auth?.user as User) || null;
  const isAuthenticated = !!user;

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

  // Check if user has permission (extend based on your permission system)
  const hasPermission = (permission: string) => {
    if (!user) return false;
    
    // Role-based permissions
    const rolePermissions = {
      admin: [
        'users.view', 'users.create', 'users.edit', 'users.delete',
        'employees.view', 'employees.create', 'employees.edit', 'employees.delete',
        'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
        'categories.view', 'categories.create', 'categories.edit', 'categories.delete',
        'menu.view', 'menu.create', 'menu.edit', 'menu.delete',
        'orders.view', 'orders.create', 'orders.edit', 'orders.delete', 'orders.approve',
        'tables.view', 'tables.create', 'tables.edit', 'tables.delete',
        'floors.view', 'floors.create', 'floors.edit', 'floors.delete',
        'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.delete',
        'expenses.view', 'expenses.create', 'expenses.edit', 'expenses.delete',
        'reservations.view', 'reservations.create', 'reservations.edit', 'reservations.delete',
        'settings.view', 'settings.edit',
        'reports.view', 'analytics.view',
        '*' // Admin has all permissions
      ],
      employee: [
        'pos.access',
        'orders.view', 'orders.create', 'orders.edit',
        'tables.view', 'tables.edit',
        'menu.view',
        'customers.view',
        'reservations.view', 'reservations.create',
      ],
      customer: [
        'menu.view',
        'orders.view', 'orders.create',
        'profile.view', 'profile.edit',
        'addresses.view', 'addresses.create', 'addresses.edit', 'addresses.delete',
        'reservations.view', 'reservations.create',
      ],
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
    isLoading,
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
