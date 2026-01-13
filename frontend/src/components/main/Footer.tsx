const Footer = () => {
    return (
        <footer className="hidden md:block bg-navy text-white py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-4 gap-8">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center">
                                <span className="text-navy font-bold">C</span>
                            </div>
                            <span className="text-xl font-serif font-bold">College</span>
                        </div>
                        <p className="text-gray-300 text-sm">
                            Your college community, connected.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4">Quick Links</h4>
                        <ul className="space-y-2 text-gray-300 text-sm">
                            <li><a href="#" className="hover:text-gold transition-colors">Home</a></li>
                            <li><a href="#" className="hover:text-gold transition-colors">Explore</a></li>
                            <li><a href="#" className="hover:text-gold transition-colors">Groups</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4">Support</h4>
                        <ul className="space-y-2 text-gray-300 text-sm">
                            <li><a href="#" className="hover:text-gold transition-colors">Help Center</a></li>
                            <li><a href="#" className="hover:text-gold transition-colors">Contact Us</a></li>
                            <li><a href="#" className="hover:text-gold transition-colors">Privacy Policy</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4">Contact</h4>
                        <ul className="space-y-2 text-gray-300 text-sm">
                            <li>admin@college.edu</li>
                            <li>+91 98765 43210</li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 mt-12 pt-8 text-center text-gray-300 text-sm">
                    <p>© 2026 College. All rights reserved.</p>
                </div>
            </div>
        </footer>
    )
}

export default Footer
