'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Settings, User, Building, Bell, Shield, Palette } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  const settingsSections = [
    {
      title: 'Workspace',
      description: 'Manage your workspace settings',
      icon: Building,
      href: '/dashboard/settings/workspace',
      color: 'bg-blue-500'
    },
    {
      title: 'Profile',
      description: 'Update your personal information',
      icon: User,
      href: '/dashboard/settings/profile',
      color: 'bg-green-500'
    },
    {
      title: 'Integrations',
      description: 'Connect external services',
      icon: Settings,
      href: '/dashboard/settings/integrations',
      color: 'bg-purple-500'
    },
    {
      title: 'Notifications',
      description: 'Configure alert preferences',
      icon: Bell,
      href: '/dashboard/settings/profile',
      color: 'bg-yellow-500'
    },
    {
      title: 'Security',
      description: 'Password and security settings',
      icon: Shield,
      href: '/dashboard/settings/profile',
      color: 'bg-red-500'
    },
    {
      title: 'Appearance',
      description: 'Theme and display options',
      icon: Palette,
      href: '/dashboard/settings/profile',
      color: 'bg-pink-500'
    }
  ]

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your workspace and account settings
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {settingsSections.map((section) => (
          <Link key={section.title} href={section.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className={`w-12 h-12 rounded-lg ${section.color} flex items-center justify-center`}>
                  <section.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle>{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
