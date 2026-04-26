import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { turso } from '../lib/turso'

const TROPHY_TAGS = new Set(['trophy', 'trophies', 'honours', 'award', 'winners', 'champion', 'champions'])
const isTrophy = (tags) => tags.some((t) => TROPHY_TAGS.has(t.toLowerCase()))

function convertDriveUrl(url) {
  if (!url) return url
  const lh3Match = url.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/)
  if (lh3Match) return `https://drive.google.com/thumbnail?id=${lh3Match[1]}&sz=w1600`
  const ucMatch = url.match(/drive\.google\.com\/uc\?.*[?&]id=([a-zA-Z0-9_-]+)/)
  if (ucMatch) return `https://drive.google.com/thumbnail?id=${ucMatch[1]}&sz=w1600`
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (fileMatch) return `https://drive.google.com/thumbnail?id=${fileMatch[1]}&sz=w1600`
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (idMatch && url.includes('drive.google.com')) return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w1600`
  return url
}

/* ── SVG icons ─────────────────────────────────────── */
function InstagramIcon() {
  return (
    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
}
function YouTubeIcon() {
  return (
    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

/* ── Photo tile ─────────────────────────────────────── */
function PhotoTile({ item, onClick, trophy = false }) {
  const [imageError, setImageError] = useState(false)

  return (
    <motion.button
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      onClick={() => onClick(item)}
      className={`relative aspect-square overflow-hidden group focus:outline-none w-full ${
        trophy ? 'rounded-2xl ring-1 ring-amber-400/40 shadow-xl shadow-amber-900/30' : ''
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary-dark to-primary" />
      {item.image_url ? (
        <>
          <img
            src={convertDriveUrl(item.thumb_url || item.image_url)}
            alt={item.title}
            className={`absolute inset-0 w-full h-full object-cover group-active:scale-95 sm:group-hover:scale-105 transition-transform duration-500 ${imageError ? 'hidden' : ''}`}
            loading="lazy"
            onError={() => setImageError(true)}
          />
          {imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-xs text-center p-2">
              <span>Unable to load image</span>
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-display font-bold text-2xl ${trophy ? 'text-amber-400/20' : 'text-white/10'}`}>NCB</span>
        </div>
      )}
      {/* always-visible caption gradient on mobile; hover on desktop */}
      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/70 to-transparent sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 flex items-end">
        <p className="text-white text-[10px] font-medium px-2 pb-1.5 line-clamp-2 leading-snug">
          {item.title}
        </p>
      </div>
      {trophy && (
        <span className="absolute top-1.5 right-1.5 text-sm pointer-events-none select-none">🏆</span>
      )}
    </motion.button>
  )
}

/* ── Section divider ────────────────────────────────── */
function SectionDivider({ icon, title, count, color = 'white' }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={`h-px flex-1 ${color === 'amber' ? 'bg-amber-500/20' : 'bg-white/10'}`} />
      <div className="text-center flex-shrink-0">
        {icon && <div className="text-xl mb-0.5">{icon}</div>}
        <h2 className={`font-display font-bold text-lg tracking-widest uppercase ${color === 'amber' ? 'text-amber-400' : 'text-white'}`}>
          {title}
        </h2>
        {count != null && (
          <p className={`text-xs mt-0.5 ${color === 'amber' ? 'text-amber-600/70' : 'text-gray-600'}`}>
            {count} photo{count !== 1 ? 's' : ''}
          </p>
        )}
      </div>
      <div className={`h-px flex-1 ${color === 'amber' ? 'bg-amber-500/20' : 'bg-white/10'}`} />
    </div>
  )
}

/* ── Main component ─────────────────────────────────── */
export default function Gallery() {
  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('All')
  const [lightbox, setLightbox] = useState(null)
  const [zoom, setZoom]               = useState(1)
  const [pan, setPan]                 = useState({ x: 0, y: 0 })
  const [isGesturing, setIsGesturing] = useState(false)
  const pinchRef   = useRef(null)
  const zoomRef    = useRef(1)
  const panRef     = useRef({ x: 0, y: 0 })
  const imgAreaRef = useRef(null)

  useEffect(() => {
    turso
      .execute('SELECT * FROM gallery ORDER BY created_at DESC')
      .then(({ rows }) =>
        setItems(rows.map((r) => ({ ...r, tags: r.tags ? JSON.parse(r.tags) : [] })))
      )
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (lightbox) { setZoom(1); setPan({ x: 0, y: 0 }); setIsGesturing(false) }
  }, [lightbox])

  // Keep refs in sync with state so touch handlers always have latest values
  useEffect(() => { zoomRef.current = zoom }, [zoom])
  useEffect(() => { panRef.current = pan }, [pan])

  // Attach non-passive touch listeners for pinch-to-zoom + drag-to-pan
  useEffect(() => {
    const el = imgAreaRef.current
    if (!el || !lightbox) return

    function getDist(t) {
      return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)
    }

    function onTouchStart(e) {
      if (e.touches.length === 2) {
        e.preventDefault()
        setIsGesturing(true)
        pinchRef.current = { type: 'pinch', startDist: getDist(e.touches), startZoom: zoomRef.current }
      } else if (e.touches.length === 1 && zoomRef.current > 1) {
        setIsGesturing(true)
        pinchRef.current = {
          type: 'pan',
          startX: e.touches[0].clientX - panRef.current.x,
          startY: e.touches[0].clientY - panRef.current.y,
        }
      } else {
        pinchRef.current = null
      }
    }

    function onTouchMove(e) {
      if (!pinchRef.current) return
      if (pinchRef.current.type === 'pinch' && e.touches.length === 2) {
        e.preventDefault()
        const ratio = getDist(e.touches) / pinchRef.current.startDist
        const newZoom = Math.min(3, Math.max(1, pinchRef.current.startZoom * ratio))
        setZoom(newZoom)
        if (newZoom <= 1) setPan({ x: 0, y: 0 })
      } else if (pinchRef.current.type === 'pan' && e.touches.length === 1 && zoomRef.current > 1) {
        e.preventDefault()
        setPan({
          x: e.touches[0].clientX - pinchRef.current.startX,
          y: e.touches[0].clientY - pinchRef.current.startY,
        })
      }
    }

    function onTouchEnd(e) {
      if (e.touches.length === 0) {
        setIsGesturing(false)
        pinchRef.current = null
        if (zoomRef.current < 1.08) { setZoom(1); setPan({ x: 0, y: 0 }) }
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: false })
    el.addEventListener('touchmove',  onTouchMove,  { passive: false })
    el.addEventListener('touchend',   onTouchEnd)
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove',  onTouchMove)
      el.removeEventListener('touchend',   onTouchEnd)
    }
  }, [lightbox])

  function zoomIn() {
    setZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))))
  }

  function zoomOut() {
    setZoom((z) => {
      const next = Math.max(1, Number((z - 0.25).toFixed(2)))
      if (next <= 1) setPan({ x: 0, y: 0 })
      return next
    })
  }

  const videoItems        = items.filter((g) => g.video_url && !g.image_url && g.tags.includes('_public'))
  const photoItems        = items.filter((g) => !!g.image_url && g.tags.includes('_public'))
  const trophyItems       = photoItems.filter((g) => isTrophy(g.tags))
  const momentItems       = photoItems.filter((g) => !isTrophy(g.tags))
  const momentTags        = [...new Set(momentItems.flatMap((g) => g.tags.filter((t) => t !== '_public')))].sort()
  const filters           = ['All', ...momentTags]
  const filteredMoments   = filter === 'All' ? momentItems : momentItems.filter((g) => g.tags.includes(filter))

  return (
    <div className="bg-black min-h-screen">

      {/* ────────────────── HERO ────────────────── */}
      <section className="bg-primary-dark pt-8 pb-6 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)', backgroundSize: '12px 12px' }} />
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="relative">
          <p className="text-accent text-[9px] font-black tracking-[0.3em] uppercase mb-1">NC Bulls Cricket Club</p>
          <h1 className="font-display text-3xl sm:text-5xl font-black leading-none">
            <span className="text-white">OUR </span>
            <span className="text-accent">GALLERY</span>
          </h1>
          <p className="text-gray-500 text-xs max-w-xs mx-auto mt-1.5">
            Trophies, moments &amp; memories
          </p>
        </motion.div>
      </section>

      {/* ────────────────── SOCIAL PROFILES ────────────────── */}
      <section className="bg-gray-900 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <p className="text-[9px] font-black tracking-[0.25em] text-gray-600 uppercase mb-2.5 text-center">Follow Our Journey</p>
          <div className="flex flex-col sm:flex-row gap-2">

            {/* Instagram — horizontal pill */}
            <motion.a
              href="https://www.instagram.com/ncbullscricketclub/"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="group relative overflow-hidden flex-1 flex items-center gap-3 rounded-xl px-4 py-3 border border-white/5 bg-gray-950 active:scale-[0.98] transition-transform"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #f0943308, #bc188808)' }} />
              <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #f09433 0%, #dc2743 50%, #bc1888 100%)' }}>
                <InstagramIcon />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-xs leading-tight">@ncbullscricketclub</p>
                <p className="text-gray-500 text-[10px]">Instagram</p>
              </div>
              <span
                className="flex-shrink-0 w-24 text-center text-[11px] font-bold px-3 py-1.5 rounded-lg text-white"
                style={{ background: 'linear-gradient(135deg, #f09433 0%, #dc2743 50%, #bc1888 100%)' }}
              >
                Follow
              </span>
            </motion.a>

            {/* YouTube — horizontal pill */}
            <motion.a
              href="https://www.youtube.com/@NCBullsCricketClub"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="group relative overflow-hidden flex-1 flex items-center gap-3 rounded-xl px-4 py-3 border border-white/5 bg-gray-950 active:scale-[0.98] transition-transform"
            >
              <div className="absolute inset-0 bg-red-900/0 group-hover:bg-red-900/10 transition-colors" />
              <div className="w-9 h-9 rounded-lg flex-shrink-0 bg-red-600 flex items-center justify-center">
                <YouTubeIcon />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-xs leading-tight">NC Bulls Cricket Club</p>
                <p className="text-gray-500 text-[10px]">YouTube</p>
              </div>
              <span className="flex-shrink-0 w-24 text-center text-[11px] font-bold px-3 py-1.5 rounded-lg bg-red-600 text-white group-hover:bg-red-500 transition-colors">
                Subscribe
              </span>
            </motion.a>

          </div>
        </div>
      </section>

      {/* ────────────────── FEATURED VIDEOS ────────────────── */}
      {videoItems.length > 0 && (
        <section className="bg-gray-950 py-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            {/* Compact single-row header */}
            <div className="flex items-center gap-2.5 mb-5">
              <span className="text-xl flex-shrink-0">🎬</span>
              <h2 className="font-display font-bold text-base sm:text-lg tracking-widest uppercase text-white leading-none">
                Featured Videos
              </h2>
              <span className="ml-auto flex-shrink-0 text-[11px] font-bold text-gray-500 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                {videoItems.length} {videoItems.length === 1 ? 'video' : 'videos'}
              </span>
            </div>
            <div className="space-y-3">
              {videoItems.map((v, i) => {
                const ytMatch = v.video_url?.match(/(?:youtu\.be\/|v=|embed\/)([\.\w-]{11})/)
                const isYouTube = !!ytMatch
                const thumbnail = ytMatch?.[1]
                  ? `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`
                  : null
                return (
                  <motion.a
                    key={v.id}
                    href={v.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="group flex items-center gap-3 rounded-xl overflow-hidden border border-white/5 bg-black/40 hover:border-white/20 active:scale-[0.98] transition-all"
                  >
                    {/* Thumbnail */}
                    <div className="flex-shrink-0 w-24 h-16 sm:w-32 sm:h-20 relative overflow-hidden bg-gray-900">
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={v.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-2xl">{isYouTube ? '▶️' : '📱'}</span>
                        </div>
                      )}
                      {/* Play overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isYouTube ? 'bg-red-600' : 'bg-gradient-to-br from-purple-500 to-pink-500'}`}>
                          <svg className="w-3.5 h-3.5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0 py-3 pr-3">
                      <p className="text-white text-sm font-semibold leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                        {v.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        {isYouTube ? (
                          <span className="text-[10px] font-bold text-red-400 bg-red-900/30 px-2 py-0.5 rounded-full">
                            ▶ YouTube
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-pink-400 bg-pink-900/30 px-2 py-0.5 rounded-full">
                            📷 Instagram
                          </span>
                        )}
                        <span className="text-gray-600 text-[10px]">Tap to watch →</span>
                      </div>
                      {v.description && (
                        <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">{v.description}</p>
                      )}
                    </div>
                  </motion.a>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ────────────────── TROPHY CABINET ────────────────── */}
      {!loading && trophyItems.length > 0 && (
        <section className="py-8 px-4 sm:px-6 lg:px-8"
          style={{ background: 'linear-gradient(to bottom, #0d0a00, #0a0a0a)' }}>
          <div className="max-w-2xl mx-auto">
            <SectionDivider icon="🏆" title="Trophy Cabinet" count={trophyItems.length} color="amber" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {trophyItems.map((item) => (
                <PhotoTile key={item.id} item={item} onClick={setLightbox} trophy />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ────────────────── TEAM MOMENTS ────────────────── */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 bg-black">
        <div className="max-w-2xl mx-auto">
          <SectionDivider icon="📸" title="Team Moments" count={!loading ? momentItems.length : null} />

          {/* Tag filters */}
          {!loading && momentTags.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-4">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    filter === f
                      ? 'bg-accent text-primary-dark'
                      : 'bg-white/5 text-gray-400 border border-white/10 active:bg-white/10'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredMoments.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📸</p>
              <p className="text-gray-500 text-sm font-medium">
                {filter === 'All' ? 'No photos yet — check back soon!' : `No photos tagged "${filter}".`}
              </p>
            </div>
          ) : (
            /* Instagram-style tight 3-col grid */
            <div className="grid grid-cols-3 gap-0.5">
              {filteredMoments.map((item) => (
                <PhotoTile key={item.id} item={item} onClick={setLightbox} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ────────────────── LIGHTBOX ────────────────── */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex flex-col"
            onClick={() => setLightbox(null)}
          >
            {/* top bar */}
            <div
              className="flex items-center justify-between px-4 py-3 flex-shrink-0 bg-black/60 backdrop-blur-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="min-w-0 pr-3">
                <p className="text-white font-semibold text-sm truncate leading-tight">{lightbox.title}</p>
                {lightbox.match_date && (
                  <p className="text-gray-400 text-xs mt-0.5">
                    {new Date(lightbox.match_date).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={zoomOut}
                  disabled={zoom <= 1}
                  className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center active:bg-white/20 transition-colors text-lg leading-none disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Zoom out"
                >
                  −
                </button>
                <span className="text-xs text-gray-300 w-12 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={zoomIn}
                  disabled={zoom >= 3}
                  className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center active:bg-white/20 transition-colors text-lg leading-none disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Zoom in"
                >
                  +
                </button>
                <button
                  onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}
                  disabled={zoom === 1}
                  className="px-2.5 h-9 rounded-full bg-white/10 text-white text-[11px] font-semibold active:bg-white/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Reset
                </button>
                <button
                  onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); setLightbox(null) }}
                  className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center active:bg-white/20 transition-colors text-xl leading-none"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            {/* image */}
            <div
              ref={imgAreaRef}
              className="flex-1 flex items-center justify-center min-h-0 safe-area-inset overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {lightbox.image_url ? (
                <motion.div
                  initial={{ scale: 0.92, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.92, opacity: 0 }}
                  className="flex items-center justify-center"
                  style={{ maxHeight: 'calc(100dvh - 120px)' }}
                >
                  <img
                    src={convertDriveUrl(lightbox.image_url)}
                    alt={lightbox.title}
                    draggable={false}
                    className={`max-w-full max-h-full object-contain select-none ${isGesturing ? '' : 'transition-transform duration-150'}`}
                    style={{
                      maxHeight: 'calc(100dvh - 120px)',
                      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                      touchAction: 'none',
                    }}
                  />
                </motion.div>
              ) : (
                <div className="w-64 h-64 bg-primary-dark rounded-2xl flex items-center justify-center">
                  <span className="font-display font-bold text-white/10 text-6xl">NCB</span>
                </div>
              )}
            </div>

            {/* caption */}
            {lightbox.description && (
              <div
                className="px-5 py-3 flex-shrink-0 bg-black/60 backdrop-blur-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-gray-400 text-xs text-center leading-relaxed">{lightbox.description}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
