import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import news from '../data/news.json'

export default function News() {
  return (
    <div>
      {/* Header */}
      <section className="bg-primary-dark text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-5xl md:text-6xl font-bold mb-3">
              NEWS &amp; <span className="text-accent">UPDATES</span>
            </h1>
            <p className="text-gray-300 text-lg">Latest from NC Bulls Cricket Club</p>
          </motion.div>
        </div>
      </section>

      {/* News Grid */}
      <section className="py-16 bg-surface min-h-[60vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((article, i) => (
              <motion.article
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all flex flex-col"
              >
                <div className="relative h-48 bg-gradient-to-br from-primary-dark to-primary flex items-center justify-center overflow-hidden">
                  <span className="font-display font-bold text-white/10 text-8xl">NCB</span>
                  <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
                    {article.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="text-xs bg-accent/90 text-primary-dark font-bold px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                  {article.team !== 'both' && (
                    <div className="absolute top-4 right-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${article.team === 'raising-bulls' ? 'bg-primary-dark/80 text-accent' : 'bg-primary/80 text-white'}`}>
                        {article.team === 'raising-bulls' ? 'Raising Bulls' : 'Royal Bulls'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                    <span>{new Date(article.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    <span>{article.author}</span>
                  </div>
                  <h2 className="font-display font-bold text-primary text-xl mb-3 leading-snug group-hover:text-accent transition-colors">
                    {article.title}
                  </h2>
                  <p className="text-gray-500 text-sm leading-relaxed flex-1 line-clamp-3">{article.excerpt}</p>
                  <Link
                    to={`/news/${article.slug}`}
                    className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-accent transition-colors"
                  >
                    Read full story <span>→</span>
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
