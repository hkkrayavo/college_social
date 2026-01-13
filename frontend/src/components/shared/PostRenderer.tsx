import { memo, createElement, type ReactNode } from 'react'
import { getMediaUrl } from '../../utils/helpers'

interface Block {
    id?: string
    type: string
    data: Record<string, any>
}

interface EditorData {
    time?: number
    blocks: Block[]
    version?: string
}

interface PostRendererProps {
    content: string | EditorData | null
    className?: string
}

function PostRendererComponent({ content, className = '' }: PostRendererProps) {
    if (!content) return null

    // Parse content if it's a string
    let data: EditorData
    try {
        data = typeof content === 'string' ? JSON.parse(content) : content
    } catch {
        // If parsing fails, treat as plain text
        return <p className={className}>{String(content)}</p>
    }

    if (!data.blocks || !Array.isArray(data.blocks)) {
        return null
    }

    const renderBlock = (block: Block, index: number): ReactNode => {
        const key = block.id || `block-${index}`

        switch (block.type) {
            case 'header': {
                const level = block.data.level || 2
                const headingClass = `font-bold text-navy ${level === 2 ? 'text-2xl mt-6 mb-3' :
                    level === 3 ? 'text-xl mt-5 mb-2' :
                        'text-lg mt-4 mb-2'
                    }`
                return createElement(`h${level}`, {
                    key,
                    className: headingClass,
                    dangerouslySetInnerHTML: { __html: block.data.text }
                })
            }

            case 'paragraph':
                return (
                    <p
                        key={key}
                        className="text-gray-700 leading-relaxed mb-4"
                        dangerouslySetInnerHTML={{ __html: block.data.text }}
                    />
                )

            case 'list':
                const ListTag = block.data.style === 'ordered' ? 'ol' : 'ul'
                return (
                    <ListTag
                        key={key}
                        className={`mb-4 ml-6 ${block.data.style === 'ordered' ? 'list-decimal' : 'list-disc'
                            }`}
                    >
                        {block.data.items.map((item: string, i: number) => (
                            <li
                                key={i}
                                className="text-gray-700 mb-1"
                                dangerouslySetInnerHTML={{ __html: item }}
                            />
                        ))}
                    </ListTag>
                )

            case 'image': {
                const imageUrl = block.data.file?.url || block.data.url
                const alignmentClass = block.data.alignment === 'left' ? 'float-left mr-6 mb-4 max-w-[50%]' :
                    block.data.alignment === 'right' ? 'float-right ml-6 mb-4 max-w-[50%]' :
                        'mx-auto'

                return (
                    <figure key={key} className={`my-6 ${alignmentClass} ${block.data.stretched ? 'w-full' : ''}`}>
                        <img
                            src={getMediaUrl(imageUrl)}
                            alt={block.data.caption || 'Image'}
                            className={`rounded-lg max-w-full ${!block.data.alignment || block.data.alignment === 'center' ? 'mx-auto' : ''} ${block.data.stretched ? 'w-full' : ''
                                } ${block.data.withBorder ? 'border border-gray-200' : ''}`}
                        />
                        {block.data.caption && (
                            <figcaption className="text-center text-sm text-gray-500 mt-2">
                                {block.data.caption}
                            </figcaption>
                        )}
                    </figure>
                )
            }

            case 'embed':
                // ... (embed logic unchanged for now as it's not our custom tool) ...
                if (block.data.service === 'youtube') {
                    return (
                        <div key={key} className="my-6 aspect-video">
                            <iframe
                                src={block.data.embed}
                                className="w-full h-full rounded-lg"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    )
                }
                if (block.data.service === 'vimeo') {
                    return (
                        <div key={key} className="my-6 aspect-video">
                            <iframe
                                src={block.data.embed}
                                className="w-full h-full rounded-lg"
                                frameBorder="0"
                                allow="autoplay; fullscreen; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    )
                }
                return null

            case 'video': {
                const url = block.data.url
                const isYouTube = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
                const isVimeo = url.match(/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:[a-zA-Z0-9_\-]+)?/i)

                const alignmentClass = block.data.alignment === 'left' ? 'float-left mr-6 mb-4 max-w-[50%]' :
                    block.data.alignment === 'right' ? 'float-right ml-6 mb-4 max-w-[50%]' :
                        'mx-auto'

                // For iframes (embeds), we need to ensure aspect ratio is maintained.
                // Floating embeds might be tricky with aspect-ratio utilities if width isn't fixed.
                // But max-w-[50%] + aspect-video should work.

                if (isYouTube) {
                    const videoId = isYouTube[1]
                    return (
                        <div key={key} className={`my-6 ${alignmentClass} ${block.data.stretched ? 'w-full' : ''} ${!block.data.alignment || block.data.alignment === 'center' ? 'aspect-video' : ''} ${block.data.withBackground ? 'p-4 bg-gray-100 rounded-xl' : ''}`}>
                            {/* If floated, we usually want width controlled by max-w-[50%]. aspect-video helps height. */}
                            <div className={`${(block.data.alignment === 'left' || block.data.alignment === 'right') ? 'aspect-video w-full' : 'w-full h-full'}`}>
                                <iframe
                                    src={`https://www.youtube.com/embed/${videoId}`}
                                    className={`w-full h-full rounded-lg ${block.data.withBorder ? 'border-2 border-gray-200' : ''}`}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                            {block.data.caption && (
                                <div className="text-center text-sm text-gray-500 mt-2">
                                    {block.data.caption}
                                </div>
                            )}
                        </div>
                    )
                } else if (isVimeo) {
                    const videoId = isVimeo[1]
                    return (
                        <div key={key} className={`my-6 ${alignmentClass} ${block.data.stretched ? 'w-full' : ''} ${!block.data.alignment || block.data.alignment === 'center' ? 'aspect-video' : ''} ${block.data.withBackground ? 'p-4 bg-gray-100 rounded-xl' : ''}`}>
                            <div className={`${(block.data.alignment === 'left' || block.data.alignment === 'right') ? 'aspect-video w-full' : 'w-full h-full'}`}>
                                <iframe
                                    src={`https://player.vimeo.com/video/${videoId}`}
                                    className={`w-full h-full rounded-lg ${block.data.withBorder ? 'border-2 border-gray-200' : ''}`}
                                    frameBorder="0"
                                    allow="autoplay; fullscreen; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                            {block.data.caption && (
                                <div className="text-center text-sm text-gray-500 mt-2">
                                    {block.data.caption}
                                </div>
                            )}
                        </div>
                    )
                } else {
                    return (
                        <figure key={key} className={`my-6 ${alignmentClass} ${block.data.stretched ? 'w-full' : ''} ${block.data.withBackground ? 'p-4 bg-gray-100 rounded-xl' : ''}`}>
                            <video
                                src={url}
                                controls
                                className={`rounded-lg max-w-full ${!block.data.alignment || block.data.alignment === 'center' ? 'mx-auto' : ''} ${block.data.stretched ? 'w-full' : ''
                                    } ${block.data.withBorder ? 'border border-gray-200' : ''}`}
                            />
                            {block.data.caption && (
                                <figcaption className="text-center text-sm text-gray-500 mt-2">
                                    {block.data.caption}
                                </figcaption>
                            )}
                        </figure>
                    )
                }
            }

            case 'quote':
                return (
                    <blockquote
                        key={key}
                        className="border-l-4 border-gold pl-4 my-6 italic text-gray-600"
                    >
                        <p dangerouslySetInnerHTML={{ __html: block.data.text }} />
                        {block.data.caption && (
                            <cite className="block mt-2 text-sm text-gray-500 not-italic">
                                — {block.data.caption}
                            </cite>
                        )}
                    </blockquote>
                )

            case 'delimiter':
                return (
                    <hr key={key} className="my-8 border-t border-gray-200" />
                )

            default:
                // Unknown block type - try to render as text
                if (block.data.text) {
                    return (
                        <p key={key} className="text-gray-700 mb-4">
                            {block.data.text}
                        </p>
                    )
                }
                return null
        }
    }

    return (
        <div className={`post-content ${className}`}>
            {data.blocks.map((block, index) => renderBlock(block, index))}
        </div>
    )
}

export const PostRenderer = memo(PostRendererComponent)
export default PostRenderer
