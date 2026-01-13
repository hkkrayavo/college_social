import { useParams, Link } from 'react-router-dom'
import { ROUTES } from '../../constants'

export default function GroupDetailPage() {
    const { id } = useParams<{ id: string }>()

    return (
        <section className="py-12 bg-white min-h-screen">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link to={ROUTES.GROUPS} className="text-navy hover:underline mb-4 inline-block">
                    ← Back to Groups
                </Link>

                <div className="bg-gray-50 rounded-xl p-8 text-center">
                    <h1 className="text-3xl font-bold text-navy mb-4">Group Details</h1>
                    <p className="text-gray-500">
                        Viewing group with ID: <span className="font-mono bg-gray-200 px-2 py-1 rounded">{id}</span>
                    </p>
                    <p className="text-gray-400 mt-4">
                        TODO: Fetch and display group details from API
                    </p>
                </div>
            </div>
        </section>
    )
}
