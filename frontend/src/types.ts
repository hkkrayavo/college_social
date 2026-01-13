export type UserRole = 'admin' | 'user' | null

export interface SignUpFormData {
    phone: string
    otp: string
    role: UserRole
    name: string
    email: string
    password: string
    confirmPassword: string
    agreedToTerms: boolean
}

export interface SignUpFormErrors {
    phone?: string
    otp?: string
    role?: string
    name?: string
    email?: string
    password?: string
    confirmPassword?: string
    agreedToTerms?: string
}
