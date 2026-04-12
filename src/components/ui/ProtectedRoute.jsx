import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

function AccessRemovedScreen({ signOut }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 text-3xl">🚫</div>
        <h2 className="font-display font-bold text-gray-800 text-xl mb-2">Access Removed</h2>
        <p className="text-sm text-gray-500 mb-6">
          Your account has been removed from the club roster. You no longer have access to this area.
          Please contact an admin if you think this is a mistake.
        </p>
        <button
          onClick={signOut}
          className="px-6 py-2.5 rounded-xl bg-primary-dark text-accent text-sm font-semibold hover:opacity-90 transition-all"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}

/**
 * Wraps a route that requires authentication.
 * Unauthenticated users are redirected to /login with a `next` param
 * so they bounce back after signing in.
 */
export function ProtectedRoute({ children }) {
  const { user, profileMissing, loading, signOut } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ next: location.pathname + location.search }} replace />
  }

  if (profileMissing) {
    return <AccessRemovedScreen signOut={signOut} />
  }

  return children
}

/**
 * Wraps a route that requires admin or superadmin role.
 * Non-admins are redirected to home.
 */
export function AdminRoute({ children }) {
  const { user, profile, profileMissing, loading, isAdmin, signOut } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ next: location.pathname }} replace />
  }

  if (profileMissing) {
    return <AccessRemovedScreen signOut={signOut} />
  }

  // Profile may still be loading after auth — wait for it
  if (user && !profile) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}
