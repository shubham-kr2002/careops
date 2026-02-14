'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Plus, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { useForms, useBookingForms, type FormTemplate, type BookingForm } from '@/lib/api'

export default function FormsPage() {
  const { data: forms = [], isLoading: loadingForms, error: formsError, refetch: refetchForms } = useForms()
  const { data: bookingForms = [], isLoading: loadingBookingForms, error: bfError } = useBookingForms()

  const loading = loadingForms || loadingBookingForms
  const error = formsError || bfError

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" aria-hidden="true" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" aria-hidden="true" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" aria-hidden="true" />
    }
  }

  const pendingForms = bookingForms.filter((f: BookingForm) => f.status === 'pending')
  const completedForms = bookingForms.filter((f: BookingForm) => f.status === 'completed')

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--neutral-900)]">Forms</h1>
          <p className="text-[var(--neutral-500)] mt-1">
            Manage and track form completion for bookings
          </p>
        </div>

        {/* Error State */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500" aria-hidden="true" />
                <p className="text-sm text-red-700">
                  Failed to load forms. The server may be unavailable.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchForms()}
                aria-label="Retry loading forms"
              >
                <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Form Templates */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-[var(--neutral-900)]">Form Templates</h2>
            <Button aria-label="Add new form template">
              <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
              Add Form
            </Button>
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardHeader className="pb-3">
                    <div className="skeleton h-5 w-32 mb-2" />
                    <div className="skeleton h-4 w-48" />
                  </CardHeader>
                  <CardContent>
                    <div className="skeleton h-4 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : forms.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-[var(--neutral-500)]">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" aria-hidden="true" />
                <p>No forms created yet</p>
                <p className="text-sm mt-1">Create forms to send to customers after booking</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {forms.map((form: FormTemplate) => (
                <Card key={form.id} className="card-hover">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{form.name}</CardTitle>
                        <CardDescription className="mt-1">{form.description}</CardDescription>
                      </div>
                      {form.required && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                          Required
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[var(--neutral-500)] capitalize">{form.type}</span>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Booking Form Status */}
        <div>
          <h2 className="text-lg font-semibold text-[var(--neutral-900)] mb-4">Customer Forms</h2>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="py-4">
                    <div className="skeleton h-5 w-40 mb-2" />
                    <div className="skeleton h-4 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : bookingForms.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-[var(--neutral-500)]">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" aria-hidden="true" />
                <p>No booking forms yet</p>
                <p className="text-sm mt-1">Forms will appear here when customers book services</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingForms.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-yellow-600 mb-3">
                    Pending ({pendingForms.length})
                  </h3>
                  <div className="space-y-2">
                    {pendingForms.map((bf: BookingForm) => (
                      <Card key={bf.id} className="border-yellow-200">
                        <CardContent className="py-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium">{bf.form.name}</p>
                            <p className="text-sm text-[var(--neutral-500)]">
                              Booking ID: {bf.booking_id.slice(0, 8)}...
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            {getStatusIcon(bf.status)}
                            <Button size="sm" variant="outline">Send Reminder</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {completedForms.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-green-600 mb-3">
                    Completed ({completedForms.length})
                  </h3>
                  <div className="space-y-2">
                    {completedForms.map((bf: BookingForm) => (
                      <Card key={bf.id} className="border-green-200">
                        <CardContent className="py-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium">{bf.form.name}</p>
                            <p className="text-sm text-[var(--neutral-500)]">
                              Completed: {bf.completed_at ? new Date(bf.completed_at).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          {getStatusIcon(bf.status)}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
