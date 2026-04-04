import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import logo from '../../assets/images/logo_without_background.png'
import { useAuth } from '../../contexts/AuthContext'

const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/about', label: 'About' },
  { path: '/teams', label: 'Teams' },
  { path: '/fixtures', label: 'Fixtures' },
  { path: '/results', label: 'Results' },
  { path: '/gallery', label: 'Gallery' },
  { path: '/events', label: 'Events' },
  { path: '/news', label: 'News' },
  { path: '/sponsors', label: 'Sponsors' },
  { path: '/availability', label: 'Availability' },
  { path: '/contact', label: 'Join Us' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, profile, isAdmin, signOut } = useAuth()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location])

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-primary-dark shadow-lg' : 'bg-primary-dark/95'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="transition-all duration-300 rounded-full overflow-hidden bg-white shadow-md p-0.5">
              <img
                src={logo}
                alt="NC Bulls Cricket Club"
                className="h-10 w-10 object-contain rounded-full"
              />
            </div>
            <div className="leading-tight">
              <div className="font-display font-bold text-white text-sm sm:text-base leading-none">
                NC BULLS
              </div>
              <div className="text-accent text-xs font-medium tracking-widest">
                CRICKET CLUB
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = location.pathname === link.path
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                    active
                      ? 'bg-accent text-primary-dark'
                      : 'text-gray-200 hover:text-white hover:bg-white/10'
                  } ${link.label === 'Join Us' ? '!bg-accent !text-primary-dark hover:!bg-accent-dark ml-2' : ''}`}
                >
                  {link.label}
                </Link>
              )
            })}

            {/* Auth section */}
            {user ? (
              <div className="flex items-center gap-2 ml-3 pl-3 border-l border-white/20">
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="px-3 py-1.5 rounded-md text-xs font-semibold bg-accent/20 text-accent border border-accent/30 hover:bg-accent hover:text-primary-dark transition-colors"
                  >
                    Admin
                  </Link>
                )}
                {/* User avatar pill */}
                <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
                  <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-primary-dark font-bold text-xs">
                    {profile?.full_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <span className="text-sm text-white font-medium max-w-[100px] truncate">
                    {profile?.full_name?.split(' ')[0] || 'Player'}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="ml-3 px-4 py-1.5 rounded-md text-sm font-semibold bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            className="lg:hidden p-2 rounded-md text-gray-200 hover:text-white hover:bg-white/10"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <div className="w-6 flex flex-col gap-1.5">
              <span
                className={`block h-0.5 bg-current transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`}
              />
              <span
                className={`block h-0.5 bg-current transition-opacity duration-300 ${menuOpen ? 'opacity-0' : ''}`}
              />
              <span
                className={`block h-0.5 bg-current transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`}
              />
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden overflow-hidden"
            >
              <div className="py-3 space-y-1 border-t border-white/10">
                {navLinks.map((link) => {
                  const active = location.pathname === link.path
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`block px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                        active
                          ? 'bg-accent text-primary-dark'
                          : 'text-gray-200 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {link.label}
                    </Link>
                  )
                })}
                {/* Mobile auth */}
                <div className="border-t border-white/10 pt-3 mt-2 space-y-1">
                  {user ? (
                    <>
                      <div className="px-4 py-2 text-sm text-gray-400">
                        Signed in as <span className="text-white font-medium">{profile?.full_name}</span>
                      </div>
                      {isAdmin && (
                        <Link to="/admin" className="block px-4 py-2.5 rounded-md text-sm font-medium text-accent hover:bg-white/10">
                          Admin Dashboard
                        </Link>
                      )}
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2.5 rounded-md text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login"  className="block px-4 py-2.5 rounded-md text-sm font-medium text-gray-200 hover:bg-white/10 hover:text-white">Sign In</Link>
                      <Link to="/signup" className="block px-4 py-2.5 rounded-md text-sm font-medium bg-accent text-primary-dark">Create Account</Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  )
}
