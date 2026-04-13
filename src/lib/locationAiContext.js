/** Shared 1–10 “calmer is higher” maps for atmosphere + AI context */

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

function scoreDimension(map, value) {
  if (value == null || value === '') return 5
  return map[value] ?? 5
}

function scoreSingleReport(report) {
  return (
    (scoreDimension(SOUND_SCORES, report.sound_level) +
      scoreDimension(CROWD_SCORES, report.crowd_level) +
      scoreDimension(LIGHTING_SCORES, report.lighting)) /
    3
  )
}

function atmosphereScoreForReports(reports) {
  if (!reports.length) return null
  const sum = reports.reduce((acc, r) => acc + scoreSingleReport(r), 0)
  return sum / reports.length
}

/**
 * Compact dataset for Gemini: each place with avg calm score (1–10) + sample reports.
 */
export function buildNeuroNavLocationDataset(locations, reports) {
  const byLoc = new Map()
  for (const r of reports ?? []) {
    if (!r.location_id) continue
    const list = byLoc.get(r.location_id) ?? []
    list.push(r)
    byLoc.set(r.location_id, list)
  }

  return (locations ?? []).map((loc) => {
    const list = byLoc.get(loc.id) ?? []
    const avg = atmosphereScoreForReports(list)
    return {
      id: loc.id,
      name: loc.name,
      category: loc.category,
      lat: loc.lat ?? loc.latitude,
      lng: loc.lng ?? loc.longitude,
      report_count: list.length,
      atmosphere_avg_1_to_10: avg != null ? Number(avg.toFixed(2)) : null,
      sample_reports: list.slice(0, 4).map((r) => ({
        sound: r.sound_level,
        lighting: r.lighting,
        crowd: r.crowd_level,
        time_of_day: r.time_of_day ?? null,
        at: r.created_at ?? null,
      })),
    }
  })
}
