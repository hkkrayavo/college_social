import { useEffect, useRef, memo, forwardRef, useImperativeHandle } from 'react'
import EditorJS from '@editorjs/editorjs'
import type { OutputData, API } from '@editorjs/editorjs'
import Header from '@editorjs/header'
import List from '@editorjs/list'
import CustomImageTool from './CustomImageTool'
import CustomVideoTool from './CustomVideoTool'
// @ts-expect-error - embed module types issue
import Embed from '@editorjs/embed'
import Quote from '@editorjs/quote'
import Delimiter from '@editorjs/delimiter'
import Paragraph from '@editorjs/paragraph'

interface EditorProps {
    data?: OutputData
    onChange?: (data: OutputData) => void
    placeholder?: string
    readOnly?: boolean
    uploadEndpoint?: string
}

export interface EditorRef {
    insertBlock: (type: string, data?: Record<string, any>) => void
    getData: () => Promise<OutputData | undefined>
}

const EditorComponent = forwardRef<EditorRef, EditorProps>(({
    data,
    onChange,
    placeholder = 'Write your article here...',
    readOnly = false,
    uploadEndpoint = '/api/posts/upload-media',
}, ref) => {
    const editorRef = useRef<EditorJS | null>(null)
    const holderRef = useRef<HTMLDivElement>(null)
    const isReady = useRef(false)
    const onChangeRef = useRef(onChange)

    // Keep the callback ref updated
    useEffect(() => {
        onChangeRef.current = onChange
    }, [onChange])

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
        insertBlock: async (type: string, blockData?: Record<string, any>) => {
            if (!editorRef.current || !isReady.current) return

            try {
                const currentIndex = await editorRef.current.blocks.getCurrentBlockIndex()
                const insertIndex = currentIndex >= 0 ? currentIndex + 1 : 0

                await editorRef.current.blocks.insert(type, blockData || {}, undefined, insertIndex, true)
                editorRef.current.caret.setToBlock(insertIndex, 'end')
            } catch (err) {
                console.error('Failed to insert block:', err)
            }
        },
        getData: async () => {
            if (editorRef.current) {
                return await editorRef.current.save()
            }
            return undefined
        }
    }), [])

    useEffect(() => {
        if (!holderRef.current || editorRef.current) return

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
        const baseUrl = apiUrl.replace(/\/api\/?$/, '')
        const token = localStorage.getItem('auth_access_token')

        const editor = new EditorJS({
            holder: holderRef.current,
            placeholder,
            readOnly,
            data: data || undefined,
            tools: {
                header: {
                    class: Header as unknown as EditorJS.ToolConstructable,
                    config: {
                        levels: [2, 3, 4],
                        defaultLevel: 2,
                    },
                },
                paragraph: {
                    class: Paragraph as unknown as EditorJS.ToolConstructable,
                    inlineToolbar: true,
                },
                list: {
                    class: List as unknown as EditorJS.ToolConstructable,
                    inlineToolbar: true,
                },
                image: {
                    class: CustomImageTool as unknown as EditorJS.ToolConstructable,
                    config: {
                        captionPlaceholder: 'Add a caption...',
                        uploader: {
                            async uploadByFile(file: File) {
                                const formData = new FormData()
                                formData.append('image', file)

                                const response = await fetch(`${baseUrl}${uploadEndpoint}`, {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${token}`,
                                    },
                                    body: formData,
                                })

                                const result = await response.json()

                                if (result.success === 1) {
                                    const imageUrl = result.file.url.startsWith('/')
                                        ? `${baseUrl}${result.file.url}`
                                        : result.file.url

                                    return {
                                        success: 1,
                                        file: {
                                            url: imageUrl,
                                        },
                                    }
                                }

                                return result
                            },
                        },
                    },
                },
                video: {
                    class: CustomVideoTool as unknown as EditorJS.ToolConstructable,
                    config: {
                        captionPlaceholder: 'Add a video caption...',
                        uploader: {
                            async uploadByFile(file: File) {
                                const formData = new FormData()
                                formData.append('image', file) // Using 'image' field as backend likely uses a generic file upload or 'image' field for media

                                const response = await fetch(`${baseUrl}${uploadEndpoint}`, {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${token}`,
                                    },
                                    body: formData,
                                })

                                const result = await response.json()

                                if (result.success === 1) {
                                    const videoUrl = result.file.url.startsWith('/')
                                        ? `${baseUrl}${result.file.url}`
                                        : result.file.url

                                    return {
                                        success: 1,
                                        file: {
                                            url: videoUrl,
                                        },
                                    }
                                }

                                return result
                            },
                        },
                    },
                },
                embed: {
                    class: Embed as unknown as EditorJS.ToolConstructable,
                    config: {
                        services: {
                            youtube: true,
                            vimeo: true,
                        },
                    },
                },
                quote: {
                    class: Quote as unknown as EditorJS.ToolConstructable,
                    inlineToolbar: true,
                },
                delimiter: Delimiter as unknown as EditorJS.ToolConstructable,
            },
            onChange: async (api: API) => {
                if (onChangeRef.current && isReady.current) {
                    const content = await api.saver.save()
                    onChangeRef.current(content)
                }
            },
            onReady: () => {
                isReady.current = true
            },
        })

        editorRef.current = editor

        return () => {
            if (editorRef.current && typeof editorRef.current.destroy === 'function') {
                editorRef.current.destroy()
                editorRef.current = null
                isReady.current = false
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Only run once on mount

    return (
        <div className="editor-wrapper" style={{ paddingLeft: '40px' }}>
            <div
                ref={holderRef}
                className="prose max-w-none"
                style={{ minHeight: '600px' }}
            />
            <style>{`
                .codex-editor {
                    background: transparent;
                }
                .ce-block__content {
                    max-width: 100%;
                    margin: 0;
                }
                .ce-toolbar__content {
                    max-width: 100%;
                }
                .ce-toolbar__plus {
                    color: #6b7280;
                    left: -40px;
                }
                .ce-toolbar__plus:hover {
                    color: #1a365d;
                }
                .ce-toolbar__settings-btn {
                    color: #6b7280;
                }
                .codex-editor__redactor {
                    padding-bottom: 100px !important;
                }
                .ce-block a {
                    color: #1a365d;
                    text-decoration: underline;
                }
                .ce-paragraph {
                    font-size: 16px;
                    line-height: 1.75;
                }
                .image-tool__image {
                    border-radius: 8px;
                    overflow: hidden;
                }
                .image-tool__caption {
                    font-size: 14px;
                    color: #666;
                    text-align: center;
                }
                .ce-header {
                    font-weight: 600;
                    color: #1a365d;
                }
                .cdx-quote {
                    border-left: 4px solid #d4a853;
                    padding-left: 16px;
                    font-style: italic;
                }
                .ce-delimiter {
                    line-height: 1.6em;
                    text-align: center;
                    font-size: 2em;
                    color: #ccc;
                }
                .ce-inline-toolbar {
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                }
                .ce-inline-tool {
                    color: #374151;
                }
                .ce-inline-tool:hover {
                    background: #f3f4f6;
                }
                .ce-inline-tool--active {
                    color: #1a365d;
                }
                .ce-conversion-toolbar {
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                }
                .ce-popover {
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
                }
                .ce-popover-item:hover {
                    background: #f3f4f6;
                }
                .cdx-search-field {
                    background: #f9fafb;
                    border: 1px solid #e5e7eb;
                    border-radius: 6px;
                }
                /* Custom Image Tool styles */
                .custom-image-tool__container {
                    border: 2px dashed #cbd5e1;
                    border-radius: 12px;
                    overflow: hidden;
                }
                .custom-image-tool__tabs {
                    display: flex;
                    background: #f1f5f9;
                    border-bottom: 1px solid #e2e8f0;
                }
                .custom-image-tool__tab {
                    flex: 1;
                    padding: 12px 16px;
                    border: none;
                    background: transparent;
                    color: #64748b;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.2s ease;
                }
                .custom-image-tool__tab:hover {
                    background: #e2e8f0;
                }
                .custom-image-tool__tab--active {
                    background: white;
                    color: #1a365d;
                    border-bottom: 2px solid #1a365d;
                }
                .custom-image-tool__panel {
                    display: none;
                    padding: 20px;
                }
                .custom-image-tool__panel--active {
                    display: block;
                }
                .custom-image-tool__upload-button {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    padding: 40px 20px;
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    color: #64748b;
                }
                .custom-image-tool__upload-button:hover {
                    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
                    color: #1a365d;
                }
                .custom-image-tool__url-input {
                    display: flex;
                    gap: 10px;
                }
                .custom-image-tool__url-field {
                    flex: 1;
                    padding: 12px 16px;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 14px;
                    outline: none;
                    transition: border-color 0.2s ease;
                }
                .custom-image-tool__url-field:focus {
                    border-color: #1a365d;
                }
                .custom-image-tool__url-submit {
                    padding: 12px 20px;
                    background: #1a365d;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.2s ease;
                }
                .custom-image-tool__url-submit:hover {
                    background: #2c5282;
                }
                .custom-image-tool__image {
                    border-radius: 8px;
                    overflow: hidden;
                }
                .custom-image-tool--withBorder {
                    border: 2px solid #e5e7eb;
                    padding: 4px;
                }
                .custom-image-tool--stretched img {
                    width: 100%;
                }
                .custom-image-tool--withBackground {
                    background: #f3f4f6;
                    padding: 15px;
                    border-radius: 12px;
                }
                .custom-image-tool--left {
                    float: left;
                    margin-right: 20px;
                    margin-bottom: 10px;
                    max-width: 50%;
                }
                .custom-image-tool--right {
                    float: right;
                    margin-left: 20px;
                    margin-bottom: 10px;
                    max-width: 50%;
                }
                .custom-image-tool--center {
                    margin-left: auto;
                    margin-right: auto;
                    display: flex;
                    justify-content: center;
                }
                .custom-image-tool__caption {
                    margin-top: 8px;
                    padding: 8px 12px;
                    font-size: 14px;
                    color: #666;
                    text-align: center;
                    border: none;
                    outline: none;
                    background: transparent;
                }
                .custom-image-tool__caption:empty:before {
                    content: attr(data-placeholder);
                    color: #9ca3af;
                }
                .custom-image-tool__loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                    padding: 40px;
                    background: #f8fafc;
                    border: 2px dashed #cbd5e1;
                    border-radius: 12px;
                    color: #64748b;
                }
                .custom-image-tool__spinner {
                    width: 32px;
                    height: 32px;
                    border: 3px solid #e5e7eb;
                    border-top-color: #1a365d;
                    border-radius: 50%;
                    animation: image-spinner 0.8s linear infinite;
                }
                @keyframes image-spinner {
                    to { transform: rotate(360deg); }
                }
                .custom-image-tool__error {
                    padding: 20px;
                    background: #fef2f2;
                    border: 1px solid #fecaca;
                    border-radius: 8px;
                    color: #dc2626;
                    text-align: center;
                    margin-bottom: 10px;
                }
            `}</style>
        </div>
    )
})

export const Editor = memo(EditorComponent)
export type { OutputData }
export default Editor
