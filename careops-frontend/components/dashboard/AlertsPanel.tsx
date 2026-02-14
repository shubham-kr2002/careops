'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Bell,
  Package,
  Calendar,
  MessageSquare,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Filter
} from 'lucide-react'
import { useLowStockItems } from '@/lib/api'

type AlertCategory = 'all' | 'inventory' | 'bookings' | 'messages' | 'leads'

interface Alert {
  id: string
  type: 'inventory' | 'booking' | 'message' | 'lead'
  title: string
  description: string
  time: string
  severity: 'warning' | 'error' | 'info' | 'success'
  actionUrl?: string
}

// Mock alerts for demo (in production these would come from API)
const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'inventory',
    title: 'Low Stock Alert',
    description: 'Widget Pro is running low (5 units remaining)',
    time: '2 hours ago',
    severity: 'warning',
    actionUrl: '/dashboard/inventory'
  },
  {
    id: '2',
    type: 'booking',
    title: 'Booking Reminder',
    description: 'Installation with Bob Williams in 2 hours',
    time: '2 hours ago',
    severity: 'info',
    actionUrl: '/dashboard/bookings'
  },
  {
    id: '3',
    type: 'message',
    title: 'New Message',
    description: 'Alice Johnson sent a new message',
    time: '15 min ago',
    severity: 'info',
    actionUrl: '/dashboard/inbox'
  },
  {
    id: '4',
    type: 'lead',
    title: 'New Lead',
    description: 'ABC Company wants a quote for consulting',
    time: '1 hour ago',
    severity: 'success',
    actionUrl: '/dashboard/bookings'
  },
  {
    id: '5',
    type: 'booking',
    title: 'Booking Cancelled',
    description: 'Mike cancelled their appointment',
    time: '3 hours ago',
    severity: 'error',
    actionUrl: '/dashboard/bookings'
  }
]

export function AlertsPanel() {
  const [category, setCategory] = useState<AlertCategory>('all')
  const [dismissed, setDismissed] = useState<string[]>([])

  const { data: lowStockItems } = useLowStockItems()
  const inventoryItems = Array.isArray(lowStockItems) ? lowStockItems : []

  // Combine mock alerts with real inventory data
  const inventoryAlerts: Alert[] = inventoryItems.map((item: any) => ({
    id: `inv-${item.id}`,
    type: 'inventory' as const,
    title: 'Low Stock Alert',
    description: `${item.name} is running low (${item.available_quantity} units remaining)`,
    time: 'Just now',
    severity: 'warning' as const,
    actionUrl: '/dashboard/inventory'
  }))

  const allAlerts = [...mockAlerts, ...inventoryAlerts]

  const filteredAlerts = category === 'all'
    ? allAlerts
    : allAlerts.filter(alert => alert.type === category)

  const visibleAlerts = filteredAlerts.filter(alert => !dismissed.includes(alert.id))

  const getCategoryIcon = (cat: AlertCategory) => {
    switch (cat) {
      case 'inventory': return Package
      case 'bookings': return Calendar
      case 'messages': return MessageSquare
      case 'leads': return Users
      default: return Bell
    }
  }

  const getSeverityStyles = (severity: Alert['severity']) => {
    switch (severity) {
      case 'warning':
        return { bg: 'bg-amber-100', text: 'text-amber-700', icon: 'text-amber-600' }
      case 'error':
        return { bg: 'bg-red-100', text: 'text-red-700', icon: 'text-red-600' }
      case 'success':
        return { bg: 'bg-green-100', text: 'text-green-700', icon: 'text-green-600' }
      default:
        return { bg: 'bg-blue-100', text: 'text-blue-700', icon: 'text-blue-600' }
    }
  }

  const getSeverityIcon = (severity: Alert['severity']) => {
    switch (severity) {
      case 'warning': return AlertCircle
      case 'error': return AlertCircle
      case 'success': return CheckCircle
      default: return Clock
    }
  }

  const dismissAlert = (id: string) => {
    setDismissed(prev => [...prev, id])
  }

  const categories: { key: AlertCategory; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: visibleAlerts.length },
    { key: 'inventory', label: 'Inventory', count: allAlerts.filter(a => a.type === 'inventory').length },
    { key: 'bookings', label: 'Bookings', count: allAlerts.filter(a => a.type === 'booking').length },
    { key: 'messages', label: 'Messages', count: allAlerts.filter(a => a.type === 'message').length },
    { key: 'leads', label: 'Leads', count: allAlerts.filter(a => a.type === 'lead').length }
  ]

  return (
    <div className="bg-white rounded-xl border border-[var(--neutral-200)] h-full">
      {/* Header */}
      <div className="p-4 border-b border-[var(--neutral-200)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[var(--primary-600)]" />
            <h3 className="font-semibold text-[var(--neutral-900)]">Alerts</h3>
            {visibleAlerts.length > 0 && (
              <span className="px-2 py-0.5 bg-[var(--primary-100)] text-[var(--primary-700)] text-xs font-medium rounded-full">
                {visibleAlerts.length}
              </span>
            )}
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => {
            const Icon = getCategoryIcon(cat.key)
            return (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  category === cat.key
                    ? 'bg-[var(--primary-100)] text-[var(--primary-700)]'
                    : 'bg-[var(--neutral-100)] text-[var(--neutral-600)] hover:bg-[var(--neutral-200)]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
                {cat.count > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                    category === cat.key
                      ? 'bg-[var(--primary-200)] text-[var(--primary-800)]'
                      : 'bg-[var(--neutral-200)] text-[var(--neutral-600)]'
                  }`}>
                    {cat.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Alerts List */}
      <div className="p-4 max-h-[400px] overflow-y-auto">
        {visibleAlerts.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-[var(--neutral-100)] rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm text-[var(--neutral-600)]">No alerts in this category</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleAlerts.map((alert) => {
              const styles = getSeverityStyles(alert.severity)
              const SeverityIcon = getSeverityIcon(alert.severity)

              return (
                <div
                  key={alert.id}
                  className={`relative p-4 rounded-lg border ${styles.bg} ${styles.text.includes('amber') ? 'border-amber-200' : styles.text.includes('red') ? 'border-red-200' : styles.text.includes('green') ? 'border-green-200' : 'border-blue-200'}`}
                >
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="absolute top-2 right-2 p-1 hover:bg-black/5 rounded transition-colors"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${styles.bg}`}>
                      <SeverityIcon className={`w-4 h-4 ${styles.icon}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{alert.title}</p>
                      <p className="text-xs mt-1 opacity-80">{alert.description}</p>
                      <p className="text-xs mt-2 opacity-60">{alert.time}</p>
                    </div>
                  </div>

                  {alert.actionUrl && (
                    <Link
                      href={alert.actionUrl}
                      className={`mt-3 inline-flex items-center gap-1 text-xs font-medium ${styles.text} hover:underline`}
                    >
                      View details
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
