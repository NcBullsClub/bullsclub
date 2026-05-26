import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// ── Supabase auth callback handling ──────────────────────────────────────────
// Problem: Supabase redirects to real paths like:
//   /reset-password?code=xxx          (PKCE success)
//   /reset-password#error=otp_expired (expired/invalid link)
//
// In dev, Vite serves index.html for any path (SPA fallback). In prod,
// GitHub Pages serves 404.html. Either way, HashRouter never sees the route
// because the path isn't a hash route (e.g. /#/reset-password).
//
// Fix: before React mounts, detect these callbacks, preserve the auth params
// in sessionStorage, then redirect to the correct hash route.
// In production after 404.html has already redirected (path = "/", hash starts
// with "#/"), this block is skipped — no double-redirect.
const _pathname = window.location.pathname
const _hash     = window.location.hash
console.log('[main] pathname:', _pathname, '| hash:', _hash, '| search:', window.location.search)
if (_pathname !== '/' && !_hash.startsWith('#/')) {
  const searchParams = window.location.search.slice(1) // "code=xxx"  (strip ?)
  const hashParams   = _hash.slice(1)                  // "error=..."  (strip #)
  console.log('[main] Intercepting auth callback — searchParams:', searchParams, '| hashParams:', hashParams)
  if (searchParams || hashParams) {
    sessionStorage.setItem('supabase_auth_params', searchParams || hashParams)
    console.log('[main] Stored in sessionStorage:', searchParams || hashParams)
  } else {
    console.warn('[main] Auth callback path detected but NO params found — code is missing from the email link!')
  }
  // Redirect to the hash-based equivalent route — React will mount correctly
  window.location.replace(`${window.location.origin}/#${_pathname}`)
  // Stop here; the page will navigate to the hash route above
} else {
  // Normal app boot
  // When a new Service Worker takes control, reload once so users get the latest
  // version automatically. Only fires after skipWaiting() (handled by autoUpdate),
  // not on every soft-reload, so auth stored in localStorage is never touched.
  if ('serviceWorker' in navigator) {
    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true
        window.location.reload()
      }
    })
  }

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </StrictMode>,
  )
}
