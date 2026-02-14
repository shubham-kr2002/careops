'use client'

import React from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Calendar, Plus, Search, Filter, MoreVertical } from 'lucide-react'

const bookings = [
  { id: 1, customer: 'Alice Johnson', service: 'Consultation', date: '2026-02-14', time: '2:00 PM', status: 'confirmed', amount: '$150' },
  { id: 2, customer: 'Bob Williams', service: 'Installation', date: '2026-02-14', time: '4:30 PM', status: 'pending', amount: '$300' },
  { id: 3, customer: 'Carol Davis', service: 'Maintenance', date: '2026-02-15', time: '10:00 AM', status: 'confirmed', amount: '$100' },
  { id: 4, customer: 'David Brown', service: 'Repair', date: '2026-02-15', time: '2:00 PM', status: 'confirmed', amount: '$200' },
  { id: 5, customer: 'Emma Wilson', service: 'Consultation', date: '2026-02-16', time: '11:00 AM', status: 'cancelled', amount: '$0' },
]

export default function BookingsPage() {
  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--neutral-900)]">Bookings</h1>
          <p className="text-[var(--neutral-500)] mt-1">Manage your appointments and reservations</p>
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--primary-600)] hover:bg-[var(--primary-700)] text-white font-medium rounded-lg transition-colors">
          <Plus className="w-5 h-5" />
          New Booking
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--neutral-400)]" />
          <input
            type="text"
            placeholder="Search bookings..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[var(--neutral-200)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary-100)] focus:border-[var(--primary-500)] transition-all"
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[var(--neutral-200)] rounded-lg bg-white hover:bg-[var(--neutral-50)] text-sm font-medium text-[var(--neutral-700)]">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Bookings Table */}
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
                          {booking.customer.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-[var(--neutral-900)]">{booking.customer}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--neutral-600)]">{booking.service}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-[var(--neutral-600)]">
                      <Calendar className="w-4 h-4" />
                      {booking.date} at {booking.time}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      booking.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-[var(--neutral-900)]">{booking.amount}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-[var(--neutral-100)] rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4 text-[var(--neutral-500)]" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}
