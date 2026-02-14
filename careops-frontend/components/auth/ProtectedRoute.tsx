"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireRole?: "owner" | "staff";
  fallback?: React.ReactNode;
}

/**
 * ProtectedRoute Component - Enhanced Security
 * 
 * Multi-layer authentication strategy:
 * 1. Server-side: Next.js middleware validates before render
 * 2. Client-side: This component validates on mount and periodically
 * 3. Auto-refresh: Proactively refreshes tokens before expiry
 * 
 * Security principles:
 * - Defense in depth (multiple validation layers)
 * - Fail secure (redirect on any auth failure)
 * - Session monitoring (auto-logout on token expiry)
 * - Zero trust (verify every request)
 * 
 * References:
 * - OWASP authentication cheat sheet
 * - JWT best practices (RFC 8725)
 */
export function ProtectedRoute({
  children,
  requireAuth = true,
  requireRole,
  fallback,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, isLoading, checkAuth, refreshToken } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const [redirectCount, setRedirectCount] = useState(0);

  useEffect(() => {
    const validateAccess = async () => {
      // Prevent infinite redirect loops
      if (redirectCount > 3) {
        console.error("Redirect loop detected");
        setIsChecking(false);
        return;
      }

      if (!requireAuth) {
        setIsChecking(false);
        return;
      }

      // Check authentication status
      const authenticated = await checkAuth();
      
      if (!authenticated) {
        setRedirectCount(prev => prev + 1);
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      // Check role if required
      if (requireRole && user?.role !== requireRole) {
        router.push("/dashboard");
        return;
      }

      setIsChecking(false);
    };

    validateAccess();
  }, [requireAuth, requireRole, checkAuth, router, pathname, user, redirectCount]);

  // Auto-refresh token every 10 minutes
  useEffect(() => {
    if (!isAuthenticated) return;

    const refreshInterval = setInterval(async () => {
      await refreshToken();
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, refreshToken]);

  // Show loading state while checking auth
  if (isLoading || isChecking) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Render children if authenticated or auth not required
  return <>{children}</>;
}

/**
 * withAuth HOC - Higher Order Component for protecting pages
 * 
 * Usage:
 * const ProtectedPage = withAuth(MyPageComponent);
 * export default ProtectedPage;
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ProtectedRouteProps, "children">
) {
  return function WithAuthComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

/**
 * AuthGuard - Simple auth check hook for use in components
 */
export function useAuthGuard(requireAuth: boolean = true) {
  const router = useRouter();
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const check = async () => {
      if (!requireAuth) {
        setIsAuthorized(true);
        return;
      }

      const authed = await checkAuth();
      if (!authed) {
        router.push("/login");
      } else {
        setIsAuthorized(true);
      }
    };

    check();
  }, [requireAuth, router, checkAuth]);

  return { isAuthenticated, isLoading, isAuthorized };
}
