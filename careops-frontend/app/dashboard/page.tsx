'use client'

import React from 'react'
import Link from 'next/link'
import { BasicDashboardLayout } from '@/components/dashboard/BasicDashboardLayout'
import { InventoryAlertsWidget } from '@/components/dashboard/InventoryAlertsWidget'
import { AlertsPanel } from '@/components/dashboard/AlertsPanel'
import {
  Calendar,
  MessageSquare,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { useAnalyticsOverview, useBookings, useConversations, type KPIOverview } from '@/lib/api'

// Fallback stats when API is unavailable  
const fallbackStats = {
  total_bookings: 48,
  total_contacts: 24,
  total_revenue: 12500,
  total_forms: 8,
  active_conversations: 12,
  low_stock_items: 5,
  booking_growth: 12,
  contact_growth: 8,
  revenue_growth: 15,
}

const getColorClasses = (color: string) => {
  const colors: Record<string, { bg: string; text: string; icon: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-600' },
    green: { bg: 'bg-green-50', text: 'text-green-700', icon: 'text-green-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-600' },
    red: { bg: 'bg-red-50', text: 'text-red-700', icon: 'text-red-600' },
  }
  return colors[color] || colors.blue
}

export default function DashboardPage() {
  const { data: analyticsData, isLoading: loadingAnalytics } = useAnalyticsOverview('7d')
  const { data: apiBookings } = useBookings()
  const { data: apiConversations } = useConversations()

  // Use real data with fallback
  const overview: KPIOverview = analyticsData || fallbackStats

  const stats = [
    {
      name: 'Total Bookings',
      value: String(overview.total_bookings),
      change: `${overview.booking_growth >= 0 ? '+' : ''}${overview.booking_growth}%`,
      trend: overview.booking_growth >= 0 ? 'up' : 'down',
      icon: Calendar,
      color: 'blue',
    },
    {
      name: 'Total Contacts',
      value: String(overview.total_contacts),
      change: `${overview.contact_growth >= 0 ? '+' : ''}${overview.contact_growth}%`,
      trend: overview.contact_growth >= 0 ? 'up' : 'down',
      icon: Users,
      color: 'green',
    },
    {
      name: 'Active Conversations',
      value: String(overview.active_conversations),
      change: '',
      trend: 'up',
      icon: MessageSquare,
      color: 'amber',
    },
    {
      name: 'Low Stock Items',
      value: String(overview.low_stock_items),
      change: '',
      trend: overview.low_stock_items > 0 ? 'up' : 'down',
      icon: Package,
      color: 'red',
    },
  ]

  // Build recent activities from real API data or use fallback
  const recentActivities = React.useMemo(() => {
    const activities: Array<{ id: number; type: string; title: string; time: string; status: string }> = []
    
    if (apiBookings && Array.isArray(apiBookings)) {
      apiBookings.slice(0, 3).forEach((b, i) => {
        activities.push({
          id: i + 1,
          type: 'booking',
          title: `Booking from ${b.contact_name || 'Customer'}`,
          time: b.created_at ? new Date(b.created_at).toLocaleDateString() : 'Recently',
          status: b.status === 'confirmed' ? 'success' : b.status === 'cancelled' ? 'error' : 'info',
        })
      })
    }

    // Fallback if no API data
    if (activities.length === 0) {
      return [
        { id: 1, type: 'booking', title: 'New booking from John Doe', time: '2 min ago', status: 'success' },
        { id: 2, type: 'message', title: 'Message from Sarah Smith', time: '15 min ago', status: 'info' },
        { id: 3, type: 'lead', title: 'New lead: ABC Company', time: '1 hour ago', status: 'success' },
        { id: 4, type: 'inventory', title: 'Low stock alert: Widget Pro', time: '2 hours ago', status: 'warning' },
        { id: 5, type: 'booking', title: 'Booking cancelled by Mike', time: '3 hours ago', status: 'error' },
      ]
    }
    return activities
  }, [apiBookings])

  // Build upcoming bookings from real API data
  const upcomingBookings = React.useMemo(() => {
    if (apiBookings && Array.isArray(apiBookings)) {
      const upcoming = apiBookings
        .filter(b => b.status !== 'cancelled' && b.status !== 'completed')
        .slice(0, 4)
        .map(b => ({
          id: b.id,
          customer: b.contact_name || 'Customer',
          service: b.service || 'General',
          time: b.scheduled_at
            ? new Date(b.scheduled_at).toLocaleString('en-US', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
              })
            : 'TBD',
          status: b.status,
        }))
      if (upcoming.length > 0) return upcoming
    }

    return [
      { id: '1', customer: 'Alice Johnson', service: 'Consultation', time: 'Today, 2:00 PM', status: 'confirmed' },
      { id: '2', customer: 'Bob Williams', service: 'Installation', time: 'Today, 4:30 PM', status: 'pending' },
      { id: '3', customer: 'Carol Davis', service: 'Maintenance', time: 'Tomorrow, 10:00 AM', status: 'confirmed' },
      { id: '4', customer: 'David Brown', service: 'Repair', time: 'Tomorrow, 2:00 PM', status: 'confirmed' },
    ]
  }, [apiBookings])

  return (
    <BasicDashboardLayout pageTitle="Dashboard" breadcrumbs={[{ name: "Dashboard" }]}>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--neutral-900)]">Dashboard</h1>
        <p className="text-[var(--neutral-500)] mt-1">Welcome back! Here&apos;s what&apos;s happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const colors = getColorClasses(stat.color)
          const Icon = stat.icon
          return (
            <div
              key={stat.name}
              className="bg-white rounded-xl border border-[var(--neutral-200)] p-6 card-hover"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--neutral-500)]">{stat.name}</p>
                  {loadingAnalytics ? (
                    <div className="skeleton h-8 w-16 mt-2" />
                  ) : (
                    <p className="text-3xl font-bold text-[var(--neutral-900)] mt-2">{stat.value}</p>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${colors.bg}`}>
                  <Icon className={`w-6 h-6 ${colors.icon}`} aria-hidden="true" />
                </div>
              </div>
              {stat.change && (
                <div className="flex items-center gap-2 mt-4">
                  {stat.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-green-600" aria-hidden="true" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" aria-hidden="true" />
                  )}
                  <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-[var(--neutral-400)]">vs last week</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[var(--neutral-200)]">
          <div className="p-6 border-b border-[var(--neutral-200)]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--neutral-900)]">Recent Activity</h2>
              <Link
                href="/dashboard/inbox"
                className="text-sm text-[var(--primary-600)] hover:text-[var(--primary-700)] font-medium flex items-center gap-1"
              >
                View all
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-4 rounded-lg hover:bg-[var(--neutral-50)] transition-colors"
                >
                  <div className={`p-2 rounded-full ${
                    activity.status === 'success' ? 'bg-green-100' :
                    activity.status === 'warning' ? 'bg-amber-100' :
                    activity.status === 'error' ? 'bg-red-100' :
                    'bg-blue-100'
                  }`}>
                    {activity.status === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" aria-hidden="true" />
                    ) : activity.status === 'warning' ? (
                      <AlertCircle className="w-5 h-5 text-amber-600" aria-hidden="true" />
                    ) : activity.status === 'error' ? (
                      <AlertCircle className="w-5 h-5 text-red-600" aria-hidden="true" />
                    ) : (
                      <Clock className="w-5 h-5 text-blue-600" aria-hidden="true" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--neutral-900)]">{activity.title}</p>
                    <p className="text-xs text-[var(--neutral-400)] mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="bg-white rounded-xl border border-[var(--neutral-200)]">
          <div className="p-6 border-b border-[var(--neutral-200)]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--neutral-900)]">Upcoming Bookings</h2>
              <Link
                href="/dashboard/bookings"
                className="text-sm text-[var(--primary-600)] hover:text-[var(--primary-700)] font-medium flex items-center gap-1"
              >
                View all
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-4 rounded-lg border border-[var(--neutral-100)] hover:border-[var(--primary-200)] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[var(--neutral-900)]">{booking.customer}</p>
                      <p className="text-xs text-[var(--neutral-500)] mt-1">{booking.service}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      booking.status === 'confirmed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-3 text-xs text-[var(--neutral-500)]">
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{booking.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-[var(--neutral-900)] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { name: 'New Booking', href: '/dashboard/bookings', color: 'bg-blue-600' },
            { name: 'Add Contact', href: '/dashboard/inbox', color: 'bg-green-600' },
            { name: 'Send Message', href: '/dashboard/inbox', color: 'bg-amber-600' },
            { name: 'Update Inventory', href: '/dashboard/inventory', color: 'bg-purple-600' },
          ].map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className={`flex items-center justify-center px-4 py-3 rounded-lg text-white font-medium text-sm transition-all hover:opacity-90 active:scale-95 ${action.color}`}
            >
              {action.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Inventory Alerts & Alerts Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <InventoryAlertsWidget />
        <AlertsPanel />
      </div>
    </BasicDashboardLayout>
  )
}
