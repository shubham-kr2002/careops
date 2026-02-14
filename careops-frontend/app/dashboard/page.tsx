'use client'

import React from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
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
  AlertCircle
} from 'lucide-react'

const stats = [
  {
    name: 'Total Bookings',
    value: '48',
    change: '+12%',
    trend: 'up',
    icon: Calendar,
    color: 'blue',
  },
  {
    name: 'New Leads',
    value: '24',
    change: '+8%',
    trend: 'up',
    icon: Users,
    color: 'green',
  },
  {
    name: 'Unread Messages',
    value: '12',
    change: '-3',
    trend: 'down',
    icon: MessageSquare,
    color: 'amber',
  },
  {
    name: 'Low Stock Items',
    value: '5',
    change: '+2',
    trend: 'up',
    icon: Package,
    color: 'red',
  },
]

const recentActivities = [
  { id: 1, type: 'booking', title: 'New booking from John Doe', time: '2 min ago', status: 'success' },
  { id: 2, type: 'message', title: 'Message from Sarah Smith', time: '15 min ago', status: 'info' },
  { id: 3, type: 'lead', title: 'New lead: ABC Company', time: '1 hour ago', status: 'success' },
  { id: 4, type: 'inventory', title: 'Low stock alert: Widget Pro', time: '2 hours ago', status: 'warning' },
  { id: 5, type: 'booking', title: 'Booking cancelled by Mike', time: '3 hours ago', status: 'error' },
]

const upcomingBookings = [
  { id: 1, customer: 'Alice Johnson', service: 'Consultation', time: 'Today, 2:00 PM', status: 'confirmed' },
  { id: 2, customer: 'Bob Williams', service: 'Installation', time: 'Today, 4:30 PM', status: 'pending' },
  { id: 3, customer: 'Carol Davis', service: 'Maintenance', time: 'Tomorrow, 10:00 AM', status: 'confirmed' },
  { id: 4, customer: 'David Brown', service: 'Repair', time: 'Tomorrow, 2:00 PM', status: 'confirmed' },
]

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
  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--neutral-900)]">Dashboard</h1>
        <p className="text-[var(--neutral-500)] mt-1">Welcome back! Here's what's happening today.</p>
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
                  <p className="text-3xl font-bold text-[var(--neutral-900)] mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${colors.bg}`}>
                  <Icon className={`w-6 h-6 ${colors.icon}`} />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                {stat.trend === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change}
                </span>
                <span className="text-sm text-[var(--neutral-400)]">vs last week</span>
              </div>
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
                <ArrowUpRight className="w-4 h-4" />
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
                      <CheckCircle className={`w-5 h-5 ${
                        activity.status === 'success' ? 'text-green-600' :
                        activity.status === 'warning' ? 'text-amber-600' :
                        activity.status === 'error' ? 'text-red-600' :
                        'text-blue-600'
                      }`} />
                    ) : activity.status === 'warning' ? (
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                    ) : activity.status === 'error' ? (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-blue-600" />
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
                <ArrowUpRight className="w-4 h-4" />
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
                    <Clock className="w-3.5 h-3.5" />
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
            { name: 'New Booking', href: '/dashboard/bookings/new', color: 'bg-blue-600' },
            { name: 'Add Lead', href: '/dashboard/leads/new', color: 'bg-green-600' },
            { name: 'Send Message', href: '/dashboard/inbox/compose', color: 'bg-amber-600' },
            { name: 'Update Inventory', href: '/dashboard/inventory', color: 'bg-purple-600' },
          ].map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="flex items-center justify-center px-4 py-3 rounded-lg text-white font-medium text-sm transition-transform active:scale-95"
              style={{ backgroundColor: action.color.replace('bg-', '').replace('-600', '') }}
            >
              {action.name}
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
