import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants'
import { PageHeader } from '../../components/shared'
import { formatDate } from '../../utils'

// Announcements data
const announcements = [
    {
        id: 1,
        title: 'Most Recent Updates',
        description: 'Important updates regarding campus activities and upcoming events.',
        date: new Date('2025-11-01'),
    },
    {
        id: 2,
        title: 'Meet Announcement',
        description: 'Annual general meet scheduled for next week. All students are requested to attend.',
        date: new Date('2025-09-01'),
    },
    {
        id: 3,
        title: 'Resource Center Opening',
        description: 'New resource center opening in the main building. Check timings below.',
        date: new Date('2025-09-01'),
    },
    {
        id: 4,
        title: 'Holiday Notice',
        description: 'Campus will remain closed for the upcoming national holiday.',
        date: new Date('2025-08-15'),
    },
]

export default function AnnouncementsPage() {
    return (
        <section className="py-12 bg-white min-h-screen">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <PageHeader
                    title="Announcements"
                    subtitle="Stay updated with official college news"
                    action={
                        <Link to={ROUTES.HOME} className="btn-green">
                            Back to Home
                        </Link>
                    }
                />

                {/* Announcements List */}
                <div className="divide-y divide-gray-100">
                    {announcements.map((announcement) => (
                        <div
                            key={announcement.id}
                            className="py-4 flex justify-between items-start hover:bg-gray-50 px-4 -mx-4 transition-colors cursor-pointer rounded-lg"
                        >
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-800">{announcement.title}</h3>
                                <p className="text-gray-400 text-sm mt-0.5">{announcement.description}</p>
                            </div>
                            <div className="text-sm text-gray-400 ml-4 whitespace-nowrap">
                                {formatDate(announcement.date)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
