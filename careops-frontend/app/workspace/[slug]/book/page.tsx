'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface BookingType {
  id: string;
  name: string;
  description: string;
  duration: number;
  location: string;
  is_virtual: boolean;
  price: string;
}

interface BookingFormData {
  booking_type_id: string;
  name: string;
  email: string;
  phone: string;
  scheduled_at: string;
  notes: string;
}

export default function PublicBookingPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.slug as string;
  
  const [bookingTypes, setBookingTypes] = useState<BookingType[]>([]);
  const [selectedType, setSelectedType] = useState<BookingType | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<BookingFormData>({
    booking_type_id: '',
    name: '',
    email: '',
    phone: '',
    scheduled_at: '',
    notes: ''
  });

  useEffect(() => {
    fetchBookingTypes();
  }, [workspaceSlug]);

  const fetchBookingTypes = async () => {
    try {
      const response = await fetch(`/api/public/workspaces/${workspaceSlug}/bookings`);
      if (!response.ok) throw new Error('Failed to fetch booking types');
      const data = await response.json();
      setBookingTypes(data);
    } catch (err) {
      setError('Failed to load booking options. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleTypeSelect = (type: BookingType) => {
    setSelectedType(type);
    setFormData({ ...formData, booking_type_id: type.id });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/public/workspaces/${workspaceSlug}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create booking');
      }

      setSubmitted(true);
      setTimeout(() => {
        router.push(`/workspace/${workspaceSlug}`);
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading booking options...</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-success-50 via-white to-primary-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl p-8 text-center animate-fadeInUp">
          <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-neutral-900 mb-3">Booking Confirmed!</h2>
          <p className="text-lg text-neutral-700 mb-4">
            Your appointment has been successfully scheduled.
          </p>
          <div className="bg-primary-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-neutral-600 mb-2">
              <strong>Service:</strong> {selectedType?.name}
            </p>
            <p className="text-sm text-neutral-600 mb-2">
              <strong>Date & Time:</strong> {new Date(formData.scheduled_at).toLocaleString()}
            </p>
            <p className="text-sm text-neutral-600">
              <strong>Duration:</strong> {selectedType?.duration} minutes
            </p>
          </div>
          <p className="text-neutral-600 text-sm mb-2">
            📧 A confirmation email has been sent to <strong>{formData.email}</strong>
          </p>
          <p className="text-neutral-500 text-xs">
            You will receive any required forms shortly.
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
            Book an Appointment
          </h1>
          <p className="text-lg text-neutral-600">
            Choose a service and select your preferred time
          </p>
        </div>

        {error && (
          <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Service Selection */}
        {!selectedType ? (
          <div className="grid md:grid-cols-2 gap-6 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
            {bookingTypes.length === 0 ? (
              <div className="col-span-2 text-center py-12">
                <p className="text-neutral-600">No booking options available at this time.</p>
              </div>
            ) : (
              bookingTypes.map((type, index) => (
                <div
                  key={type.id}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-primary-500 transform hover:-translate-y-1"
                  onClick={() => handleTypeSelect(type)}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-semibold text-neutral-900">{type.name}</h3>
                    {type.price && (
                      <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                        {type.price}
                      </span>
                    )}
                  </div>
                  <p className="text-neutral-600 mb-4">{type.description}</p>
                  <div className="flex flex-wrap gap-3 text-sm text-neutral-500">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {type.duration} min
                    </span>
                    <span className="flex items-center">
                      {type.is_virtual ? (
                        <>
                          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                          Virtual
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {type.location}
                        </>
                      )}
                    </span>
                  </div>
                  <div className="mt-4 text-primary-600 font-medium flex items-center">
                    Select this service
                    <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Booking Form */
          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10 animate-fadeInUp">
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-neutral-200">
              <div>
                <h2 className="text-2xl font-bold text-neutral-900">{selectedType.name}</h2>
                <p className="text-neutral-600 text-sm">{selectedType.duration} minutes</p>
              </div>
              <button
                onClick={() => setSelectedType(null)}
                className="text-neutral-500 hover:text-neutral-700 text-sm font-medium"
              >
                ← Change Service
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-2">
                    Full Name <span className="text-error-500">*</span>
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                    Email Address <span className="text-error-500">*</span>
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-2">
                    Phone Number <span className="text-error-500">*</span>
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label htmlFor="scheduled_at" className="block text-sm font-medium text-neutral-700 mb-2">
                    Preferred Date & Time <span className="text-error-500">*</span>
                  </label>
                  <Input
                    id="scheduled_at"
                    name="scheduled_at"
                    type="datetime-local"
                    required
                    value={formData.scheduled_at}
                    onChange={handleChange}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-neutral-700 mb-2">
                  Additional Notes <span className="text-neutral-400">(optional)</span>
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                  placeholder="Any special requirements or questions?"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {submitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Confirming Booking...
                  </span>
                ) : (
                  'Confirm Booking'
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-neutral-200">
              <p className="text-xs text-neutral-500 text-center">
                🔒 Your information is secure. You'll receive a confirmation email with all the details.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 animate-fadeInUp" style={{ animationDelay: '200ms' }}>
          <p className="text-sm text-neutral-600">
            Need help?{' '}
            <a href={`/workspace/${workspaceSlug}/contact`} className="text-primary-600 hover:text-primary-700 font-medium underline">
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
