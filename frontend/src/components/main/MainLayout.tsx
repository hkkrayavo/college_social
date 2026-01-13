import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import BottomNav from './BottomNav'

const MainLayout = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="pt-16">
                <Outlet />
            </main>

            <BottomNav />

            {/* Add padding at bottom for mobile nav */}
            <div className="h-16 md:hidden"></div>
        </div>
    )
}

export default MainLayout
