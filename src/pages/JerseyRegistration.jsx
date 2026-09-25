import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const TEAMS = [
  { id: 'raising-bulls', label: 'Raising Bulls' },
  { id: 'royal-bulls', label: 'Royal Bulls' },
]

function normalizeName(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

function Status({ provided, label }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${provided ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
      <span>{provided ? '✓' : '○'}</span>{label} {provided ? 'provided' : 'pending'}
    </span>
  )
}

function OrderCard({ order }) {
  return (
    <article className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Submitted</p>
          <h2 className="font-display text-xl font-bold text-primary mt-0.5">{order.print_name} <span className="text-accent">#{order.jersey_number}</span></h2>
        </div>
        <span className="rounded-lg bg-primary-dark text-accent px-2.5 py-1 text-sm font-bold">{order.jersey_size}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div><p className="text-gray-400 text-xs">Sleeves</p><p className="font-semibold text-gray-700">{order.sleeve_type}</p></div>
        <div><p className="text-gray-400 text-xs">Pant</p><p className="font-semibold text-gray-700">{order.pant_size || 'Not selected'}</p></div>
        <div><p className="text-gray-400 text-xs">Cap</p><p className="font-semibold text-gray-700">{order.cap_choice}</p></div>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3">
        <Status provided={order.jersey_provided} label="Jersey" />
        <Status provided={order.pant_provided} label="Pant" />
        <Status provided={order.cap_provided} label="Cap" />
      </div>
      {order.notes && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">Note: {order.notes}</p>}
    </article>
  )
}

export default function JerseyRegistration() {
  const { profile } = useAuth()
  const [team, setTeam] = useState(profile?.team || 'raising-bulls')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadOrders() {
      setLoading(true)
      const { data, error: loadError } = await supabase.from('jersey_orders').select('*').order('player_name')
      if (loadError) setError(loadError.message)
      setOrders(data || [])
      setLoading(false)
    }
    loadOrders()
  }, [])

  const myOrder = orders.find((order) => order.team === team && (order.profile_id === profile?.id || normalizeName(order.player_name) === normalizeName(profile?.full_name)))
  const canSwitchTeam = orders.some((order) => normalizeName(order.player_name) === normalizeName(profile?.full_name))

  return (
    <div className="bg-surface min-h-[calc(100vh-8rem)]">
      <section className="bg-primary-dark text-white py-8 sm:py-12">
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-accent text-xs font-bold uppercase tracking-[0.18em] mb-2">Clubhouse · Kit desk</p>
          <h1 className="font-display text-3xl sm:text-5xl font-bold">Your <span className="text-accent">Jersey</span></h1>
          <p className="text-gray-300 text-sm mt-2">Review your submitted choices and collection status.</p>
        </div>
      </section>
      <main className="max-w-3xl mx-auto px-4 py-5 sm:py-8">
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5" aria-label="Team">
          {TEAMS.map((item) => (
            <button key={item.id} onClick={() => setTeam(item.id)} disabled={!canSwitchTeam && item.id !== profile?.team} className={`min-h-11 flex-1 rounded-xl px-4 text-sm font-bold whitespace-nowrap transition-colors disabled:opacity-40 ${team === item.id ? 'bg-primary-dark text-accent' : 'bg-white border border-gray-200 text-gray-600'}`}>
              {item.label}
            </button>
          ))}
        </div>
        {error && <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 p-4 text-sm mb-4">Unable to load jersey details: {error}</div>}
        {loading ? <div className="py-16 text-center text-gray-400">Loading your submission…</div> : myOrder ? <OrderCard order={myOrder} /> : (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
            <p className="text-3xl mb-3">👕</p>
            <h2 className="font-display text-xl font-bold text-primary">No submission assigned</h2>
            <p className="text-sm text-gray-500 mt-2">We could not find a {team === 'raising-bulls' ? 'Raising Bulls' : 'Royal Bulls'} jersey submission for your account.</p>
          </div>
        )}
        <a href="https://forms.gle/uCYXtWCYN2zE69Tx8" target="_blank" rel="noopener noreferrer" className="mt-6 flex min-h-12 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition-colors hover:border-primary hover:text-primary">
          Open the original jersey form <span aria-hidden="true">↗</span>
        </a>
      </main>
    </div>
  )
}
