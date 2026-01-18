import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../services/api'
import Editor from '../../components/shared/Editor'
import type { EditorRef } from '../../components/shared/Editor'
import { PostRenderer } from '../../components/shared/PostRenderer'
import { Button, Modal } from '../../components/common'
import type { OutputData } from '@editorjs/editorjs'

export function CreatePost() {
    const navigate = useNavigate()
    const editorRef = useRef<EditorRef>(null)
    const [mode, setMode] = useState<'edit' | 'preview'>('edit')
    const [title, setTitle] = useState('')
    const [content, setContent] = useState<OutputData | null>(null)
    const [tags] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showPublishModal, setShowPublishModal] = useState(false)



    const handleContentChange = (data: OutputData) => {
        setContent(data)
    }





    const handlePublishClick = () => {
        if (!title.trim()) {
            setError('Please add a title')
            return
        }
        if (!content || content.blocks.length === 0) {
            setError('Please add some content to your post')
            return
        }
        setError(null)
        setShowPublishModal(true)
    }

    const confirmPublish = async () => {



        setLoading(true)
        setError(null)

        try {
            await apiClient.post('/posts', {
                title: title.trim() || null,
                content: content,
                tags,
            })

            navigate('/dashboard/user/my-posts', {
                state: { message: 'Post submitted for approval!' }
            })
            setShowPublishModal(false)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create post')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
                    {/* Left: Title */}
                    <h1 className="text-lg font-semibold text-gray-800">Create Post</h1>

                    {/* Center: Spacer */}
                    <div className="flex-1" />

                    {/* Right: Edit/Preview and Publish */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setMode('edit')}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${mode === 'edit' ? 'bg-gray-100 text-navy' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Edit
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('preview')}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${mode === 'preview' ? 'bg-gray-100 text-navy' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Preview
                        </button>
                        <Button
                            type="button"
                            onClick={handlePublishClick}
                            loading={loading}
                            size="sm"
                            variant="primary"
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            Publish
                        </Button>
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="max-w-4xl mx-auto px-4 mt-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                        {error}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setError(null)}
                            className="ml-4 underline text-red-700 hover:text-red-900 hover:bg-red-100 p-0 h-auto"
                        >
                            Dismiss
                        </Button>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-4 py-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {/* Title */}
                    <div className="px-6 py-6">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="New post title here..."
                            className="w-full text-3xl font-bold text-gray-900 placeholder-gray-400 border-0 focus:ring-0 focus:outline-none"
                        />
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-100" />

                    {/* Formatting Toolbar */}
                    {mode === 'edit' && (
                        <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-1">
                            {/* Bold - inline formatting hint */}
                            <button
                                type="button"
                                className="p-2 rounded hover:bg-gray-100 text-gray-600 font-bold"
                                title="Bold (select text first)"
                            >
                                B
                            </button>
                            {/* Italic - inline formatting hint */}
                            <button
                                type="button"
                                className="p-2 rounded hover:bg-gray-100 text-gray-600 italic"
                                title="Italic (select text first)"
                            >
                                I
                            </button>
                            {/* Link - inline formatting hint */}
                            <button
                                type="button"
                                className="p-2 rounded hover:bg-gray-100 text-gray-600"
                                title="Add Link (select text first)"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                            </button>

                            <div className="w-px h-6 bg-gray-200 mx-1" />

                            {/* Ordered List */}
                            <button
                                type="button"
                                onClick={() => editorRef.current?.insertBlock('list', { style: 'ordered', items: [''] })}
                                className="p-2 rounded hover:bg-gray-100 text-gray-600"
                                title="Numbered List"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                </svg>
                            </button>
                            {/* Unordered List */}
                            <button
                                type="button"
                                onClick={() => editorRef.current?.insertBlock('list', { style: 'unordered', items: [''] })}
                                className="p-2 rounded hover:bg-gray-100 text-gray-600"
                                title="Bullet List"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <circle cx="4" cy="6" r="1.5" fill="currentColor" />
                                    <circle cx="4" cy="12" r="1.5" fill="currentColor" />
                                    <circle cx="4" cy="18" r="1.5" fill="currentColor" />
                                    <path strokeLinecap="round" strokeWidth={2} d="M9 6h12M9 12h12M9 18h12" />
                                </svg>
                            </button>

                            <div className="w-px h-6 bg-gray-200 mx-1" />

                            {/* Heading */}
                            <button
                                type="button"
                                onClick={() => editorRef.current?.insertBlock('header', { text: '', level: 2 })}
                                className="p-2 rounded hover:bg-gray-100 text-gray-600 font-bold"
                                title="Heading"
                            >
                                H
                            </button>
                            {/* Quote */}
                            <button
                                type="button"
                                onClick={() => editorRef.current?.insertBlock('quote', { text: '', caption: '' })}
                                className="p-2 rounded hover:bg-gray-100 text-gray-600 text-xl font-serif"
                                title="Quote"
                            >
                                "
                            </button>
                            {/* Delimiter */}
                            <button
                                type="button"
                                onClick={() => editorRef.current?.insertBlock('delimiter')}
                                className="p-2 rounded hover:bg-gray-100 text-gray-600"
                                title="Divider"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                                </svg>
                            </button>

                            <div className="w-px h-6 bg-gray-200 mx-1" />

                            {/* Image */}
                            <button
                                type="button"
                                onClick={() => editorRef.current?.insertBlock('image')}
                                className="p-2 rounded hover:bg-gray-100 text-gray-600"
                                title="Image"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </button>

                            <div className="flex-1" />

                            {/* More options */}
                            <button
                                type="button"
                                className="p-2 rounded hover:bg-gray-100 text-gray-600"
                                title="More options"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="6" r="2" />
                                    <circle cx="12" cy="12" r="2" />
                                    <circle cx="12" cy="18" r="2" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {/* Editor / Preview */}
                    <div className="p-6">
                        {mode === 'edit' ? (
                            <Editor
                                ref={editorRef}
                                key="editor-instance"
                                data={content || undefined}
                                onChange={handleContentChange}
                                placeholder="Write your article content here..."
                            />
                        ) : (
                            <div className="min-h-[300px]">
                                {content && content.blocks.length > 0 ? (
                                    <PostRenderer content={content} />
                                ) : (
                                    <div className="text-gray-400 text-center py-12">
                                        <p>Nothing to preview yet.</p>
                                        <p className="text-sm mt-1">Switch to Edit mode to add content.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <p className="text-sm text-center text-gray-500 mt-4">
                    Your post will be reviewed by moderators before being published.
                </p>
            </div>

            <Modal
                isOpen={showPublishModal}
                onClose={() => setShowPublishModal(false)}
                title="Submit Post for Review"
                size="md"
                footer={
                    <div className="flex w-full gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setShowPublishModal(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={confirmPublish}
                            loading={loading}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                        >
                            Submit for Review
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="text-amber-800 font-medium">Post will be reviewed</p>
                            <p className="text-amber-700 text-sm mt-1">
                                Your post will be submitted for moderator approval. Once approved, the admin will assign it to the appropriate groups.
                            </p>
                        </div>
                    </div>
                    <div className="text-center text-gray-600">
                        <p>Ready to submit <strong>"{title}"</strong>?</p>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default CreatePost
