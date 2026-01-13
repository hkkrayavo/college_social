import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants'
import { PageHeader } from '../../components/shared'

// Sample photos for albums
const photoAlbums = [
    { id: 1, url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=600&h=400&fit=crop', title: 'Campus Life' },
    { id: 2, url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=300&fit=crop', title: 'Sports Day' },
    { id: 3, url: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=400&h=300&fit=crop', title: 'Cultural Fest' },
    { id: 4, url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&h=300&fit=crop', title: 'Graduation' },
    { id: 5, url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop', title: 'Study Groups' },
    { id: 6, url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400&h=300&fit=crop', title: 'Library' },
]

export default function PhotosPage() {
    return (
        <section className="py-12 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <PageHeader
                    title="Photo Albums"
                    subtitle="Capture and share campus memories"
                    action={
                        <Link to={ROUTES.HOME} className="btn-green">
                            Back to Home
                        </Link>
                    }
                />

                {/* Photo Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {photoAlbums.map((photo) => (
                        <div
                            key={photo.id}
                            className="relative group rounded-xl overflow-hidden aspect-square cursor-pointer"
                        >
                            <img
                                src={photo.url}
                                alt={photo.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="absolute bottom-4 left-4 text-white font-semibold">
                                    {photo.title}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
