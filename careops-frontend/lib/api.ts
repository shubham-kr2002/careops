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

// Inventory Types
export interface InventoryItem {
  id: string
  workspace_id: string
  name: string
  description: string | null
  sku: string | null
  category: string | null
  total_quantity: number
  reserved_quantity: number
  min_threshold: number | null
  unit_cost: number | null
  unit_price: number | null
  unit: string | null
  available_quantity: number
  is_low_stock: boolean
  created_at: string
  updated_at: string
}

export interface InventoryTransaction {
  id: string
  workspace_id: string
  item_id: string
  transaction_type: 'purchase' | 'use' | 'adjustment' | 'reservation' | 'release' | 'return'
  quantity: number
  job_id: string | null
  booking_id: string | null
  reference_id: string | null
  notes: string | null
  created_at: string
  created_by_id: string | null
}

// Inventory API functions
export const getInventoryItems = async (): Promise<InventoryItem[]> => {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_BASE_URL}/inventory/items`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.json()
}

export const getInventoryItem = async (itemId: string): Promise<InventoryItem> => {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_BASE_URL}/inventory/items/${itemId}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.json()
}

export const createInventoryItem = async (data: Partial<InventoryItem>) => {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_BASE_URL}/inventory/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })
  return response.json()
}

export const updateInventoryItem = async (itemId: string, data: Partial<InventoryItem>) => {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_BASE_URL}/inventory/items/${itemId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })
  return response.json()
}

export const deleteInventoryItem = async (itemId: string) => {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_BASE_URL}/inventory/items/${itemId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.json()
}

export const createInventoryTransaction = async (data: {
  item_id: string
  transaction_type: string
  quantity: number
  job_id?: string
  booking_id?: string
  notes?: string
}) => {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_BASE_URL}/inventory/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })
  return response.json()
}

export const getLowStockItems = async (): Promise<InventoryItem[]> => {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_BASE_URL}/inventory/items/low-stock`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.json()
}

// React Query hooks for Inventory
export const useInventoryItems = () => {
  return useQuery({
    queryKey: ['inventory', 'items'],
    queryFn: getInventoryItems
  })
}

export const useInventoryItem = (itemId: string) => {
  return useQuery({
    queryKey: ['inventory', 'items', itemId],
    queryFn: () => getInventoryItem(itemId),
    enabled: !!itemId
  })
}

export const useCreateInventoryItem = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Partial<InventoryItem>) => createInventoryItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    }
  })
}

export const useUpdateInventoryItem = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: Partial<InventoryItem> }) =>
      updateInventoryItem(itemId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['inventory', 'items', variables.itemId] })
    }
  })
}

export const useDeleteInventoryItem = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (itemId: string) => deleteInventoryItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    }
  })
}

export const useCreateInventoryTransaction = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: {
      item_id: string
      transaction_type: string
      quantity: number
      job_id?: string
      booking_id?: string
      notes?: string
    }) => createInventoryTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    }
  })
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

// ============ AI Endpoints ============

export interface AIHealthResponse {
  available: boolean
  model: string | null
  confidence_threshold: number
}

export interface ProcessInquiryResponse {
  intent: string
  sentiment: string
  confidence: number
  suggested_response: string | null
  method: string
  fallback_used: boolean
  explanation: string | null
}

export interface DemandForecastItem {
  date: string
  predicted_count: number
  confidence: number
}

export interface DemandForecastResponse {
  forecast: DemandForecastItem[]
  method: string
  confidence: number
  fallback_used: boolean
}

export interface StaffRoutingResponse {
  recommended_staff_id: string | null
  reasoning: string
  confidence: number
  fallback_used: boolean
  method: string
}

export interface InventoryRecommendation {
  item_id: string
  item_name: string
  current_quantity: number
  threshold: number
  recommendation: string
  suggested_quantity: number
  urgency: string
}

export interface InventoryOptimizationResponse {
  recommendations: InventoryRecommendation[]
  method: string
  total_items: number
  items_needing_attention: number
}

export const getAIHealth = async (): Promise<AIHealthResponse> => {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_BASE_URL}/ai/health`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.json()
}

export const processInquiry = async (conversationId: string, message: string): Promise<ProcessInquiryResponse> => {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_BASE_URL}/ai/process-inquiry`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ conversation_id: conversationId, message })
  })
  return response.json()
}

export const getDemandForecast = async (daysToForecast: number = 7): Promise<DemandForecastResponse> => {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_BASE_URL}/ai/demand-forecast`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ days_to_forecast: daysToForecast })
  })
  return response.json()
}

export const routeToStaff = async (
  inquiryIntent: string,
  inquirySubject: string,
  requiredSkills: string[] = []
): Promise<StaffRoutingResponse> => {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_BASE_URL}/ai/route-staff`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      inquiry_intent: inquiryIntent,
      inquiry_subject: inquirySubject,
      required_skills: requiredSkills
    })
  })
  return response.json()
}

export const getInventoryOptimization = async (): Promise<InventoryOptimizationResponse> => {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_BASE_URL}/ai/inventory-optimization`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.json()
}

// React Query hooks for AI
export const useAIHealth = () => {
  return useQuery({
    queryKey: ['ai', 'health'],
    queryFn: getAIHealth
  })
}

export const useProcessInquiry = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ conversationId, message }: { conversationId: string; message: string }) =>
      processInquiry(conversationId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai'] })
    }
  })
}

export const useDemandForecast = (daysToForecast: number = 7) => {
  return useQuery({
    queryKey: ['ai', 'demand-forecast', daysToForecast],
    queryFn: () => getDemandForecast(daysToForecast)
  })
}

export const useRouteToStaff = () => {
  return useMutation({
    mutationFn: ({
      inquiryIntent,
      inquirySubject,
      requiredSkills
    }: {
      inquiryIntent: string
      inquirySubject: string
      requiredSkills?: string[]
    }) => routeToStaff(inquiryIntent, inquirySubject, requiredSkills || [])
  })
}

export const useInventoryOptimization = () => {
  return useQuery({
    queryKey: ['ai', 'inventory-optimization'],
    queryFn: getInventoryOptimization
  })
}
