import { http } from './http'

export interface User {
  id: string
  username: string
  email: string
  provider: 'local' | 'google'
  educationSystem?: string | null
  grade?: string | null
  subject?: string | null
  createdAt: Date
  updatedAt?: Date
}

export interface UpdateUserPreferencesRequest {
  educationSystem?: string | null
  grade?: string | null
  subject?: string | null
}

export interface UserResponse {
  user: User
}

export async function getCurrentUser(): Promise<UserResponse> {
  return http<UserResponse>('/users/me')
}

export async function updateUserPreferences(preferences: UpdateUserPreferencesRequest): Promise<UserResponse> {
  return http<UserResponse>('/users/preferences', {
    method: 'PUT',
    body: JSON.stringify(preferences)
  })
}