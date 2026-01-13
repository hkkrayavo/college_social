import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import type { UserRole, SignUpFormData, SignUpFormErrors } from '../../types'
import { authService } from '../../services/authService'
import { Button } from '../../components/common'

const SignUp = () => {
    const navigate = useNavigate()
    const [currentStep, setCurrentStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [apiError, setApiError] = useState<string | null>(null)
    const [countdown, setCountdown] = useState(5)
    const [formData, setFormData] = useState<SignUpFormData>({
        phone: '',
        otp: '',
        role: null,
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        agreedToTerms: false
    })
    const [errors, setErrors] = useState<SignUpFormErrors>({})

    const totalSteps = 4 // 3 form steps + success

    // Countdown for redirect on success step
    useEffect(() => {
        if (currentStep === 4 && countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
            return () => clearTimeout(timer)
        } else if (currentStep === 4 && countdown === 0) {
            navigate('/login')
        }
    }, [currentStep, countdown, navigate])

    const updateFormData = (field: keyof SignUpFormData, value: string | boolean | UserRole) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        setErrors(prev => ({ ...prev, [field]: undefined }))
        setApiError(null)
    }

    const nextStep = async () => {
        if (validateCurrentStep()) {
            // Step 1: Send OTP to backend
            if (currentStep === 1) {
                setIsLoading(true)
                try {
                    await authService.sendOtp(formData.phone)
                    setCurrentStep(prev => Math.min(prev + 1, totalSteps))
                } catch (err) {
                    setApiError(err instanceof Error ? err.message : 'Failed to send OTP')
                } finally {
                    setIsLoading(false)
                }
            } else {
                setCurrentStep(prev => Math.min(prev + 1, totalSteps))
            }
        }
    }

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1))
        setApiError(null)
    }

    const validateCurrentStep = (): boolean => {
        const newErrors: SignUpFormErrors = {}

        switch (currentStep) {
            case 1:
                if (!formData.phone || formData.phone.length < 10) {
                    newErrors.phone = 'Please enter a valid phone number'
                }
                break
            case 2:
                if (!formData.otp || formData.otp.length !== 4) {
                    newErrors.otp = 'Please enter a valid 4-digit code'
                }
                break
            case 3:
                if (!formData.name.trim()) {
                    newErrors.name = 'Name is required'
                }
                if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
                    newErrors.email = 'Please enter a valid email'
                }
                if (!formData.agreedToTerms) {
                    newErrors.agreedToTerms = 'You must agree to the terms'
                }
                break
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async () => {
        if (!validateCurrentStep()) return

        setIsLoading(true)
        setApiError(null)

        try {
            await authService.signUp({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                role: 'user',
            })

            // Move to success step
            setCurrentStep(4)
        } catch (err) {
            setApiError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleOtpChange = (index: number, value: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const digit = value.replace(/\D/g, '')
        const otpArray = formData.otp.split('')
        otpArray[index] = digit
        updateFormData('otp', otpArray.join('').slice(0, 4))

        // Auto-focus next input
        if (digit && e.target.nextElementSibling) {
            (e.target.nextElementSibling as HTMLInputElement).focus()
        }
    }

    const resendOtp = async () => {
        setIsLoading(true)
        try {
            await authService.sendOtp(formData.phone)
            setApiError(null)
        } catch (err) {
            setApiError(err instanceof Error ? err.message : 'Failed to resend OTP')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
            <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md border border-gray-100">
                {currentStep < 4 && (
                    <h1 className="text-2xl font-bold text-navy text-center mb-6">Sign Up</h1>
                )}

                {/* API Error Message */}
                {apiError && currentStep < 4 && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {apiError}
                    </div>
                )}

                {/* Step Indicator - hide on success */}
                {currentStep < 4 && (
                    <div className="flex items-center justify-center mb-8">
                        {[1, 2, 3].map((step, index) => (
                            <div key={step} className="flex items-center">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                                        ${currentStep >= step ? 'bg-navy text-white' : 'bg-gray-200 text-gray-500'}`}
                                >
                                    {currentStep > step ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : step}
                                </div>
                                {index < 2 && (
                                    <div className={`w-12 h-0.5 mx-2 rounded ${currentStep > step ? 'bg-navy' : 'bg-gray-200'}`} />
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Step 1: Phone Number */}
                {currentStep === 1 && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-800">Enter Your Phone Number</h2>
                            <p className="text-gray-500 mt-2">We'll send you a verification code</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                        +91
                                    </span>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => updateFormData('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        placeholder="Enter your phone number"
                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                                    />
                                </div>
                                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                            </div>
                        </div>

                        <Button
                            onClick={nextStep}
                            loading={isLoading}
                            fullWidth
                            size="lg"
                        >
                            Send Verification Code
                        </Button>
                    </div>
                )}

                {/* Step 2: OTP Verification */}
                {currentStep === 2 && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-800">Verify Your Number</h2>
                            <p className="text-gray-500 mt-2">Enter the 4-digit code sent to +91 {formData.phone}</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Verification Code</label>
                                <div className="flex justify-center gap-3">
                                    {[0, 1, 2, 3].map((index) => (
                                        <input
                                            key={index}
                                            type="text"
                                            maxLength={1}
                                            value={formData.otp[index] || ''}
                                            onChange={(e) => handleOtpChange(index, e.target.value, e)}
                                            className="w-14 h-14 text-center text-xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                                        />
                                    ))}
                                </div>
                                {errors.otp && <p className="text-red-500 text-sm mt-1 text-center">{errors.otp}</p>}
                            </div>

                            <p className="text-center text-gray-500 text-sm">
                                Didn't receive the code?{' '}
                                <button
                                    onClick={resendOtp}
                                    disabled={isLoading}
                                    className="text-gold font-medium hover:underline disabled:opacity-50"
                                >
                                    {isLoading ? 'Sending...' : 'Resend'}
                                </button>
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <Button onClick={prevStep} variant="outline" className="flex-1">Back</Button>
                            <Button onClick={nextStep} className="flex-1">Verify</Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Personal Details (was Step 4) */}

                {currentStep === 3 && (
                    <div className="space-y-5">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-800">Complete Your Profile</h2>
                            <p className="text-gray-500 mt-2">Fill in your personal details</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => updateFormData('name', e.target.value)}
                                    placeholder="Enter your full name"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                                />
                                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => updateFormData('email', e.target.value)}
                                    placeholder="Enter your email"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                                />
                                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                            </div>

                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    checked={formData.agreedToTerms}
                                    onChange={(e) => updateFormData('agreedToTerms', e.target.checked)}
                                    className="w-5 h-5 mt-0.5 rounded border-gray-300 text-navy focus:ring-navy"
                                />
                                <label htmlFor="terms" className="text-sm text-gray-600">
                                    I agree to the <a href="#" className="text-gold hover:underline">Privacy Policy</a> and <a href="#" className="text-gold hover:underline">Terms of Use</a>
                                </label>
                            </div>
                            {errors.agreedToTerms && <p className="text-red-500 text-sm">{errors.agreedToTerms}</p>}
                        </div>

                        <div className="flex gap-3">
                            <Button onClick={prevStep} variant="outline" className="flex-1">Back</Button>
                            <Button
                                onClick={handleSubmit}
                                loading={isLoading}
                                className="flex-1"
                            >
                                Create Account
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 4: Success Message */}
                {currentStep === 4 && (
                    <div className="text-center space-y-6 py-8">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Account Created!</h2>
                            <p className="text-gray-500 mt-2">
                                Your registration is complete. Please wait for admin approval before you can log in.
                            </p>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <p className="text-amber-800 text-sm">
                                <strong>Note:</strong> You will receive a notification once your account is approved.
                            </p>
                        </div>

                        <p className="text-gray-400 text-sm">
                            Redirecting to login in {countdown} seconds...
                        </p>

                        <Button
                            onClick={() => navigate('/login')}
                            variant="success"
                            className="inline-block"
                        >
                            Go to Login Now
                        </Button>
                    </div>
                )}

                {/* Login Link - hide on success */}
                {currentStep < 4 && (
                    <p className="text-center mt-6 text-gray-500 text-sm">
                        Already have an account? <Link to="/login" className="text-gold font-medium hover:underline">Log In</Link>
                    </p>
                )}
            </div>
        </div>
    )
}

export default SignUp
