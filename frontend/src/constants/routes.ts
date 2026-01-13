// Route path constants
// Use these instead of hardcoded strings for consistency

export const ROUTES = {
    HOME: '/',

    // Auth routes
    LOGIN: '/login',
    SIGNUP: '/signup',
    FORGOT_PASSWORD: '/forgot-password',

    // Main routes
    GROUPS: '/groups',
    GROUP_DETAIL: (id: string) => `/groups/${id}`,

    PHOTOS: '/photos',
    ALBUM_DETAIL: (id: string) => `/photos/${id}`,

    ANNOUNCEMENTS: '/announcements',
    ANNOUNCEMENT_DETAIL: (id: string) => `/announcements/${id}`,

    PROFILE: '/profile',
    SETTINGS: '/settings',
} as const
