import { LoginForm } from "@/components/common/LoginForm";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Login - CareOps",
  description: "Sign in to your CareOps account",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary-600)] via-[var(--primary-700)] to-[var(--primary-900)]" />
        
        {/* Decorative Elements */}
        <div className="absolute inset-0">
          {/* Grid Pattern */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }}
          />
          
          {/* Floating Circles */}
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-[var(--primary-400)]/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-[var(--primary-300)]/10 rounded-full blur-2xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg">
              <svg 
                className="w-6 h-6 text-[var(--primary-600)]" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M13 10V3L4 14h7v7l9-11h-7z" 
                />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white">CareOps</span>
          </div>

          {/* Main Message */}
          <div className="max-w-lg">
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
              Eliminate Tool Chaos
            </h1>
            <p className="text-xl text-white/80 leading-relaxed">
              One platform for leads, bookings, communications, forms, and inventory. 
              Streamline your service business operations.
            </p>
            
            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3 mt-8">
              {['Lead Management', 'Booking System', 'Unified Inbox', 'Form Builder', 'Inventory'].map((feature) => (
                <span 
                  key={feature}
                  className="px-4 py-2 rounded-full bg-white/10 text-white/90 text-sm font-medium backdrop-blur-sm border border-white/20"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom Stats */}
          <div className="flex gap-12">
            <div>
              <div className="text-3xl font-bold text-white">99.9%</div>
              <div className="text-white/60 text-sm mt-1">Uptime</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">50%</div>
              <div className="text-white/60 text-sm mt-1">Time Saved</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">24/7</div>
              <div className="text-white/60 text-sm mt-1">Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-8 lg:p-12 bg-[var(--neutral-50)]">
        {/* Mobile Logo */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary-600)] flex items-center justify-center shadow-lg">
            <svg 
              className="w-6 h-6 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13 10V3L4 14h7v7l9-11h-7z" 
              />
            </svg>
          </div>
          <span className="text-2xl font-bold text-[var(--neutral-900)]">CareOps</span>
        </div>

        {/* Login Form Container */}
        <div className="w-full max-w-md animate-fadeInUp">
          <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
            <LoginForm />
          </Suspense>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[var(--neutral-500)]">
            Don't have an account?{' '}
            <a 
              href="#" 
              className="text-[var(--primary-600)] hover:text-[var(--primary-700)] font-medium transition-colors"
            >
              Contact sales
            </a>
          </p>
          <p className="text-xs text-[var(--neutral-400)] mt-4">
            © 2026 CareOps. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
