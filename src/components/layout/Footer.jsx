import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-primary-dark text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Club Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center font-display font-bold text-primary-dark text-sm">
                NCB
              </div>
              <div>
                <div className="font-display font-bold text-white text-base leading-none">NC BULLS</div>
                <div className="text-accent text-xs tracking-widest">CRICKET CLUB</div>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Home of the Raising Bulls &amp; Royal Bulls. Playing cricket, building community in North Carolina.
            </p>
          </div>

          {/* Teams */}
          <div>
            <h3 className="font-display font-semibold text-white uppercase tracking-wider text-sm mb-4">Our Teams</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/teams" className="hover:text-accent transition-colors flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent inline-block" />
                  Raising Bulls
                </Link>
              </li>
              <li>
                <Link to="/teams" className="hover:text-accent transition-colors flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent-light inline-block" />
                  Royal Bulls
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display font-semibold text-white uppercase tracking-wider text-sm mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {[
                { to: '/fixtures', label: 'Fixtures' },
                { to: '/results', label: 'Results' },
                { to: '/events', label: 'Events' },
                { to: '/players', label: 'Players' },
                { to: '/news', label: 'News' },
                { to: '/contact', label: 'Join the Club' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="hover:text-accent transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display font-semibold text-white uppercase tracking-wider text-sm mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>📍 Cary, North Carolina</li>
              <li>✉️ <a href="mailto:sivab4usai@gmail.com" className="hover:text-accent transition-colors">sivab4usai@gmail.com</a></li>
              <li className="pt-2 flex gap-3">
                <a href="#" aria-label="Facebook" className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-accent hover:text-primary-dark transition-colors text-xs font-bold">f</a>
                <a href="#" aria-label="Instagram" className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-accent hover:text-primary-dark transition-colors text-xs font-bold">in</a>
                <a href="#" aria-label="YouTube" className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-accent hover:text-primary-dark transition-colors text-xs font-bold">▶</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-500">
          <span>© {new Date().getFullYear()} NC Bulls Cricket Club. All rights reserved.</span>
          <span className="flex gap-1 items-center">
            <span className="w-2 h-2 rounded-full bg-accent inline-block" />
            Raising Bulls &amp; Royal Bulls
          </span>
        </div>
      </div>
    </footer>
  )
}
