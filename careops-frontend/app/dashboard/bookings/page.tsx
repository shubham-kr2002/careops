'use client'

import React from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Calendar, Plus, Search, Filter, MoreVertical, AlertCircle, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBookings, type Booking } from '@/lib/api'

// Fallback mock data for when API is unavailable
const mockBookings: Booking[] = [
  { id: '1', workspace_id: '', contact_id: null, booking_type_id: null, contact_name: 'Alice Johnson', service: 'Consultation', scheduled_at: '2026-02-14T14:00:00Z', status: 'confirmed', amount: 150, notes: null, created_at: '', updated_at: '' },
  { id: '2', workspace_id: '', contact_id: null, booking_type_id: null, contact_name: 'Bob Williams', service: 'Installation', scheduled_at: '2026-02-14T16:30:00Z', status: 'pending', amount: 300, notes: null, created_at: '', updated_at: '' },
  { id: '3', workspace_id: '', contact_id: null, booking_type_id: null, contact_name: 'Carol Davis', service: 'Maintenance', scheduled_at: '2026-02-15T10:00:00Z', status: 'confirmed', amount: 100, notes: null, created_at: '', updated_at: '' },
  { id: '4', workspace_id: '', contact_id: null, booking_type_id: null, contact_name: 'David Brown', service: 'Repair', scheduled_at: '2026-02-15T14:00:00Z', status: 'confirmed', amount: 200, notes: null, created_at: '', updated_at: '' },
  { id: '5', workspace_id: '', contact_id: null, booking_type_id: null, contact_name: 'Emma Wilson', service: 'Consultation', scheduled_at: '2026-02-16T11:00:00Z', status: 'cancelled', amount: 0, notes: null, created_at: '', updated_at: '' },
]

export default function BookingsPage() {
  const { data: apiBookings, isLoading, error, refetch } = useBookings()
  const [searchQuery, setSearchQuery] = React.useState('')

  // Use API data if available, fallback to mock
  const allBookings = apiBookings && Array.isArray(apiBookings) && apiBookings.length > 0
    ? apiBookings
    : mockBookings

  const usingMock = !apiBookings || !Array.isArray(apiBookings) || apiBookings.length === 0

  // Filter bookings by search query
  const bookings = searchQuery
    ? allBookings.filter(b =>
        (b.contact_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (b.service?.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : allBookings

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    } catch {
      return dateStr
    }
  }

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--neutral-900)]">Bookings</h1>
          <p className="text-[var(--neutral-500)] mt-1">Manage your appointments and reservations</p>
        </div>
        <Button aria-label="Create new booking">
          <Plus className="w-5 h-5 mr-2" aria-hidden="true" />
          New Booking
        </Button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" aria-hidden="true" />
            <p className="text-sm text-red-700">Failed to load bookings from server. Showing demo data.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} aria-label="Retry loading bookings">
            <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
            Retry
          </Button>
        </div>
      )}

      {usingMock && !error && !isLoading && (
        <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-amber-500" aria-hidden="true" />
          <p className="text-sm text-amber-700">Showing demo data. Connect your backend to see real bookings.</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--neutral-400)]" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search bookings..."
            aria-label="Search bookings"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[var(--neutral-200)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary-100)] focus:border-[var(--primary-500)] transition-all"
          />
        </div>
        <Button variant="outline" aria-label="Filter bookings">
          <Filter className="w-4 h-4 mr-2" aria-hidden="true" />
          Filter
        </Button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-[var(--neutral-200)] p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--primary-600)]" />
          <p className="text-sm text-[var(--neutral-500)] mt-3">Loading bookings...</p>
        </div>
      ) : (
        /* Bookings Table */
        <div className="bg-white rounded-xl border border-[var(--neutral-200)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--neutral-50)] border-b border-[var(--neutral-200)]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--neutral-500)] uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--neutral-500)] uppercase tracking-wider">Service</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--neutral-500)] uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--neutral-500)] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--neutral-500)] uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-[var(--neutral-500)] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--neutral-200)]">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-[var(--neutral-50)] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--primary-100)] flex items-center justify-center">
                          <span className="text-sm font-medium text-[var(--primary-700)]">
                            {(booking.contact_name || 'U').split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-[var(--neutral-900)]">{booking.contact_name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--neutral-600)]">{booking.service || 'General'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-[var(--neutral-600)]">
                        <Calendar className="w-4 h-4" aria-hidden="true" />
                        {formatDate(booking.scheduled_at)} at {formatTime(booking.scheduled_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        booking.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-[var(--neutral-900)]">
                      {booking.amount ? `$${booking.amount}` : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        className="p-2 hover:bg-[var(--neutral-100)] rounded-lg transition-colors"
                        aria-label={`More actions for ${booking.contact_name || 'booking'}`}
                      >
                        <MoreVertical className="w-4 h-4 text-[var(--neutral-500)]" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
