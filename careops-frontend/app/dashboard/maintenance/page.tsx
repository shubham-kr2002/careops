'use client'

import React, { useState } from 'react'
import { BasicDashboardLayout } from '@/components/dashboard/BasicDashboardLayout'
import { Card } from '@/components/ui/card'
import {
  useEquipmentItems,
  useCreateEquipment,
  useUpdateEquipment,
  useDeleteEquipment,
  useLogMaintenance,
  useMaintenancePredictions,
  useMaintenanceDue,
  type EquipmentItem,
} from '@/lib/api'
import {
  Wrench,
  Plus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Clock,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
  active: { label: 'Active', color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: CheckCircle },
  needs_maintenance: { label: 'Needs Maintenance', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: AlertTriangle },
  out_of_service: { label: 'Out of Service', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: XCircle },
}

const riskColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  low: 'bg-green-100 text-green-800 border-green-200',
}

export default function MaintenancePage() {
  const [tab, setTab] = useState<'equipment' | 'predictions'>('equipment')
  const [showAdd, setShowAdd] = useState(false)
  const [newEquipment, setNewEquipment] = useState({ name: '', type: '', serial_number: '', maintenance_interval_days: 90 })

  const { data: equipment, isLoading } = useEquipmentItems()
  const { data: predictions, isLoading: predictionsLoading } = useMaintenancePredictions()
  const { data: dueItems } = useMaintenanceDue()
  const createMutation = useCreateEquipment()
  const deleteMutation = useDeleteEquipment()
  const logMaintenanceMutation = useLogMaintenance()

  const handleAddEquipment = () => {
    if (!newEquipment.name.trim()) return
    createMutation.mutate(newEquipment, {
      onSuccess: () => {
        setShowAdd(false)
        setNewEquipment({ name: '', type: '', serial_number: '', maintenance_interval_days: 90 })
      },
    })
  }

  const handleLogMaintenance = (equipmentId: string) => {
    logMaintenanceMutation.mutate({
      equipmentId,
      data: { maintenance_type: 'routine', notes: 'Routine maintenance performed' },
    })
  }

  return (
    <BasicDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Equipment & Maintenance</h1>
            <p className="text-sm text-gray-500 mt-1">
              AI-powered predictive maintenance and equipment tracking
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setTab('equipment')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  tab === 'equipment' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                Equipment
              </button>
              <button
                onClick={() => setTab('predictions')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  tab === 'predictions' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> AI Predictions
                </span>
              </button>
            </div>
            <Button
              onClick={() => setShowAdd(!showAdd)}
              aria-label="Add new equipment"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Add Equipment
            </Button>
          </div>
        </div>

        {/* Due Alert */}
        {dueItems && dueItems.length > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">{dueItems.length} equipment item(s) due for maintenance</p>
              <p className="text-sm text-amber-600 mt-1">
                {dueItems.map((e) => e.name).join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* Add Equipment Form */}
        {showAdd && (
          <Card className="p-5">
            <h3 className="font-semibold mb-3">Add New Equipment</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <input
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Equipment name *"
                value={newEquipment.name}
                onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
              />
              <input
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type (e.g., Medical)"
                value={newEquipment.type}
                onChange={(e) => setNewEquipment({ ...newEquipment, type: e.target.value })}
              />
              <input
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Serial number"
                value={newEquipment.serial_number}
                onChange={(e) => setNewEquipment({ ...newEquipment, serial_number: e.target.value })}
              />
              <input
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="number"
                placeholder="Maint. interval (days)"
                value={newEquipment.maintenance_interval_days}
                onChange={(e) => setNewEquipment({ ...newEquipment, maintenance_interval_days: parseInt(e.target.value) || 90 })}
              />
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleAddEquipment}
                disabled={createMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Adding...' : 'Add Equipment'}
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 text-gray-600 text-sm rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </Card>
        )}

        {/* Equipment List */}
        {tab === 'equipment' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <div className="col-span-full h-40 flex items-center justify-center text-gray-400">Loading equipment...</div>
            ) : !equipment || equipment.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-400">
                <Wrench className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No equipment added yet</p>
              </div>
            ) : (
              equipment.map((eq: EquipmentItem) => {
                const status = statusConfig[eq.status] || statusConfig['active']
                return (
                  <Card key={eq.id} className={`p-5 border ${status.bg}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{eq.name}</h4>
                        {eq.type && <p className="text-sm text-gray-500">{eq.type}</p>}
                      </div>
                      <div className="flex items-center gap-1">
                        <status.icon className={`w-4 h-4 ${status.color}`} />
                        <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1 text-sm text-gray-600">
                      {eq.serial_number && <p>SN: {eq.serial_number}</p>}
                      <p className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Interval: {eq.maintenance_interval_days} days
                      </p>
                      <p className="flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5" />
                        Usage: {eq.usage_count} times
                      </p>
                      {eq.last_maintained_at && (
                        <p>Last maintained: {new Date(eq.last_maintained_at).toLocaleDateString()}</p>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleLogMaintenance(eq.id)}
                        disabled={logMaintenanceMutation.isPending}
                        className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Wrench className="w-3 h-3 inline mr-1" />
                        Log Maintenance
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(eq.id)}
                        className="px-3 py-1.5 text-red-600 text-xs border border-red-200 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </Card>
                )
              })
            )}
          </div>
        )}

        {/* AI Predictions */}
        {tab === 'predictions' && (
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-semibold">Maintenance Predictions</h3>
              {predictions && (
                <span className="text-sm text-gray-400 ml-auto">{predictions.total} equipment analyzed</span>
              )}
            </div>

            {predictionsLoading ? (
              <div className="h-40 flex items-center justify-center text-gray-400">Analyzing equipment...</div>
            ) : !predictions?.predictions.length ? (
              <p className="text-gray-400 text-center py-8">No equipment to analyze. Add equipment first.</p>
            ) : (
              <div className="space-y-3">
                {predictions.predictions.map((pred, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border ${riskColors[pred.risk_level] || riskColors['low']}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{pred.equipment_name}</h4>
                      <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded-full border">
                        {pred.risk_level} risk
                      </span>
                    </div>
                    <p className="text-sm mb-1">{pred.recommendation}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span>Due in {pred.days_until_due} days</span>
                      <span>Confidence: {(pred.confidence * 100).toFixed(0)}%</span>
                      {pred.estimated_cost && <span>Est. cost: ${pred.estimated_cost}</span>}
                      <span className="ml-auto">{pred.method}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </BasicDashboardLayout>
  )
}
