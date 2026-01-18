import { useEffect, useState } from 'react'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export default function HomePage() {
    const [heroBackground, setHeroBackground] = useState<string | null>(null)

    useEffect(() => {
        // Fetch hero background image setting
        fetch(`${API_URL}/users/settings/hero_background_image`)
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
            className="min-h-screen pt-16 relative overflow-hidden bg-navy"
            style={{
                backgroundImage: heroBackground
                    ? `url(${heroBackground})`
                    : 'linear-gradient(135deg, #1a365d 0%, #2d3748 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
        >

        </section>
    )
}
