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
 * ProtectedRoute Component
 * 
 * Protects routes based on authentication status and user roles.
 * 
 * First Principles:
 * - Visibility: Clear feedback on why access is denied
 * - Zero Friction: Redirect to login seamlessly
 * - Security: Check auth status before rendering protected content
 * 
 * Inversion Analysis - What could go wrong:
 * 1. Flash of unauthenticated content (FOUC) → Show loading state
 * 2. Infinite redirect loops → Track redirect count
 * 3. Role check bypass → Validate role on server too
 * 4. Token expiration not handled → Check token expiry
 * 5. Hydration mismatch → Use client-side only rendering
 */
export function ProtectedRoute({
  children,
  requireAuth = true,
  requireRole,
  fallback,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, isLoading, checkAuth } = useAuthStore();
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

      // Check authentication status
      const isAuthed = await checkAuth();

      if (requireAuth && !isAuthed) {
        // Store intended destination for post-login redirect
        if (pathname !== "/login") {
          sessionStorage.setItem("redirectAfterLogin", pathname);
        }
        setRedirectCount((prev) => prev + 1);
        router.push("/login");
        return;
      }

      // Check role requirements
      if (requireRole && user?.role !== requireRole && user?.role !== "owner") {
        // Owners can access everything, staff has restrictions
        if (requireRole === "owner" && user?.role !== "owner") {
          router.push("/dashboard"); // Redirect staff away from owner-only pages
          return;
        }
      }

      // If no auth required but user is logged in, optionally redirect away from public auth pages
      if (!requireAuth && isAuthed && pathname === "/login") {
        const redirectTo = sessionStorage.getItem("redirectAfterLogin") || "/dashboard";
        sessionStorage.removeItem("redirectAfterLogin");
        router.push(redirectTo);
        return;
      }

      setIsChecking(false);
    };

    validateAccess();
  }, [requireAuth, requireRole, isAuthenticated, user, pathname, router, checkAuth, redirectCount]);

  // Show loading state while checking authentication
  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  // If authentication is required but user is not authenticated, show nothing
  // (redirect will happen)
  if (requireAuth && !isAuthenticated) {
    return fallback || null;
  }

  // If role is required but user doesn't have it, show nothing
  // (redirect will happen)
  if (requireRole && user?.role !== requireRole && user?.role !== "owner") {
    return fallback || null;
  }

  // Render protected content
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
