// User roles in the system (simplified)
export type UserRole = 'admin' | 'user'

// Permissions that can be assigned based on roles
export type Permission =
    | 'read:posts'
    | 'create:posts'
    | 'delete:posts'
    | 'manage:groups'
    | 'manage:users'
    | 'manage:announcements'
    | 'admin:all'

// Role to permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    user: ['read:posts', 'create:posts'],
    admin: ['read:posts', 'create:posts', 'delete:posts', 'manage:groups', 'manage:users', 'manage:announcements', 'admin:all'],
}

// User type with role information
export interface User {
    id: string
    name: string
    email: string | null
    phone?: string
    mobileNumber?: string
    profilePictureUrl?: string | null
    status?: 'pending' | 'approved' | 'rejected'
    role: UserRole
    avatar?: string
    firstLoginComplete?: boolean
    createdAt?: string
}

// Auth tokens structure
export interface AuthTokens {
    accessToken: string
    refreshToken: string
    expiresAt: number // Unix timestamp
}

// Complete auth state
export interface AuthState {
    user: User | null
    tokens: AuthTokens | null
    isAuthenticated: boolean
    isLoading: boolean
    error: AuthError | null
}

// Login credentials (phone + OTP based)
export interface LoginCredentials {
    phone: string
    otp: string
}

// Sign up data
export interface SignUpData {
    name: string
    email: string
    phone: string
    password?: string // Optional - using OTP auth
    role: UserRole
}

// Auth error type
export interface AuthError {
    code: string
    message: string
    field?: string
}

// API response types
export interface AuthResponse {
    user: User
    accessToken: string
    refreshToken: string
    expiresIn: number // seconds until expiry
}

export interface RefreshResponse {
    accessToken: string
    refreshToken: string
    expiresIn: number
}

// Form action state for React 19 useActionState
export interface AuthActionState {
    success: boolean
    error: AuthError | null
    user: User | null
}

// Initial state for auth actions
export const initialAuthActionState: AuthActionState = {
    success: false,
    error: null,
    user: null,
}
