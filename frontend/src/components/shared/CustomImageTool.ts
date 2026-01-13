/**
 * Custom Image Tool for Editor.js
 * Provides tabs for "Upload File" and "Add by URL"
 */

interface ImageToolData {
    url: string
    caption?: string
    withBorder?: boolean
    stretched?: boolean
    withBackground?: boolean
    alignment?: 'left' | 'center' | 'right'
}

interface ImageToolConfig {
    uploader: {
        uploadByFile: (file: File) => Promise<{ success: number; file?: { url: string } }>
    }
    captionPlaceholder?: string
}

class CustomImageTool {
    private data: ImageToolData
    private wrapper: HTMLElement | null = null
    private config: ImageToolConfig

    static get toolbox() {
        return {
            title: 'Image',
            icon: `<svg width="17" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
            </svg>`
        }
    }

    static get pasteConfig() {
        return {
            tags: ['IMG'],
            patterns: {
                image: /https?:\/\/\S+\.(gif|jpe?g|tiff|png|webp|bmp)$/i
            },
            files: {
                mimeTypes: ['image/*']
            }
        }
    }

    constructor({ data, config }: { data: ImageToolData; config: ImageToolConfig }) {
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
        this.wrapper.classList.add('custom-image-tool')

        if (this.data.url) {
            this._createImage(this.data.url)
        } else {
            this._createUploadUI()
        }

        return this.wrapper
    }

    private _createUploadUI(): void {
        if (!this.wrapper) return

        const container = document.createElement('div')
        container.classList.add('custom-image-tool__container')

        // Tabs
        const tabs = document.createElement('div')
        tabs.classList.add('custom-image-tool__tabs')
        tabs.innerHTML = `
            <button type="button" class="custom-image-tool__tab custom-image-tool__tab--active" data-tab="upload">Upload File</button>
            <button type="button" class="custom-image-tool__tab" data-tab="url">Add by URL</button>
        `

        // Upload panel
        const uploadPanel = document.createElement('div')
        uploadPanel.classList.add('custom-image-tool__panel', 'custom-image-tool__panel--active')
        uploadPanel.dataset.panel = 'upload'
        uploadPanel.innerHTML = `
            <div class="custom-image-tool__upload-button">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <span>Click to upload image</span>
            </div>
        `

        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.style.display = 'none'

        input.onchange = async (e) => {
            const target = e.target as HTMLInputElement
            const file = target.files?.[0]
            if (file) {
                await this._uploadFile(file)
            }
        }

        const uploadBtn = uploadPanel.querySelector('.custom-image-tool__upload-button')
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => input.click())
        }
        uploadPanel.appendChild(input)

        // URL panel
        const urlPanel = document.createElement('div')
        urlPanel.classList.add('custom-image-tool__panel')
        urlPanel.dataset.panel = 'url'
        urlPanel.innerHTML = `
            <div class="custom-image-tool__url-input">
                <input type="text" placeholder="Paste image URL..." class="custom-image-tool__url-field" />
                <button type="button" class="custom-image-tool__url-submit">Add Image</button>
            </div>
        `

        // Tab switching
        tabs.querySelectorAll('.custom-image-tool__tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault()
                e.stopPropagation()
                tabs.querySelectorAll('.custom-image-tool__tab').forEach(t => t.classList.remove('custom-image-tool__tab--active'))
                tab.classList.add('custom-image-tool__tab--active')

                const tabName = (tab as HTMLElement).dataset.tab
                container.querySelectorAll('.custom-image-tool__panel').forEach(p => {
                    p.classList.toggle('custom-image-tool__panel--active', (p as HTMLElement).dataset.panel === tabName)
                })
            })
        })

        container.appendChild(tabs)
        container.appendChild(uploadPanel)
        container.appendChild(urlPanel)
        this.wrapper.appendChild(container)

        // Bind URL submit after DOM append
        const urlSubmitBtn = this.wrapper.querySelector('.custom-image-tool__url-submit') as HTMLButtonElement
        const urlInputField = this.wrapper.querySelector('.custom-image-tool__url-field') as HTMLInputElement

        if (urlSubmitBtn && urlInputField) {
            urlSubmitBtn.onclick = () => {
                const url = urlInputField.value?.trim()
                if (url) {
                    this.data.url = url
                    this._createImage(url)
                }
            }

            urlInputField.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault()
                    const url = urlInputField.value?.trim()
                    if (url) {
                        this.data.url = url
                        this._createImage(url)
                    }
                }
            }
        }
    }

    private async _uploadFile(file: File): Promise<void> {
        if (!this.wrapper) return

        // Show loading
        this.wrapper.innerHTML = `
            <div class="custom-image-tool__loading">
                <div class="custom-image-tool__spinner"></div>
                <span>Uploading image...</span>
            </div>
        `

        try {
            const response = await this.config.uploader.uploadByFile(file)
            if (response.success === 1 && response.file?.url) {
                this.data.url = response.file.url
                this._createImage(response.file.url)
            } else {
                this._showError('Upload failed')
            }
        } catch (error) {
            console.error('Image upload error:', error)
            this._showError('Upload failed')
        }
    }

    private _createImage(url: string): void {
        if (!this.wrapper) return
        this.wrapper.innerHTML = ''

        const imageContainer = document.createElement('div')
        imageContainer.classList.add('custom-image-tool__image')

        if (this.data.withBorder) imageContainer.classList.add('custom-image-tool--withBorder')
        if (this.data.stretched) imageContainer.classList.add('custom-image-tool--stretched')
        if (this.data.withBackground) imageContainer.classList.add('custom-image-tool--withBackground')
        if (this.data.alignment) imageContainer.classList.add(`custom-image-tool--${this.data.alignment}`)

        const img = document.createElement('img')
        img.src = url
        img.style.maxWidth = '100%'
        img.style.borderRadius = '8px'

        imageContainer.appendChild(img)
        this.wrapper.appendChild(imageContainer)

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

    private _showError(message: string): void {
        if (!this.wrapper) return
        this.wrapper.innerHTML = `
            <div class="custom-image-tool__error">
                <span>${message}</span>
            </div>
        `
        this._createUploadUI()
    }

    save(): ImageToolData {
        return this.data
    }

    validate(_savedData: ImageToolData): boolean {
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
                label: 'Stretch Image',
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
        const imageContainer = this.wrapper?.querySelector('.custom-image-tool__image')
        if (!imageContainer) return

        imageContainer.classList.toggle('custom-image-tool--withBorder', !!this.data.withBorder)
        imageContainer.classList.toggle('custom-image-tool--stretched', !!this.data.stretched)
        imageContainer.classList.toggle('custom-image-tool--withBackground', !!this.data.withBackground)

        // Clear previous alignment classes
        imageContainer.classList.remove('custom-image-tool--left', 'custom-image-tool--center', 'custom-image-tool--right')
        // Add new alignment class
        if (this.data.alignment) {
            imageContainer.classList.add(`custom-image-tool--${this.data.alignment}`)
        }
    }

    // Handle paste
    async onPaste(event: { type: string; detail: { file?: File; data?: string } }) {
        if (event.type === 'file' && event.detail.file) {
            await this._uploadFile(event.detail.file)
        } else if (event.type === 'pattern' && event.detail.data) {
            this.data.url = event.detail.data
            this._createImage(event.detail.data)
        }
    }
}

export default CustomImageTool
