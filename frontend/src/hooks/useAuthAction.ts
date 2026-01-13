import { useActionState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import { useAuthContext } from '../context/AuthContext'
import type { AuthActionState, SignUpData, AuthError, UserRole } from '../types/auth.types'

// Initial state for auth actions
const initialState: AuthActionState = {
    success: false,
    error: null,
    user: null,
}

// Hook for sending OTP
export function useSendOtpAction() {
    const sendOtpAction = async (
        _prevState: { success: boolean; error: string | null },
        formData: FormData
    ): Promise<{ success: boolean; error: string | null }> => {
        const phone = formData.get('phone') as string

        if (!phone || phone.length < 10) {
            return { success: false, error: 'Please enter a valid phone number' }
        }

        try {
            await authService.sendOtp(phone)
            return { success: true, error: null }
        } catch (err: unknown) {
            let errorMessage = 'Failed to send OTP'

            if (err && typeof err === 'object' && 'response' in err) {
                const axiosError = err as { response?: { data?: { message?: string; error?: string } } }
                const data = axiosError.response?.data
                errorMessage = data?.message || data?.error || errorMessage
            } else if (err instanceof Error) {
                errorMessage = err.message
            }

            return { success: false, error: errorMessage }
        }
    }

    const [state, formAction, isPending] = useActionState(sendOtpAction, {
        success: false,
        error: null,
    })

    return { state, formAction, isPending }
}

// Hook for login form using React 19 useActionState (phone + OTP)
export function useLoginAction() {
    const navigate = useNavigate()
    const { setUser } = useAuthContext()

    const loginAction = async (
        _prevState: AuthActionState,
        formData: FormData
    ): Promise<AuthActionState> => {
        const phone = formData.get('phone') as string
        const otp = formData.get('otp') as string

        // Validate
        if (!phone || phone.length < 10) {
            return {
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Please enter a valid phone number' },
                user: null,
            }
        }

        if (!otp || otp.length < 4) {
            return {
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Please enter a valid OTP' },
                user: null,
            }
        }

        try {
            const { user } = await authService.login({ phone, otp })
            setUser(user)

            // Navigate after successful login to dashboard
            setTimeout(() => navigate('/dashboard'), 0)

            return { success: true, error: null, user }
        } catch (err: unknown) {
            // Extract error message from axios response or use default
            let errorMessage = 'Login failed. Please try again.'

            // Debug log
            console.log('Login error:', err)

            if (err && typeof err === 'object') {
                // Axios error with response
                if ('response' in err) {
                    const axiosError = err as { response?: { data?: { message?: string; error?: string } } }
                    const data = axiosError.response?.data
                    errorMessage = data?.message || data?.error || errorMessage
                    console.log('Error response data:', data)
                }
                // Error with message property
                else if ('message' in err) {
                    errorMessage = (err as Error).message
                }
            }

            const error: AuthError = {
                code: 'LOGIN_FAILED',
                message: errorMessage,
            }
            return { success: false, error, user: null }
        }
    }

    const [state, formAction, isPending] = useActionState(loginAction, initialState)

    return { state, formAction, isPending }
}

// Hook for signup form using React 19 useActionState
export function useSignUpAction() {
    const navigate = useNavigate()
    const { setUser } = useAuthContext()

    const signUpAction = async (
        _prevState: AuthActionState,
        formData: FormData
    ): Promise<AuthActionState> => {
        const data: SignUpData = {
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            phone: formData.get('phone') as string,
            password: formData.get('password') as string,
            role: formData.get('role') as UserRole,
        }

        // Validate required fields
        if (!data.name || !data.email || !data.password) {
            return {
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'All fields are required' },
                user: null,
            }
        }

        // Validate password match
        const confirmPassword = formData.get('confirmPassword') as string
        if (data.password !== confirmPassword) {
            return {
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Passwords do not match', field: 'confirmPassword' },
                user: null,
            }
        }

        try {
            const { user } = await authService.signUp(data)
            setUser(user)

            // Navigate after successful signup
            setTimeout(() => navigate('/'), 0)

            return { success: true, error: null, user }
        } catch (err) {
            const error: AuthError = {
                code: 'SIGNUP_FAILED',
                message: err instanceof Error ? err.message : 'Sign up failed. Please try again.',
            }
            return { success: false, error, user: null }
        }
    }

    const [state, formAction, isPending] = useActionState(signUpAction, initialState)

    return { state, formAction, isPending }
}
