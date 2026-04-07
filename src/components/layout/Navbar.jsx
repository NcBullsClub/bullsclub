import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import logo from '../../assets/images/logo_without_background.png'
import { useAuth } from '../../contexts/AuthContext'

/* ── Inline SVG icon component (Heroicons v2 outline) ─────── */
function NavIcon({ name, className = 'w-5 h-5' }) {
  const paths = {
    Home: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
    About: 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z',
    Teams: 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z',
    Fixtures: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z',
    Results: 'M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0',
    Gallery: 'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z',
    Events: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z',
    News: 'M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6V7.5z',
    Sponsors: 'M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z',
    Availability: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    'Join Us': 'M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z',
    Clubhouse: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z',
    Admin: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
  }
  const d = paths[name]
  if (!d) return null
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  )
}

/* ── Nav data ─────────────────────────────────────────────── */
// Mobile: flat grid — Clubhouse children are surfaced directly
const mobileNavItems = [
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

// Desktop: keep Clubhouse as a dropdown group
const desktopNavItems = [
  { path: '/', label: 'Home' },
  { path: '/about', label: 'About' },
  { path: '/teams', label: 'Teams' },
  { path: '/fixtures', label: 'Fixtures' },
  { path: '/results', label: 'Results' },
  {
    label: 'Clubhouse',
    group: true,
    children: [
      { path: '/gallery', label: 'Gallery' },
      { path: '/events', label: 'Events' },
      { path: '/news', label: 'News' },
    ],
  },
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
  const [clubhouseOpen, setClubhouseOpen] = useState(false)
  const clubhouseRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (clubhouseRef.current && !clubhouseRef.current.contains(e.target)) {
        setClubhouseOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <>
      {/* ── Top bar ──────────────────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-primary-dark shadow-lg' : 'bg-primary-dark/95'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0 group">
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

            {/* ── Desktop Nav ────────────────────────────────── */}
            <div className="hidden lg:flex items-center gap-1">
              {desktopNavItems.map((item) => {
                if (item.group) {
                  const isGroupActive = item.children.some(c => location.pathname === c.path)
                  return (
                    <div key={item.label} className="relative" ref={clubhouseRef}>
                      <button
                        onClick={() => setClubhouseOpen(o => !o)}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 flex items-center gap-1.5 ${
                          isGroupActive
                            ? 'bg-accent text-primary-dark'
                            : 'text-gray-200 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <NavIcon name={item.label} className="w-4 h-4" />
                        {item.label}
                        <svg
                          className={`w-3 h-3 transition-transform duration-200 ${clubhouseOpen ? 'rotate-180' : ''}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <AnimatePresence>
                        {clubhouseOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full left-0 mt-1 bg-primary-dark rounded-md shadow-lg py-1 min-w-[140px] border border-white/10 z-50"
                          >
                            {item.children.map(child => {
                              const active = location.pathname === child.path
                              return (
                                <Link
                                  key={child.path}
                                  to={child.path}
                                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                                    active ? 'text-accent bg-white/10' : 'text-gray-200 hover:text-white hover:bg-white/10'
                                  }`}
                                >
                                  <NavIcon name={child.label} className="w-4 h-4" />
                                  {child.label}
                                </Link>
                              )
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                }
                if (item.label === 'Join Us' && user) return null
                const active = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                      active
                        ? 'bg-accent text-primary-dark'
                        : 'text-gray-200 hover:text-white hover:bg-white/10'
                    } ${item.label === 'Join Us' ? '!bg-accent !text-primary-dark hover:!bg-accent-dark ml-2' : ''}`}
                  >
                    <NavIcon name={item.label} className="w-4 h-4" />
                    {item.label}
                  </Link>
                )
              })}

              {/* Desktop auth */}
              {user ? (
                <div className="flex items-center gap-2 ml-3 pl-3 border-l border-white/20">
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-accent/20 text-accent border border-accent/30 hover:bg-accent hover:text-primary-dark transition-colors"
                    >
                      <NavIcon name="Admin" className="w-3.5 h-3.5" />
                      Admin
                    </Link>
                  )}
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
                    className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-300 border border-white/20 hover:text-white hover:bg-white/10 hover:border-white/40 transition-colors"
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

            {/* ── Mobile: hamburger ──────────────────────────── */}
            <button
              className="lg:hidden p-2 rounded-md text-gray-200 hover:text-white hover:bg-white/10 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              <div className="w-6 h-6 flex flex-col justify-center gap-1.5">
                <span
                  className={`block h-0.5 bg-current rounded-full transition-all duration-300 origin-center ${
                    menuOpen ? 'rotate-45 translate-y-2' : ''
                  }`}
                />
                <span
                  className={`block h-0.5 bg-current rounded-full transition-opacity duration-300 ${
                    menuOpen ? 'opacity-0' : ''
                  }`}
                />
                <span
                  className={`block h-0.5 bg-current rounded-full transition-all duration-300 origin-center ${
                    menuOpen ? '-rotate-45 -translate-y-2' : ''
                  }`}
                />
              </div>
            </button>
          </div>
        </nav>
      </header>

      {/* ── Mobile full-screen overlay (below header) ──────── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-x-0 top-16 bottom-0 z-40 lg:hidden bg-primary-dark flex flex-col"
          >
            {/* Scrollable nav grid area */}
            <div className="flex-1 overflow-y-auto px-4 pt-5 pb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 px-1">
                Navigation
              </p>

              {/*
                4-column grid.
                10 regular items + Join Us (col-span-2) = 12 slots → 3 perfect rows.
              */}
              <div className="grid grid-cols-4 gap-2.5">
                {mobileNavItems.map((item) => {
                  const active = location.pathname === item.path
                  const isJoin = item.label === 'Join Us'

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMenuOpen(false)}
                      className={[
                        'flex flex-col items-center justify-center gap-2 py-4 px-1 rounded-2xl',
                        'transition-all duration-150 active:scale-95 select-none',
                        isJoin
                          ? 'col-span-2 bg-accent text-primary-dark shadow-md'
                          : active
                            ? 'bg-accent text-primary-dark shadow-md'
                            : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white',
                      ].join(' ')}
                    >
                      <NavIcon
                        name={item.label}
                        className={isJoin ? 'w-7 h-7' : 'w-6 h-6'}
                      />
                      <span
                        className={`font-semibold text-center leading-tight ${
                          isJoin ? 'text-sm' : 'text-xs'
                        }`}
                      >
                        {item.label}
                      </span>
                    </Link>
                  )
                })}

                {/* Admin — full-width single row, only for admins */}
                {user && isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMenuOpen(false)}
                    className={[
                      'col-span-4 flex items-center gap-4 px-6 py-5 rounded-2xl',
                      'transition-all duration-150 active:scale-[0.98] select-none',
                      location.pathname.startsWith('/admin')
                        ? 'bg-accent text-primary-dark shadow-lg'
                        : 'bg-accent/10 text-accent border border-accent/25 hover:bg-accent/20',
                    ].join(' ')}
                  >
                    <div className={`p-2.5 rounded-xl shrink-0 ${
                      location.pathname.startsWith('/admin')
                        ? 'bg-primary-dark/20'
                        : 'bg-accent/15'
                    }`}>
                      <NavIcon name="Admin" className="w-7 h-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-bold leading-tight">Admin Panel</div>
                      <div className={`text-xs mt-0.5 font-medium ${
                        location.pathname.startsWith('/admin') ? 'opacity-70' : 'text-gray-400'
                      }`}>Manage club, players &amp; results</div>
                    </div>
                    <svg className="w-5 h-5 opacity-60 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </Link>
                )}
              </div>
            </div>

            {/* Auth strip at bottom */}
            <div className="shrink-0 px-4 pb-6 pt-3 border-t border-white/10">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-primary-dark font-bold text-base shrink-0">
                    {profile?.full_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">
                      {profile?.full_name || 'Player'}
                    </div>
                    <div className="text-xs text-gray-400 truncate">{user.email}</div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500/80 hover:bg-red-500 active:scale-95 transition-all duration-150 shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold bg-accent text-primary-dark hover:bg-accent-dark transition-colors"
                  >
                    Create Account
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
