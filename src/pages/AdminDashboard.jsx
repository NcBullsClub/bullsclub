import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import AvailabilityTab    from './admin/AvailabilityTab'
import WhatsAppSummaryTab from './admin/WhatsAppSummaryTab'
import ResultsTab         from './admin/ResultsTab'
import AllowedEmailsTab   from './admin/AllowedEmailsTab'
import PlayerRosterTab    from './admin/PlayerRosterTab'

const TABS = [
  { id: 'availability', label: 'Availability',  icon: '📋', short: 'Availability' },
  { id: 'whatsapp',     label: 'Selection',      icon: '🏏', short: 'Selection'   },
  { id: 'results',      label: 'Results',        icon: '🏆', short: 'Results'     },
  { id: 'access',       label: 'Access',         icon: '🔑', short: 'Access'      },
  { id: 'roster',       label: 'Player Roster',  icon: '👥', short: 'Roster'      },
]

export default function AdminDashboard() {
  const { profile, isSuperAdmin } = useAuth()
  const [activeTab, setActiveTab]                   = useState('availability')
  const [selectedFixtureKey, setSelectedFixtureKey] = useState('')

  function handleSelectFixture(key) {
    setSelectedFixtureKey(key)
    setActiveTab('whatsapp')
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

      {/* ── Mobile tab grid (hidden on md+) ── */}
      <section className="md:hidden bg-white border-b border-gray-100 shadow-sm px-3 py-3 sticky top-16 z-30">
        <div className="grid grid-cols-5 gap-1.5">
          {TABS.map((tab) => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl text-center transition-all ${
                  active
                    ? 'bg-primary-dark text-accent'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg leading-none">{tab.icon}</span>
                <span className="text-[10px] font-semibold leading-tight">{tab.short}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* ── Desktop tab bar (hidden on mobile) ── */}
      <section className="hidden md:block bg-white sticky top-16 z-30 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 py-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-primary-dark text-accent'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-primary'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Tab content */}
      <section className="py-8 md:py-10 bg-surface min-h-[70vh]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Active tab title on mobile */}
          <div className="md:hidden flex items-center gap-2 mb-5">
            <span className="text-xl">{activeTabObj?.icon}</span>
            <h2 className="font-display font-bold text-primary text-xl">{activeTabObj?.label}</h2>
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
            {activeTab === 'access'       && <AllowedEmailsTab />}
            {activeTab === 'roster'       && <PlayerRosterTab />}
          </motion.div>
        </div>
      </section>
    </div>
  )
}
