import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Placeholder gallery items — user can replace src with real photo imports
const galleryItems = [
  { id: 1, label: 'Raising Bulls — League Final 2025', team: 'raising-bulls', type: 'match', color: 'from-primary-dark to-primary' },
  { id: 2, label: 'Royal Bulls — Pre-season 2026', team: 'royal-bulls', type: 'team', color: 'from-primary to-primary-light' },
  { id: 3, label: 'Victory Celebrations', team: 'raising-bulls', type: 'celebration', color: 'from-primary-dark to-accent/60' },
  { id: 4, label: 'Match Day — WakeMed Park', team: 'raising-bulls', type: 'match', color: 'from-primary to-primary-dark' },
  { id: 5, label: 'Royal Bulls Training Session', team: 'royal-bulls', type: 'training', color: 'from-primary-light to-primary-dark' },
  { id: 6, label: 'Trophy Presentation 2025', team: 'raising-bulls', type: 'celebration', color: 'from-accent/40 to-primary-dark' },
  { id: 7, label: 'Opening Ceremony 2026', team: 'both', type: 'event', color: 'from-primary-dark to-primary' },
  { id: 8, label: 'Batting Practice', team: 'royal-bulls', type: 'training', color: 'from-primary to-primary-dark' },
  { id: 9, label: 'Club Annual Dinner 2025', team: 'both', type: 'event', color: 'from-primary-dark to-accent/50' },
  { id: 10, label: 'Raising Bulls vs Triangle Hawks', team: 'raising-bulls', type: 'match', color: 'from-primary to-primary-light' },
  { id: 11, label: 'Royal Bulls Season Opener', team: 'royal-bulls', type: 'match', color: 'from-primary-dark to-primary' },
  { id: 12, label: 'Kids Cricket Camp', team: 'both', type: 'event', color: 'from-accent/30 to-primary' },
]

const filters = ['All', 'Raising Bulls', 'Royal Bulls', 'Match', 'Training', 'Event', 'Celebration']

export default function Gallery() {
  const [filter, setFilter] = useState('All')
  const [lightbox, setLightbox] = useState(null)

  const filtered = galleryItems.filter((g) => {
    if (filter === 'All') return true
    if (filter === 'Raising Bulls') return g.team === 'raising-bulls'
    if (filter === 'Royal Bulls') return g.team === 'royal-bulls'
    return g.type === filter.toLowerCase()
  })

  return (
    <div>
      {/* Header */}
      <section className="bg-primary-dark text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-5xl md:text-6xl font-bold mb-3">
              <span className="text-accent">GALLERY</span>
            </h1>
            <p className="text-gray-300 text-lg">Moments from the field — matches, celebrations, and club life</p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white sticky top-16 z-30 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-2 flex-wrap">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filter === f ? 'bg-accent text-primary-dark font-bold' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-12 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <AnimatePresence>
              {filtered.map((item, i) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.04 }}
                  className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group"
                  onClick={() => setLightbox(item)}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color}`} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                    <span className="font-display font-bold text-white/20 text-5xl">NCB</span>
                  </div>
                  <div className="absolute inset-0 bg-primary-dark/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <p className="text-white text-xs font-medium leading-snug">{item.label}</p>
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.team === 'raising-bulls' ? 'bg-primary-dark/80 text-accent' : item.team === 'royal-bulls' ? 'bg-primary/80 text-white' : 'bg-black/40 text-white'}`}>
                      {item.team === 'raising-bulls' ? 'RB' : item.team === 'royal-bulls' ? 'RY' : '🏏'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {filtered.length === 0 && (
            <div className="text-center py-20 text-gray-400">No photos in this category.</div>
          )}

          <p className="text-center text-sm text-gray-400 mt-8">
            📸 Real photos coming soon — upload your match photos to replace the placeholders!
          </p>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative max-w-2xl w-full aspect-video rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${lightbox.color}`} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display font-bold text-white/10 text-9xl">NCB</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 p-6">
                <p className="text-white font-medium">{lightbox.label}</p>
                <p className="text-gray-300 text-sm mt-1">NC Bulls Cricket Club</p>
              </div>
              <button
                onClick={() => setLightbox(null)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80 transition-colors text-xl leading-none"
              >
                ×
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
