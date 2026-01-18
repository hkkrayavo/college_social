import { useState, useEffect, useRef } from 'react'
import { Button, Modal } from '../../components/common'
import { adminService, type SmsTemplate } from '../../services/adminService'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

type TabType = 'general' | 'sms'

export function AdminSettings() {
    const [activeTab, setActiveTab] = useState<TabType>('general')

    // General settings state
    const [heroImageUrl, setHeroImageUrl] = useState<string>('')
    const [logoUrl, setLogoUrl] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState<'hero' | 'logo' | null>(null)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const heroFileInputRef = useRef<HTMLInputElement>(null)
    const logoFileInputRef = useRef<HTMLInputElement>(null)

    // SMS Templates state
    const [smsTemplates, setSmsTemplates] = useState<SmsTemplate[]>([])
    const [smsLoading, setSmsLoading] = useState(true)
    const [editModal, setEditModal] = useState<{
        isOpen: boolean
        template: SmsTemplate | null
        content: string
        saving: boolean
    }>({ isOpen: false, template: null, content: '', saving: false })

    useEffect(() => {
        loadSettings()
        loadSmsTemplates()
    }, [])

    const loadSettings = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem('auth_access_token')

            // Load hero image
            const heroRes = await fetch(`${API_URL}/users/settings/hero_background_image`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const heroData = await heroRes.json()
            if (heroData.success && heroData.value) {
                setHeroImageUrl(heroData.value)
            }

            // Load logo
            const logoRes = await fetch(`${API_URL}/users/settings/site_logo`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const logoData = await logoRes.json()
            if (logoData.success && logoData.value) {
                setLogoUrl(logoData.value)
            }
        } catch (err) {
            console.error('Failed to load settings:', err)
        } finally {
            setLoading(false)
        }
    }

    const loadSmsTemplates = async () => {
        try {
            setSmsLoading(true)
            const templates = await adminService.getSmsTemplates()
            setSmsTemplates(templates)
        } catch (err) {
            console.error('Failed to load SMS templates:', err)
        } finally {
            setSmsLoading(false)
        }
    }

    const saveSetting = async (key: string, value: string, successMessage: string) => {
        try {
            setSaving(true)
            setMessage(null)
            const token = localStorage.getItem('auth_access_token')
            const res = await fetch(`${API_URL}/users/settings/${key}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ value })
            })
            const data = await res.json()
            if (data.success) {
                setMessage({ type: 'success', text: successMessage })
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to update' })
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to save settings' })
        } finally {
            setSaving(false)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'hero' | 'logo') => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setUploading(type)
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
                if (type === 'hero') {
                    setHeroImageUrl(data.file.url)
                } else {
                    setLogoUrl(data.file.url)
                }
                setMessage({ type: 'success', text: 'Image uploaded! Click Save to apply.' })
            } else {
                setMessage({ type: 'error', text: 'Upload failed' })
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to upload image' })
        } finally {
            setUploading(null)
        }
    }

    const openEditModal = (template: SmsTemplate) => {
        setEditModal({
            isOpen: true,
            template,
            content: template.content,
            saving: false
        })
    }

    const closeEditModal = () => {
        setEditModal({ isOpen: false, template: null, content: '', saving: false })
    }

    const handleSaveTemplate = async () => {
        if (!editModal.template) return
        try {
            setEditModal(prev => ({ ...prev, saving: true }))
            await adminService.updateSmsTemplate(editModal.template.key, editModal.content)
            setSmsTemplates(prev =>
                prev.map(t => t.key === editModal.template!.key ? { ...t, content: editModal.content } : t)
            )
            closeEditModal()
        } catch (err) {
            console.error('Failed to save template:', err)
        }
    }

    const handleToggleTemplate = async (key: string) => {
        try {
            const result = await adminService.toggleSmsTemplate(key)
            setSmsTemplates(prev =>
                prev.map(t => t.key === key ? { ...t, isActive: result.isActive } : t)
            )
        } catch (err) {
            console.error('Failed to toggle template:', err)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy"></div>
            </div>
        )
    }

    const tabs = [
        { id: 'general' as TabType, label: 'General', icon: '⚙️' },
        { id: 'sms' as TabType, label: 'SMS Templates', icon: '📱' },
    ]

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-xl font-bold text-navy mb-6">Site Settings</h1>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                ? 'border-navy text-navy'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <span className="mr-2">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {message && (
                <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            {/* General Settings Tab */}
            {activeTab === 'general' && (
                <div className="space-y-6">
                    {/* Site Logo */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-navy mb-4">Site Logo</h2>
                        <p className="text-gray-500 text-sm mb-4">
                            This logo will be displayed in the header and other places across the site.
                        </p>

                        {logoUrl && (
                            <div className="mb-4">
                                <p className="text-sm font-medium text-gray-700 mb-2">Current Logo:</p>
                                <div className="inline-block p-4 bg-gray-100 rounded-lg">
                                    <img
                                        src={logoUrl}
                                        alt="Site Logo"
                                        className="h-16 w-auto object-contain"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                            <input
                                type="text"
                                value={logoUrl}
                                onChange={(e) => setLogoUrl(e.target.value)}
                                placeholder="https://example.com/logo.png"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent"
                            />
                        </div>

                        <div className="flex items-center gap-4 mb-4">
                            <input
                                ref={logoFileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileUpload(e, 'logo')}
                                className="hidden"
                            />
                            <Button
                                variant="secondary"
                                onClick={() => logoFileInputRef.current?.click()}
                                disabled={uploading === 'logo'}
                            >
                                {uploading === 'logo' ? 'Uploading...' : 'Upload Logo'}
                            </Button>
                            <span className="text-sm text-gray-500">or paste a URL above</span>
                        </div>

                        <Button
                            variant="primary"
                            onClick={() => saveSetting('site_logo', logoUrl, 'Logo updated successfully!')}
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save Logo'}
                        </Button>
                    </div>

                    {/* Hero Background Image */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-navy mb-4">Hero Background Image</h2>
                        <p className="text-gray-500 text-sm mb-4">
                            This image will be displayed as the background of the landing page hero section.
                        </p>

                        {heroImageUrl && (
                            <div className="mb-4">
                                <p className="text-sm font-medium text-gray-700 mb-2">Current Preview:</p>
                                <div
                                    className="w-full h-48 rounded-lg bg-cover bg-center border border-gray-200"
                                    style={{ backgroundImage: `url(${heroImageUrl})` }}
                                />
                            </div>
                        )}

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

                        <div className="flex items-center gap-4 mb-4">
                            <input
                                ref={heroFileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileUpload(e, 'hero')}
                                className="hidden"
                            />
                            <Button
                                variant="secondary"
                                onClick={() => heroFileInputRef.current?.click()}
                                disabled={uploading === 'hero'}
                            >
                                {uploading === 'hero' ? 'Uploading...' : 'Upload Image'}
                            </Button>
                            <span className="text-sm text-gray-500">or paste a URL above</span>
                        </div>

                        <Button
                            variant="primary"
                            onClick={() => saveSetting('hero_background_image', heroImageUrl, 'Hero image updated successfully!')}
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save Hero Image'}
                        </Button>
                    </div>
                </div>
            )}

            {/* SMS Templates Tab */}
            {activeTab === 'sms' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-navy mb-4">SMS Templates</h2>
                    <p className="text-gray-500 text-sm mb-4">
                        Configure the SMS messages sent to users. Use variables like {'{user_name}'} which will be replaced with actual values.
                    </p>

                    {smsLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {smsTemplates.map(template => (
                                <div
                                    key={template.key}
                                    className={`border rounded-lg p-4 ${template.isActive ? 'border-gray-200' : 'border-gray-100 bg-gray-50 opacity-60'}`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-medium text-gray-800">{template.name}</h3>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${template.isActive
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-200 text-gray-500'
                                                    }`}>
                                                    {template.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 mb-2">{template.description}</p>
                                            <div className="bg-gray-50 rounded p-2 text-sm font-mono text-gray-700 mb-2">
                                                {template.content}
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {template.variables.map(v => (
                                                    <span key={v} className="text-xs px-2 py-1 bg-navy/10 text-navy rounded">
                                                        {'{' + v + '}'}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openEditModal(template)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                variant={template.isActive ? 'ghost' : 'secondary'}
                                                size="sm"
                                                onClick={() => handleToggleTemplate(template.key)}
                                            >
                                                {template.isActive ? 'Disable' : 'Enable'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Edit Template Modal */}
            <Modal
                isOpen={editModal.isOpen}
                onClose={closeEditModal}
                title={`Edit Template: ${editModal.template?.name || ''}`}
                size="lg"
            >
                {editModal.template && (
                    <>
                        <div className="mb-4">
                            <p className="text-sm text-gray-500 mb-2">{editModal.template.description}</p>
                            <div className="flex flex-wrap gap-1 mb-4">
                                <span className="text-xs text-gray-500 mr-1">Available variables:</span>
                                {editModal.template.variables.map(v => (
                                    <span key={v} className="text-xs px-2 py-1 bg-navy/10 text-navy rounded cursor-pointer"
                                        onClick={() => setEditModal(prev => ({
                                            ...prev,
                                            content: prev.content + `{${v}}`
                                        }))}
                                    >
                                        {'{' + v + '}'}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Template Content
                            </label>
                            <textarea
                                value={editModal.content}
                                onChange={(e) => setEditModal(prev => ({ ...prev, content: e.target.value }))}
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent resize-none"
                            />
                            <div className="flex justify-between mt-1">
                                <span className={`text-xs ${editModal.content.length > 160 ? 'text-orange-600' : 'text-gray-500'}`}>
                                    {editModal.content.length} characters
                                    {editModal.content.length > 160 && ' (may be split into multiple SMS)'}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={closeEditModal} className="flex-1">
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleSaveTemplate}
                                loading={editModal.saving}
                                disabled={!editModal.content.trim()}
                                className="flex-1"
                            >
                                Save Template
                            </Button>
                        </div>
                    </>
                )}
            </Modal>
        </div>
    )
}

export default AdminSettings
