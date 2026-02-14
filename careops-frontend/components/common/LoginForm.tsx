'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui'
import { useLogin } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'

  const { login } = useAuthStore()
  const { mutate, isPending, error } = useLogin()

  const onSubmit = (data: LoginFormData) => {
    mutate(data, {
      onSuccess: (response) => {
        // Use the enhanced login method with token
        if (response.access_token && response.user) {
          login(response.user, response.access_token)
        } else if (response.token && response.user) {
          // Fallback for old API response format
          login(response.user, response.token)
        }
        router.push(redirectTo)
      }
    })
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8 text-center lg:text-left">
        <h1 className="text-2xl font-bold text-[var(--neutral-900)] mb-2">
          Welcome back
        </h1>
        <p className="text-[var(--neutral-500)]">
          Sign in to access your CareOps dashboard
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-[var(--error-50)] border border-[var(--error-200)] flex items-start gap-3 animate-fadeIn">
          <svg 
            className="w-5 h-5 text-[var(--error-500)] mt-0.5 flex-shrink-0" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-[var(--error-700)]">
              Login failed
            </h3>
            <p className="text-sm text-[var(--error-600)] mt-1">
              Invalid email or password. Please try again.
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email Field */}
        <div className="space-y-2">
          <label 
            htmlFor="email" 
            className="block text-sm font-medium text-[var(--neutral-700)]"
          >
            Email address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-[var(--neutral-400)]" />
            </div>
            <Input
              {...register('email')}
              id="email"
              type="email"
              placeholder="name@company.com"
              className="pl-10 h-11 w-full bg-white border-[var(--neutral-200)] rounded-lg text-[var(--neutral-900)] placeholder:text-[var(--neutral-400)] focus:border-[var(--primary-500)] focus:ring-2 focus:ring-[var(--primary-100)] transition-all"
              disabled={isPending}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-[var(--error-600)] flex items-center gap-1 animate-fadeIn">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label 
              htmlFor="password" 
              className="block text-sm font-medium text-[var(--neutral-700)]"
            >
              Password
            </label>
            <a 
              href="#" 
              className="text-sm text-[var(--primary-600)] hover:text-[var(--primary-700)] font-medium transition-colors"
            >
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-[var(--neutral-400)]" />
            </div>
            <Input
              {...register('password')}
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              className="pl-10 pr-10 h-11 w-full bg-white border-[var(--neutral-200)] rounded-lg text-[var(--neutral-900)] placeholder:text-[var(--neutral-400)] focus:border-[var(--primary-500)] focus:ring-2 focus:ring-[var(--primary-100)] transition-all"
              disabled={isPending}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--neutral-400)] hover:text-[var(--neutral-600)] transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-[var(--error-600)] flex items-center gap-1 animate-fadeIn">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Remember Me */}
        <div className="flex items-center">
          <input
            id="remember"
            type="checkbox"
            className="h-4 w-4 rounded border-[var(--neutral-300)] text-[var(--primary-600)] focus:ring-[var(--primary-500)] cursor-pointer"
          />
          <label 
            htmlFor="remember" 
            className="ml-2 block text-sm text-[var(--neutral-600)] cursor-pointer"
          >
            Remember me for 30 days
          </label>
        </div>

        {/* Submit Button */}
        <Button 
          type="submit" 
          className="w-full h-11 bg-[var(--primary-600)] hover:bg-[var(--primary-700)] text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 btn-press disabled:opacity-70 disabled:cursor-not-allowed"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign in</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="mt-8 relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--neutral-200)]" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-[var(--neutral-50)] text-[var(--neutral-500)]">
            Or continue with
          </span>
        </div>
      </div>

      {/* Social Login */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled
          title="Coming soon"
          className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[var(--neutral-200)] rounded-lg bg-white opacity-50 cursor-not-allowed text-sm font-medium text-[var(--neutral-700)]"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </button>
        <button
          type="button"
          disabled
          title="Coming soon"
          className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[var(--neutral-200)] rounded-lg bg-white opacity-50 cursor-not-allowed text-sm font-medium text-[var(--neutral-700)]"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          GitHub
        </button>
      </div>

      {/* Demo Credentials - only shown in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-4 rounded-lg bg-[var(--primary-50)] border border-[var(--primary-100)]">
          <p className="text-xs font-medium text-[var(--primary-700)] mb-2">
            Demo Credentials
          </p>
          <div className="text-xs text-[var(--primary-600)] space-y-1 font-mono">
            <p>Email: owner@example.com</p>
            <p>Password: password123</p>
          </div>
        </div>
      )}
    </div>
  )
}
