'use client'

import React, { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Search, Send, Paperclip, Smile, MoreVertical, Phone, Video, ArrowLeft, Pause, Play, RefreshCw } from 'lucide-react'
import { useConversations, useConversationMessages, useSendMessage, pauseAutomation, resumeAutomation } from '@/lib/api'

interface ConversationData {
  id: string
  contact_name: string
  status: string
  automation_paused: string | null
  last_message: string | null
  last_message_at: string | null
  unread_count: number
}

interface MessageData {
  id: string
  type: string
  direction: string
  content: string
  created_at: string
}

// Mock data for demo when API is not connected
const mockConversations = [
  { id: '1', contact_name: 'Alice Johnson', message: 'Can we reschedule our appointment?', time: '2 min ago', unread: 2, status: 'online', automation_paused: null },
  { id: '2', contact_name: 'Bob Williams', message: 'Thanks for the quick service!', time: '15 min ago', unread: 0, status: 'offline', automation_paused: 'staff_reply' },
  { id: '3', contact_name: 'Carol Davis', message: 'Is the package ready for pickup?', time: '1 hour ago', unread: 1, status: 'online', automation_paused: null },
  { id: '4', contact_name: 'David Brown', message: 'I need to cancel my booking', time: '2 hours ago', unread: 0, status: 'offline', automation_paused: null },
  { id: '5', contact_name: 'Emma Wilson', message: 'What are your business hours?', time: '3 hours ago', unread: 0, status: 'online', automation_paused: null },
]

const mockMessages = [
  { id: '1', sender: 'them', text: 'Hi, I was wondering if we could reschedule our appointment to next week?', time: '2:30 PM' },
  { id: '2', sender: 'me', text: 'Of course! What day works best for you?', time: '2:32 PM' },
  { id: '3', sender: 'them', text: 'Would Tuesday at 3 PM work?', time: '2:35 PM' },
  { id: '4', sender: 'me', text: 'Tuesday at 3 PM works perfectly. I\'ve updated your booking.', time: '2:37 PM' },
]

export default function InboxPage() {
  const [selectedChat, setSelectedChat] = useState<string | null>('1')
  const [messageText, setMessageText] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [automationPaused, setAutomationPaused] = useState<string | null>(null)

  // Use API if available, otherwise use mock data
  const { data: apiConversations, isLoading: loadingConversations } = useConversations()
  const { data: apiMessages, isLoading: loadingMessages, refetch: refetchMessages } = useConversationMessages(selectedChat || '')
  const sendMessageMutation = useSendMessage()

  const conversations = apiConversations && Array.isArray(apiConversations) && apiConversations.length > 0 
    ? apiConversations 
    : mockConversations

  const messages = apiMessages && Array.isArray(apiMessages) && apiMessages.length > 0
    ? apiMessages.map((m: MessageData) => ({
        id: m.id,
        sender: m.direction === 'outbound' ? 'me' : 'them',
        text: m.content,
        time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }))
    : mockMessages

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedChat) return

    // If API is available, use it
    if (apiConversations && Array.isArray(apiConversations) && apiConversations.length > 0) {
      await sendMessageMutation.mutateAsync({ conversationId: selectedChat, content: messageText })
      refetchMessages()
    }
    
    // Set automation as paused when staff replies (Rule #4: If a human staff member replies, the automation loop MUST pause immediately)
    setAutomationPaused('staff_reply')
    setMessageText('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const toggleAutomation = async () => {
    if (!selectedChat) return
    
    // If API is available, sync with backend
    if (apiConversations && Array.isArray(apiConversations) && apiConversations.length > 0) {
      if (automationPaused) {
        await resumeAutomation(selectedChat)
      } else {
        await pauseAutomation(selectedChat)
      }
    }
    
    setAutomationPaused(automationPaused ? null : 'manual_pause')
  }

  const currentConversation = conversations.find((c: any) => c.id === selectedChat)

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] bg-white rounded-xl border border-[var(--neutral-200)] overflow-hidden">
        <div className="flex h-full">
          {/* Conversations Sidebar */}
          <div className={`${sidebarOpen ? 'flex' : 'hidden'} w-full md:w-80 flex-col border-r border-[var(--neutral-200)]`}>
            {/* Search */}
            <div className="p-4 border-b border-[var(--neutral-200)]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--neutral-400)]" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  className="w-full pl-10 pr-4 py-2 bg-[var(--neutral-100)] border-none rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary-100)] focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
              {conversations.map((chat: any) => (
                <button
                  key={chat.id}
                  onClick={() => {
                    setSelectedChat(chat.id)
                    setSidebarOpen(false)
                    setAutomationPaused(chat.automation_paused)
                  }}
                  className={`w-full p-4 flex items-start gap-3 hover:bg-[var(--neutral-50)] transition-colors border-b border-[var(--neutral-100)] ${
                    selectedChat === chat.id ? 'bg-[var(--primary-50)]' : ''
                  }`}
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-[var(--primary-100)] flex items-center justify-center">
                      <span className="text-sm font-medium text-[var(--primary-700)]">
                        {chat.contact_name.split(' ').map((n: string) => n[0]).join('')}
                      </span>
                    </div>
                    {chat.status === 'online' && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                    )}
                    {chat.automation_paused && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 border-2 border-white rounded-full flex items-center justify-center" title="Automation paused">
                        <Pause className="w-2.5 h-2.5 text-white" />
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-[var(--neutral-900)] truncate">{chat.contact_name}</p>
                      <span className="text-xs text-[var(--neutral-400)]">{chat.time}</span>
                    </div>
                    <p className="text-sm text-[var(--neutral-500)] truncate mt-1">{chat.last_message || chat.message}</p>
                  </div>
                  {(chat.unread_count || chat.unread || 0) > 0 && (
                    <span className="flex-shrink-0 w-5 h-5 bg-[var(--primary-600)] text-white text-xs font-medium rounded-full flex items-center justify-center">
                      {chat.unread_count || chat.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          {selectedChat ? (
            <div className="flex-1 flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-[var(--neutral-200)] flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="md:hidden p-2 hover:bg-[var(--neutral-100)] rounded-lg"
                >
                  <ArrowLeft className="w-5 h-5 text-[var(--neutral-500)]" />
                </button>
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-[var(--primary-100)] flex items-center justify-center">
                    <span className="text-sm font-medium text-[var(--primary-700)]">
                      {currentConversation?.contact_name?.split(' ').map((n: string) => n[0]).join('') || 'AJ'}
                    </span>
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[var(--neutral-900)]">{currentConversation?.contact_name || 'Alice Johnson'}</p>
                  <p className="text-xs text-[var(--neutral-500)]">Online</p>
                </div>
                {/* Automation Toggle */}
                <button
                  onClick={toggleAutomation}
                  className={`p-2 rounded-lg transition-colors ${
                    automationPaused 
                      ? 'bg-amber-100 hover:bg-amber-200' 
                      : 'hover:bg-[var(--neutral-100)]'
                  }`}
                  title={automationPaused ? 'Resume Automation' : 'Pause Automation'}
                >
                  {automationPaused ? (
                    <Play className="w-5 h-5 text-amber-600" />
                  ) : (
                    <Pause className="w-5 h-5 text-[var(--neutral-500)]" />
                  )}
                </button>
                {automationPaused && (
                  <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded">
                    Auto paused
                  </span>
                )}
                <button className="p-2 hover:bg-[var(--neutral-100)] rounded-lg">
                  <Phone className="w-5 h-5 text-[var(--neutral-500)]" />
                </button>
                <button className="p-2 hover:bg-[var(--neutral-100)] rounded-lg">
                  <Video className="w-5 h-5 text-[var(--neutral-500)]" />
                </button>
                <button className="p-2 hover:bg-[var(--neutral-100)] rounded-lg">
                  <MoreVertical className="w-5 h-5 text-[var(--neutral-500)]" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-2.5 rounded-2xl ${
                        msg.sender === 'me'
                          ? 'bg-[var(--primary-600)] text-white rounded-br-md'
                          : 'bg-[var(--neutral-100)] text-[var(--neutral-900)] rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <p className={`text-xs mt-1 ${msg.sender === 'me' ? 'text-white/70' : 'text-[var(--neutral-400)]'}`}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-[var(--neutral-200)]">
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-[var(--neutral-100)] rounded-lg">
                    <Paperclip className="w-5 h-5 text-[var(--neutral-500)]" />
                  </button>
                  <button className="p-2 hover:bg-[var(--neutral-100)] rounded-lg">
                    <Smile className="w-5 h-5 text-[var(--neutral-500)]" />
                  </button>
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 bg-[var(--neutral-100)] border-none rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary-100)] focus:bg-white transition-all"
                  />
                  <button 
                    onClick={handleSendMessage}
                    className="p-2.5 bg-[var(--primary-600)] hover:bg-[var(--primary-700)] text-white rounded-lg transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-[var(--neutral-100)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-[var(--neutral-400)]" />
                </div>
                <p className="text-[var(--neutral-500)]">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
