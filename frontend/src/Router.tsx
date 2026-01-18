import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import SignUp from './pages/auth/SignUp'
import { Login } from './pages/auth/Login'
import { Unauthorized } from './pages/auth/Unauthorized'
import MainLayout from './components/main/MainLayout'
import { DashboardLayout } from './components/layout'
import { ProtectedRoute, DashboardRedirect } from './components/auth'
import { HomePage } from './pages/home'
import { GroupsPage, GroupDetailPage } from './pages/groups'
import { PhotosPage } from './pages/photos'
import { AnnouncementsPage } from './pages/announcements'
import { ProfilePage } from './pages/profile'
import { ROUTES } from './constants'

// Dashboard pages
import { StudentFeed, EventFeed, EventDetail, StudentProfile, CreatePost, PostFeed, PostDetail, MyPosts } from './pages/dashboard'
import { AdminDashboard, PendingUsers, AllUsers, PendingPosts, ReviewPost, AllPosts, AdminGroups, GroupMembers, AlbumPhotos, AdminEvents, EventAlbums, EventForm, AlbumForm, AdminSettings, AdminGroupTypes } from './pages/admin'

import './index.css'

function AppRouter() {
    return (
        <Router>
            <Routes>
                {/* Public routes with main layout */}
                <Route element={<MainLayout />}>
                    <Route path={ROUTES.HOME} element={<HomePage />} />
                    <Route path={ROUTES.SIGNUP} element={<SignUp />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/unauthorized" element={<Unauthorized />} />

                    {/* Legacy protected routes */}
                    <Route element={<ProtectedRoute />}>
                        <Route path={ROUTES.GROUPS} element={<GroupsPage />} />
                        <Route path="/groups/:id" element={<GroupDetailPage />} />
                        <Route path={ROUTES.PHOTOS} element={<PhotosPage />} />
                        <Route path={ROUTES.ANNOUNCEMENTS} element={<AnnouncementsPage />} />
                        <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
                    </Route>
                </Route>

                {/* Dashboard Entry Point - Smart Redirect */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<DashboardRedirect />} />
                </Route>

                {/* Student Dashboard */}
                <Route element={<ProtectedRoute />}>
                    <Route element={<DashboardLayout />}>
                        <Route path="/dashboard/user" element={<StudentFeed />} />
                        <Route path="/dashboard/user/posts" element={<PostFeed />} />
                        <Route path="/dashboard/user/posts/new" element={<CreatePost />} />
                        <Route path="/dashboard/user/posts/:id" element={<PostDetail />} />
                        <Route path="/dashboard/user/eventfeed" element={<EventFeed />} />
                        <Route path="/dashboard/user/events/:eventId" element={<EventDetail />} />
                        <Route path="/dashboard/user/profile" element={<StudentProfile />} />
                        <Route path="/dashboard/user/my-posts" element={<MyPosts />} />
                        {/* Legacy redirects */}
                        <Route path="/dashboard/feed" element={<Navigate to="/dashboard/user" replace />} />
                    </Route>
                </Route>

                {/* Admin Dashboard - under /dashboard/admin/* */}
                <Route element={<ProtectedRoute requiredRoles={['admin']} />}>
                    <Route element={<DashboardLayout isAdmin />}>
                        <Route path="/dashboard/admin" element={<AdminDashboard />} />
                        <Route path="/dashboard/admin/users/pending" element={<PendingUsers />} />
                        <Route path="/dashboard/admin/users" element={<AllUsers />} />
                        <Route path="/dashboard/admin/posts/pending" element={<PendingPosts />} />
                        <Route path="/dashboard/admin/posts/:id/review" element={<ReviewPost />} />
                        <Route path="/dashboard/admin/posts" element={<AllPosts />} />
                        <Route path="/dashboard/admin/groups" element={<AdminGroups />} />
                        <Route path="/dashboard/admin/groups/types" element={<AdminGroupTypes />} />
                        <Route path="/dashboard/admin/groups/:groupId/members" element={<GroupMembers />} />
                        <Route path="/dashboard/admin/events" element={<AdminEvents />} />
                        <Route path="/dashboard/admin/events/new" element={<EventForm />} />
                        <Route path="/dashboard/admin/events/:eventId/edit" element={<EventForm />} />
                        <Route path="/dashboard/admin/events/:eventId/albums" element={<EventAlbums />} />
                        <Route path="/dashboard/admin/events/:eventId/albums/new" element={<AlbumForm />} />
                        <Route path="/dashboard/admin/albums" element={<Navigate to="/dashboard/admin/events" replace />} />
                        <Route path="/dashboard/admin/albums/:albumId/edit" element={<AlbumForm />} />
                        <Route path="/dashboard/admin/albums/:albumId/photos" element={<AlbumPhotos />} />
                        <Route path="/dashboard/admin/settings" element={<AdminSettings />} />
                    </Route>
                </Route>

                {/* Legacy /admin redirect to new path */}
                <Route path="/admin/*" element={<Navigate to="/dashboard/admin" replace />} />

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    )
}

export default AppRouter

