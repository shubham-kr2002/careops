'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    }
  }, [isAuthenticated, isLoading, router])

  // Show loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--neutral-50)]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[var(--primary-200)] border-t-[var(--primary-600)] rounded-full animate-spin" />
        <p className="text-[var(--neutral-500)] text-sm">Loading...</p>
      </div>
    </div>
  )
}
