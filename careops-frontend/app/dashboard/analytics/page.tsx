'use client'

import React, { useState } from 'react'
import { BasicDashboardLayout } from '@/components/dashboard/BasicDashboardLayout'
import { Card } from '@/components/ui/card'
import {
  useAnalyticsOverview,
  useAnalyticsTrends,
  useAIInsights,
} from '@/lib/api'
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  DollarSign,
  FileText,
  MessageSquare,
  Package,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

const periods = [
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
]

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30d')
  const { data: overview, isLoading: overviewLoading } = useAnalyticsOverview(period)
  const { data: trends, isLoading: trendsLoading } = useAnalyticsTrends(period)
  const { data: insights, isLoading: insightsLoading } = useAIInsights()

  const kpiCards = [
    {
      label: 'Total Bookings',
      value: overview?.total_bookings ?? 0,
      growth: overview?.booking_growth ?? 0,
      icon: Calendar,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Total Contacts',
      value: overview?.total_contacts ?? 0,
      growth: overview?.contact_growth ?? 0,
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Revenue',
      value: `$${(overview?.total_revenue ?? 0).toLocaleString()}`,
      growth: overview?.revenue_growth ?? 0,
      icon: DollarSign,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
    {
      label: 'Forms Completed',
      value: overview?.total_forms ?? 0,
      growth: 0,
      icon: FileText,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Active Conversations',
      value: overview?.active_conversations ?? 0,
      growth: 0,
      icon: MessageSquare,
      color: 'text-cyan-600',
      bg: 'bg-cyan-50',
    },
    {
      label: 'Low Stock Items',
      value: overview?.low_stock_items ?? 0,
      growth: 0,
      icon: Package,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
  ]

  return (
    <BasicDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-sm text-gray-500 mt-1">AI-powered business insights and trends</p>
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  period === p.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpiCards.map((kpi) => (
            <Card key={kpi.label} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{kpi.label}</p>
                  <p className="text-2xl font-bold mt-1">
                    {overviewLoading ? '—' : kpi.value}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${kpi.bg}`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
              </div>
              {kpi.growth !== 0 && (
                <div className="flex items-center mt-3 text-sm">
                  {kpi.growth > 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={kpi.growth > 0 ? 'text-green-600' : 'text-red-600'}>
                    {Math.abs(kpi.growth).toFixed(1)}%
                  </span>
                  <span className="text-gray-400 ml-1">vs prev period</span>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Trend Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bookings & Contacts Trend */}
          <Card className="p-5">
            <h3 className="text-lg font-semibold mb-4">Bookings & Contacts Trend</h3>
            {trendsLoading ? (
              <div className="h-64 flex items-center justify-center text-gray-400">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trends?.data || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="bookings"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    name="Bookings"
                  />
                  <Line
                    type="monotone"
                    dataKey="contacts"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    name="Contacts"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Revenue Trend */}
          <Card className="p-5">
            <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
            {trendsLoading ? (
              <div className="h-64 flex items-center justify-center text-gray-400">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={trends?.data || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        {/* AI Insights */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-semibold">AI Insights</h3>
            {!insightsLoading && insights && (
              <span className="text-xs text-gray-400 ml-auto">
                Generated {new Date(insights.generated_at).toLocaleString()}
              </span>
            )}
          </div>
          {insightsLoading ? (
            <div className="h-32 flex items-center justify-center text-gray-400">Generating insights...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(insights?.insights || []).map((insight, idx) => (
                <div
                  key={`${insight.title}-${insight.category}-${idx}`}
                  className={`p-4 rounded-lg border ${
                    insight.impact === 'high'
                      ? 'border-red-200 bg-red-50'
                      : insight.impact === 'medium'
                      ? 'border-amber-200 bg-amber-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{insight.title}</h4>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        insight.impact === 'high'
                          ? 'bg-red-100 text-red-700'
                          : insight.impact === 'medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {insight.impact}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">Action:</span> {insight.action}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </BasicDashboardLayout>
  )
}
