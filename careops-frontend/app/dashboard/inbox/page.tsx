'use client'

import React, { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Search, Send, Paperclip, Smile, MoreVertical, Phone, Video, ArrowLeft } from 'lucide-react'

const conversations = [
  { id: 1, name: 'Alice Johnson', message: 'Can we reschedule our appointment?', time: '2 min ago', unread: 2, status: 'online' },
  { id: 2, name: 'Bob Williams', message: 'Thanks for the quick service!', time: '15 min ago', unread: 0, status: 'offline' },
  { id: 3, name: 'Carol Davis', message: 'Is the package ready for pickup?', time: '1 hour ago', unread: 1, status: 'online' },
  { id: 4, name: 'David Brown', message: 'I need to cancel my booking', time: '2 hours ago', unread: 0, status: 'offline' },
  { id: 5, name: 'Emma Wilson', message: 'What are your business hours?', time: '3 hours ago', unread: 0, status: 'online' },
]

const messages = [
  { id: 1, sender: 'them', text: 'Hi, I was wondering if we could reschedule our appointment to next week?', time: '2:30 PM' },
  { id: 2, sender: 'me', text: 'Of course! What day works best for you?', time: '2:32 PM' },
  { id: 3, sender: 'them', text: 'Would Tuesday at 3 PM work?', time: '2:35 PM' },
  { id: 4, sender: 'me', text: 'Tuesday at 3 PM works perfectly. I\'ve updated your booking.', time: '2:37 PM' },
]

export default function InboxPage() {
  const [selectedChat, setSelectedChat] = useState<number | null>(1)
  const [messageText, setMessageText] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)

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
              {conversations.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => {
                    setSelectedChat(chat.id)
                    setSidebarOpen(false)
                  }}
                  className={`w-full p-4 flex items-start gap-3 hover:bg-[var(--neutral-50)] transition-colors border-b border-[var(--neutral-100)] ${
                    selectedChat === chat.id ? 'bg-[var(--primary-50)]' : ''
                  }`}
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-[var(--primary-100)] flex items-center justify-center">
                      <span className="text-sm font-medium text-[var(--primary-700)]">
                        {chat.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    {chat.status === 'online' && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-[var(--neutral-900)] truncate">{chat.name}</p>
                      <span className="text-xs text-[var(--neutral-400)]">{chat.time}</span>
                    </div>
                    <p className="text-sm text-[var(--neutral-500)] truncate mt-1">{chat.message}</p>
                  </div>
                  {chat.unread > 0 && (
                    <span className="flex-shrink-0 w-5 h-5 bg-[var(--primary-600)] text-white text-xs font-medium rounded-full flex items-center justify-center">
                      {chat.unread}
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
                    <span className="text-sm font-medium text-[var(--primary-700)]">AJ</span>
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[var(--neutral-900)]">Alice Johnson</p>
                  <p className="text-xs text-[var(--neutral-500)]">Online</p>
                </div>
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
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 bg-[var(--neutral-100)] border-none rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary-100)] focus:bg-white transition-all"
                  />
                  <button className="p-2.5 bg-[var(--primary-600)] hover:bg-[var(--primary-700)] text-white rounded-lg transition-colors">
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
