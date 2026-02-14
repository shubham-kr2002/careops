'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  MessageSquare,
  FileText,
  Package,
  Users,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Zap
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  badge?: number
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Bookings', href: '/dashboard/bookings', icon: Calendar, badge: 3 },
  { name: 'Inbox', href: '/dashboard/inbox', icon: MessageSquare, badge: 12 },
  { name: 'Forms', href: '/dashboard/forms', icon: FileText },
  { name: 'Inventory', href: '/dashboard/inventory', icon: Package },
  { name: 'Leads', href: '/dashboard/leads', icon: Users },
]

const secondaryNavigation: NavItem[] = [
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-[var(--neutral-50)]">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fadeIn"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed top-0 left-0 z-50 h-full w-[var(--sidebar-width)] bg-white border-r border-[var(--neutral-200)]
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center px-6 border-b border-[var(--neutral-200)]">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary-600)] flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[var(--neutral-900)]">CareOps</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden p-2 rounded-lg hover:bg-[var(--neutral-100)]"
          >
            <X className="w-5 h-5 text-[var(--neutral-500)]" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <p className="px-3 text-xs font-semibold text-[var(--neutral-400)] uppercase tracking-wider mb-3">
            Main
          </p>
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-[var(--primary-50)] text-[var(--primary-700)]' 
                    : 'text-[var(--neutral-600)] hover:bg-[var(--neutral-100)] hover:text-[var(--neutral-900)]'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[var(--primary-600)]' : ''}`} />
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <span className={`
                    px-2 py-0.5 text-xs font-medium rounded-full
                    ${isActive 
                      ? 'bg-[var(--primary-100)] text-[var(--primary-700)]' 
                      : 'bg-[var(--neutral-100)] text-[var(--neutral-600)]'
                    }
                  `}>
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}

          <p className="px-3 text-xs font-semibold text-[var(--neutral-400)] uppercase tracking-wider mt-8 mb-3">
            System
          </p>
          {secondaryNavigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-[var(--primary-50)] text-[var(--primary-700)]' 
                    : 'text-[var(--neutral-600)] hover:bg-[var(--neutral-100)] hover:text-[var(--neutral-900)]'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[var(--primary-600)]' : ''}`} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[var(--neutral-200)]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-[var(--neutral-600)] hover:bg-[var(--neutral-100)] hover:text-[var(--error-600)] transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-[var(--sidebar-width)]">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-[var(--neutral-200)] sticky top-0 z-30">
          <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            {/* Left: Menu & Search */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-[var(--neutral-100)]"
              >
                <Menu className="w-5 h-5 text-[var(--neutral-500)]" />
              </button>
              
              {/* Search */}
              <div className="hidden sm:flex items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--neutral-400)]" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-64 pl-10 pr-4 py-2 bg-[var(--neutral-100)] border-none rounded-lg text-sm text-[var(--neutral-900)] placeholder:text-[var(--neutral-400)] focus:ring-2 focus:ring-[var(--primary-100)] focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Right: Notifications & Profile */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <button className="relative p-2 rounded-lg hover:bg-[var(--neutral-100)] transition-colors">
                <Bell className="w-5 h-5 text-[var(--neutral-500)]" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--error-500)] rounded-full" />
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 p-1.5 pr-3 rounded-lg hover:bg-[var(--neutral-100)] transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[var(--primary-100)] flex items-center justify-center">
                    <span className="text-sm font-medium text-[var(--primary-700)]">
                      {user?.first_name?.[0]}{user?.last_name?.[0]}
                    </span>
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-[var(--neutral-900)]">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-xs text-[var(--neutral-500)]">{user?.role}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-[var(--neutral-400)]" />
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-[var(--neutral-200)] py-1 z-20 animate-scaleIn">
                      <div className="px-4 py-3 border-b border-[var(--neutral-200)]">
                        <p className="text-sm font-medium text-[var(--neutral-900)]">
                          {user?.first_name} {user?.last_name}
                        </p>
                        <p className="text-xs text-[var(--neutral-500)] truncate">{user?.email}</p>
                      </div>
                      <Link
                        href="/dashboard/profile"
                        className="block px-4 py-2 text-sm text-[var(--neutral-600)] hover:bg-[var(--neutral-50)] hover:text-[var(--neutral-900)]"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Your Profile
                      </Link>
                      <Link
                        href="/dashboard/settings"
                        className="block px-4 py-2 text-sm text-[var(--neutral-600)] hover:bg-[var(--neutral-50)] hover:text-[var(--neutral-900)]"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Settings
                      </Link>
                      <div className="border-t border-[var(--neutral-200)] mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-[var(--error-600)] hover:bg-[var(--error-50)]"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
