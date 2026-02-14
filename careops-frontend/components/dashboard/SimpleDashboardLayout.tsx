import React from 'react'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  MessageSquare,
  Package,
  Settings,
  Users,
  Menu,
  X,
  LogOut,
  Bell,
  User,
  ChevronDown,
  Plus,
  Search,
  Home,
  FileText,
  Shield,
  CreditCard,
  HelpCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Bookings', href: '/dashboard/bookings', icon: Calendar },
  { name: 'Inbox', href: '/dashboard/inbox', icon: MessageSquare },
  { name: 'Inventory', href: '/dashboard/inventory', icon: Package },
  { name: 'Forms', href: '/dashboard/forms', icon: FileText },
]

const secondaryNavigation = [
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  { name: 'Team', href: '/dashboard/team', icon: Users },
]

const userNavigation = [
  { name: 'Profile', href: '/dashboard/settings/profile', icon: User },
  { name: 'Security', href: '/dashboard/settings/security', icon: Shield },
  { name: 'Billing', href: '/dashboard/settings/billing', icon: CreditCard },
  { name: 'Help', href: '/help', icon: HelpCircle },
  { name: 'Sign out', href: '/logout', icon: LogOut },
]

interface SimpleDashboardLayoutProps {
  children: React.ReactNode
  pageTitle?: string
  breadcrumbs?: { name: string; href?: string }[]
}

export function SimpleDashboardLayout({ children, pageTitle, breadcrumbs }: SimpleDashboardLayoutProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')

  const isActive = (href: string) => pathname === href

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
          <div className="flex h-16 items-center justify-between px-4 border-b border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-neutral-900">CareOps</h1>
                <p className="text-xs text-neutral-500">Healthcare Operations</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="h-[calc(100vh-64px)] overflow-y-auto">
            <div className="p-4 space-y-6">
              {/* Quick Actions */}
              <div>
                <h3 className="px-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <Button className="w-full justify-start gap-3 bg-primary-600 hover:bg-primary-700 text-white">
                    <Plus className="w-4 h-4" />
                    New Booking
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-3 border-neutral-200">
                    <MessageSquare className="w-4 h-4" />
                    Send Message
                  </Button>
                </div>
              </div>

              {/* Main Navigation */}
              <div>
                <h3 className="px-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                  Main Menu
                </h3>
                <nav className="space-y-1">
                  {navigation.map((item) => {
                    const Icon = item.icon
                    return (
                      <a
                        key={item.name}
                        href={item.href}
                        className={`group flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                          isActive(item.href)
                            ? 'bg-primary-50 text-primary-700 border border-primary-200'
                            : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${
                          isActive(item.href) ? 'text-primary-600' : 'text-neutral-400 group-hover:text-neutral-500'
                        }`} />
                        {item.name}
                        {isActive(item.href) && (
                          <div className="ml-auto w-2 h-2 bg-primary-600 rounded-full" />
                        )}
                      </a>
                    )
                  })}
                </nav>
              </div>

              {/* Secondary Navigation */}
              <div>
                <h3 className="px-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                  Management
                </h3>
                <nav className="space-y-1">
                  {secondaryNavigation.map((item) => {
                    const Icon = item.icon
                    return (
                      <a
                        key={item.name}
                        href={item.href}
                        className="group flex items-center gap-3 px-3 py-2 text-sm font-medium text-neutral-600 rounded-lg hover:bg-neutral-50 hover:text-neutral-900 transition-all duration-200"
                      >
                        <Icon className="w-4 h-4 text-neutral-400 group-hover:text-neutral-500" />
                        {item.name}
                      </a>
                    )
                  })}
                </nav>
              </div>

              <Separator />

              {/* User Menu */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
                      <AvatarFallback>AD</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Admin User</p>
                      <p className="text-xs text-neutral-500">admin@careops.com</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-neutral-600">
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-1">
                  {userNavigation.map((item) => {
                    const Icon = item.icon
                    return (
                      <a
                        key={item.name}
                        href={item.href}
                        className="flex items-center gap-3 px-3 py-2 text-sm text-neutral-600 rounded-lg hover:bg-neutral-50 hover:text-neutral-900 transition-all duration-200"
                      >
                        <Icon className="w-4 h-4 text-neutral-400" />
                        {item.name}
                      </a>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-neutral-200 bg-white px-6">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-neutral-900">CareOps</h1>
              <p className="text-xs text-neutral-500">Healthcare Operations</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-neutral-50 border-neutral-200 focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            <h3 className="px-1 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Button className="w-full justify-start gap-3 bg-primary-600 hover:bg-primary-700 text-white">
                <Plus className="w-4 h-4" />
                New Booking
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 border-neutral-200">
                <MessageSquare className="w-4 h-4" />
                Send Message
              </Button>
            </div>
          </div>

          {/* Main Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                        isActive(item.href)
                          ? 'bg-primary-50 text-primary-700 border border-primary-200'
                          : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${
                        isActive(item.href) ? 'text-primary-600' : 'text-neutral-400 group-hover:text-neutral-500'
                      }`} />
                      {item.name}
                      {isActive(item.href) && (
                        <div className="ml-auto w-2 h-2 bg-primary-600 rounded-full" />
                      )}
                    </a>
                  </li>
                )
              })}
            </ul>

            <div className="mt-6 space-y-1">
              <h3 className="px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Management
              </h3>
              {secondaryNavigation.map((item) => {
                const Icon = item.icon
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-all duration-200"
                  >
                    <Icon className="w-4 h-4 text-neutral-400 group-hover:text-neutral-500" />
                    {item.name}
                  </a>
                )
              })}
            </div>
          </nav>

          <div className="flex flex-col gap-4 border-t border-neutral-200 pt-5">
            {/* Notifications */}
            <Button variant="ghost" className="w-full justify-start gap-3 text-neutral-600 hover:text-neutral-900">
              <Bell className="w-4 h-4" />
              Notifications
              <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">3</span>
            </Button>

            {/* User Menu */}
            <div className="border-t border-neutral-200 pt-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
                    <AvatarFallback>AD</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">Admin User</p>
                    <p className="text-xs text-neutral-500">admin@careops.com</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-neutral-600">
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="mt-3 space-y-1">
                {userNavigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-all duration-200"
                    >
                      <Icon className="w-4 h-4 text-neutral-400" />
                      {item.name}
                    </a>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top navigation */}
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-neutral-200 bg-white px-4 shadow-sm">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-neutral-600 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>

          {/* Breadcrumbs */}
          <div className="flex-1">
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav className="flex" aria-label="Breadcrumb">
                <ol role="list" className="flex items-center space-x-2">
                  <li>
                    <a href="/" className="text-neutral-400 hover:text-neutral-600">
                      <Home className="h-4 w-4" />
                      <span className="sr-only">Home</span>
                    </a>
                  </li>
                  {breadcrumbs.map((breadcrumb, index) => (
                    <li key={breadcrumb.name} className="flex items-center">
                      <svg className="h-4 w-4 text-neutral-300" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                      </svg>
                      {breadcrumb.href ? (
                        <a href={breadcrumb.href} className="ml-2 text-sm font-medium text-neutral-500 hover:text-neutral-700">
                          {breadcrumb.name}
                        </a>
                      ) : (
                        <span className="ml-2 text-sm font-medium text-neutral-700">{breadcrumb.name}</span>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            )}
          </div>

          {/* Header actions */}
          <div className="flex items-center gap-4">
            {/* Quick stats */}
            <div className="hidden md:flex items-center gap-4 text-sm text-neutral-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success-500 rounded-full" />
                <span>Online</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-neutral-400">|</span>
                <span>Today: 12 appointments</span>
              </div>
            </div>

            {/* User menu */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative text-neutral-400 hover:text-neutral-600">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
              </Button>
              
              <Separator orientation="vertical" className="h-6" />
              
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
                <span className="hidden md:block text-sm font-medium text-neutral-700">Admin User</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page header */}
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            {/* Page title */}
            {pageTitle && (
              <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
                  {pageTitle}
                </h1>
              </div>
            )}

            {/* Page content */}
            <Card className="border-neutral-200 shadow-sm">
              <div className="p-6">
                {children}
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}