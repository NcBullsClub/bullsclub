import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import news from '../data/news.json'

export default function Article() {
  const { slug } = useParams()
  const article = news.find((a) => a.slug === slug)

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
                  {tag}
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

      {/* Cover image placeholder */}
      <div className="bg-gradient-to-br from-primary to-primary-light h-64 md:h-80 flex items-center justify-center">
        <span className="font-display font-bold text-white/10 text-9xl">NCB</span>
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
            <div className="text-sm text-gray-400">© {new Date().getFullYear()} NC Bulls Cricket Club</div>
          </div>
        </div>
      </section>
    </div>
  )
}
