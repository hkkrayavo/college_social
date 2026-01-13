import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLoginAction, useSendOtpAction } from '../../hooks/useAuthAction'
import { Button } from '../../components/common'

type LoginStep = 'phone' | 'otp'

export function Login() {
    const [step, setStep] = useState<LoginStep>('phone')
    const [phone, setPhone] = useState('')
    const [otpSent, setOtpSent] = useState(false)
    const { state: loginState, formAction: loginAction, isPending: isLoggingIn } = useLoginAction()
    const { state: otpState, formAction: sendOtpAction, isPending: isSendingOtp } = useSendOtpAction()

    // Handle OTP sent successfully
    const handleSendOtp = async (formData: FormData) => {
        const phoneValue = formData.get('phone') as string
        setPhone(phoneValue)
        setOtpSent(false) // Reset flag before sending
        await sendOtpAction(formData)
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
        setOtpSent(false) // Reset so we can send OTP again
    }

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
            <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md border border-gray-100">
                <h1 className="text-2xl font-bold text-navy text-center mb-6">Welcome Back</h1>

                {/* Step 1: Phone Number */}
                {step === 'phone' && (
                    <>
                        {otpState.error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                {otpState.error}
                            </div>
                        )}

                        <form action={handleSendOtp} className="space-y-5">
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
                                loading={isSendingOtp}
                                disabled={phone.length < 10}
                            >
                                Send OTP
                            </Button>
                        </form>
                    </>
                )}

                {/* Step 2: OTP Verification */}
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
                                                if (value && input.nextElementSibling) {
                                                    (input.nextElementSibling as HTMLInputElement).focus()
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

                {/* Sign Up Link */}
                <p className="text-center mt-6 text-gray-500 text-sm">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-gold font-medium hover:underline">
                        Sign Up
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default Login
