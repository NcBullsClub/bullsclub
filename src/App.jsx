import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import About from './pages/About'
import Teams from './pages/Teams'
import Players from './pages/Players'
import Fixtures from './pages/Fixtures'
import Results from './pages/Results'
import Gallery from './pages/Gallery'
import News from './pages/News'
import Article from './pages/Article'
import Contact from './pages/Contact'
import Sponsors from './pages/Sponsors'
import Events from './pages/Events'

function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="font-display text-8xl font-bold text-gray-100 mb-4">404</div>
      <h1 className="font-display text-3xl font-bold text-primary mb-3">Page Not Found</h1>
      <p className="text-gray-400 mb-6">The page you're looking for doesn't exist.</p>
      <a href="#/" className="btn-primary">Go Home</a>
    </div>
  )
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/players" element={<Players />} />
        <Route path="/fixtures" element={<Fixtures />} />
        <Route path="/results" element={<Results />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/news" element={<News />} />
        <Route path="/news/:slug" element={<Article />} />
        <Route path="/events" element={<Events />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/sponsors" element={<Sponsors />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  )
}
