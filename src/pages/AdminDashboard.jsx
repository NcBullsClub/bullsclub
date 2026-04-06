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

// Row 1 — match day tools
const ROW1 = [
  { id: 'availability', label: 'Availability', icon: '📋', short: 'Avail.'   },
  { id: 'whatsapp',     label: 'Selection',    icon: '🏏', short: 'Select.'  },
  { id: 'results',      label: 'Results',      icon: '🏆', short: 'Results'  },
  { id: 'finances',     label: 'Finances',     icon: '💰', short: 'Finances' },
]
// Row 2 — management tools
const ROW2 = [
  { id: 'access',     label: 'Access',        icon: '🔑', short: 'Access'    },
  { id: 'roster',     label: 'Player Roster',  icon: '👥', short: 'Roster'    },
  { id: 'requests',   label: 'Join Requests',  icon: '📩', short: 'Requests'  },
  { id: 'clubhouse',  label: 'Clubhouse',      icon: '🏠', short: 'Clubhouse' },
]
const TABS = [...ROW1, ...ROW2]

export default function AdminDashboard() {
  const { profile, isSuperAdmin } = useAuth()
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

  const activeTabObj = TABS.find((t) => t.id === activeTab)

  return (
    <div>
      {/* Header */}
      <section className="bg-primary-dark text-white py-10 md:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-4 ${roleColor}`}>
              🔐 {roleLabel} Dashboard
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold mb-2">
              ADMIN <span className="text-accent">PANEL</span>
            </h1>
            <p className="text-gray-400 text-sm">
              Logged in as{' '}
              <strong className="text-white">{profile?.full_name}</strong>
              {!isSuperAdmin && profile?.team && (
                <> &middot; <span className="text-accent">{
                  profile.team === 'raising-bulls' ? 'Raising Bulls' : 'Royal Bulls'
                }</span></>
              )}
              {isSuperAdmin && (
                <> &middot; <span className="text-purple-400">All Teams</span></>
              )}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Mobile tab grid — 2 rows of 4 ── */}
      <section className="md:hidden bg-white border-b border-gray-100 shadow-sm px-3 py-3 sticky top-16 z-30">
        <div className="space-y-1.5">
          {[ROW1, ROW2].map((row, ri) => (
            <div key={ri} className="grid grid-cols-4 gap-1.5">
              {row.map((tab) => {
                const active = activeTab === tab.id
                const badge  = tab.id === 'requests' && pendingRequests > 0
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl text-center transition-all ${
                      active
                        ? 'bg-primary-dark text-accent'
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-lg leading-none">{tab.icon}</span>
                    <span className="text-[10px] font-semibold leading-tight">{tab.short}</span>
                    {badge && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-amber-400 text-primary-dark rounded-full text-[9px] font-bold flex items-center justify-center leading-none">
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

      {/* ── Desktop tab bar — 2 rows ── */}
      <section className="hidden md:block bg-white sticky top-16 z-30 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {[ROW1, ROW2].map((row, ri) => (
            <div key={ri} className={`flex gap-1 ${ri === 0 ? 'pt-2 pb-1' : 'pb-2'} ${ri === 0 ? 'border-b border-gray-100' : ''}`}>
              {row.map((tab) => {
                const badge = tab.id === 'requests' && pendingRequests > 0
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-primary-dark text-accent'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-primary'
                    }`}
                  >
                    <span>{tab.icon}</span>
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

      {/* Tab content */}
      <section className="py-8 md:py-10 bg-surface min-h-[70vh]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Active tab title on mobile */}
          <div className="md:hidden flex items-center gap-2 mb-5">
            <span className="text-xl">{activeTabObj?.icon}</span>
            <h2 className="font-display font-bold text-primary text-xl">{activeTabObj?.label}</h2>
            {activeTabObj?.id === 'requests' && pendingRequests > 0 && (
              <span className="text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                {pendingRequests} pending
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
            {activeTab === 'whatsapp'     && <WhatsAppSummaryTab initialFixtureKey={selectedFixtureKey} />}
            {activeTab === 'results'      && <ResultsTab />}
            {activeTab === 'finances'     && <FinancesTab />}
            {activeTab === 'access'       && <AllowedEmailsTab onPlayerDeleted={handlePlayerDeleted} />}
            {activeTab === 'roster'       && <PlayerRosterTab key={rosterRefreshKey} />}
            {activeTab === 'requests'     && <JoinRequestsTab onPendingCount={setPendingRequests} />}
            {activeTab === 'clubhouse'    && (
              <div>
                {/* Clubhouse sub-nav */}
                <div className="flex gap-2 mb-6">
                  {[
                    { id: 'news',    label: 'News',    icon: '📰' },
                    { id: 'events',  label: 'Events',  icon: '📅' },
                    { id: 'gallery', label: 'Gallery', icon: '🖼️' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setClubhouseTab(s.id)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                        clubhouseTab === s.id
                          ? 'bg-primary-dark text-accent'
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span>{s.icon}</span>{s.label}
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
