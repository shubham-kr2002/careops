import { Loader2 } from 'lucide-react'

export default function DashboardLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--neutral-50)]">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin mx-auto text-[var(--primary-600)]" />
        <p className="text-sm text-[var(--neutral-500)] mt-3">Loading...</p>
      </div>
    </div>
  )
}
