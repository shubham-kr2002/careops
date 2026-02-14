'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Building, Save, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { useAuthStore } from '@/store/authStore'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

interface WorkspaceData {
  id: string
  name: string
  slug: string
  industry: string
  phone?: string
  address?: string
  timezone: string
  is_active: boolean
}

export default function WorkspaceSettingsPage() {
  const { user } = useAuthStore()
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    phone: '',
    address: '',
    timezone: '',
  })

  useEffect(() => {
    fetchWorkspace()
  }, [])

  const fetchWorkspace = async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) return

      const response = await fetch(`${API_BASE_URL}/workspaces/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setWorkspace(data)
        setFormData({
          name: data.name || '',
          industry: data.industry || '',
          phone: data.phone || '',
          address: data.address || '',
          timezone: data.timezone || 'UTC',
        })
      }
    } catch (err) {
      setError('Failed to load workspace settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/workspaces/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError('Failed to update workspace settings')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const isOwner = user?.role === 'owner'

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--neutral-900)]">Workspace Settings</h1>
          <p className="text-[var(--neutral-500)] mt-1">
            Manage your workspace configuration
          </p>
        </div>

        {!isOwner && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="py-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500" aria-hidden="true" />
              <p className="text-sm text-amber-700">
                Only workspace owners can modify these settings.
              </p>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="py-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" aria-hidden="true" />
              <p className="text-sm text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {success && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="py-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" aria-hidden="true" />
              <p className="text-sm text-green-700">Settings saved successfully!</p>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--primary-600)]" />
              <p className="text-sm text-[var(--neutral-500)] mt-3">Loading workspace settings...</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Building className="w-5 h-5 text-blue-600" aria-hidden="true" />
                </div>
                <div>
                  <CardTitle>General Information</CardTitle>
                  <CardDescription>Basic workspace details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label htmlFor="ws-name" className="block text-sm font-medium text-[var(--neutral-700)] mb-1.5">
                  Workspace Name
                </label>
                <Input
                  id="ws-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isOwner}
                  placeholder="My Healthcare Practice"
                />
              </div>

              <div>
                <label htmlFor="ws-slug" className="block text-sm font-medium text-[var(--neutral-700)] mb-1.5">
                  Workspace Slug
                </label>
                <Input
                  id="ws-slug"
                  value={workspace?.slug || ''}
                  disabled
                  className="bg-[var(--neutral-50)]"
                />
                <p className="text-xs text-[var(--neutral-400)] mt-1">
                  Used in public-facing URLs. Cannot be changed.
                </p>
              </div>

              <div>
                <label htmlFor="ws-industry" className="block text-sm font-medium text-[var(--neutral-700)] mb-1.5">
                  Industry
                </label>
                <Input
                  id="ws-industry"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  disabled={!isOwner}
                  placeholder="Healthcare"
                />
              </div>

              <div>
                <label htmlFor="ws-phone" className="block text-sm font-medium text-[var(--neutral-700)] mb-1.5">
                  Phone
                </label>
                <Input
                  id="ws-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isOwner}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div>
                <label htmlFor="ws-address" className="block text-sm font-medium text-[var(--neutral-700)] mb-1.5">
                  Address
                </label>
                <Input
                  id="ws-address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  disabled={!isOwner}
                  placeholder="123 Medical Center Dr"
                />
              </div>

              <div>
                <label htmlFor="ws-timezone" className="block text-sm font-medium text-[var(--neutral-700)] mb-1.5">
                  Timezone
                </label>
                <select
                  id="ws-timezone"
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  disabled={!isOwner}
                  className="w-full px-3 py-2 border border-[var(--neutral-200)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary-100)] focus:border-[var(--primary-500)]"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Asia/Kolkata">India Standard Time</option>
                  <option value="Europe/London">GMT</option>
                </select>
              </div>

              {isOwner && (
                <div className="pt-4 border-t border-[var(--neutral-200)]">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" aria-hidden="true" />
                    )}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
