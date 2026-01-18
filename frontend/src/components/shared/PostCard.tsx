import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from '../common'
import { LikeButton } from './LikeButton'
import { LikersList } from './LikersList'
import { CommentSection } from './CommentSection'
import type { Post } from '../../types/posts.types'
import { formatRelativeTime, getReadTime } from '../../utils/helpers'

interface PostCardProps {
    post: Post
    onDelete?: (e: React.MouseEvent, postId: string) => void
    showStatus?: boolean
}

export function PostCard({ post, onDelete, showStatus = false }: PostCardProps) {
    const [showLikers, setShowLikers] = useState(false)
    const [showComments, setShowComments] = useState(false)
    const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0)
    const [likesCount, setLikesCount] = useState(post.likesCount || 0)
    const [likersKey, setLikersKey] = useState(0)

    return (
        <article className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:border-indigo-300 transition-colors">
            {/* Author Header */}
            <div className="px-5 pt-5 flex items-center gap-3">
                <Avatar
                    src={post.author?.profilePictureUrl}
                    name={post.author?.name || 'User'}
                    size="md"
                    className="bg-gradient-to-br from-navy to-gold"
                    fallbackClassName="bg-gradient-to-br from-navy to-gold text-white"
                />
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                        {post.author?.name || 'Unknown'}
                    </div>
                    <div className="text-sm text-gray-500">
                        {formatRelativeTime(post.createdAt)}
                    </div>
                </div>

                {/* Status Badge */}
                {showStatus && post.status && (
                    <div className={`px-2 py-1 rounded-full text-xs font-medium capitalize whitespace-nowrap ${post.status === 'approved' ? 'bg-green-100 text-green-700' :
                        post.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                        }`}>
                        {post.status}
                    </div>
                )}

                {/* Read Time */}
                <span className="text-xs text-gray-400 whitespace-nowrap">{getReadTime(post.content)}</span>

                {/* Delete Button */}
                {onDelete && (
                    <button
                        onClick={(e) => onDelete(e, post.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors ml-1"
                        title="Delete Post"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Title */}
            <Link to={`/dashboard/user/posts/${post.id}`} className="block px-5 py-3">
                <h2 className="text-xl font-bold text-gray-900 hover:text-navy transition-colors">
                    {post.title || 'Untitled Post'}
                </h2>
            </Link>

            {/* Groups/Tags */}
            {post.groups && post.groups.length > 0 && (
                <div className="px-5 pb-3 flex flex-wrap gap-2">
                    {post.groups.map(group => (
                        <span
                            key={group.id}
                            className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full hover:text-navy cursor-pointer"
                        >
                            #{group.name.toLowerCase().replace(/\s+/g, '')}
                        </span>
                    ))}
                </div>
            )}

            {/* Actions */}
            <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-3">
                {/* Like Button */}
                <LikeButton
                    type="posts"
                    id={post.id}
                    initialLiked={post.liked || false}
                    initialCount={likesCount}
                    size="sm"
                    onStateChange={(_liked, count) => {
                        setLikesCount(count)
                        setLikersKey(prev => prev + 1)
                    }}
                />

                {/* View Likers Button */}
                <button
                    onClick={() => { setShowLikers(!showLikers); setShowComments(false); }}
                    className={`p-1.5 rounded-full transition-colors cursor-pointer ${showLikers ? 'bg-red-50 text-red-600' : 'text-gray-400 hover:text-red-500 hover:bg-gray-100'}`}
                    title="View who liked"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                </button>

                {/* Comments Button */}
                <button
                    onClick={() => { setShowComments(!showComments); setShowLikers(false); }}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm transition-colors cursor-pointer ${showComments ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    title="Comments"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>{commentsCount}</span>
                </button>

                {/* View Details Link */}
                <Link
                    to={`/dashboard/user/posts/${post.id}`}
                    className="ml-auto flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-navy hover:bg-navy/10 transition-colors cursor-pointer"
                >
                    View Details
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
            </div>

            {/* Likers */}
            {showLikers && (
                <div className="px-5 pb-4 border-t border-gray-100 pt-4">
                    <LikersList key={likersKey} type="posts" id={post.id} compact={false} initialCount={likesCount} />
                </div>
            )}

            {/* Comments */}
            {showComments && (
                <div className="px-5 pb-4 border-t border-gray-100 pt-4">
                    <CommentSection type="posts" id={post.id} onCountChange={setCommentsCount} />
                </div>
            )}
        </article>
    )
}
