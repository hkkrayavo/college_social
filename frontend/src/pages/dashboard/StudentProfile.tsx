import { useState, useRef } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { apiClient } from '../../services/api'

import { StatusBadge, Button, Avatar } from '../../components/common'

interface ProfileFormData {
    name: string
    email: string
}

export function StudentProfile() {
    const { user, refreshUser } = useAuth()
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Modal state
    const [showEditModal, setShowEditModal] = useState(false)
    const [formData, setFormData] = useState<ProfileFormData>({
        name: '',
        email: '',
    })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    // Profile picture upload
    const [uploading, setUploading] = useState(false)

    const openEditModal = () => {
        setFormData({
            name: user?.name || '',
            email: user?.email || '',
        })
        setError(null)
        setSuccess(null)
        setShowEditModal(true)
    }

    const handleSaveProfile = async () => {
        setSaving(true)
        setError(null)

        try {
            await apiClient.patch('/users/me', {
                name: formData.name,
                email: formData.email || undefined,
            })
            setSuccess('Profile updated successfully!')

            // Refresh user data
            if (refreshUser) {
                await refreshUser()
            }

            setTimeout(() => {
                setShowEditModal(false)
                setSuccess(null)
            }, 1500)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update profile')
        } finally {
            setSaving(false)
        }
    }

    const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        setError(null)

        try {
            const formData = new FormData()
            formData.append('profilePicture', file)

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/users/me/profile-picture`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_access_token')}`,
                },
                body: formData,
            })

            if (!response.ok) {
                const result = await response.json()
                throw new Error(result.message || 'Failed to upload picture')
            }

            // Refresh user data to get updated profilePictureUrl
            if (refreshUser) {
                await refreshUser()
            }
            setSuccess('Profile picture updated!')
            setTimeout(() => setSuccess(null), 3000)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload picture')
        } finally {
            setUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        })
    }



    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-navy">My Profile</h1>
                <p className="text-gray-500 mt-1">View and manage your account details</p>
            </div>

            {/* Success/Error Messages */}
            {success && !showEditModal && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
                    {success}
                </div>
            )}
            {error && !showEditModal && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    {error}
                </div>
            )}

            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header with background */}
                <div className="h-24 bg-gradient-to-r from-navy to-navy/80"></div>

                {/* Profile Content */}
                <div className="px-6 pb-6">
                    {/* Avatar Section */}
                    <div className="flex flex-col md:flex-row items-start md:items-end gap-4 -mt-12 mb-6">
                        <div className="relative">
                            <div className="w-28 h-28 rounded-full bg-white border-4 border-white shadow-lg overflow-hidden">
                                <Avatar
                                    src={user?.profilePictureUrl}
                                    name={user?.name || 'User'}
                                    size="2xl"
                                    className="w-full h-full"
                                />
                            </div>
                            {/* Change Photo Button */}
                            <label className="absolute bottom-0 right-0 p-2 bg-navy text-white rounded-full cursor-pointer hover:bg-navy/90 transition-colors shadow-lg">
                                {uploading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleProfilePictureChange}
                                    disabled={uploading}
                                />
                            </label>
                        </div>

                        <div className="flex-1 pt-4 md:pt-0">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">{user?.name || 'User'}</h2>
                                    <p className="text-gray-500 capitalize">{user?.role || 'Student'}</p>
                                </div>
                                <Button
                                    onClick={openEditModal}
                                    leftIcon={
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    }
                                >
                                    Edit Profile
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Profile Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Contact Information */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Contact Information</h3>

                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <div className="w-10 h-10 bg-navy/10 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Mobile Number</p>
                                    <p className="font-medium text-gray-800">{user?.phone || user?.mobileNumber || 'Not provided'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <div className="w-10 h-10 bg-navy/10 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Email Address</p>
                                    <p className="font-medium text-gray-800">{user?.email || 'Not provided'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Account Information */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Account Information</h3>

                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <div className="w-10 h-10 bg-navy/10 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Account Status</p>
                                    <StatusBadge status={user?.status || 'approved'} size="sm" />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <div className="w-10 h-10 bg-navy/10 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Role</p>
                                    <p className="font-medium text-gray-800 capitalize">{user?.role || 'Student'}</p>
                                </div>
                            </div>

                            {user?.createdAt && (
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="w-10 h-10 bg-navy/10 rounded-full flex items-center justify-center">
                                        <svg className="w-5 h-5 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Member Since</p>
                                        <p className="font-medium text-gray-800">{formatDate(user.createdAt)}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-gray-800">Edit Profile</h3>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                                {success}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                                    placeholder="Enter your name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                                    placeholder="Enter your email"
                                />
                            </div>

                            <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500">
                                    <strong>Mobile Number:</strong> {user?.phone || user?.mobileNumber}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Contact admin to change your mobile number
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <Button
                                variant="outline"
                                onClick={() => setShowEditModal(false)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveProfile}
                                loading={saving}
                                disabled={!formData.name.trim()}
                                fullWidth
                                className="flex-1"
                            >
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default StudentProfile
