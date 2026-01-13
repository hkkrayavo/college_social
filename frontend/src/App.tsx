import { Link } from 'react-router-dom'
import './App.css'

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

// Sample photos for albums
const photoAlbums = [
  { url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=600&h=400&fit=crop', size: 'large' },
  { url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=300&fit=crop', size: 'small' },
  { url: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=400&h=300&fit=crop', size: 'small' },
  { url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&h=300&fit=crop', size: 'small' },
  { url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop', size: 'small' }
]

// Announcements data
const announcements = [
  {
    id: 1,
    title: 'Most Recent Updates',
    description: 'Et ocon wnt wrell canmedtes thrend...',
    date: 'Nov 1, 2025'
  },
  {
    id: 2,
    title: 'Meet Announcement',
    description: 'Et ocean anti wlet thei smesrement on...',
    date: 'Sep 1, 2025'
  },
  {
    id: 3,
    title: 'Most Rescource arent',
    description: 'Et oson ent wlee thef mesrment on...',
    date: 'Sep 1, 2025'
  },
  {
    id: 4,
    title: 'Most Recent Updates',
    description: 'Et oson anti whet csmarshen thrend',
    date: 'Sep 1, 2025'
  }
]

function App() {
  return (
    <>
      {/* Hero Section */}

      {/* Hero Section */}
      <section className="hero-gradient min-h-screen flex items-center justify-center pt-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
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
            <Link to="/signup" className="btn-gold py-3 px-8 text-base">
              Join Us
            </Link>
            <button className="btn-outline-white py-3 px-8 text-base">
              Learn More
            </button>
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

      {/* Student Groups Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-navy">Student Groups</h2>
              <p className="text-gray-500 text-sm mt-1">Connect, Share, and Discover on Campus</p>
            </div>
            <button className="btn-green">
              View All Groups
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {studentGroups.map((group) => (
              <div key={group.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="h-44 overflow-hidden">
                  <img
                    src={group.image}
                    alt={group.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800">{group.name}</h3>
                  <p className="text-gray-400 text-sm">{group.description}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-navy/20 border-2 border-white"></div>
                      <div className="w-6 h-6 rounded-full bg-gold/30 border-2 border-white"></div>
                      <div className="w-6 h-6 rounded-full bg-navy/10 border-2 border-white"></div>
                    </div>
                    <span className="text-sm text-gray-500">{group.members}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-6">
            <button className="btn-green">
              View All Groups
            </button>
          </div>
        </div>
      </section>

      {/* Photo Albums Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-navy">Photo Albums</h2>
              <p className="text-gray-500 text-sm mt-1">Capture and share campus memories</p>
            </div>
            <button className="btn-green">
              See More Photos
            </button>
          </div>

          {/* Masonry-style grid */}
          <div className="grid grid-cols-3 gap-3">
            {/* Large image */}
            <div className="row-span-2 rounded-xl overflow-hidden">
              <img
                src={photoAlbums[0].url}
                alt="Album photo"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
              />
            </div>
            {/* Small images */}
            <div className="rounded-xl overflow-hidden">
              <img
                src={photoAlbums[1].url}
                alt="Album photo"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
              />
            </div>
            <div className="rounded-xl overflow-hidden">
              <img
                src={photoAlbums[2].url}
                alt="Album photo"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
              />
            </div>
            <div className="rounded-xl overflow-hidden">
              <img
                src={photoAlbums[3].url}
                alt="Album photo"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
              />
            </div>
            <div className="rounded-xl overflow-hidden">
              <img
                src={photoAlbums[4].url}
                alt="Album photo"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
              />
            </div>
          </div>

          <div className="text-center mt-6">
            <button className="btn-green">
              See More Photos
            </button>
          </div>
        </div>
      </section>

      {/* Announcements Section */}
      <section className="py-12 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gold/10 flex items-center justify-center">
              <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-navy mb-1">Announcements</h2>
            <p className="text-gray-500 text-sm">Stay updated with official college news</p>
          </div>

          {/* Announcements List */}
          <div className="divide-y divide-gray-100">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="py-4 flex justify-between items-start hover:bg-gray-50 px-4 -mx-4 transition-colors cursor-pointer rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{announcement.title}</h3>
                  <p className="text-gray-400 text-sm mt-0.5">{announcement.description}</p>
                </div>
                <div className="text-sm text-gray-400 ml-4 whitespace-nowrap">
                  {announcement.date}
                </div>
              </div>
            ))}
          </div>

          {/* View All Button */}
          <div className="text-center mt-6">
            <button className="btn-green">
              View All Updates
            </button>
          </div>
        </div>
      </section>

    </>
  )
}

export default App
