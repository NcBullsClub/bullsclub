import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { SeasonProvider } from './contexts/SeasonContext'
import { ProtectedRoute, AdminRoute } from './components/ui/ProtectedRoute'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import About from './pages/About'
import Teams from './pages/Teams'
import Players from './pages/Players'
import Fixtures from './pages/Fixtures'
import FixtureDetail from './pages/FixtureDetail'
import Results from './pages/Results'
import Gallery from './pages/Gallery'
import News from './pages/News'
import Article from './pages/Article'
import Contact from './pages/Contact'
import Sponsors from './pages/Sponsors'
import Events from './pages/Events'
import Availability from './pages/Availability'
import PlayerFinances from './pages/PlayerFinances'
import Contacts from './pages/Contacts'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import AdminDashboard from './pages/AdminDashboard'
import PwaDiagnostics from './pages/PwaDiagnostics'
import JerseyRegistration from './pages/JerseyRegistration'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
        document.documentElement.scrollTop = 0
        document.body.scrollTop = 0
      })
    })
  }, [pathname])
  return null
}

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
    <AuthProvider>
      <SeasonProvider>
      <ScrollToTop />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/players" element={<Players />} />
          <Route path="/fixtures" element={<Fixtures />} />
          <Route path="/fixtures/:id" element={<FixtureDetail />} />
          <Route path="/results" element={<Results />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:slug" element={<Article />} />
          <Route path="/events" element={<Events />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/sponsors" element={<Sponsors />} />
          <Route path="/availability" element={<Availability />} />
          <Route path="/finances" element={<ProtectedRoute><PlayerFinances /></ProtectedRoute>} />
          <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/pwa-diagnostics" element={<PwaDiagnostics />} />
          <Route path="/jersey" element={<JerseyRegistration />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
      </SeasonProvider>
    </AuthProvider>
  )
}
