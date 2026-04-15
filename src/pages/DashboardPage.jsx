import { useCallback, useEffect, useMemo, useState } from 'react'
import { haversineKm } from '../lib/geo';
import { supabase } from '../lib/supabase'
import { getOrCreateAnonUserId } from '../lib/anonUser'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Activity, TrendingUp, ShieldCheck, Bot } from 'lucide-react'

const SOUND_SCORES = {
  quiet: 10,
  'low-hum': 7,
  loud: 3,
  'sudden-noises': 2,
}

const CROWD_SCORES = {
  empty: 10,
  'spaced-out': 6,
  crowded: 2,
}

const LIGHTING_SCORES = {
  natural: 10,
  dim: 6,
  'bright-fluorescent': 4,
  flickering: 2,
}

function formatLabel(value) {
  if (value == null || value === '') return '—'
  return String(value)
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function scoreDimension(map, value) {
  if (value == null || value === '') return 5
  return map[value] ?? 5
}

function scoreSingleReport(report) {
  const s =
    (scoreDimension(SOUND_SCORES, report.sound_level) +
      scoreDimension(CROWD_SCORES, report.crowd_level) +
      scoreDimension(LIGHTING_SCORES, report.lighting)) /
    3
  return s
}

function atmosphereScore(reports) {
  if (!reports.length) return null
  const sum = reports.reduce((acc, r) => acc + scoreSingleReport(r), 0)
  return sum / reports.length
}

function sortReportsByNewest(reports) {
  return [...reports].sort((a, b) => {
    const ta = a.created_at ? new Date(a.created_at).getTime() : NaN
    const tb = b.created_at ? new Date(b.created_at).getTime() : NaN
    const aOk = !Number.isNaN(ta)
    const bOk = !Number.isNaN(tb)
    if (aOk && bOk && tb !== ta) return tb - ta
    if (bOk && !aOk) return 1
    if (aOk && !bOk) return -1
    return String(b.id ?? '').localeCompare(String(a.id ?? ''))
  })
}

function isCurrentlyCalm(reports) {
  const sorted = sortReportsByNewest(reports)
  const latest = sorted[0]
  if (!latest) return false
  return (
    latest.sound_level === 'quiet' || latest.crowd_level === 'empty'
  )
}

function categoryVenueEmoji(category) {
  const c = String(category ?? '').toLowerCase()
  if (c.includes('library')) return '🏛️'
  if (c.includes('park')) return '🌳'
  if (c.includes('cafe') || c.includes('café') || c.includes('coffee')) {
    return '☕'
  }
  if (c.includes('hospital') || c.includes('clinic')) return '🏥'
  if (c.includes('school')) return '🏫'
  return '🏠'
}

function atmosphereHealthPercent(score) {
  if (score == null) return 0
  return Math.min(100, Math.max(0, (score / 10) * 100))
}

function atmosphereHealthFill(score) {
  if (score == null) return '#5c3d1e'
  if (score > 7) return '#7ab648'
  if (score >= 4) return '#e8c96d'
  return '#c94c4c'
}

function AtmosphereHealthBar({ score }) {
  const pct = atmosphereHealthPercent(score)
  const fill = atmosphereHealthFill(score)
  const label =
    score != null ? `${score.toFixed(1)} / 10` : 'No reports'

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/40">
          Atmosphere
        </span>
        <span className="text-sm font-medium text-white/80">{label}</span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-black/40"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={10}
        aria-valuenow={score != null ? Math.round(score * 10) / 10 : 0}
        aria-label={`Atmosphere ${label}`}
      >
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            backgroundColor: fill,
            boxShadow: `0 0 10px ${fill}44`,
          }}
        />
      </div>
    </div>
  )
}

function TrendChart({ data }) {
  if (!data || data.length === 0) return null

  return (
    <div className="h-[300px] w-full rounded-3xl bg-black/20 p-6 border border-white/5">
      <h3 className="mb-6 flex items-center gap-2 font-heading text-lg font-bold text-wheat">
        <TrendingUp size={20} className="text-grass" />
        Sensory Trends (Last 24h)
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
          <XAxis 
            dataKey="time" 
            stroke="#ffffff40" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
          />
          <YAxis 
            stroke="#ffffff40" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false} 
            domain={[0, 10]}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1a1108', 
              border: '1px solid #ffffff10', 
              borderRadius: '12px',
              fontSize: '12px'
            }}
            itemStyle={{ color: '#7ab648' }}
          />
          <Line 
            type="monotone" 
            dataKey="score" 
            stroke="#7ab648" 
            strokeWidth={3} 
            dot={{ fill: '#7ab648', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function LocationCard({
  location,
  latest,
  score,
  variant = 'default',
  onConfirm,
  confirming,
  confirmError,
  alreadyConfirmed,
}) {
  const isCalm = variant === 'calm'
  const confirmedCount = latest?.confirmed_by ?? 0
  const canConfirm = Boolean(latest?.id) && !alreadyConfirmed

  return (
    <article
      className={`cozy-card group relative flex flex-col gap-5 p-6 transition-all duration-300 hover:-translate-y-1 ${
        isCalm ? 'ring-2 ring-grass/30' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden>
              {categoryVenueEmoji(location.category)}
            </span>
            <h3 className="text-xl font-bold leading-tight text-white">
              {location.name ?? 'Unknown'}
            </h3>
          </div>
          <p className="mt-1 text-sm font-medium text-wheat/60">
            {location.category ?? 'General Location'}
          </p>
        </div>
        {isCalm && (
          <span className="rounded-full bg-grass/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-grass">
            Calm Spot
          </span>
        )}
      </div>

      <div className="space-y-4">
        <AtmosphereHealthBar score={score} />
        
        <div className="rounded-xl bg-black/20 p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/30">
            Latest Report
          </p>
          {latest ? (
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
              <div className="flex items-center gap-2 text-white/60">
                <span className="opacity-50">🔊</span>
                <span className="font-medium text-white/90">{formatLabel(latest.sound_level)}</span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <span className="opacity-50">💡</span>
                <span className="font-medium text-white/90">{formatLabel(latest.lighting)}</span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <span className="opacity-50">👥</span>
                <span className="font-medium text-white/90">{formatLabel(latest.crowd_level)}</span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <span className="opacity-50">🌸</span>
                <span className="font-medium text-white/90">{formatLabel(latest.fragrance)}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm italic text-white/40">
              No reports yet... be the first! 🌱
            </p>
          )}
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
        <div className="flex items-center gap-2 text-xs text-white/40">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-grass/10 text-grass">👍</span>
          <span className="font-bold text-grass">{confirmedCount}</span>
          <span>confirmations</span>
        </div>
        
        {alreadyConfirmed ? (
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">
            Verified
          </span>
        ) : (
          <button
            type="button"
            disabled={!canConfirm || confirming}
            onClick={() => onConfirm?.(latest)}
            className="text-[10px] font-bold uppercase tracking-widest text-wheat hover:text-white disabled:opacity-20"
          >
            {confirming ? '...' : 'Confirm'}
          </button>
        )}
      </div>
      {confirmError && (
        <p className="mt-2 text-[10px] text-red-400">{confirmError}</p>
      )}
    </article>
  )
}

export default function DashboardPage() {
  const [userCoords, setUserCoords] = useState(null);
  const [locations, setLocations] = useState([])
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [confirmingReportId, setConfirmingReportId] = useState(null)
  const [confirmErrors, setConfirmErrors] = useState({})
  const [confirmedReportIds, setConfirmedReportIds] = useState(() => new Set())

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    const anonUserId = getOrCreateAnonUserId()

    const [locRes, repRes, confRes] = await Promise.all([
      supabase.from('locations').select('*'),
      supabase
        .from('sensory_reports')
        .select(
          'id, location_id, sound_level, lighting, crowd_level, fragrance, created_at, confirmed_by',
        ),
      supabase
        .from('confirmations')
        .select('report_id')
        .eq('user_id', anonUserId),
    ])

    if (locRes.error) {
      setError(locRes.error.message)
      setLocations([])
      setReports([])
      setLoading(false)
      return
    }
    if (repRes.error) {
      setError(repRes.error.message)
      setLocations([])
      setReports([])
      setLoading(false)
      return
    }
    if (confRes.error) {
      setError(confRes.error.message)
      setLocations([])
      setReports([])
      setLoading(false)
      return
    }

    setLocations(locRes.data ?? [])
    setReports(repRes.data ?? [])
    setConfirmedReportIds(
      new Set((confRes.data ?? []).map((c) => c.report_id).filter(Boolean)),
    )
    setLoading(false)
  }, [])

  useEffect(() => {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      setUserCoords({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      });
    },
    () => {
      console.log("Location permission denied");
    }
  );
}, []);

  useEffect(() => {
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])


  const handleConfirm = useCallback(
    async (latest) => {
      if (!latest?.id) return
      if (confirmedReportIds.has(latest.id)) return

      const userId = getOrCreateAnonUserId()
      setConfirmingReportId(latest.id)
      setConfirmErrors((prev) => ({ ...prev, [latest.id]: null }))

      const { error: insertError } = await supabase
        .from('confirmations')
        .insert({ user_id: userId, report_id: latest.id })

      if (insertError) {
        if (insertError.code === '23505') {
          setConfirmedReportIds((prev) => new Set(prev).add(latest.id))
          await load()
        } else {
          setConfirmErrors((prev) => ({
            ...prev,
            [latest.id]: insertError.message,
          }))
        }
        setConfirmingReportId(null)
        return
      }

      const next = (latest.confirmed_by ?? 0) + 1
      const { error: updateError } = await supabase
        .from('sensory_reports')
        .update({ confirmed_by: next })
        .eq('id', latest.id)

      if (updateError) {
        setConfirmErrors((prev) => ({
          ...prev,
          [latest.id]: updateError.message,
        }))
      } else {
        setConfirmedReportIds((prev) => new Set(prev).add(latest.id))
        await load()
      }
      setConfirmingReportId(null)
    },
    [load, confirmedReportIds],
  )

  const reportsByLocation = useMemo(() => {
    const map = new Map()
    for (const r of reports) {
      if (r.location_id == null) continue
      const list = map.get(r.location_id) ?? []
      list.push(r)
      map.set(r.location_id, list)
    }
    return map
  }, [reports])

  const enriched = useMemo(() => {
    return (locations ?? []).map((loc) => {
      const raw = reportsByLocation.get(loc.id) ?? []
      const sorted = sortReportsByNewest(raw)
      const latest = sorted[0] ?? null
      const score = atmosphereScore(sorted)
      return {
        location: loc,
        reports: sorted,
        latest,
        score,
      }
    })
  }, [locations, reportsByLocation])

  const calmSpots = useMemo(
    () => sortedNearby.filter((e) => isCurrentlyCalm(e.reports)),
    [sortedNearby],
  )

  const trendData = useMemo(() => {
    if (!reports || reports.length === 0) return []
    const now = new Date()
    const last24h = []
    for (let i = 0; i < 24; i++) {
      const d = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000)
      last24h.push({
        label: `${d.getHours()}:00`,
        reports: []
      })
    }

    reports.forEach(r => {
      const rd = new Date(r.created_at)
      const diffHours = Math.floor((now.getTime() - rd.getTime()) / (1000 * 60 * 60))
      if (diffHours >= 0 && diffHours < 24) {
        last24h[23 - diffHours].reports.push(r)
      }
    })

    return last24h.map(h => ({
      time: h.label,
      score: h.reports.length > 0 ? atmosphereScore(h.reports) : null
    })).filter(d => d.score !== null)
  }, [reports])
const nearbyLocations = userCoords
  ? enriched.filter((e) =>
      haversineKm(
        userCoords.lat,
        userCoords.lng,
        e.location.lat,
        e.location.lng
      ) <= 5
    )
  : enriched;

const sortedNearby = userCoords
  ? [...nearbyLocations].sort((a, b) =>
      haversineKm(userCoords.lat, userCoords.lng, a.location.lat, a.location.lng) -
      haversineKm(userCoords.lat, userCoords.lng, b.location.lat, b.location.lng)
    )
  : nearbyLocations;
  return (
    <div className="cozy-page-bg min-h-[calc(100vh-4rem)] px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 flex flex-col items-center text-center">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-wheat/10 text-4xl shadow-2xl">
            🏘️
          </div>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-wheat md:text-5xl">
            Community Board
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/60">
            Real-time sensory insights from fellow villagers. Helping you find the perfect atmosphere for your needs.
          </p>
        </header>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-wheat border-t-transparent" />
          </div>
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-400">
            {error}
          </div>
        ) : (
          <div className="space-y-16">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-3xl bg-grass/10 p-6 border border-grass/20">
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="text-grass" size={20} />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-grass/80">Live Activity</h3>
                </div>
                <p className="text-2xl font-bold text-white">{reports.length}</p>
                <p className="text-xs text-white/40 mt-1">Total community reports</p>
              </div>
              <div className="rounded-3xl bg-wheat/10 p-6 border border-wheat/20">
                <div className="flex items-center gap-3 mb-2">
                  <ShieldCheck className="text-wheat" size={20} />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-wheat/80">Verified Spots</h3>
                </div>
                <p className="text-2xl font-bold text-white">{sortedNearby.filter(e => e.latest?.confirmed_by > 0).length}</p>
                <p className="text-xs text-white/40 mt-1">Locations with confirmations</p>
              </div>
              <div className="rounded-3xl bg-black/20 p-6 border border-white/5">
                <div className="flex items-center gap-3 mb-2">
                  <Bot className="text-grass" size={20} />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-white/40">AI Insights</h3>
                </div>
                <p className="text-sm text-white/60">Ask our AI assistant for personalized calm spot recommendations.</p>
              </div>
            </div>

            <TrendChart data={trendData} />

            <section aria-labelledby="alerts-heading">
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
                  <Activity size={20} />
                </div>
                <div>
                  <h2 id="alerts-heading" className="font-heading text-2xl font-bold text-red-400">
                    Sensory Alerts
                  </h2>
                  <p className="mt-1 text-sm text-white/40">Places currently reported with high sensory intensity</p>
                </div>
              </div>
              
              {sortedNearby.filter(e => e.latest?.crowd_level === 'crowded' || e.latest?.sound_level === 'loud' || e.latest?.sound_level === 'sudden-noises').length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center bg-grass/5">
                  <p className="text-grass/60 italic">All clear! No high-intensity reports in the last few hours. 🌿</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {sortedNearby
                    .filter(e => e.latest?.crowd_level === 'crowded' || e.latest?.sound_level === 'loud' || e.latest?.sound_level === 'sudden-noises')
                    .map((e) => (
                      <div key={e.location.id} className="flex items-center justify-between rounded-2xl bg-red-500/5 p-4 border border-red-500/10">
                        <div className="flex items-center gap-4">
                          <span className="text-2xl">{categoryVenueEmoji(e.location.category)}</span>
                          <div>
                            <h4 className="font-bold text-white">{e.location.name}</h4>
                            <p className="text-xs text-red-400/80">
                              {e.latest.crowd_level === 'crowded' ? '🚨 High Crowd' : ''}
                              {e.latest.crowd_level === 'crowded' && (e.latest.sound_level === 'loud' || e.latest.sound_level === 'sudden-noises') ? ' & ' : ''}
                              {e.latest.sound_level === 'loud' || e.latest.sound_level === 'sudden-noises' ? '🔊 High Noise' : ''}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">
                          {new Date(e.latest.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </section>

            <section aria-labelledby="calm-heading">
              <div className="mb-8 flex items-end justify-between">
                <div>
                  <h2 id="calm-heading" className="font-heading text-2xl font-bold text-grass">
                    Currently Calm
                  </h2>
                  <p className="mt-1 text-sm text-white/40">Spots with the highest tranquility scores right now</p>
                </div>
              </div>
              
              {calmSpots.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center">
                  <p className="text-white/40 italic">No spots match right now... check back later! 🌱</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {calmSpots.map((e) => (
                    <LocationCard
                      key={e.location.id}
                      location={e.location}
                      latest={e.latest}
                      score={e.score}
                      variant="calm"
                      onConfirm={handleConfirm}
                      alreadyConfirmed={e.latest?.id != null && confirmedReportIds.has(e.latest.id)}
                      confirming={e.latest?.id != null && confirmingReportId === e.latest.id}
                      confirmError={e.latest?.id != null ? confirmErrors[e.latest.id] : undefined}
                    />
                  ))}
                </div>
              )}
            </section>

            <section aria-labelledby="all-heading">
              <div className="mb-8 border-b border-white/5 pb-4">
                <h2 id="all-heading" className="font-heading text-2xl font-bold text-wheat">
                  All Locations
                </h2>
              </div>
              
              {sortedNearby.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center">
                  <p className="text-white/40 italic">No locations yet... be the first villager! 🌱</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {sortedNearby.map((e) => (
                    <LocationCard
                      key={e.location.id}
                      location={e.location}
                      latest={e.latest}
                      score={e.score}
                      onConfirm={handleConfirm}
                      alreadyConfirmed={e.latest?.id != null && confirmedReportIds.has(e.latest.id)}
                      confirming={e.latest?.id != null && confirmingReportId === e.latest.id}
                      confirmError={e.latest?.id != null ? confirmErrors[e.latest.id] : undefined}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
