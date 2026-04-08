import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { turso } from '../lib/turso'

const TAG_ICONS = {
  'match report':   '🏏',
  'match-report':   '🏏',
  'win':            '🏆',
  'victory':        '🏆',
  'loss':           '📉',
  'announcement':   '📢',
  'league':         '🏅',
  'mega bash':      '⚡',
  'mega-bash':      '⚡',
  't20':            '🔥',
  'championship':   '🥇',
  'tournament':     '🎯',
  'registration':   '📝',
  'trials':         '🎽',
  'training':       '🏋️',
  'event':          '📅',
  'events':         '📅',
  'raising bulls':  '🐂',
  'royal bulls':    '👑',
  'news':           '📰',
  'season':         '📆',
  'milestone':      '🌟',
  'squad':          '👥',
  'fundraiser':     '💰',
  'sponsor':        '🤝',
  'community':      '🤲',
}

function tagWithIcon(tag) {
  const icon = TAG_ICONS[tag.toLowerCase().trim()]
  return icon ? `${icon} ${tag}` : tag
}

/* ── Share button ────────────────────────────────────── */
function ShareButton({ title, url }) {
  const [open, setOpen]     = useState(false)
  const [copied, setCopied] = useState(false)
  const ref                 = useRef(null)

  // Close popover when clicking outside
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  async function handleShare() {
    if (navigator.share) {
      try { await navigator.share({ title, url }) } catch (_) { /* user cancelled */ }
    } else {
      setOpen((v) => !v)
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => { setCopied(false); setOpen(false) }, 1800)
  }

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`
  const twitter  = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleShare}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-dark text-white text-sm font-semibold hover:bg-primary transition-colors active:scale-95"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        Share
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 right-0 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-20"
          >
            <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase px-4 pt-3 pb-1.5">Share article</p>

            {/* WhatsApp */}
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
            >
              <span className="w-7 h-7 rounded-lg bg-[#25D366] flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </span>
              WhatsApp
            </a>

            {/* Twitter / X */}
            <a
              href={twitter}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
            >
              <span className="w-7 h-7 rounded-lg bg-black flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </span>
              Share on X
            </a>

            {/* Copy link */}
            <button
              onClick={copyLink}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 border-t border-gray-100"
            >
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${copied ? 'bg-green-500' : 'bg-gray-200'}`}>
                {copied ? (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                )}
              </span>
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Article() {
  const { slug } = useParams()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    turso.execute({ sql: 'SELECT * FROM news WHERE slug=? LIMIT 1', args: [slug] })
      .then(({ rows }) => {
        if (rows.length > 0) {
          const r = rows[0]
          setArticle({
            ...r,
            date: r.published_at?.split('T')[0] ?? '',
            tags: r.tags ? JSON.parse(r.tags) : [],
          })
        }
      })
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="font-display text-6xl font-bold text-gray-200 mb-4">404</div>
        <h1 className="font-display text-2xl font-bold text-primary mb-3">Article not found</h1>
        <p className="text-gray-400 mb-6">The article you're looking for doesn't exist.</p>
        <Link to="/news" className="btn-primary">Back to News</Link>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <section className="bg-primary-dark text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Link to="/news" className="inline-flex items-center gap-2 text-gray-400 hover:text-accent text-sm mb-6 transition-colors">
              ← Back to News
            </Link>
            <div className="flex flex-wrap gap-2 mb-4">
              {article.tags.map((tag) => (
                <span key={tag} className="text-xs bg-accent/20 text-accent px-3 py-1 rounded-full border border-accent/30">
                  {tagWithIcon(tag)}
                </span>
              ))}
            </div>
            <h1 className="font-display text-3xl md:text-5xl font-bold leading-tight mb-4">
              {article.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>{new Date(article.date.replace(/-/g, '/')).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
              <span>·</span>
              <span>{article.author}</span>
              {article.team !== 'both' && (
                <>
                  <span>·</span>
                  <span className={`font-bold ${article.team === 'raising-bulls' ? 'text-accent' : 'text-accent-light'}`}>
                    {article.team === 'raising-bulls' ? 'Raising Bulls' : 'Royal Bulls'}
                  </span>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Cover image */}
      <div className="relative bg-gradient-to-br from-primary to-primary-light h-64 md:h-80 flex items-center justify-center overflow-hidden">
        {article.cover_image_url ? (
          <img
            src={article.cover_image_url}
            alt={article.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <span className="font-display font-bold text-white/10 text-9xl">NCB</span>
        )}
      </div>

      {/* Content */}
      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="prose prose-lg max-w-none"
          >
            {article.content.split('\n\n').map((para, i) => (
              <p key={i} className="text-gray-600 leading-relaxed mb-5 text-base md:text-lg">
                {para}
              </p>
            ))}
          </motion.div>

          <div className="mt-10 pt-8 border-t border-gray-100 flex items-center justify-between">
            <Link to="/news" className="text-primary hover:text-accent font-medium text-sm transition-colors">
              ← All News
            </Link>
            <ShareButton
              title={article.title}
              url={window.location.href}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
