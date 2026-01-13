import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants'
import { Button } from '../../components/ui'
import { getInitials } from '../../utils'

export default function ProfilePage() {
    // TODO: Get actual user data from AuthContext
    const user = {
        name: 'John Doe',
        email: 'john.doe@college.edu',
        role: 'Student',
        phone: '+91 9876543210',
        joinedDate: 'January 2024',
    }

    return (
        <section className="py-12 bg-gray-50 min-h-screen">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link to={ROUTES.HOME} className="text-navy hover:underline mb-4 inline-block">
                    ← Back to Home
                </Link>

                {/* Profile Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-navy to-navy/80 px-6 py-8 text-center">
                        <div className="w-20 h-20 mx-auto rounded-full bg-gold text-navy font-bold text-2xl flex items-center justify-center mb-4">
                            {getInitials(user.name)}
                        </div>
                        <h1 className="text-2xl font-bold text-white">{user.name}</h1>
                        <p className="text-gold mt-1">{user.role}</p>
                    </div>

                    {/* Details */}
                    <div className="p-6 space-y-4">
                        <div className="flex justify-between py-3 border-b border-gray-100">
                            <span className="text-gray-500">Email</span>
                            <span className="text-gray-800">{user.email}</span>
                        </div>
                        <div className="flex justify-between py-3 border-b border-gray-100">
                            <span className="text-gray-500">Phone</span>
                            <span className="text-gray-800">{user.phone}</span>
                        </div>
                        <div className="flex justify-between py-3 border-b border-gray-100">
                            <span className="text-gray-500">Member Since</span>
                            <span className="text-gray-800">{user.joinedDate}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="px-6 pb-6 flex gap-4">
                        <Button variant="primary" className="flex-1">
                            Edit Profile
                        </Button>
                        <Button variant="outline" className="flex-1">
                            Settings
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    )
}
