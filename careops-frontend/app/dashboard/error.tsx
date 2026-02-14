'use client'

import { AlertCircle, RefreshCw, Home } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--neutral-50)]">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-semibold text-[var(--neutral-900)] mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-[var(--neutral-500)] mb-6">
          An unexpected error occurred in the dashboard. Please try again.
        </p>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mb-6 text-left">
            <summary className="text-xs text-[var(--neutral-400)] cursor-pointer hover:text-[var(--neutral-600)]">
              Error details (dev only)
            </summary>
            <pre className="mt-2 p-3 bg-[var(--neutral-100)] rounded-lg text-xs text-red-600 overflow-auto max-h-40">
              {error.message}
            </pre>
          </details>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--primary-600)] hover:bg-[var(--primary-700)] text-white font-medium rounded-lg transition-colors text-sm"
            aria-label="Try again"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Try Again
          </button>
          <a
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2.5 border border-[var(--neutral-200)] hover:bg-[var(--neutral-50)] font-medium rounded-lg transition-colors text-sm text-[var(--neutral-700)]"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
