/**
 * Custom Video Tool for Editor.js
 * Supports video upload and URL embedding (YouTube, Vimeo, direct links)
 */

interface VideoToolData {
    url: string
    caption?: string
    withBorder?: boolean
    stretched?: boolean
    withBackground?: boolean
    alignment?: 'left' | 'center' | 'right'
}

interface VideoToolConfig {
    captionPlaceholder?: string
    uploader?: {
        uploadByFile?: (file: File) => Promise<{ success: boolean; file: { url: string } }>
    }
}

class CustomVideoTool {
    private data: VideoToolData
    private wrapper: HTMLElement | null = null
    private config: VideoToolConfig

    static get toolbox() {
        return {
            title: 'Video',
            icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                <line x1="7" y1="2" x2="7" y2="22"></line>
                <line x1="17" y1="2" x2="17" y2="22"></line>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <line x1="2" y1="7" x2="7" y2="7"></line>
                <line x1="2" y1="17" x2="7" y2="17"></line>
                <line x1="17" y1="17" x2="22" y2="17"></line>
                <line x1="17" y1="7" x2="22" y2="7"></line>
            </svg>`
        }
    }

    constructor({ data, config }: { data: VideoToolData; config: VideoToolConfig }) {
        this.data = {
            url: data.url || '',
            caption: data.caption || '',
            withBorder: data.withBorder ?? false,
            stretched: data.stretched ?? false,
            withBackground: data.withBackground ?? false,
            alignment: data.alignment || 'center'
        }
        this.config = config
    }

    render(): HTMLElement {
        this.wrapper = document.createElement('div')
        this.wrapper.classList.add('custom-video-tool')

        if (this.data.url) {
            this._createVideo(this.data.url)
        } else {
            this._createUploadUI()
        }

        return this.wrapper
    }

    private _createUploadUI(): void {
        if (!this.wrapper) return

        const container = document.createElement('div')
        container.classList.add('custom-image-tool__container') // Reusing image tool styles

        // Tabs
        const tabContainer = document.createElement('div')
        tabContainer.classList.add('custom-image-tool__tabs')
        tabContainer.innerHTML = `
            <button type="button" class="custom-image-tool__tab custom-image-tool__tab--active" data-tab="upload">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                Upload Video
            </button>
            <button type="button" class="custom-image-tool__tab" data-tab="url">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
                Video URL
            </button>
        `
        container.appendChild(tabContainer)

        // Upload panel
        const uploadPanel = document.createElement('div')
        uploadPanel.classList.add('custom-image-tool__panel', 'custom-image-tool__panel--active')
        uploadPanel.dataset.panel = 'upload'
        uploadPanel.innerHTML = `
            <div class="custom-image-tool__upload-area">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                    <polygon points="10 8 16 12 10 16 10 8"></polygon>
                </svg>
                <p>Click to upload or drag and drop</p>
                <span>MP4, WebM, MOV up to 50MB</span>
                <input type="file" accept="video/*" class="custom-image-tool__file-input" />
            </div>
        `
        container.appendChild(uploadPanel)

        // URL panel
        const urlPanel = document.createElement('div')
        urlPanel.classList.add('custom-image-tool__panel')
        urlPanel.dataset.panel = 'url'
        urlPanel.innerHTML = `
            <div class="custom-image-tool__url-input">
                <input type="text" placeholder="Paste video URL (YouTube, Vimeo, or direct link)..." class="custom-image-tool__url-field" />
                <button type="button" class="custom-image-tool__url-submit">Add Video</button>
            </div>
        `
        container.appendChild(urlPanel)

        this.wrapper.appendChild(container)

        // Bind tab switching
        const tabs = this.wrapper.querySelectorAll('.custom-image-tool__tab')
        const panels = this.wrapper.querySelectorAll('.custom-image-tool__panel')

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = (tab as HTMLElement).dataset.tab

                tabs.forEach(t => t.classList.remove('custom-image-tool__tab--active'))
                tab.classList.add('custom-image-tool__tab--active')

                panels.forEach(p => {
                    const panel = p as HTMLElement
                    if (panel.dataset.panel === targetTab) {
                        panel.classList.add('custom-image-tool__panel--active')
                    } else {
                        panel.classList.remove('custom-image-tool__panel--active')
                    }
                })
            })
        })

        // Bind file upload
        const fileInput = this.wrapper.querySelector('.custom-image-tool__file-input') as HTMLInputElement
        const uploadArea = this.wrapper.querySelector('.custom-image-tool__upload-area') as HTMLElement

        if (fileInput && uploadArea) {
            uploadArea.onclick = () => fileInput.click()

            fileInput.onchange = () => {
                const file = fileInput.files?.[0]
                if (file) {
                    this._uploadFile(file)
                }
            }

            // Drag and drop
            uploadArea.ondragover = (e) => {
                e.preventDefault()
                uploadArea.classList.add('custom-image-tool__upload-area--dragover')
            }
            uploadArea.ondragleave = () => {
                uploadArea.classList.remove('custom-image-tool__upload-area--dragover')
            }
            uploadArea.ondrop = (e) => {
                e.preventDefault()
                uploadArea.classList.remove('custom-image-tool__upload-area--dragover')
                const file = e.dataTransfer?.files[0]
                if (file && file.type.startsWith('video/')) {
                    this._uploadFile(file)
                }
            }
        }

        // Bind URL submit
        const urlSubmitBtn = this.wrapper.querySelector('.custom-image-tool__url-submit') as HTMLButtonElement
        const urlInputField = this.wrapper.querySelector('.custom-image-tool__url-field') as HTMLInputElement

        if (urlSubmitBtn && urlInputField) {
            urlSubmitBtn.onclick = () => {
                const url = urlInputField.value?.trim()
                if (url) {
                    this.data.url = url
                    this._createVideo(url)
                }
            }

            urlInputField.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault()
                    const url = urlInputField.value?.trim()
                    if (url) {
                        this.data.url = url
                        this._createVideo(url)
                    }
                }
            }
        }
    }

    private async _uploadFile(file: File): Promise<void> {
        if (!this.config.uploader?.uploadByFile) {
            console.error('No uploader configured for video tool')
            return
        }

        const uploadArea = this.wrapper?.querySelector('.custom-image-tool__upload-area') as HTMLElement
        if (uploadArea) {
            uploadArea.innerHTML = `
                <div class="custom-image-tool__uploading">
                    <div class="custom-image-tool__spinner"></div>
                    <p>Uploading video...</p>
                </div>
            `
        }

        try {
            const response = await this.config.uploader.uploadByFile(file)
            if (response.success && response.file?.url) {
                this.data.url = response.file.url
                this._createVideo(response.file.url)
            } else {
                this._showError('Upload failed')
            }
        } catch (error) {
            console.error('Video upload error:', error)
            this._showError('Upload failed')
        }
    }

    private _showError(message: string): void {
        if (!this.wrapper) return
        this.wrapper.innerHTML = `
            <div class="custom-image-tool__error">
                <span>${message}</span>
            </div>
        `
        this._createUploadUI()
    }

    private _createVideo(url: string): void {
        if (!this.wrapper) return
        this.wrapper.innerHTML = ''

        const container = document.createElement('div')
        container.classList.add('custom-image-tool__image') // Reusing image styles

        if (this.data.withBorder) container.classList.add('custom-image-tool--withBorder')
        if (this.data.stretched) container.classList.add('custom-image-tool--stretched')
        if (this.data.withBackground) container.classList.add('custom-image-tool--withBackground')
        if (this.data.alignment) container.classList.add(`custom-image-tool--${this.data.alignment}`)

        // Check for YouTube/Vimeo
        const isYouTube = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
        const isVimeo = url.match(/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:[a-zA-Z0-9_\-]+)?/i)

        if (isYouTube) {
            const videoId = isYouTube[1]
            const iframe = document.createElement('iframe')
            iframe.src = `https://www.youtube.com/embed/${videoId}`
            iframe.style.width = '100%'
            iframe.style.aspectRatio = '16/9'
            iframe.style.border = 'none'
            iframe.style.borderRadius = '8px'
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
            iframe.allowFullscreen = true
            container.appendChild(iframe)
        } else if (isVimeo) {
            const videoId = isVimeo[1]
            const iframe = document.createElement('iframe')
            iframe.src = `https://player.vimeo.com/video/${videoId}`
            iframe.style.width = '100%'
            iframe.style.aspectRatio = '16/9'
            iframe.style.border = 'none'
            iframe.style.borderRadius = '8px'
            iframe.allow = 'autoplay; fullscreen; picture-in-picture'
            iframe.allowFullscreen = true
            container.appendChild(iframe)
        } else {
            // Standard Video
            const video = document.createElement('video')
            video.src = url
            video.controls = true
            video.style.maxWidth = '100%'
            video.style.borderRadius = '8px'
            container.appendChild(video)
        }

        this.wrapper.appendChild(container)

        // Caption
        const caption = document.createElement('div')
        caption.classList.add('custom-image-tool__caption')
        caption.contentEditable = 'true'
        caption.dataset.placeholder = this.config.captionPlaceholder || 'Add a caption...'
        caption.innerHTML = this.data.caption || ''
        caption.addEventListener('input', () => {
            this.data.caption = caption.innerHTML
        })

        this.wrapper.appendChild(caption)
    }



    save(): VideoToolData {
        return this.data
    }

    validate(_savedData: VideoToolData): boolean {
        return true
    }

    renderSettings() {
        return [
            {
                name: 'withBorder',
                icon: `<svg width="20" height="20" viewBox="0 0 20 20"><rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" fill="none" stroke-width="2"/></svg>`,
                label: 'Add Border',
                isActive: this.data.withBorder,
                closeOnActivate: true,
                onActivate: () => {
                    this.data.withBorder = !this.data.withBorder
                    this._updateStyles()
                }
            },
            {
                name: 'stretched',
                icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h16M4 12l4-4M4 12l4 4M20 12l-4-4M20 12l-4 4"/></svg>`,
                label: 'Stretch Video',
                isActive: this.data.stretched,
                closeOnActivate: true,
                onActivate: () => {
                    this.data.stretched = !this.data.stretched
                    this._updateStyles()
                }
            },
            {
                name: 'withBackground',
                icon: `<svg width="20" height="20" viewBox="0 0 20 20"><rect x="2" y="2" width="16" height="16" rx="2" fill="currentColor"/></svg>`,
                label: 'Add Background',
                isActive: this.data.withBackground,
                closeOnActivate: true,
                onActivate: () => {
                    this.data.withBackground = !this.data.withBackground
                    this._updateStyles()
                }
            },
            {
                name: 'alignLeft',
                icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="21" y1="6" x2="3" y2="6"></line><line x1="15" y1="12" x2="3" y2="12"></line><line x1="17" y1="18" x2="3" y2="18"></line></svg>`,
                label: 'Align Left',
                isActive: this.data.alignment === 'left',
                closeOnActivate: true,
                onActivate: () => {
                    this.data.alignment = 'left'
                    this._updateStyles()
                }
            },
            {
                name: 'alignCenter',
                icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="21" y1="6" x2="3" y2="6"></line><line x1="19" y1="12" x2="5" y2="12"></line><line x1="21" y1="18" x2="3" y2="18"></line></svg>`,
                label: 'Align Center',
                isActive: this.data.alignment === 'center',
                closeOnActivate: true,
                onActivate: () => {
                    this.data.alignment = 'center'
                    this._updateStyles()
                }
            },
            {
                name: 'alignRight',
                icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="12" x2="9" y2="12"></line><line x1="21" y1="18" x2="3" y2="18"></line></svg>`,
                label: 'Align Right',
                isActive: this.data.alignment === 'right',
                closeOnActivate: true,
                onActivate: () => {
                    this.data.alignment = 'right'
                    this._updateStyles()
                }
            }
        ]
    }

    private _updateStyles(): void {
        const container = this.wrapper?.querySelector('.custom-image-tool__image')
        if (!container) return

        container.classList.toggle('custom-image-tool--withBorder', !!this.data.withBorder)
        container.classList.toggle('custom-image-tool--stretched', !!this.data.stretched)
        container.classList.toggle('custom-image-tool--withBackground', !!this.data.withBackground)

        // Clear previous alignment classes
        container.classList.remove('custom-image-tool--left', 'custom-image-tool--center', 'custom-image-tool--right')
        // Add new alignment class
        if (this.data.alignment) {
            container.classList.add(`custom-image-tool--${this.data.alignment}`)
        }
    }
}

export default CustomVideoTool
