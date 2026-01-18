import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLoginAction, useSendOtpAction } from '../../hooks/useAuthAction'
import { authService } from '../../services/authService'
import { Button } from '../../components/common'

type LoginStep = 'phone' | 'pending' | 'rejected' | 'not-found' | 'otp'

export function Login() {
    const [step, setStep] = useState<LoginStep>('phone')
    const [phone, setPhone] = useState('')
    const [otpSent, setOtpSent] = useState(false)
    const [isChecking, setIsChecking] = useState(false)
    const [statusMessage, setStatusMessage] = useState('')
    const { state: loginState, formAction: loginAction, isPending: isLoggingIn } = useLoginAction()
    const { state: otpState, formAction: sendOtpAction, isPending: isSendingOtp } = useSendOtpAction()

    // Check account status before sending OTP
    const handleCheckAndSendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const phoneValue = formData.get('phone') as string
        setPhone(phoneValue)
        setIsChecking(true)

        try {
            // First check account status
            const statusResult = await authService.checkAccountStatus(phoneValue)

            if (!statusResult.exists) {
                // Account doesn't exist
                setStatusMessage('Account not found. Please sign up first.')
                setStep('not-found')
                return
            }

            if (statusResult.status === 'pending') {
                // Account pending approval - show only pending message
                setStatusMessage('Your account is pending approval.')
                setStep('pending')
                return
            }

            if (statusResult.status === 'rejected') {
                // Account rejected
                setStatusMessage('Your account has been rejected. Please contact admin for more information.')
                setStep('rejected')
                return
            }

            // Account is approved - send OTP
            setOtpSent(false)
            await sendOtpAction(formData)
        } catch (err) {
            // Handle error - show on phone step
            setStatusMessage(err instanceof Error ? err.message : 'Failed to check account status')
        } finally {
            setIsChecking(false)
        }
    }

    // Move to OTP step when OTP is sent successfully  
    useEffect(() => {
        if (otpState.success && !otpSent) {
            setOtpSent(true)
            setStep('otp')
        }
    }, [otpState.success, otpSent])

    // Handle changing number - go back to phone step
    const handleChangeNumber = () => {
        setStep('phone')
        setOtpSent(false)
        setStatusMessage('')
    }

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
            <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md border border-gray-100">
                <h1 className="text-2xl font-bold text-navy text-center mb-6">Login</h1>

                {/* Step 1: Phone Number */}
                {step === 'phone' && (
                    <>
                        {(otpState.error || statusMessage) && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                {otpState.error || statusMessage}
                            </div>
                        )}

                        <form onSubmit={handleCheckAndSendOtp} className="space-y-5">
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number
                                </label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                        +91
                                    </span>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        required
                                        maxLength={10}
                                        placeholder="Enter your phone number"
                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        value={phone}
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                size="lg"
                                fullWidth
                                loading={isChecking || isSendingOtp}
                                disabled={phone.length < 10}
                            >
                                {isChecking ? 'Checking...' : 'Send OTP'}
                            </Button>
                        </form>
                    </>
                )}

                {/* Account Pending Approval - Show ONLY the pending message */}
                {step === 'pending' && (
                    <div className="text-center space-y-6 py-4">
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Account Pending</h2>
                            <p className="text-gray-500 mt-2">{statusMessage}</p>
                        </div>
                        <Button variant="primary" onClick={handleChangeNumber}>
                            Try Different Number
                        </Button>
                    </div>
                )}

                {/* Account Rejected */}
                {step === 'rejected' && (
                    <div className="text-center space-y-6 py-4">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Account Rejected</h2>
                            <p className="text-gray-500 mt-2">{statusMessage}</p>
                        </div>
                        <Button variant="primary" onClick={handleChangeNumber}>
                            Try Different Number
                        </Button>
                    </div>
                )}

                {/* Account Not Found */}
                {step === 'not-found' && (
                    <div className="text-center space-y-6 py-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Account Not Found</h2>
                            <p className="text-gray-500 mt-2">{statusMessage}</p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={handleChangeNumber} className="flex-1">
                                Try Again
                            </Button>
                            <Link to="/signup" className="flex-1">
                                <Button fullWidth>Sign Up</Button>
                            </Link>
                        </div>
                    </div>
                )}

                {/* Step 2: OTP Verification (only shown for approved accounts) */}
                {step === 'otp' && (
                    <>
                        <div className="text-center mb-6">
                            <p className="text-gray-500 text-sm">
                                Enter the 4-digit code sent to <span className="font-medium">+91 {phone}</span>
                            </p>
                            <Button
                                variant="ghost"
                                onClick={handleChangeNumber}
                                className="text-gold hover:text-gold-dark hover:bg-transparent p-0 h-auto font-normal mt-1"
                            >
                                Change number
                            </Button>
                        </div>

                        {loginState.error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                {loginState.error.message}
                            </div>
                        )}

                        <form action={loginAction} className="space-y-5">
                            <input type="hidden" name="phone" value={phone} />

                            <div>
                                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                                    Verification Code
                                </label>
                                <div className="flex justify-center gap-3">
                                    {[0, 1, 2, 3].map((index) => (
                                        <input
                                            key={index}
                                            type="text"
                                            maxLength={1}
                                            data-index={index}
                                            className="w-14 h-14 text-center text-xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                                            onInput={(e) => {
                                                const input = e.target as HTMLInputElement
                                                const value = input.value.replace(/\D/g, '')
                                                input.value = value

                                                // Move to next input if value entered
                                                if (value && input.nextElementSibling) {
                                                    (input.nextElementSibling as HTMLInputElement).focus()
                                                }

                                                // Auto-submit when all 4 digits are entered
                                                const form = input.closest('form')
                                                const inputs = form?.querySelectorAll('input[data-index]') as NodeListOf<HTMLInputElement>
                                                const otp = Array.from(inputs).map(i => i.value).join('')

                                                if (otp.length === 4) {
                                                    // Set hidden OTP field
                                                    const otpInput = form?.querySelector('input[name="otp"]') as HTMLInputElement
                                                    if (otpInput) otpInput.value = otp

                                                    // Auto-submit after a brief delay for UX
                                                    setTimeout(() => {
                                                        form?.requestSubmit()
                                                    }, 150)
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                const input = e.target as HTMLInputElement
                                                if (e.key === 'Backspace' && !input.value && input.previousElementSibling) {
                                                    (input.previousElementSibling as HTMLInputElement).focus()
                                                }
                                            }}
                                        />
                                    ))}
                                </div>
                                {/* Hidden input to collect all OTP digits */}
                                <input
                                    type="hidden"
                                    name="otp"
                                    id="otp"
                                />
                            </div>

                            <p className="text-center text-gray-500 text-sm">
                                Didn't receive the code?{' '}
                                <Button
                                    variant="ghost"
                                    onClick={handleChangeNumber}
                                    className="text-gold hover:text-gold-dark hover:bg-transparent p-0 h-auto font-medium"
                                >
                                    Resend
                                </Button>
                            </p>

                            <Button
                                type="submit"
                                size="lg"
                                fullWidth
                                loading={isLoggingIn}
                                onClick={(e) => {
                                    // Collect OTP digits before submit
                                    const form = (e.target as HTMLButtonElement).closest('form')
                                    const inputs = form?.querySelectorAll('input[data-index]') as NodeListOf<HTMLInputElement>
                                    const otp = Array.from(inputs).map(i => i.value).join('')
                                    const otpInput = form?.querySelector('input[name="otp"]') as HTMLInputElement
                                    if (otpInput) otpInput.value = otp
                                }}
                            >
                                Verify & Login
                            </Button>
                        </form>
                    </>
                )}

                {/* Sign Up Link - show only on phone step */}
                {step === 'phone' && (
                    <p className="text-center mt-6 text-gray-500 text-sm">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-gold font-medium hover:underline">
                            Sign Up
                        </Link>
                    </p>
                )}
            </div>
        </div>
    )
}

export default Login
