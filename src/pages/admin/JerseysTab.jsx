import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

const TEAMS = [
  { id: 'raising-bulls', label: 'Raising Bulls' },
  { id: 'royal-bulls', label: 'Royal Bulls' },
]

const ITEMS = [
  { key: 'jersey_provided', label: 'Jersey' },
  { key: 'pant_provided', label: 'Pant' },
  { key: 'cap_provided', label: 'Cap' },
]

export default function JerseysTab() {
  const [team, setTeam] = useState('raising-bulls')
  const [orders, setOrders] = useState([])
  const [profiles, setProfiles] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(null)
  const [editingAssignment, setEditingAssignment] = useState(null)

  useEffect(() => {
    let active = true
    async function fetchOrders() {
      setError('')
      const [{ data, error: loadError }, { data: profileData, error: profileError }] = await Promise.all([
        supabase.from('jersey_orders').select('*').eq('team', team).order('player_name'),
        supabase.from('profiles').select('id, full_name, email').eq('team', team).order('full_name'),
      ])
      if (!active) return
      if (loadError) setError(loadError.message)
      if (profileError) setError(profileError.message)
      setOrders(data || [])
      setProfiles(profileData || [])
      setLoading(false)
    }
    fetchOrders()
    return () => { active = false }
  }, [team])

  async function toggleItem(order, item) {
    const nextValue = !order[item.key]
    setSaving(`${order.id}-${item.key}`)
    const { error: updateError } = await supabase.from('jersey_orders').update({
      [item.key]: nextValue,
      [`${item.key.replace('_provided', '')}_provided_at`]: nextValue ? new Date().toISOString() : null,
    }).eq('id', order.id)
    if (updateError) setError(updateError.message)
    else setOrders((current) => current.map((entry) => entry.id === order.id ? { ...entry, [item.key]: nextValue } : entry))
    setSaving(null)
  }

  async function assignProfile(order, profileId) {
    setSaving(`${order.id}-profile`)
    const { error: updateError } = await supabase.from('jersey_orders').update({ profile_id: profileId || null }).eq('id', order.id)
    if (updateError) setError(updateError.message)
    else {
      setOrders((current) => current.map((entry) => entry.id === order.id ? { ...entry, profile_id: profileId || null } : entry))
      setEditingAssignment(null)
    }
    setSaving(null)
  }

  const visibleOrders = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return orders
    return orders.filter((order) => [order.player_name, order.print_name, order.jersey_number].some((value) => String(value).toLowerCase().includes(query)))
  }, [orders, search])

  const counts = ITEMS.map((item) => ({ ...item, count: orders.filter((order) => order[item.key]).length }))

  return (
    <div>
      <div className="mb-4">
        <h2 className="font-display font-bold text-primary text-2xl">Jersey desk</h2>
        <p className="text-sm text-gray-500 mt-1">Find a submitted order and mark each item at handover.</p>
      </div>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {TEAMS.map((item) => <button key={item.id} onClick={() => setTeam(item.id)} className={`min-h-11 flex-1 rounded-xl px-4 text-sm font-bold whitespace-nowrap ${team === item.id ? 'bg-primary-dark text-accent' : 'bg-white border border-gray-200 text-gray-600'}`}>{item.label}</button>)}
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {counts.map((item) => <div key={item.key} className="bg-white border border-gray-200 rounded-xl p-3"><p className="text-[10px] uppercase font-bold tracking-wide text-gray-400">{item.label}</p><p className="text-xl font-bold text-primary mt-1">{item.count}<span className="text-xs font-normal text-gray-400"> / {orders.length}</span></p></div>)}
      </div>
      <label className="block mb-4"><span className="sr-only">Search player</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search player, print name, or number" className="w-full min-h-12 rounded-xl border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent" /></label>
      {error && <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 p-4 text-sm mb-4">{error}</div>}
      {loading ? <div className="py-16 text-center text-gray-400">Loading jersey orders…</div> : visibleOrders.length === 0 ? <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-sm text-gray-500">No matching submissions.</div> : (
        <div className="space-y-3">
          {visibleOrders.map((order) => (
            <article key={order.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-3"><div><h3 className="font-display font-bold text-primary text-lg">{order.player_name}</h3><p className="text-xs text-gray-500">Print: <strong>{order.print_name}</strong> · #{order.jersey_number} · {order.jersey_size}</p></div><span className="text-[11px] font-bold rounded-full px-2.5 py-1 bg-gray-100 text-gray-600">{order.sleeve_type}</span></div>
              <div className="flex flex-wrap gap-2">
                {ITEMS.map((item) => <button key={item.key} onClick={() => toggleItem(order, item)} disabled={saving === `${order.id}-${item.key}`} className={`min-h-11 flex-1 rounded-xl border px-3 py-2 text-xs font-bold transition-colors disabled:opacity-50 ${order[item.key] ? 'bg-green-100 border-green-300 text-green-700' : 'bg-white border-gray-300 text-gray-600'}`}><span className="block text-base leading-none mb-1">{order[item.key] ? '✓' : '○'}</span>{item.label}</button>)}
              </div>
              <div className="mt-3">
                {order.profile_id && editingAssignment !== order.id ? (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2.5">
                    <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wide text-green-700">Assigned account</p><p className="truncate text-sm font-semibold text-green-900">{profiles.find((player) => player.id === order.profile_id)?.full_name || 'Club account assigned'}</p></div>
                    <button type="button" onClick={() => setEditingAssignment(order.id)} aria-label={`Edit account assignment for ${order.player_name}`} title="Edit account assignment" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-green-300 bg-white text-lg text-green-700 transition-colors hover:bg-green-100">✎</button>
                  </div>
                ) : (
                  <label className="block text-xs font-semibold text-gray-500">{order.profile_id ? 'Edit account assignment' : 'Assign account'}
                    <select autoFocus={editingAssignment === order.id} value={order.profile_id || ''} onChange={(event) => assignProfile(order, event.target.value)} disabled={saving === `${order.id}-profile`} className="mt-1 min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50">
                      <option value="">Unassigned</option>
                      {profiles.map((player) => <option key={player.id} value={player.id}>{player.full_name}{player.email ? ` · ${player.email}` : ''}</option>)}
                    </select>
                  </label>
                )}
                <div className="mt-2 text-xs text-gray-500">Pant: {order.pant_size || 'Not selected'} · Cap: {order.cap_choice}{order.notes && <span className="block mt-1 text-amber-700">{order.notes}</span>}</div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
