import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

// ============ Auth Token Helper ============
/** Centralized token retrieval - single source of truth */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('authToken')
}

/** Get standard auth headers for API requests */
function getAuthHeaders(contentType?: string): HeadersInit {
  const token = getAuthToken()
  const headers: HeadersInit = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (contentType) headers['Content-Type'] = contentType
  return headers
}

/** API error class for structured error handling */
export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** Wrapper around fetch that handles auth and errors consistently */
async function authFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken()
  const headers: HeadersInit = {
    ...(options?.headers || {}),
  }
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`

  const response = await fetch(url, { ...options, headers })
  
  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unknown error')
    throw new ApiError(errorBody || `HTTP ${response.status}`, response.status)
  }

  // Handle 204 No Content
  if (response.status === 204) return null as T
  
  return response.json()
}

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
    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown error')
      throw new ApiError(errorBody || `HTTP ${response.status}`, response.status)
    }
    return response.json()
  },

  register: async (data: RegisterData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown error')
      throw new ApiError(errorBody || `HTTP ${response.status}`, response.status)
    }
    return response.json()
  },

  // Workspace endpoints
  getWorkspace: async (workspaceId: string) => {
    return authFetch(`${API_BASE_URL}/workspaces/${workspaceId}`)
  },

  // Contacts endpoints
  getContacts: async (workspaceId: string) => {
    return authFetch(`${API_BASE_URL}/workspaces/${workspaceId}/contacts`)
  },

  createContact: async (workspaceId: string, data: ContactData) => {
    return authFetch(`${API_BASE_URL}/workspaces/${workspaceId}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
  }
}

// ============ Forms API ============
export interface FormTemplate {
  id: string
  workspace_id: string
  name: string
  type: string
  description: string
  required: boolean
  file_url?: string
  fields?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface BookingForm {
  id: string
  booking_id: string
  form_id: string
  form: FormTemplate
  status: 'pending' | 'completed'
  completed_at?: string
}

export const getForms = async (): Promise<FormTemplate[]> => {
  return authFetch<FormTemplate[]>(`${API_BASE_URL}/forms/`)
}

export const getBookingForms = async (): Promise<BookingForm[]> => {
  return authFetch<BookingForm[]>(`${API_BASE_URL}/forms/`)
}

export const useForms = () => {
  return useQuery({
    queryKey: ['forms'],
    queryFn: getForms,
  })
}

export const useBookingForms = () => {
  return useQuery({
    queryKey: ['bookingForms'],
    queryFn: getBookingForms,
  })
}

// ============ Bookings API ============
export interface Booking {
  id: string
  workspace_id: string
  contact_id: string | null
  booking_type_id: string | null
  contact_name?: string
  service?: string
  scheduled_at: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  amount?: number
  notes?: string | null
  created_at: string
  updated_at: string
}

export const getBookings = async (): Promise<Booking[]> => {
  return authFetch<Booking[]>(`${API_BASE_URL}/bookings/`)
}

export const useBookings = () => {
  return useQuery({
    queryKey: ['bookings'],
    queryFn: getBookings,
  })
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
  return authFetch<InventoryItem[]>(`${API_BASE_URL}/inventory/items`)
}

export const getInventoryItem = async (itemId: string): Promise<InventoryItem> => {
  return authFetch<InventoryItem>(`${API_BASE_URL}/inventory/items/${itemId}`)
}

export const createInventoryItem = async (data: Partial<InventoryItem>) => {
  return authFetch(`${API_BASE_URL}/inventory/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
}

export const updateInventoryItem = async (itemId: string, data: Partial<InventoryItem>) => {
  return authFetch(`${API_BASE_URL}/inventory/items/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
}

export const deleteInventoryItem = async (itemId: string) => {
  return authFetch(`${API_BASE_URL}/inventory/items/${itemId}`, {
    method: 'DELETE'
  })
}

export const createInventoryTransaction = async (data: {
  item_id: string
  transaction_type: string
  quantity: number
  job_id?: string
  booking_id?: string
  notes?: string
}) => {
  return authFetch(`${API_BASE_URL}/inventory/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
}

export const getLowStockItems = async (): Promise<InventoryItem[]> => {
  return authFetch<InventoryItem[]>(`${API_BASE_URL}/inventory/items/low-stock`)
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
  return authFetch(`${API_BASE_URL}/conversations`)
}

export const getConversationMessages = async (conversationId: string) => {
  return authFetch(`${API_BASE_URL}/conversations/${conversationId}/messages`)
}

export const sendMessage = async (conversationId: string, content: string) => {
  return authFetch(`${API_BASE_URL}/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  })
}

// Pause automation when staff replies
export const pauseAutomation = async (conversationId: string) => {
  return authFetch(`${API_BASE_URL}/conversations/${conversationId}/pause-automation`, {
    method: 'POST'
  })
}

export const resumeAutomation = async (conversationId: string) => {
  return authFetch(`${API_BASE_URL}/conversations/${conversationId}/resume-automation`, {
    method: 'POST'
  })
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
  return authFetch<AIHealthResponse>(`${API_BASE_URL}/ai/health`)
}

export const processInquiry = async (conversationId: string, message: string): Promise<ProcessInquiryResponse> => {
  return authFetch<ProcessInquiryResponse>(`${API_BASE_URL}/ai/process-inquiry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversation_id: conversationId, message })
  })
}

export const getDemandForecast = async (daysToForecast: number = 7): Promise<DemandForecastResponse> => {
  return authFetch<DemandForecastResponse>(`${API_BASE_URL}/ai/demand-forecast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ days_to_forecast: daysToForecast })
  })
}

export const routeToStaff = async (
  inquiryIntent: string,
  inquirySubject: string,
  requiredSkills: string[] = []
): Promise<StaffRoutingResponse> => {
  return authFetch<StaffRoutingResponse>(`${API_BASE_URL}/ai/route-staff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      inquiry_intent: inquiryIntent,
      inquiry_subject: inquirySubject,
      required_skills: requiredSkills
    })
  })
}

export const getInventoryOptimization = async (): Promise<InventoryOptimizationResponse> => {
  return authFetch<InventoryOptimizationResponse>(`${API_BASE_URL}/ai/inventory-optimization`)
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

// ============ Analytics Endpoints (Phase 10) ============

export interface KPIOverview {
  total_bookings: number
  total_contacts: number
  total_revenue: number
  total_forms: number
  active_conversations: number
  low_stock_items: number
  booking_growth: number
  contact_growth: number
  revenue_growth: number
}

export interface TrendDataPoint {
  date: string
  bookings: number
  contacts: number
  revenue: number
}

export interface TrendsResponse {
  period: string
  data: TrendDataPoint[]
}

export interface AIInsight {
  title: string
  description: string
  impact: string
  category: string
  action: string
  method: string
  fallback_used: boolean
}

export interface AIInsightsResponse {
  insights: AIInsight[]
  generated_at: string
}

export const getAnalyticsOverview = async (period: string = '30d'): Promise<KPIOverview> => {
  return authFetch<KPIOverview>(`${API_BASE_URL}/analytics/overview?period=${period}`)
}

export const getAnalyticsTrends = async (period: string = '30d'): Promise<TrendsResponse> => {
  return authFetch<TrendsResponse>(`${API_BASE_URL}/analytics/trends?period=${period}`)
}

export const getAIInsights = async (): Promise<AIInsightsResponse> => {
  return authFetch<AIInsightsResponse>(`${API_BASE_URL}/analytics/ai-insights`)
}

export const useAnalyticsOverview = (period: string = '30d') => {
  return useQuery({
    queryKey: ['analytics', 'overview', period],
    queryFn: () => getAnalyticsOverview(period)
  })
}

export const useAnalyticsTrends = (period: string = '30d') => {
  return useQuery({
    queryKey: ['analytics', 'trends', period],
    queryFn: () => getAnalyticsTrends(period)
  })
}

export const useAIInsights = () => {
  return useQuery({
    queryKey: ['analytics', 'ai-insights'],
    queryFn: getAIInsights
  })
}

// ============ Reports Endpoints (Phase 10) ============

export interface ReportMetric {
  label: string
  current: number
  previous: number
  change_pct: number
}

export interface ReportData {
  period_label: string
  start_date: string
  end_date: string
  metrics: ReportMetric[]
}

export interface AIReportSummary {
  summary: string
  highlights: string[]
  recommendations: string[]
  overall_trend: string
  method: string
  fallback_used: boolean
}

export const getWeeklyReport = async (): Promise<ReportData> => {
  return authFetch<ReportData>(`${API_BASE_URL}/reports/weekly`)
}

export const getMonthlyReport = async (): Promise<ReportData> => {
  return authFetch<ReportData>(`${API_BASE_URL}/reports/monthly`)
}

export const getAIReportSummary = async (period: string = 'monthly'): Promise<AIReportSummary> => {
  return authFetch<AIReportSummary>(`${API_BASE_URL}/reports/ai-summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ period })
  })
}

export const exportReport = async (period: string = 'monthly'): Promise<Blob> => {
  const token = getAuthToken()
  const response = await fetch(`${API_BASE_URL}/reports/export?period=${period}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!response.ok) {
    throw new ApiError(`HTTP ${response.status}`, response.status)
  }
  return response.blob()
}

export const useWeeklyReport = () => {
  return useQuery({
    queryKey: ['reports', 'weekly'],
    queryFn: getWeeklyReport
  })
}

export const useMonthlyReport = () => {
  return useQuery({
    queryKey: ['reports', 'monthly'],
    queryFn: getMonthlyReport
  })
}

export const useAIReportSummary = (period: string = 'monthly') => {
  return useQuery({
    queryKey: ['reports', 'ai-summary', period],
    queryFn: () => getAIReportSummary(period)
  })
}

// ============ Equipment / Maintenance Endpoints (Phase 10) ============

export interface EquipmentItem {
  id: string
  workspace_id: string
  name: string
  type: string | null
  serial_number: string | null
  purchase_date: string | null
  last_maintained_at: string | null
  maintenance_interval_days: number
  status: 'active' | 'needs_maintenance' | 'out_of_service'
  usage_count: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface MaintenanceLog {
  id: string
  equipment_id: string
  performed_at: string
  performed_by: string | null
  maintenance_type: 'routine' | 'repair' | 'inspection'
  cost: number | null
  notes: string | null
  next_due_at: string | null
  created_at: string
}

export interface MaintenancePrediction {
  equipment_id: string
  equipment_name: string
  risk_level: string
  days_until_due: number
  confidence: number
  recommendation: string
  estimated_cost: number | null
  method: string
  fallback_used: boolean
}

export const getEquipmentItems = async (): Promise<EquipmentItem[]> => {
  return authFetch<EquipmentItem[]>(`${API_BASE_URL}/equipment/`)
}

export const getEquipmentItem = async (id: string): Promise<EquipmentItem> => {
  return authFetch<EquipmentItem>(`${API_BASE_URL}/equipment/${id}`)
}

export const createEquipment = async (data: Partial<EquipmentItem>) => {
  return authFetch(`${API_BASE_URL}/equipment/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
}

export const updateEquipment = async (id: string, data: Partial<EquipmentItem>) => {
  return authFetch(`${API_BASE_URL}/equipment/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
}

export const deleteEquipment = async (id: string) => {
  return authFetch(`${API_BASE_URL}/equipment/${id}`, {
    method: 'DELETE'
  })
}

export const getMaintenanceLogs = async (equipmentId: string): Promise<MaintenanceLog[]> => {
  return authFetch<MaintenanceLog[]>(`${API_BASE_URL}/equipment/${equipmentId}/maintenance`)
}

export const logMaintenance = async (equipmentId: string, data: {
  maintenance_type: string
  performed_by?: string
  cost?: number
  notes?: string
}) => {
  return authFetch(`${API_BASE_URL}/equipment/${equipmentId}/maintenance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
}

export const getMaintenancePredictions = async (): Promise<{ total: number; predictions: MaintenancePrediction[] }> => {
  return authFetch<{ total: number; predictions: MaintenancePrediction[] }>(`${API_BASE_URL}/equipment/predictions/all`)
}

export const getMaintenanceDue = async (): Promise<EquipmentItem[]> => {
  return authFetch<EquipmentItem[]>(`${API_BASE_URL}/equipment/maintenance-due`)
}

// React Query hooks for Equipment
export const useEquipmentItems = () => {
  return useQuery({
    queryKey: ['equipment', 'items'],
    queryFn: getEquipmentItems
  })
}

export const useEquipmentItem = (id: string) => {
  return useQuery({
    queryKey: ['equipment', 'items', id],
    queryFn: () => getEquipmentItem(id),
    enabled: !!id
  })
}

export const useCreateEquipment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<EquipmentItem>) => createEquipment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
    }
  })
}

export const useUpdateEquipment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EquipmentItem> }) =>
      updateEquipment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
    }
  })
}

export const useDeleteEquipment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteEquipment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
    }
  })
}

export const useMaintenanceLogs = (equipmentId: string) => {
  return useQuery({
    queryKey: ['equipment', equipmentId, 'maintenance'],
    queryFn: () => getMaintenanceLogs(equipmentId),
    enabled: !!equipmentId
  })
}

export const useLogMaintenance = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ equipmentId, data }: { equipmentId: string; data: { maintenance_type: string; performed_by?: string; cost?: number; notes?: string } }) =>
      logMaintenance(equipmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
    }
  })
}

export const useMaintenancePredictions = () => {
  return useQuery({
    queryKey: ['equipment', 'predictions'],
    queryFn: getMaintenancePredictions
  })
}

export const useMaintenanceDue = () => {
  return useQuery({
    queryKey: ['equipment', 'maintenance-due'],
    queryFn: getMaintenanceDue
  })
}

// ============ Public Chatbot API (Phase 10) ============

const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL
  ? new URL('..', new URL(process.env.NEXT_PUBLIC_API_URL + '/')).href.replace(/\/$/, '')
  : 'http://localhost:8000/api'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface ChatResponse {
  response: string
  intent: string
  sentiment: string
  conversation_id: string
  contact_id: string
}

export const sendChatMessage = async (
  workspaceSlug: string,
  message: string,
  visitorName?: string,
  visitorEmail?: string,
): Promise<ChatResponse> => {
  const response = await fetch(`${PUBLIC_API_URL}/public/workspaces/${workspaceSlug}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      visitor_name: visitorName,
      visitor_email: visitorEmail,
    })
  })
  if (!response.ok) {
    throw new ApiError(`Chat request failed: HTTP ${response.status}`, response.status)
  }
  return response.json()
}

// ============ AI Translation & Segmentation (Phase 10) ============

export const translateText = async (text: string, targetLanguage: string, sourceLanguage: string = 'auto') => {
  return authFetch(`${API_BASE_URL}/ai/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, target_language: targetLanguage, source_language: sourceLanguage })
  })
}

export const detectLanguage = async (text: string) => {
  return authFetch(`${API_BASE_URL}/ai/detect-language`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  })
}

export const segmentContacts = async (contactIds?: string[]) => {
  return authFetch(`${API_BASE_URL}/ai/segment-contacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contact_ids: contactIds || null })
  })
}

export const useTranslateText = () => {
  return useMutation({
    mutationFn: ({ text, targetLanguage, sourceLanguage }: { text: string; targetLanguage: string; sourceLanguage?: string }) =>
      translateText(text, targetLanguage, sourceLanguage || 'auto')
  })
}

export const useSegmentContacts = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (contactIds?: string[]) => segmentContacts(contactIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    }
  })
}
