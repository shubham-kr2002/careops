import { create } from 'zustand'

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
  isAuthenticated: boolean
  isLoading: boolean
  login: (user: User) => void
  logout: () => void
  checkAuth: () => Promise<boolean>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: (user) => {
    set({ user, isAuthenticated: true, isLoading: false })
  },
  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, isAuthenticated: false, isLoading: false })
  },
  checkAuth: async () => {
    set({ isLoading: true })
    try {
      const token = localStorage.getItem('token')
      if (token) {
        // TODO: Verify token with backend and get user info
        // For now, just set authenticated based on token existence
        set({ isAuthenticated: true, isLoading: false })
        return true
      }
      set({ isAuthenticated: false, isLoading: false })
      return false
    } catch (error) {
      set({ isAuthenticated: false, isLoading: false })
      return false
    }
  }
}))
