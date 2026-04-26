import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import AvailabilityTab    from './admin/AvailabilityTab'
import WhatsAppSummaryTab from './admin/WhatsAppSummaryTab'
import ResultsTab         from './admin/ResultsTab'
import AllowedEmailsTab   from './admin/AllowedEmailsTab'
import PlayerRosterTab    from './admin/PlayerRosterTab'
import JoinRequestsTab    from './admin/JoinRequestsTab'
import FinancesTab           from './admin/FinancesTab'
import ClubhouseNewsTab    from './admin/ClubhouseNewsTab'
import ClubhouseEventsTab  from './admin/ClubhouseEventsTab'
import ClubhouseGalleryTab from './admin/ClubhouseGalleryTab'
import FixturesTab         from './admin/FixturesTab'
import UsersTab            from './admin/UsersTab'

// Row 1 — match day tools
const ROW1 = [
  { id: 'availability', label: 'Availability', icon: '📋', short: 'Avail.'   },
  { id: 'fixtures',     label: 'Fixtures',     icon: '🏏', short: 'Fixtures'  },
  { id: 'results',      label: 'Results',      icon: '🏆', short: 'Results'  },
  { id: 'finances',     label: 'Finances',     icon: '💰', short: 'Finances' },
]
// Row 2 — management tools
const ROW2_BASE = [
  { id: 'access',     label: 'Access',        icon: '🔑', short: 'Access'    },
  { id: 'roster',     label: 'Player Roster',  icon: '👥', short: 'Roster'    },
  { id: 'requests',   label: 'Join Requests',  icon: '📩', short: 'Requests'  },
  { id: 'clubhouse',  label: 'Clubhouse',      icon: '🏠', short: 'Clubhouse' },
]
const USERS_TAB = { id: 'users', label: 'Users', icon: '🛡️', short: 'Users' }
const TABS = [...ROW1, ...ROW2_BASE]
export default function AdminDashboard() {
  const { profile, isSuperAdmin } = useAuth()
  const ROW2 = isSuperAdmin ? [...ROW2_BASE, USERS_TAB] : ROW2_BASE
  const [activeTab, setActiveTab]                   = useState('availability')
  const [clubhouseTab, setClubhouseTab]             = useState('news')
  const [selectedFixtureKey, setSelectedFixtureKey] = useState('')
  const [pendingRequests, setPendingRequests]       = useState(0)
  const [rosterRefreshKey, setRosterRefreshKey]     = useState(0)

  function handleSelectFixture(key) {
    setSelectedFixtureKey(key)
    setActiveTab('whatsapp')
  }

  function handlePlayerDeleted() {
    setRosterRefreshKey((k) => k + 1)
  }

  const roleLabel = isSuperAdmin ? 'Super Admin' : 'Admin'
  const roleColor = isSuperAdmin
    ? 'bg-purple-100 text-purple-700 border border-purple-200'
    : 'bg-accent/20 border border-accent/40 text-accent'

  const TABS = [...ROW1, ...ROW2]

  const activeTabObj = TABS.find((t) => t.id === activeTab)

  return (
    <div>
      {/* Header — Compact for mobile */}
      <section className="bg-primary-dark text-white py-4 md:py-10 lg:py-14">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] sm:text-xs font-semibold mb-2 sm:mb-3 md:mb-4 ${roleColor}`}>
              🔐 {roleLabel}
            </div>
            <h1 className="font-display text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold mb-1 sm:mb-2 leading-tight">
              ADMIN <span className="text-accent">PANEL</span>
            </h1>
            <p className="text-gray-400 text-[11px] sm:text-xs md:text-sm">
              <span className="text-white font-medium">{profile?.full_name}</span>
              {!isSuperAdmin && profile?.team && (
                <> · <span className="text-accent">{profile.team === 'raising-bulls' ? 'Raising Bulls' : 'Royal Bulls'}</span></>
              )}
              {isSuperAdmin && <> · <span className="text-purple-400">All Teams</span></>}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Mobile tab grid — Compact 4-column single row ── */}
      <section className="md:hidden bg-white border-b border-gray-100 shadow-sm px-2 py-2 sticky top-16 z-30">
        <div className="grid grid-cols-4 gap-1">
          {TABS.map((tab) => {
            const active = activeTab === tab.id
            const badge = tab.id === 'requests' && pendingRequests > 0
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col items-center gap-0.5 py-1.5 px-0.5 rounded-lg text-center transition-all ${
                  active
                    ? 'bg-primary-dark text-accent'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl leading-none">{tab.icon}</span>
                <span className="text-[9px] font-semibold leading-tight">{tab.short}</span>
                {badge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-primary-dark rounded-full text-[8px] font-bold flex items-center justify-center leading-none">
                    {pendingRequests}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* ── Desktop tab bar — 2 rows ── */}
      <section className="hidden md:block bg-white sticky top-16 z-30 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {[ROW1, ROW2].map((row, ri) => (
            <div key={ri} className={`flex gap-1 ${ri === 0 ? 'pt-2 pb-1' : 'pb-2 pt-1'} ${ri === 0 ? 'border-b border-gray-100' : ''}`}>
              {row.map((tab) => {
                const badge = tab.id === 'requests' && pendingRequests > 0
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-primary-dark text-accent'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-primary'
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    {tab.label}
                    {badge && (
                      <span className="ml-0.5 bg-amber-400 text-primary-dark rounded-full px-1.5 text-[10px] font-bold leading-none py-0.5">
                        {pendingRequests}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </section>

      {/* Tab content — Compact for mobile */}
      <section className="py-4 md:py-8 lg:py-10 bg-surface min-h-[calc(100vh-300px)]">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          {/* Active tab title on mobile (hidden for clubhouse; handled inline with sub-nav) */}
          <div className={`md:hidden flex items-center gap-2 mb-3 ${activeTab === 'clubhouse' ? 'hidden' : ''}`}>
            <span className="text-lg">{activeTabObj?.icon}</span>
            <h2 className="font-display font-bold text-primary text-base">{activeTabObj?.label}</h2>
            {activeTabObj?.id === 'requests' && pendingRequests > 0 && (
              <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                {pendingRequests}
              </span>
            )}
          </div>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === 'availability' && <AvailabilityTab onSelectFixture={handleSelectFixture} />}
            {activeTab === 'fixtures'     && <FixturesTab />}
            {activeTab === 'whatsapp'     && <WhatsAppSummaryTab initialFixtureKey={selectedFixtureKey} />}
            {activeTab === 'results'      && <ResultsTab />}
            {activeTab === 'finances'     && <FinancesTab />}
            {activeTab === 'access'       && <AllowedEmailsTab onPlayerDeleted={handlePlayerDeleted} />}
            {activeTab === 'roster'       && <PlayerRosterTab key={rosterRefreshKey} />}
            {activeTab === 'requests'     && <JoinRequestsTab onPendingCount={setPendingRequests} />}
            {activeTab === 'users'        && isSuperAdmin && <UsersTab />}
            {activeTab === 'clubhouse'    && (
              <div>
                {/* Clubhouse title + sub-nav in one row on mobile */}
                <div className="md:hidden flex items-center gap-2 mb-3 overflow-x-auto whitespace-nowrap pb-1 -mx-3 px-3">
                  <div className="flex items-center gap-1.5 flex-shrink-0 pr-1">
                    <span className="text-base">🏠</span>
                    <h2 className="font-display font-bold text-primary text-base">Clubhouse</h2>
                  </div>
                  {[
                    { id: 'news', label: 'News', icon: '📰' },
                    { id: 'events', label: 'Events', icon: '📅' },
                    { id: 'gallery', label: 'Gallery', icon: '🖼️' },
                  ].map((s) => (
                    <button
                      key={`mobile-${s.id}`}
                      onClick={() => setClubhouseTab(s.id)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                        clubhouseTab === s.id
                          ? 'bg-primary-dark text-accent'
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-sm">{s.icon}</span>
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>

                {/* Clubhouse sub-nav — Single row with responsive sizing */}
                <div className="hidden md:flex gap-1.5 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto pb-1 -mx-3 sm:mx-0 px-3 sm:px-0">
                  {[
                    { id: 'news',    label: 'News',    icon: '📰' },
                    { id: 'events',  label: 'Events',  icon: '📅' },
                    { id: 'gallery', label: 'Gallery', icon: '🖼️' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setClubhouseTab(s.id)}
                      className={`flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                        clubhouseTab === s.id
                          ? 'bg-primary-dark text-accent'
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-base sm:text-lg">{s.icon}</span>
                      <span className="hidden sm:inline">{s.label}</span>
                      <span className="sm:hidden text-[10px]">{s.label}</span>
                    </button>
                  ))}
                </div>

                {clubhouseTab === 'news'    && <ClubhouseNewsTab />}
                {clubhouseTab === 'events'  && <ClubhouseEventsTab />}
                {clubhouseTab === 'gallery' && <ClubhouseGalleryTab />}
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  )
}
