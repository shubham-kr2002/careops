import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  name?: string
  role?: string
  workspace_id?: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  tokenExpiry: number | null
  login: (user: User, token: string) => void
  logout: () => void
  setToken: (token: string) => void
  checkAuth: () => Promise<boolean>
  refreshToken: () => Promise<boolean>
}

export const useAuthStore = create<AuthState>()(persist(
  (set, get) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    tokenExpiry: null,
    
    login: (user, token) => {
      // Decode JWT to get expiry
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const expiry = payload.exp * 1000 // Convert to milliseconds
        
        // Store token in both localStorage AND cookie (for server-side proxy)
        localStorage.setItem('authToken', token)
        document.cookie = `authToken=${token}; path=/; max-age=${Math.floor((expiry - Date.now()) / 1000)}; SameSite=Lax`
        set({ 
          user, 
          token,
          tokenExpiry: expiry,
          isAuthenticated: true, 
          isLoading: false 
        })
      } catch (error) {
        console.error('Failed to parse token:', error)
        localStorage.setItem('authToken', token)
        document.cookie = `authToken=${token}; path=/; max-age=86400; SameSite=Lax`
        set({ user, token, isAuthenticated: true, isLoading: false })
      }
    },
    
    logout: () => {
      localStorage.removeItem('authToken')
      document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      set({ 
        user: null, 
        token: null,
        tokenExpiry: null,
        isAuthenticated: false, 
        isLoading: false 
      })
    },
    
    setToken: (token) => {
      localStorage.setItem('authToken', token)
      document.cookie = `authToken=${token}; path=/; max-age=86400; SameSite=Lax`
      set({ token })
    },
    
    checkAuth: async () => {
      set({ isLoading: true })
      try {
        const token = localStorage.getItem('authToken')
        if (!token) {
          set({ isAuthenticated: false, isLoading: false, user: null, token: null })
          return false
        }

        // Verify token with backend
        const response = await fetch(`${API_URL}/auth/verify`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          // Token invalid, clear auth state
          localStorage.removeItem('authToken')
          set({ isAuthenticated: false, isLoading: false, user: null, token: null })
          return false
        }

        const data = await response.json()
        set({ 
          user: data.user, 
          token,
          isAuthenticated: true, 
          isLoading: false 
        })
        return true
      } catch (error) {
        console.error('Auth check failed:', error)
        localStorage.removeItem('authToken')
        set({ isAuthenticated: false, isLoading: false, user: null, token: null })
        return false
      }
    },
    
    refreshToken: async () => {
      const { token, tokenExpiry } = get()
      
      // Check if token needs refresh (5 minutes before expiry)
      if (!token || !tokenExpiry) return false
      
      const now = Date.now()
      const fiveMinutes = 5 * 60 * 1000
      
      if (tokenExpiry - now > fiveMinutes) {
        return true // Token still valid
      }
      
      try {
        const response = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) {
          get().logout()
          return false
        }
        
        const data = await response.json()
        get().login(data.user, data.access_token)
        return true
      } catch (error) {
        console.error('Token refresh failed:', error)
        get().logout()
        return false
      }
    }
  }),
  {
    name: 'auth-storage',
    partialize: (state) => ({
      user: state.user,
      token: state.token,
      isAuthenticated: state.isAuthenticated,
      tokenExpiry: state.tokenExpiry
    })
  }
))
