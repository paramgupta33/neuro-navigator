import 'leaflet/dist/leaflet.css'

import L from 'leaflet'
/* global process */
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'
import { supabase } from '../lib/supabase'
import { haversineKm } from '../lib/geo'
import { motion, AnimatePresence } from 'motion/react' // eslint-disable-line no-unused-vars

import iconRetina from 'leaflet/dist/images/marker-icon-2x.png'
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY })

const DefaultIcon = L.icon({
  iconRetinaUrl: iconRetina,
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const GreenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const GreyIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon

const userGlowDivIcon = L.divIcon({
  className: 'user-glow-map-icon',
  html: '<div class="user-glow-dot"></div>',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
})

const MUMBAI_CENTER = [18.9322, 72.8347]
const MUMBAI_ZOOM = 13

const SOUND_LEVELS = ['quiet', 'low-hum', 'loud', 'sudden-noises']
const LIGHTING_LEVELS = ['natural', 'dim', 'bright-fluorescent', 'flickering']
const CROWD_LEVELS = ['empty', 'spaced-out', 'crowded']
const FRAGRANCE_LEVELS = ['fragrance-free', 'mild-scent', 'strong-scents']

const OSM_TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const NOMINATIM_UA = 'NeuroNav/1.0 (community map; +https://github.com/)'

function formatLabel(value) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
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

function normalizeLocation(row) {
  const lat = row.lat ?? row.latitude
  const lng = row.lng ?? row.longitude
  if (lat == null || lng == null) return null
  const nlat = Number(lat)
  const nlng = Number(lng)
  if (!Number.isFinite(nlat) || !Number.isFinite(nlng)) return null
  return {
    id: row.id,
    name: row.name ?? 'Unknown',
    category: row.category ?? '—',
    lat: nlat,
    lng: nlng,
  }
}

function PixelRadioGroup({ groupName, title, value, onChange, options }) {
  return (
    <fieldset className="border-b border-white/5 pb-4 last:border-b-0">
      <legend className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/30">
        {title}
      </legend>
      <ul className="flex flex-col gap-2">
        <li>
          <label className="group flex cursor-pointer items-center gap-3 text-sm text-white/60 transition-colors hover:text-white">
            <input
              type="radio"
              name={groupName}
              checked={value == null}
              onChange={() => onChange(null)}
              className="sr-only"
            />
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                value == null
                  ? 'border-grass bg-grass shadow-[0_0_8px_rgba(122,182,72,0.4)]'
                  : 'border-white/10 bg-black/20 group-hover:border-white/30'
              }`}
              aria-hidden
            />
            <span className="font-medium">Any</span>
          </label>
        </li>
        {options.map((opt) => {
          const selected = value === opt
          return (
            <li key={opt}>
              <label className="group flex cursor-pointer items-center gap-3 text-sm text-white/60 transition-colors hover:text-white">
                <input
                  type="radio"
                  name={groupName}
                  checked={selected}
                  onChange={() => onChange(opt)}
                  className="sr-only"
                />
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                    selected
                      ? 'border-grass bg-grass shadow-[0_0_8px_rgba(122,182,72,0.4)]'
                      : 'border-white/10 bg-black/20 group-hover:border-white/30'
                  }`}
                  aria-hidden
                />
                <span className="font-medium">{formatLabel(opt)}</span>
              </label>
            </li>
          )
        })}
      </ul>
    </fieldset>
  )
}

function MapFlyTo({ target }) {
  const map = useMap()

  useEffect(() => {
    if (!target || target.lat == null || target.lng == null) return
    map.flyTo([target.lat, target.lng], target.zoom ?? 15, { duration: 1.1 })
  }, [map, target])

  return null
}

function tryParseRecommendationJson(text) {
  if (!text) return null
  const trimmed = text.trim()
  const block = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = block ? block[1].trim() : trimmed
  try {
    const o = JSON.parse(raw)
    if (o && typeof o.location_name === 'string') {
      return {
        location_name: o.location_name,
        why: typeof o.why === 'string' ? o.why : '',
        best_time_to_visit:
          typeof o.best_time_to_visit === 'string'
            ? o.best_time_to_visit
            : typeof o.best_time === 'string'
              ? o.best_time
              : '—',
      }
    }
  } catch {
    /* ignore */
  }
  return null
}

export default function MapPage() {
  const [locations, setLocations] = useState([])
  const [loadingLocations, setLoadingLocations] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loadingFilters, setLoadingFilters] = useState(false)

  const [filterSound, setFilterSound] = useState(null)
  const [filterLighting, setFilterLighting] = useState(null)
  const [filterCrowd, setFilterCrowd] = useState(null)
  const [filterFragrance, setFilterFragrance] = useState(null)
  const [matchedLocationIds, setMatchedLocationIds] = useState(null)

  const [placeQuery, setPlaceQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const [flyTarget, setFlyTarget] = useState(null)

  const [userCoords, setUserCoords] = useState(null)
  const [nearMeActive, setNearMeActive] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState(null)

  const [recLoading, setRecLoading] = useState(false)
  const [recError, setRecError] = useState(null)
  const [recOpen, setRecOpen] = useState(false)
  const [recData, setRecData] = useState(null)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingLocation, setPendingLocation] = useState(null)

  const hasAnyFilter =
    filterSound != null || filterLighting != null || filterCrowd != null || filterFragrance != null

  const fetchLocations = useCallback(async () => {
    setLoadingLocations(true)
    const [{ data: locData, error: locErr }, { data: repData }] = await Promise.all([
      supabase.from('locations').select('*'),
      supabase.from('sensory_reports').select('location_id')
    ])

    if (locErr) {
      setLocations([])
    } else {
      const counts = (repData ?? []).reduce((acc, r) => {
        acc[r.location_id] = (acc[r.location_id] || 0) + 1
        return acc
      }, {})

      const normalized = (locData ?? [])
        .map(loc => {
          const norm = normalizeLocation(loc)
          if (!norm) return null
          return {
            ...norm,
            report_count: counts[loc.id] || 0
          }
        })
        .filter(Boolean)
      setLocations(normalized)
    }
    setLoadingLocations(false)
  }, [])

  useEffect(() => {
    fetchLocations()
  }, [fetchLocations, filterFragrance])

  useEffect(() => {
    if (!hasAnyFilter) {
      setMatchedLocationIds(null)
      setLoadingFilters(false)
      return
    }

    let cancelled = false

    async function run() {
      setLoadingFilters(true)

      let query = supabase.from('sensory_reports').select('location_id')

      if (filterSound != null) {
        query = query.eq('sound_level', filterSound)
      }
      if (filterLighting != null) {
        query = query.eq('lighting', filterLighting)
      }
      if (filterCrowd != null) {
        query = query.eq('crowd_level', filterCrowd)
      }
      if (filterFragrance != null) {
        query = query.eq('fragrance', filterFragrance)
      }

      const { data, error } = await query

      if (cancelled) return

      if (error) {
        setMatchedLocationIds(new Set())
      } else {
        const ids = new Set((data ?? []).map((r) => r.location_id).filter(Boolean))
        setMatchedLocationIds(ids)
      }
      setLoadingFilters(false)
    }

    run()
    return () => {
      cancelled = true
    }
  }, [hasAnyFilter, filterSound, filterLighting, filterCrowd, filterFragrance])

  const sensoryFiltered = useMemo(() => {
    if (!hasAnyFilter || matchedLocationIds == null) return locations
    return locations.filter((loc) => matchedLocationIds.has(loc.id))
  }, [locations, hasAnyFilter, matchedLocationIds])

  const visibleLocations = useMemo(() => {
    if (!nearMeActive || !userCoords) return sensoryFiltered
    return sensoryFiltered.filter(
      (loc) =>
        haversineKm(userCoords.lat, userCoords.lng, loc.lat, loc.lng) <= 5,
    )
  }, [sensoryFiltered, nearMeActive, userCoords])

  const clearNearMe = useCallback(() => {
    setNearMeActive(false)
    setUserCoords(null)
    setGeoError(null)
  }, [])

  const clearAllFilters = useCallback(() => {
    setFilterSound(null)
    setFilterLighting(null)
    setFilterCrowd(null)
    setFilterFragrance(null)
  }, [])

  const runFindMe = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('This browser does not support location.')
      return
    }
    setGeoLoading(true)
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          setGeoError('Could not read your coordinates.')
          setGeoLoading(false)
          return
        }
        setUserCoords({ lat, lng })
        setNearMeActive(true)
        setFlyTarget({ lat, lng, zoom: 14, key: Date.now() })
        setGeoLoading(false)
      },
      (err) => {
        const denied =
          err && typeof err.code === 'number' && err.code === 1
        setGeoError(
          denied
            ? 'Location permission was denied.'
            : err?.message || 'Could not get your location.',
        )
        setGeoLoading(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  }, [])

  const runPlaceSearch = useCallback(async () => {
    const q = placeQuery.trim()
    if (!q) {
      setSearchError('Type a place name first.')
      return
    }
    setSearchLoading(true)
    setSearchError(null)
    try {
      // 1. Check Supabase first for similar name
      const { data: existing } = await supabase
        .from('locations')
        .select('*')
        .ilike('name', `%${q}%`)
        .limit(1)
        .maybeSingle()

      if (existing) {
        const norm = normalizeLocation(existing)
        if (norm) {
          setFlyTarget({ lat: norm.lat, lng: norm.lng, zoom: 16, key: Date.now() })
          setSearchLoading(false)
          return
        }
      }

      // 2. Use Nominatim
      const url = `${NOMINATIM_URL}?format=json&limit=1&q=${encodeURIComponent(q)}`
      const res = await fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': NOMINATIM_UA },
      })
      if (!res.ok) throw new Error(`Search failed (${res.status})`)
      const results = await res.json()
      const hit = results?.[0]
      if (!hit) {
        setSearchError("🌾 We couldn't find that place. Try being more specific, like 'Juhu Beach Mumbai'")
        return
      }

      const lat = parseFloat(hit.lat)
      const lon = parseFloat(hit.lon)
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        setSearchError('Invalid coordinates from search.')
        return
      }

      const shortName =
        hit.name ||
        (typeof hit.display_name === 'string'
          ? hit.display_name.split(',')[0].trim()
          : q)

      setPendingLocation({
        name: shortName,
        lat,
        lng: lon,
        category: 'Searched'
      })
      setConfirmOpen(true)
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : 'Search failed.')
    } finally {
      setSearchLoading(false)
    }
  }, [placeQuery])

  const confirmAddLocation = async () => {
    if (!pendingLocation) return
    setSearchLoading(true)
    try {
      const { error: insErr } = await supabase.from('locations').insert(pendingLocation)
      if (insErr) throw new Error(insErr.message)
      
      await fetchLocations()
      setFlyTarget({ lat: pendingLocation.lat, lng: pendingLocation.lng, zoom: 16, key: Date.now() })
      setConfirmOpen(false)
      setPendingLocation(null)
      setPlaceQuery('')
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : 'Failed to add location.')
    } finally {
      setSearchLoading(false)
    }
  }

  const runCalmRecommendation = useCallback(async () => {
    setRecLoading(true)
    setRecError(null)
    setRecData(null)
    setRecOpen(true)

    try {
      const [{ data: locRows, error: locErr }, { data: repRows, error: repErr }] =
        await Promise.all([
          supabase.from('locations').select('id, name, category, lat, lng'),
          supabase
            .from('sensory_reports')
            .select(
              'location_id, sound_level, lighting, crowd_level, fragrance, created_at',
            ),
        ])

      if (locErr) throw new Error(locErr.message)
      if (repErr) throw new Error(repErr.message)

      const locs = locRows ?? []
      const reps = repRows ?? []

      if (!locs.length) {
        setRecError('No locations in the database yet.')
        setRecLoading(false)
        return
      }

      const payload = {
        locations: locs,
        sensory_reports: reps,
      }

      const prompt = `You are helping neurodivergent visitors pick a calmer place.

Here is JSON with all locations and all sensory_reports (each report links to a location_id). Prefer lower sensory intensity: quiet sound, empty or spaced-out crowds, natural or dim (not flickering or harsh fluorescent) lighting when available.

Data:
${JSON.stringify(payload)}

Pick exactly ONE location from the locations list by matching its "name" field (or the closest match). Respond with ONLY valid JSON (no markdown) in this exact shape:
{"location_name":"...","why":"2-4 short sentences","best_time_to_visit":"one short phrase"}`

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      })

      const text = response.text
      const parsed = tryParseRecommendationJson(text)
      if (!parsed) {
        throw new Error('Could not read the recommendation. Try again.')
      }
      setRecData(parsed)
    } catch (e) {
      setRecError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setRecLoading(false)
    }
  }, [])

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full overflow-hidden">

  <button
    onClick={() => setSidebarOpen(true)}
    className="md:hidden fixed top-20 left-4 z-[3000] rounded-xl bg-[#1a1108]/90 px-3 py-2 text-white shadow-lg"
  >
    ☰
  </button>
      <aside
  className={`
    fixed md:absolute top-0 left-0 z-[2000]
    h-full w-[85%] max-w-sm
    flex flex-col
    border-r border-white/5 bg-[#1a1108]/95 backdrop-blur-xl shadow-2xl
    transition-transform duration-300

    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
    md:translate-x-0
  `}
><div className="md:hidden flex justify-end p-3">
  <button
    onClick={() => setSidebarOpen(false)}
    className="text-white/60 text-lg"
  >
    ✕
  </button>
</div>
        <div className="flex flex-col gap-6 p-6 overflow-y-auto">
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => void runFindMe()}
              disabled={geoLoading}
              className="cozy-pixel-btn cozy-pixel-btn-wheat w-full py-3 text-sm"
            >
              {geoLoading ? 'Finding you...' : '📍 Find My Location'}
            </button>
            {nearMeActive && (
              <button
                type="button"
                onClick={clearNearMe}
                className="w-full text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white"
              >
                Clear 5km Filter
              </button>
            )}
            {geoError && (
              <p className="text-xs text-red-400">{geoError}</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="relative">
              <input
                id="map-place-search"
                type="search"
                value={placeQuery}
                onChange={(e) => {
                  setPlaceQuery(e.target.value)
                  setSearchError(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void runPlaceSearch()
                  }
                }}
                placeholder="Search for a place..."
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-wheat/50 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => void runPlaceSearch()}
                disabled={searchLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-wheat/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-wheat hover:bg-wheat/20"
              >
                {searchLoading ? '...' : 'Go'}
              </button>
            </div>
            {searchError && (
              <p className="text-xs text-red-400">{searchError}</p>
            )}
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-bold text-grass">Sensory Filters</h2>
              <button 
                onClick={clearAllFilters}
                className="text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white"
              >
                Reset
              </button>
            </div>
            
            <div className="space-y-6">
              <PixelRadioGroup
                groupName="map-filter-sound"
                title="Sound Level"
                value={filterSound}
                onChange={setFilterSound}
                options={SOUND_LEVELS}
              />
              <PixelRadioGroup
                groupName="map-filter-lighting"
                title="Lighting"
                value={filterLighting}
                onChange={setFilterLighting}
                options={LIGHTING_LEVELS}
              />
              <PixelRadioGroup
                groupName="map-filter-crowd"
                title="Crowd Level"
                value={filterCrowd}
                onChange={setFilterCrowd}
                options={CROWD_LEVELS}
              />
              <PixelRadioGroup
                groupName="map-filter-fragrance"
                title="Fragrance"
                value={filterFragrance}
                onChange={setFilterFragrance}
                options={FRAGRANCE_LEVELS}
              />
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <button
              type="button"
              onClick={() => void runCalmRecommendation()}
              disabled={recLoading}
              className="cozy-pixel-btn w-full py-3 text-sm"
            >
              {recLoading ? 'Thinking...' : '🌿 AI Calm Recommendation'}
            </button>
          </div>
        </div>

        <div className="mt-auto border-t border-white/5 p-6 bg-black/20">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
            <span className="text-white/30">Showing</span>
            <span className="text-grass">{visibleLocations.length} / {sensoryFiltered.length} Locations</span>
          </div>
          {nearMeActive && (
            <p className="mt-1 text-[10px] text-white/20">Within 5km radius</p>
          )}
          {(loadingLocations || (hasAnyFilter && loadingFilters)) && (
            <p className="mt-2 text-[10px] text-wheat/60 animate-pulse">Updating map...</p>
          )}
        </div>
      </aside>
{sidebarOpen && (
  <div
    className="fixed inset-0 bg-black/40 z-[1500] md:hidden"
    onClick={() => setSidebarOpen(false)}
  />
)}

      <div className="h-full w-full md:pl-[20rem]">
        <MapContainer
          center={MUMBAI_CENTER}
          zoom={MUMBAI_ZOOM}
          className="h-full w-full bg-[#1a1108]"
          scrollWheelZoom
        >
          <MapFlyTo target={flyTarget} />
          <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_TILES} />
          {userCoords && (
            <Marker position={[userCoords.lat, userCoords.lng]} icon={userGlowDivIcon}>
              <Popup>
                <div className="p-2">
                  <p className="font-bold text-soil">You are here</p>
                </div>
              </Popup>
            </Marker>
          )}
          {visibleLocations.map((loc) => (
            <Marker 
              key={loc.id} 
              position={[loc.lat, loc.lng]}
              icon={loc.report_count >= 3 ? GreenIcon : GreyIcon}
            >
              <Popup>
                <div className="p-3 min-w-[180px]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{categoryVenueEmoji(loc.category)}</span>
                    <p className="font-bold text-soil text-lg leading-tight">{loc.name}</p>
                  </div>
                  
                  <div className="mb-3">
                    {loc.report_count >= 3 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                        ✓ Verified location
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-wheat/20 px-2 py-0.5 text-[10px] font-bold text-[#8b5e3c]">
                        🌱 New — be the first to report!
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] text-soil/60 font-bold uppercase tracking-widest">
                    {loc.category}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        <AnimatePresence>
          {confirmOpen && pendingLocation && (
            <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-sm overflow-hidden rounded-3xl border-4 border-[#4a3728] bg-[#f5e6c8] shadow-2xl"
              >
                <div className="bg-[#4a3728] p-4">
                  <h3 className="text-center font-heading text-lg font-bold text-wheat">📍 Location Found</h3>
                </div>
                <div className="p-6 text-center">
                  <p className="mb-2 text-sm font-bold text-soil">Found: {pendingLocation.name}</p>
                  <p className="mb-6 text-sm text-soil/70">Add this place to the NeuroNav map?</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => void confirmAddLocation()}
                      className="flex-1 rounded-xl bg-grass py-3 text-sm font-bold text-[#1a1108] transition-all hover:scale-105 active:scale-95"
                    >
                      Yes, Add it
                    </button>
                    <button
                      onClick={() => {
                        setConfirmOpen(false)
                        setPendingLocation(null)
                      }}
                      className="flex-1 rounded-xl bg-white/50 py-3 text-sm font-bold text-soil transition-all hover:bg-white/80"
                    >
                      No
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {searchError && searchError.includes('🌾') && (
          <div className="fixed top-24 left-1/2 z-[2000] -translate-x-1/2 px-4 w-full max-w-md">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border-4 border-[#4a3728] bg-[#f5e6c8] p-4 shadow-xl"
            >
              <p className="text-center text-sm font-bold text-soil leading-relaxed">
                {searchError}
              </p>
              <button 
                onClick={() => setSearchError(null)}
                className="mt-2 w-full text-[10px] font-bold uppercase tracking-widest text-soil/40 hover:text-soil"
              >
                Dismiss
              </button>
            </motion.div>
          </div>
        )}

        {recOpen && (
          <div className="fixed bottom-8 right-8 z-[2500] w-[min(24rem,calc(100vw-4rem))] overflow-hidden rounded-3xl border border-white/10 bg-[#1a1108]/95 backdrop-blur-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between border-b border-white/5 p-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌿</span>
                <h3 className="font-heading text-lg font-bold text-grass">Calm Recommendation</h3>
              </div>
              <button
                onClick={() => {
                  setRecOpen(false)
                  setRecData(null)
                  setRecError(null)
                }}
                className="h-8 w-8 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {recLoading ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-grass border-t-transparent" />
                  <p className="text-sm text-white/40">Analyzing community reports...</p>
                </div>
              ) : recError ? (
                <p className="text-sm text-red-400">{recError}</p>
              ) : recData ? (
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Recommended Place</p>
                    <p className="text-xl font-bold text-wheat">{recData.location_name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Why it fits</p>
                    <p className="text-sm leading-relaxed text-white/70">{recData.why}</p>
                  </div>
                  <div className="rounded-2xl bg-grass/10 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-grass mb-1">Best time to visit</p>
                    <p className="text-sm font-bold text-grass">{recData.best_time_to_visit}</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
