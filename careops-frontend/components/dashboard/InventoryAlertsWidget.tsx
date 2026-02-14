'use client'

import React from 'react'
import Link from 'next/link'
import { Package, AlertTriangle, ArrowUpRight, RefreshCw } from 'lucide-react'
import { useLowStockItems } from '@/lib/api'

interface InventoryAlert {
  id: string
  name: string
  available_quantity: number
  min_threshold: number
  unit?: string
}

export function InventoryAlertsWidget() {
  const { data: lowStockItems, isLoading, error, refetch } = useLowStockItems()

  const items: InventoryAlert[] = Array.isArray(lowStockItems) ? lowStockItems : []

  return (
    <div className="bg-white rounded-xl border border-[var(--neutral-200)]">
      <div className="p-4 border-b border-[var(--neutral-200)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-red-600" />
          <h3 className="font-semibold text-[var(--neutral-900)]">Low Stock Alerts</h3>
          {items.length > 0 && (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
              {items.length}
            </span>
          )}
        </div>
        <button
          onClick={() => refetch()}
          className="p-1.5 hover:bg-[var(--neutral-100)] rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 text-[var(--neutral-500)] ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 text-[var(--neutral-400)] animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-sm text-red-600">Failed to load alerts</p>
            <button
              onClick={() => refetch()}
              className="mt-2 text-sm text-[var(--primary-600)] hover:text-[var(--primary-700)]"
            >
              Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm text-[var(--neutral-600)]">All items in stock</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--neutral-900)]">{item.name}</p>
                    <p className="text-xs text-[var(--neutral-500)]">
                      {item.available_quantity} / {item.min_threshold} {item.unit || 'units'}
                    </p>
                  </div>
                </div>
                <div className="w-20 h-2 bg-red-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{
                      width: `${Math.min((item.available_quantity / item.min_threshold) * 100, 100)}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {items.length > 5 && (
          <Link
            href="/dashboard/inventory"
            className="mt-4 flex items-center justify-center gap-1 text-sm text-[var(--primary-600)] hover:text-[var(--primary-700)] font-medium"
          >
            View all {items.length} items
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  )
}
