import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

interface RegisterData {
  name: string
  email: string
  password: string
}

interface ContactData {
  name: string
  email: string
  phone?: string
  address?: string
}

export const api = {
  // Auth endpoints
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    return response.json()
  },

  register: async (data: RegisterData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return response.json()
  },

  // Workspace endpoints
  getWorkspace: async (workspaceId: string) => {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.json()
  },

  // Contacts endpoints
  getContacts: async (workspaceId: string) => {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/contacts`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.json()
  },

  createContact: async (workspaceId: string, data: ContactData) => {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/contacts`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    })
    return response.json()
  }
}

// React Query hooks
export const useLogin = () => {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => 
      api.login(email, password)
  })
}

export const useRegister = () => {
  return useMutation({
    mutationFn: (data: RegisterData) => api.register(data)
  })
}

export const useWorkspace = (workspaceId: string) => {
  return useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => api.getWorkspace(workspaceId),
    enabled: !!workspaceId
  })
}

export const useContacts = (workspaceId: string) => {
  return useQuery({
    queryKey: ['contacts', workspaceId],
    queryFn: () => api.getContacts(workspaceId),
    enabled: !!workspaceId
  })
}

export const useCreateContact = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ workspaceId, data }: { workspaceId: string; data: ContactData }) => 
      api.createContact(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    }
  })
}

// Inventory endpoints
export const getLowStockItems = async () => {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_BASE_URL}/inventory/items/low-stock`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.json()
}

export const useLowStockItems = () => {
  return useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: getLowStockItems
  })
}

// Conversation/Message endpoints
export const getConversations = async () => {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_BASE_URL}/conversations`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.json()
}

export const getConversationMessages = async (conversationId: string) => {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.json()
}

export const sendMessage = async (conversationId: string, content: string) => {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ content })
  })
  return response.json()
}

// Pause automation when staff replies
export const pauseAutomation = async (conversationId: string) => {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/pause-automation`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.json()
}

export const resumeAutomation = async (conversationId: string) => {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/resume-automation`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.json()
}

export const useConversations = () => {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations
  })
}

export const useConversationMessages = (conversationId: string) => {
  return useQuery({
    queryKey: ['conversations', conversationId, 'messages'],
    queryFn: () => getConversationMessages(conversationId),
    enabled: !!conversationId
  })
}

export const useSendMessage = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ conversationId, content }: { conversationId: string; content: string }) => 
      sendMessage(conversationId, content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversations', variables.conversationId, 'messages'] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    }
  })
}
