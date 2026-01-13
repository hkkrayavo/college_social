import { Navigate } from 'react-router-dom'

// Legacy page - redirects to Events (albums are now managed within events)
export function AdminAlbums() {
    return <Navigate to="/dashboard/admin/events" replace />
}

export default AdminAlbums
