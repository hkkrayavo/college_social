import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ROUTES } from '../../constants'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export default function HomePage() {
    const [heroBackground, setHeroBackground] = useState<string | null>(null)

    useEffect(() => {
        // Fetch hero background image setting
        fetch(`${API_URL}/settings/hero_background_image`)
            .then(res => res.json())
            .then(data => {
                if (data.success && data.value) {
                    setHeroBackground(data.value)
                }
            })
            .catch(err => console.error('Failed to fetch hero background:', err))
    }, [])

    return (
        <section
            className="min-h-screen flex items-center justify-center pt-16 relative overflow-hidden"
            style={{
                backgroundImage: heroBackground
                    ? `linear-gradient(rgba(26, 54, 93, 0.85), rgba(26, 54, 93, 0.9)), url(${heroBackground})`
                    : 'linear-gradient(135deg, #1a365d 0%, #2d3748 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
        >
            <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                    Your College Community
                </h1>
                <p className="text-xl md:text-2xl text-gold mb-4 max-w-2xl mx-auto">
                    Connect, Share, and Discover on Campus
                </p>
                <p className="text-base text-white/70 mb-8 max-w-xl mx-auto">
                    Join student groups, share event albums, get announcements, and stay connected with your college community — all in one place.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                    <Link to={ROUTES.SIGNUP} className="btn-gold py-3 px-8 text-base">
                        Join Us
                    </Link>
                    <Link to={ROUTES.LOGIN} className="btn-outline-white py-3 px-8 text-base">
                        Sign In
                    </Link>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap justify-center gap-8 md:gap-16">
                    <div className="text-center">
                        <div className="text-3xl md:text-4xl font-bold text-gold">500+</div>
                        <div className="text-white/70 text-sm">Active Students</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl md:text-4xl font-bold text-gold">50+</div>
                        <div className="text-white/70 text-sm">Student Groups</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl md:text-4xl font-bold text-gold">100+</div>
                        <div className="text-white/70 text-sm">Events Shared</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl md:text-4xl font-bold text-gold">1K+</div>
                        <div className="text-white/70 text-sm">Photos Uploaded</div>
                    </div>
                </div>
            </div>
        </section>
    )
}
