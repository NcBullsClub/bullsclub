import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import AvailabilityTab    from './admin/AvailabilityTab'
import WhatsAppSummaryTab from './admin/WhatsAppSummaryTab'
import ResultsTab         from './admin/ResultsTab'
import AllowedEmailsTab   from './admin/AllowedEmailsTab'
import PlayerRosterTab    from './admin/PlayerRosterTab'

const TABS = [
  { id: 'availability', label: '📋 Availability' },
  { id: 'whatsapp',     label: '🏏 Selection'    },
  { id: 'results',      label: '🏆 Results'      },
  { id: 'access',       label: '🔑 Access'       },
  { id: 'roster',       label: '👥 Player Roster' },
]

export default function AdminDashboard() {
  const { profile, isSuperAdmin } = useAuth()
  const [activeTab, setActiveTab]  = useState('availability')

  const roleLabel = isSuperAdmin ? 'Super Admin' : 'Admin'
  const roleColor = isSuperAdmin
    ? 'bg-purple-100 text-purple-700 border border-purple-200'
    : 'bg-accent/20 border border-accent/40 text-accent'

  return (
    <div>
      {/* Header */}
      <section className="bg-primary-dark text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-4 ${roleColor}`}>
              🔐 {roleLabel} Dashboard
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-bold mb-2">
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

      {/* Tab navigation */}
      <section className="bg-white sticky top-16 z-30 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto gap-1 py-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-primary-dark text-accent'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Tab content */}
      <section className="py-10 bg-surface min-h-[70vh]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === 'availability' && <AvailabilityTab />}
            {activeTab === 'whatsapp'     && <WhatsAppSummaryTab />}
            {activeTab === 'results'      && <ResultsTab />}
            {activeTab === 'access'       && <AllowedEmailsTab />}
            {activeTab === 'roster'       && <PlayerRosterTab />}
          </motion.div>
        </div>
      </section>
    </div>
  )
}
