'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface BookingForm {
  id: string;
  form_id: string;
  name: string;
  type: string;
  description: string;
  file_url: string;
  status: string;
  required: boolean;
}

export default function PublicFormCompletionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const workspaceSlug = params.slug as string;
  const formId = params.form_id as string;
  const bookingId = searchParams.get('booking_id');
  
  const [forms, setForms] = useState<BookingForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bookingId) {
      fetchForms();
    } else {
      setError('Booking ID is required to access forms');
      setLoading(false);
    }
  }, [bookingId]);

  const fetchForms = async () => {
    try {
      const response = await fetch(
        `/api/public/workspaces/${workspaceSlug}/bookings/${bookingId}/forms`
      );
      
      if (!response.ok) throw new Error('Failed to fetch forms');
      
      const data = await response.json();
      setForms(data);
    } catch (err) {
      setError('Failed to load forms. Please check your booking link.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteForm = async (bookingFormId: string) => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/public/workspaces/${workspaceSlug}/bookings/${bookingId}/forms/${bookingFormId}/complete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to complete form');
      }

      setCompleted(true);
      setTimeout(() => {
        fetchForms(); // Refresh to show updated status
        setCompleted(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadForm = (fileUrl: string) => {
    window.open(fileUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading your forms...</p>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-success-50 via-white to-primary-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center animate-fadeInUp">
          <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-3">Form Completed!</h2>
          <p className="text-neutral-600">
            Thank you for completing your form. Your submission has been recorded.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fadeInUp">
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
            Complete Your Forms
          </h1>
          <p className="text-lg text-neutral-600">
            Please review and complete the required forms for your booking
          </p>
        </div>

        {error && (
          <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Forms List */}
        <div className="space-y-6">
          {forms.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-neutral-600">No forms found for this booking.</p>
            </div>
          ) : (
            forms.map((form, index) => (
              <div
                key={form.id}
                className="bg-white rounded-xl shadow-lg p-6 md:p-8 animate-fadeInUp hover:shadow-2xl transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-semibold text-neutral-900">{form.name}</h3>
                      {form.required && (
                        <span className="bg-error-100 text-error-700 text-xs px-2 py-1 rounded-full font-medium">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-neutral-600 mb-3">{form.description}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="bg-neutral-100 text-neutral-700 px-3 py-1 rounded-full">
                        {form.type}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full font-medium ${
                          form.status === 'completed'
                            ? 'bg-success-100 text-success-700'
                            : form.status === 'pending'
                            ? 'bg-warning-100 text-warning-700'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  {form.status === 'completed' && (
                    <div className="ml-4">
                      <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-neutral-200">
                  {form.file_url && (
                    <Button
                      onClick={() => downloadForm(form.file_url)}
                      className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-4 py-2 rounded-lg transition-all"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download Form
                    </Button>
                  )}
                  
                  {form.status !== 'completed' && (
                    <Button
                      onClick={() => handleCompleteForm(form.id)}
                      disabled={submitting}
                      className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-all disabled:opacity-50"
                    >
                      {submitting ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Mark as Completed
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Upload Instructions */}
                {form.status !== 'completed' && form.file_url && (
                  <div className="mt-4 bg-primary-50 rounded-lg p-4">
                    <p className="text-sm text-primary-900 font-medium mb-2">📋 Instructions:</p>
                    <ol className="text-sm text-primary-800 space-y-1 ml-4 list-decimal">
                      <li>Download the form using the button above</li>
                      <li>Fill out the form completely</li>
                      <li>Email the completed form to us or bring it to your appointment</li>
                      <li>Click "Mark as Completed" once you've submitted it</li>
                    </ol>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Progress Summary */}
        {forms.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6 animate-fadeInUp">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Progress Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Total Forms:</span>
                <span className="font-medium text-neutral-900">{forms.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Completed:</span>
                <span className="font-medium text-success-600">
                  {forms.filter(f => f.status === 'completed').length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Pending:</span>
                <span className="font-medium text-warning-600">
                  {forms.filter(f => f.status === 'pending').length}
                </span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div
                  className="bg-success-600 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${(forms.filter(f => f.status === 'completed').length / forms.length) * 100}%`
                  }}
                ></div>
              </div>
              <p className="text-xs text-neutral-500 mt-2 text-center">
                {Math.round((forms.filter(f => f.status === 'completed').length / forms.length) * 100)}% Complete
              </p>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-sm text-neutral-600">
            Need help?{' '}
            <a
              href={`/workspace/${workspaceSlug}/contact`}
              className="text-primary-600 hover:text-primary-700 font-medium underline"
            >
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
