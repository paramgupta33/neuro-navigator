import { useState } from 'react'
import { supabase } from '../lib/supabase'

const SOUND_LEVELS = ['quiet', 'low-hum', 'loud', 'sudden-noises']
const LIGHTING_LEVELS = ['natural', 'dim', 'bright-fluorescent', 'flickering']
const CROWD_LEVELS = ['empty', 'spaced-out', 'crowded']
const FRAGRANCE_LEVELS = ['fragrance-free', 'mild-scent', 'strong-scents']

const TIME_OF_DAY_OPTIONS = [
  'Early Morning (6-9am)',
  'Morning (9am-12pm)',
  'Afternoon (12-4pm)',
  'Evening (4-8pm)',
  'Night (8pm+)',
]

const fieldClass =
  'min-h-11 w-full rounded-[4px] border-[3px] border-[#5c3d1e] bg-[#1a1108] px-3 py-2 text-[20px] leading-snug text-[#f5e6c8] placeholder:text-[#f5e6c8]/40 transition-all duration-75 focus:border-[#7ab648] focus:outline-none focus:ring-2 focus:ring-[#7ab648] focus:ring-offset-2 focus:ring-offset-[#2d1f0e]'

function formatLabel(value) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  required,
  onUserInput,
  formatOptions = true,
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-[1.05rem] font-semibold text-[#e8c96d]"
      >
        {label}
        {required ? <span className="text-red-400"> *</span> : null}
      </label>
      <select
        id={id}
        name={id}
        value={value}
        onChange={(e) => {
          onUserInput?.()
          onChange(e.target.value)
        }}
        required={required}
        className={fieldClass}
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-[#2d1f0e] text-[#f5e6c8]">
            {formatOptions ? formatLabel(opt) : opt}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function ReportPage() {
  const [locationName, setLocationName] = useState('')
  const [soundLevel, setSoundLevel] = useState(SOUND_LEVELS[0])
  const [lighting, setLighting] = useState(LIGHTING_LEVELS[0])
  const [crowdLevel, setCrowdLevel] = useState(CROWD_LEVELS[0])
  const [fragrance, setFragrance] = useState(FRAGRANCE_LEVELS[0])
  const [timeOfDay, setTimeOfDay] = useState(TIME_OF_DAY_OPTIONS[0])
  const [notes, setNotes] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const dismissSuccess = () => setSuccess(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const trimmedName = locationName.trim()
    if (!trimmedName) {
      setError('Please enter a location name.')
      return
    }

    setSubmitting(true)

    try {
      const { data: existing, error: findError } = await supabase
        .from('locations')
        .select('id')
        .ilike('name', trimmedName)
        .limit(1)
        .maybeSingle()

      if (findError) {
        setError(findError.message)
        return
      }

      let locationId = existing?.id

      if (!locationId) {
        const { data: created, error: insertLocError } = await supabase
          .from('locations')
          .insert({
            name: trimmedName,
            category: 'Community report',
          })
          .select('id')
          .single()

        if (insertLocError) {
          setError(insertLocError.message)
          return
        }
        locationId = created.id
      }

      const trimmedNotes = notes.trim()
      const { error: reportError } = await supabase.from('sensory_reports').insert({
        location_id: locationId,
        sound_level: soundLevel,
        lighting,
        crowd_level: crowdLevel,
        fragrance,
        time_of_day: timeOfDay,
        notes: trimmedNotes ? trimmedNotes : null,
      })

      if (reportError) {
        setError(reportError.message)
        return
      }

      setSuccess(true)
      setLocationName('')
      setSoundLevel(SOUND_LEVELS[0])
      setLighting(LIGHTING_LEVELS[0])
      setCrowdLevel(CROWD_LEVELS[0])
      setFragrance(FRAGRANCE_LEVELS[0])
      setTimeOfDay(TIME_OF_DAY_OPTIONS[0])
      setNotes('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="cozy-page-bg min-h-[calc(100vh-4rem)] px-4 py-12">
      <div className="mx-auto w-full max-w-[640px]">
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fbbf24]/10 text-3xl">
            📝
          </div>
          <h1 className="font-heading text-3xl font-bold text-[#fbbf24]">
            Log a Location
          </h1>
          <p className="mt-2 text-white/60">
            Help fellow villagers find their calm by sharing your sensory experience
          </p>
        </div>

        {success && (
          <div role="status" className="golden-scroll-banner mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✨</span>
              <p>Report logged! Your note is now on the community board.</p>
            </div>
            <button onClick={dismissSuccess} className="text-soil/60 hover:text-soil">✕</button>
          </div>
        )}

        <div className="cozy-card p-8">
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-8 md:grid-cols-2"
            noValidate
          >
            <div className="flex flex-col gap-2 md:col-span-2">
              <label
                htmlFor="location-name"
                className="text-sm font-medium text-white/80"
              >
                Location Name <span className="text-red-400">*</span>
              </label>
              <input
                id="location-name"
                name="locationName"
                type="text"
                value={locationName}
                onChange={(e) => {
                  setLocationName(e.target.value)
                  dismissSuccess()
                }}
                autoComplete="off"
                placeholder="e.g. Pierre's shop corner"
              />
            </div>

            <SelectField
              id="sound-level"
              label="Sound Level"
              value={soundLevel}
              onChange={setSoundLevel}
              onUserInput={dismissSuccess}
              options={SOUND_LEVELS}
              required
            />
            <SelectField
              id="lighting"
              label="Lighting"
              value={lighting}
              onChange={setLighting}
              onUserInput={dismissSuccess}
              options={LIGHTING_LEVELS}
              required
            />
            <SelectField
              id="crowd-level"
              label="Crowd Level"
              value={crowdLevel}
              onChange={setCrowdLevel}
              onUserInput={dismissSuccess}
              options={CROWD_LEVELS}
              required
            />
            <SelectField
              id="fragrance"
              label="Fragrance"
              value={fragrance}
              onChange={setFragrance}
              onUserInput={dismissSuccess}
              options={FRAGRANCE_LEVELS}
              required
            />
            <SelectField
              id="time-of-day"
              label="Time of Visit"
              value={timeOfDay}
              onChange={setTimeOfDay}
              onUserInput={dismissSuccess}
              options={TIME_OF_DAY_OPTIONS}
              formatOptions={false}
              required
            />

            <div className="flex flex-col gap-2 md:col-span-2">
              <label
                htmlFor="notes"
                className="text-sm font-medium text-white/80"
              >
                Notes <span className="text-white/40 font-normal">(optional)</span>
              </label>
              <textarea
                id="notes"
                name="notes"
                value={notes}
                onChange={(e) => {
                  dismissSuccess()
                  setNotes(e.target.value)
                }}
                rows={4}
                placeholder="Anything else fellow villagers should know…"
                className="resize-none"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="md:col-span-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
              >
                {error}
              </div>
            )}

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="cozy-pixel-btn cozy-pixel-btn-wheat w-full py-4 text-lg"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
