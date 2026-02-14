'use client'

import React, { useState } from 'react'
import { BasicDashboardLayout } from '@/components/dashboard/BasicDashboardLayout'
import { Card } from '@/components/ui/card'
import {
  useWeeklyReport,
  useMonthlyReport,
  useAIReportSummary,
  exportReport,
} from '@/lib/api'
import {
  FileText,
  Download,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ReportsPage() {
  const [tab, setTab] = useState<'weekly' | 'monthly'>('monthly')
  const { data: weeklyReport, isLoading: weeklyLoading } = useWeeklyReport()
  const { data: monthlyReport, isLoading: monthlyLoading } = useMonthlyReport()
  const { data: aiSummary, isLoading: summaryLoading } = useAIReportSummary(tab)

  const report = tab === 'weekly' ? weeklyReport : monthlyReport
  const loading = tab === 'weekly' ? weeklyLoading : monthlyLoading

  const handleExport = async () => {
    try {
      const blob = await exportReport(tab)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `careops-report-${tab}-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  const trendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-5 h-5 text-green-500" />
      case 'declining':
        return <TrendingDown className="w-5 h-5 text-red-500" />
      default:
        return <Minus className="w-5 h-5 text-gray-400" />
    }
  }

  return (
    <BasicDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
            <p className="text-sm text-gray-500 mt-1">Business performance reports with AI analysis</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setTab('weekly')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  tab === 'weekly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setTab('monthly')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  tab === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
            </div>
            <Button
              onClick={handleExport}
              aria-label="Export report as CSV"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Report Metrics */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">{report?.period_label || 'Report'}</h3>
              {report && (
                <p className="text-sm text-gray-500">
                  {report.start_date} to {report.end_date}
                </p>
              )}
            </div>
            <FileText className="w-5 h-5 text-gray-400" />
          </div>

          {loading ? (
            <div className="h-40 flex items-center justify-center text-gray-400">Loading report...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(report?.metrics || []).map((metric, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                  <p className="text-sm text-gray-500">{metric.label}</p>
                  <p className="text-2xl font-bold mt-1">
                    {metric.label.toLowerCase().includes('revenue')
                      ? `$${metric.current.toLocaleString()}`
                      : metric.current.toLocaleString()}
                  </p>
                  <div className="flex items-center mt-2 text-sm">
                    {metric.change_pct > 0 ? (
                      <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                    ) : metric.change_pct < 0 ? (
                      <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                    ) : (
                      <Minus className="w-4 h-4 text-gray-400 mr-1" />
                    )}
                    <span className={metric.change_pct > 0 ? 'text-green-600' : metric.change_pct < 0 ? 'text-red-600' : 'text-gray-500'}>
                      {metric.change_pct > 0 ? '+' : ''}
                      {metric.change_pct.toFixed(1)}%
                    </span>
                    <span className="text-gray-400 ml-1">vs previous ({metric.previous})</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* AI Summary */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-semibold">AI Report Summary</h3>
            {aiSummary && (
              <div className="ml-auto flex items-center gap-2">
                {trendIcon(aiSummary.overall_trend)}
                <span className="text-sm text-gray-500 capitalize">{aiSummary.overall_trend}</span>
              </div>
            )}
          </div>

          {summaryLoading ? (
            <div className="h-32 flex items-center justify-center text-gray-400">Generating AI summary...</div>
          ) : aiSummary ? (
            <div className="space-y-4">
              <p className="text-gray-700">{aiSummary.summary}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-green-50 border border-green-100">
                  <h4 className="font-medium text-sm text-green-800 mb-2">Highlights</h4>
                  <ul className="space-y-1">
                    {aiSummary.highlights.map((h, i) => (
                      <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                        <span className="mt-1">•</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                  <h4 className="font-medium text-sm text-blue-800 mb-2">Recommendations</h4>
                  <ul className="space-y-1">
                    {aiSummary.recommendations.map((r, i) => (
                      <li key={i} className="text-sm text-blue-700 flex items-start gap-2">
                        <span className="mt-1">•</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <p className="text-xs text-gray-400 text-right">
                Method: {aiSummary.method} | Fallback: {aiSummary.fallback_used ? 'Yes' : 'No'}
              </p>
            </div>
          ) : (
            <p className="text-gray-400">No summary available.</p>
          )}
        </Card>
      </div>
    </BasicDashboardLayout>
  )
}
