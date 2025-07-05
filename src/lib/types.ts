// Database Types for user_table

export type UserRole = 'Admin' | 'LSP' | 'Management' | 'Operations' | 'Customer'

export interface UserProfile {
    id: string
    user_id: string
    email: string
    role: UserRole
    created_at: string
    updated_at: string
}

// For creating new user profiles
export interface CreateUserProfile {
    user_id: string
    email: string
    role?: UserRole  // Optional, defaults to 'Customer'
}

// For updating user profiles
export interface UpdateUserProfile {
    email?: string
    role?: UserRole
} 