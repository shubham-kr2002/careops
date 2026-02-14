'use client'

import React, { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * Error Boundary component to gracefully handle runtime errors
 * Prevents white-screen-of-death by showing a friendly error UI
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })

    // Log to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to Sentry/other error tracking
      console.error('ErrorBoundary caught:', error, errorInfo)
    } else {
      console.error('ErrorBoundary caught:', error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--neutral-900)] mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-[var(--neutral-500)] mb-6">
              An unexpected error occurred. Please try refreshing the page or go back to the dashboard.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-xs text-[var(--neutral-400)] cursor-pointer hover:text-[var(--neutral-600)]">
                  Error details (dev only)
                </summary>
                <pre className="mt-2 p-3 bg-[var(--neutral-100)] rounded-lg text-xs text-red-600 overflow-auto max-h-40">
                  {this.state.error.message}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-4 py-2.5 bg-[var(--primary-600)] hover:bg-[var(--primary-700)] text-white font-medium rounded-lg transition-colors text-sm"
                aria-label="Try again"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                Try Again
              </button>
              <a
                href="/dashboard"
                className="flex items-center gap-2 px-4 py-2.5 border border-[var(--neutral-200)] hover:bg-[var(--neutral-50)] font-medium rounded-lg transition-colors text-sm text-[var(--neutral-700)]"
                aria-label="Go to dashboard"
              >
                <Home className="w-4 h-4" aria-hidden="true" />
                Dashboard
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
