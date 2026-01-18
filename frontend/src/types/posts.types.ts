export interface Author {
    id: string
    name: string
    profilePictureUrl?: string
    avatar?: string
}

export interface Comment {
    id: string
    content: string
    author: Author
    createdAt: string
}

export interface Post {
    id: string
    title: string | null
    content: string
    author: Author
    groups: { id: string; name: string }[]
    likesCount: number
    commentsCount: number
    liked?: boolean
    comments?: Comment[]
    status?: 'approved' | 'pending' | 'rejected'
    createdAt: string
}
