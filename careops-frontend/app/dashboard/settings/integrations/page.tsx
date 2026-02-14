'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar, Cloud, Webhook, Mail, CheckCircle, XCircle, Loader2, ShieldAlert } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

interface Integration {
  id: string
  type: 'email_sendgrid' | 'email_gmail' | 'sms' | 'calendar' | 'storage' | 'webhook'
  name: string
  status: 'pending' | 'active' | 'error'
  is_active: boolean
  config: Record<string, unknown>
  created_at: string
}

export default function IntegrationsPage() {
  const { user } = useAuthStore()
  const isOwner = user?.role === 'owner'

  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(false)
  const [showEmailConfig, setShowEmailConfig] = useState(false)
  const [showCalendarConfig, setShowCalendarConfig] = useState(false)
  const [showStorageConfig, setShowStorageConfig] = useState(false)
  const [showWebhookConfig, setShowWebhookConfig] = useState(false)
  const [emailProvider, setEmailProvider] = useState<'sendgrid' | 'gmail'>('sendgrid')
  
  // Form states
  const [emailConfig, setEmailConfig] = useState({
    // SendGrid
    sendgrid_api_key: '',
    sendgrid_from_email: '',
    // Gmail
    gmail_client_id: '',
    gmail_client_secret: '',
    gmail_email: '',
    gmail_redirect_uri: ''
  })
  
  const [calendarConfig, setCalendarConfig] = useState({
    client_id: '',
    client_secret: '',
    redirect_uri: ''
  })
  
  const [storageConfig, setStorageConfig] = useState({
    provider: 's3',
    access_key_id: '',
    secret_access_key: '',
    bucket_name: '',
    region: 'us-east-1'
  })
  
  const [webhookConfig, setWebhookConfig] = useState({
    url: '',
    secret: '',
    events: ['booking.created', 'contact.created']
  })

  const integrationTypes = [
    {
      type: 'email_gmail',
      name: 'Gmail',
      description: 'Send emails via Gmail API',
      icon: Mail,
      color: 'bg-red-500'
    },
    {
      type: 'email_sendgrid',
      name: 'SendGrid',
      description: 'Send emails via SendGrid',
      icon: Mail,
      color: 'bg-blue-500'
    },
    {
      type: 'calendar',
      name: 'Google Calendar',
      description: 'Sync bookings with Google Calendar',
      icon: Calendar,
      color: 'bg-blue-500'
    },
    {
      type: 'storage',
      name: 'File Storage',
      description: 'Upload files to AWS S3 or Cloudinary',
      icon: Cloud,
      color: 'bg-orange-500'
    },
    {
      type: 'webhook',
      name: 'Webhooks',
      description: 'Send events to external services',
      icon: Webhook,
      color: 'bg-purple-500'
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle className="w-4 h-4" /> Active
          </span>
        )
      case 'error':
        return (
          <span className="flex items-center gap-1 text-red-600">
            <XCircle className="w-4 h-4" /> Error
          </span>
        )
      default:
        return (
          <span className="flex items-center gap-1 text-yellow-600">
            <Loader2 className="w-4 h-4" /> Pending
          </span>
        )
    }
  }

  const handleCalendarConnect = async () => {
    // In production, this would initiate OAuth flow
    // For now, we'll simulate the config save
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/integrations/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          type: 'calendar',
          name: 'Google Calendar',
          config: calendarConfig
        })
      })
      if (response.ok) {
        setShowCalendarConfig(false)
      }
    } catch (error) {
      console.error('Failed to connect calendar:', error)
    }
    setLoading(false)
  }

  const handleStorageConnect = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/integrations/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          type: 'storage',
          name: 'AWS S3',
          config: storageConfig
        })
      })
      if (response.ok) {
        setShowStorageConfig(false)
      }
    } catch (error) {
      console.error('Failed to connect storage:', error)
    }
    setLoading(false)
  }

  const handleWebhookCreate = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/integrations/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          type: 'webhook',
          name: 'Custom Webhook',
          config: webhookConfig
        })
      })
      if (response.ok) {
        setShowWebhookConfig(false)
      }
    } catch (error) {
      console.error('Failed to create webhook:', error)
    }
    setLoading(false)
  }

  // Staff cannot access integrations settings
  if (!isOwner) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-12 text-center">
            <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-[var(--neutral-900)] mb-2">Owner Access Required</h2>
            <p className="text-sm text-[var(--neutral-500)]">
              Only workspace owners can manage integrations. Contact your workspace owner for access.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-muted-foreground mt-2">
          Connect external services to enhance your workflow
        </p>
      </div>

      <div className="grid gap-6">
        {/* Email Integration */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-red-500 flex items-center justify-center">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle>Email</CardTitle>
              <CardDescription>Configure email provider (Gmail or SendGrid)</CardDescription>
            </div>
            {getStatusBadge('pending')}
          </CardHeader>
          <CardContent>
            {showEmailConfig ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Email Provider</label>
                  <select
                    value={emailProvider}
                    onChange={(e) => setEmailProvider(e.target.value as 'sendgrid' | 'gmail')}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  >
                    <option value="gmail">Gmail API</option>
                    <option value="sendgrid">SendGrid</option>
                  </select>
                </div>
                
                {emailProvider === 'gmail' ? (
                  <>
                    <div>
                      <label className="text-sm font-medium">Client ID</label>
                      <Input
                        type="text"
                        value={emailConfig.gmail_client_id}
                        onChange={(e) => setEmailConfig({ ...emailConfig, gmail_client_id: e.target.value })}
                        placeholder="Enter your Gmail OAuth Client ID"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Client Secret</label>
                      <Input
                        type="password"
                        value={emailConfig.gmail_client_secret}
                        onChange={(e) => setEmailConfig({ ...emailConfig, gmail_client_secret: e.target.value })}
                        placeholder="Enter your Gmail OAuth Client Secret"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email Address</label>
                      <Input
                        type="email"
                        value={emailConfig.gmail_email}
                        onChange={(e) => setEmailConfig({ ...emailConfig, gmail_email: e.target.value })}
                        placeholder="your-email@gmail.com"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Redirect URI</label>
                      <Input
                        type="text"
                        value={emailConfig.gmail_redirect_uri}
                        onChange={(e) => setEmailConfig({ ...emailConfig, gmail_redirect_uri: e.target.value })}
                        placeholder="https://your-domain.com/api/v1/integrations/gmail/callback"
                        className="mt-1"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-sm font-medium">API Key</label>
                      <Input
                        type="password"
                        value={emailConfig.sendgrid_api_key}
                        onChange={(e) => setEmailConfig({ ...emailConfig, sendgrid_api_key: e.target.value })}
                        placeholder="Enter your SendGrid API Key"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">From Email</label>
                      <Input
                        type="email"
                        value={emailConfig.sendgrid_from_email}
                        onChange={(e) => setEmailConfig({ ...emailConfig, sendgrid_from_email: e.target.value })}
                        placeholder="noreply@yourdomain.com"
                        className="mt-1"
                      />
                    </div>
                  </>
                )}
                
                <div className="flex gap-2">
                  <Button onClick={() => {
                    // Save email config - in production, this would call the API
                    // TODO: implement email config save via API
                    setShowEmailConfig(false)
                  }} disabled={loading}>
                    {loading ? 'Saving...' : 'Save'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowEmailConfig(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => setShowEmailConfig(true)}>
                Configure Email
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Google Calendar */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle>Google Calendar</CardTitle>
              <CardDescription>Sync your bookings with Google Calendar</CardDescription>
            </div>
            {getStatusBadge('pending')}
          </CardHeader>
          <CardContent>
            {showCalendarConfig ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Client ID</label>
                  <Input
                    type="text"
                    value={calendarConfig.client_id}
                    onChange={(e) => setCalendarConfig({ ...calendarConfig, client_id: e.target.value })}
                    placeholder="Enter your Google OAuth Client ID"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Client Secret</label>
                  <Input
                    type="password"
                    value={calendarConfig.client_secret}
                    onChange={(e) => setCalendarConfig({ ...calendarConfig, client_secret: e.target.value })}
                    placeholder="Enter your Google OAuth Client Secret"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Redirect URI</label>
                  <Input
                    type="text"
                    value={calendarConfig.redirect_uri}
                    onChange={(e) => setCalendarConfig({ ...calendarConfig, redirect_uri: e.target.value })}
                    placeholder="https://your-domain.com/api/v1/integrations/calendar/callback"
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCalendarConnect} disabled={loading}>
                    {loading ? 'Connecting...' : 'Connect'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowCalendarConfig(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => setShowCalendarConfig(true)}>
                Configure Google Calendar
              </Button>
            )}
          </CardContent>
        </Card>

        {/* File Storage */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-orange-500 flex items-center justify-center">
              <Cloud className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle>File Storage</CardTitle>
              <CardDescription>Store files in AWS S3 or Cloudinary</CardDescription>
            </div>
            {getStatusBadge('pending')}
          </CardHeader>
          <CardContent>
            {showStorageConfig ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Provider</label>
                  <select
                    value={storageConfig.provider}
                    onChange={(e) => setStorageConfig({ ...storageConfig, provider: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  >
                    <option value="s3">AWS S3</option>
                    <option value="cloudinary">Cloudinary</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Access Key ID</label>
                  <Input
                    type="text"
                    value={storageConfig.access_key_id}
                    onChange={(e) => setStorageConfig({ ...storageConfig, access_key_id: e.target.value })}
                    placeholder="Enter AWS Access Key ID"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Secret Access Key</label>
                  <Input
                    type="password"
                    value={storageConfig.secret_access_key}
                    onChange={(e) => setStorageConfig({ ...storageConfig, secret_access_key: e.target.value })}
                    placeholder="Enter AWS Secret Access Key"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Bucket Name</label>
                  <Input
                    type="text"
                    value={storageConfig.bucket_name}
                    onChange={(e) => setStorageConfig({ ...storageConfig, bucket_name: e.target.value })}
                    placeholder="Enter S3 Bucket Name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Region</label>
                  <Input
                    type="text"
                    value={storageConfig.region}
                    onChange={(e) => setStorageConfig({ ...storageConfig, region: e.target.value })}
                    placeholder="us-east-1"
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleStorageConnect} disabled={loading}>
                    {loading ? 'Connecting...' : 'Connect'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowStorageConfig(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => setShowStorageConfig(true)}>
                Configure Storage
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Webhooks */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center">
              <Webhook className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle>Webhooks</CardTitle>
              <CardDescription>Send events to external services</CardDescription>
            </div>
            {getStatusBadge('pending')}
          </CardHeader>
          <CardContent>
            {showWebhookConfig ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Webhook URL</label>
                  <Input
                    type="url"
                    value={webhookConfig.url}
                    onChange={(e) => setWebhookConfig({ ...webhookConfig, url: e.target.value })}
                    placeholder="https://your-server.com/webhook"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Secret (for signature verification)</label>
                  <Input
                    type="password"
                    value={webhookConfig.secret}
                    onChange={(e) => setWebhookConfig({ ...webhookConfig, secret: e.target.value })}
                    placeholder="Enter a secure secret"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Events to trigger</label>
                  <div className="mt-2 space-y-2">
                    {['booking.created', 'booking.updated', 'contact.created', 'job.completed'].map((event) => (
                      <label key={event} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={webhookConfig.events.includes(event)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setWebhookConfig({
                                ...webhookConfig,
                                events: [...webhookConfig.events, event]
                              })
                            } else {
                              setWebhookConfig({
                                ...webhookConfig,
                                events: webhookConfig.events.filter(e => e !== event)
                              })
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{event}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleWebhookCreate} disabled={loading}>
                    {loading ? 'Creating...' : 'Create Webhook'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowWebhookConfig(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => setShowWebhookConfig(true)}>
                Add Webhook
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
