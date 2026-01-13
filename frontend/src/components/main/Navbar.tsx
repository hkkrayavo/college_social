import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const Navbar = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const { user, isAuthenticated } = useAuth()

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-navy border-b border-gold/20 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-9 h-9 rounded-full bg-gold flex items-center justify-center transition-transform group-hover:scale-105">
                            <span className="text-navy font-bold text-lg">C</span>
                        </div>
                        <span className="text-xl font-serif font-bold text-white">College</span>
                    </Link>

                    {/* Auth Buttons / Dashboard Link */}
                    <div className="hidden md:flex items-center gap-4">
                        {isAuthenticated ? (
                            <>
                                <Link to="/dashboard" className="btn-gold flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                    Dashboard
                                </Link>
                                <span className="text-white/60 text-sm">Hi, {user?.name?.split(' ')[0]}</span>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-white/80 hover:text-gold font-medium transition-colors">
                                    Log In
                                </Link>
                                <Link to="/signup" className="btn-gold">
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-white hover:text-gold transition-colors"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {mobileMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-navy-dark border-t border-gold/20 py-4 px-4">
                    <div className="flex flex-col gap-4">
                        {isAuthenticated ? (
                            <>
                                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="btn-gold text-center">
                                    Dashboard
                                </Link>
                                <span className="text-white/60 text-sm text-center">Logged in as {user?.name}</span>
                            </>
                        ) : (
                            <>
                                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-white font-medium text-left hover:text-gold">Log In</Link>
                                <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="btn-gold text-center">
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    )
}

export default Navbar
