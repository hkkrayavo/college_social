import { useState, useEffect, useRef } from 'react'
import { Button } from '../../components/common'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export function AdminSettings() {
    const [heroImageUrl, setHeroImageUrl] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem('auth_access_token')
            const res = await fetch(`${API_URL}/users/settings/hero_background_image`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (data.success && data.value) {
                setHeroImageUrl(data.value)
            }
        } catch (err) {
            console.error('Failed to load settings:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            setMessage(null)
            const token = localStorage.getItem('auth_access_token')
            const res = await fetch(`${API_URL}/users/settings/hero_background_image`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ value: heroImageUrl })
            })
            const data = await res.json()
            if (data.success) {
                setMessage({ type: 'success', text: 'Hero image updated successfully!' })
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to update' })
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to save settings' })
        } finally {
            setSaving(false)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setUploading(true)
            setMessage(null)
            const token = localStorage.getItem('auth_access_token')
            const formData = new FormData()
            formData.append('image', file)

            const res = await fetch(`${API_URL}/posts/upload-media`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            })
            const data = await res.json()
            if (data.success === 1 && data.file?.url) {
                // Construct full URL if relative
                const baseUrl = API_URL.replace(/\/api\/?$/, '')
                const fullUrl = data.file.url.startsWith('/') ? `${baseUrl}${data.file.url}` : data.file.url
                setHeroImageUrl(fullUrl)
                setMessage({ type: 'success', text: 'Image uploaded! Click Save to apply.' })
            } else {
                setMessage({ type: 'error', text: 'Upload failed' })
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to upload image' })
        } finally {
            setUploading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy"></div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-xl font-bold text-navy mb-6">Site Settings</h1>

            {message && (
                <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            {/* Hero Background Image */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-navy mb-4">Hero Background Image</h2>
                <p className="text-gray-500 text-sm mb-4">
                    This image will be displayed as the background of the landing page hero section.
                </p>

                {/* Preview */}
                {heroImageUrl && (
                    <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Current Preview:</p>
                        <div
                            className="w-full h-48 rounded-lg bg-cover bg-center border border-gray-200"
                            style={{ backgroundImage: `url(${heroImageUrl})` }}
                        />
                    </div>
                )}

                {/* URL Input */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                    <input
                        type="text"
                        value={heroImageUrl}
                        onChange={(e) => setHeroImageUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent"
                    />
                </div>

                {/* Upload Button */}
                <div className="flex items-center gap-4 mb-4">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    <Button
                        variant="secondary"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                    >
                        {uploading ? 'Uploading...' : 'Upload Image'}
                    </Button>
                    <span className="text-sm text-gray-500">or paste a URL above</span>
                </div>

                {/* Save Button */}
                <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </div>
    )
}

export default AdminSettings
