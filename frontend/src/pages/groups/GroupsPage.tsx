import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants'
import { PageHeader } from '../../components/shared'
import { Card, CardImage, CardContent, CardTitle, CardDescription } from '../../components/ui'

// Sample data for groups
const studentGroups = [
    {
        id: 1,
        name: 'Hiking Club',
        description: 'Campus community',
        members: '1015 members',
        image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop'
    },
    {
        id: 2,
        name: 'Coding Society',
        description: 'Campus community',
        members: '1355 members',
        image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop'
    },
    {
        id: 3,
        name: 'A Cappella',
        description: 'Campus community',
        members: '1105 members',
        image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=300&fit=crop'
    }
]

export default function GroupsPage() {
    return (
        <section className="py-12 bg-white min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <PageHeader
                    title="Student Groups"
                    subtitle="Connect, Share, and Discover on Campus"
                    action={
                        <Link to={ROUTES.HOME} className="btn-green">
                            Back to Home
                        </Link>
                    }
                />

                <div className="grid md:grid-cols-3 gap-6">
                    {studentGroups.map((group) => (
                        <Card key={group.id}>
                            <CardImage src={group.image} alt={group.name} className="h-44" />
                            <CardContent>
                                <CardTitle>{group.name}</CardTitle>
                                <CardDescription>{group.description}</CardDescription>
                                <div className="flex items-center gap-2 mt-3">
                                    <div className="flex -space-x-2">
                                        <div className="w-6 h-6 rounded-full bg-navy/20 border-2 border-white"></div>
                                        <div className="w-6 h-6 rounded-full bg-gold/30 border-2 border-white"></div>
                                        <div className="w-6 h-6 rounded-full bg-navy/10 border-2 border-white"></div>
                                    </div>
                                    <span className="text-sm text-gray-500">{group.members}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    )
}
