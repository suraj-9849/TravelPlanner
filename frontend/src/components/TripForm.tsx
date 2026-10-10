import { useState } from 'react'
import type { FormEvent } from 'react'
import { DEFAULT_DAYS } from '../constants/trip'
import type { TripRequest } from '../lib/types'

type Props = { onSubmit: (request: TripRequest) => void; loading: boolean }
const today = new Date().toISOString().slice(0, 10)

export function TripForm({ onSubmit, loading }: Props) {
  const [location, setLocation] = useState('')
  const [startDate, setStartDate] = useState(today)
  const [days, setDays] = useState(DEFAULT_DAYS)
  const [travelerLocation, setTravelerLocation] = useState('')
  const [foodPreferences, setFoodPreferences] = useState('')
  const [needsGuide, setNeedsGuide] = useState(false)
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit({
      location: location.trim(),
      start_date: startDate,
      days: Number(days),
      traveler_location: travelerLocation.trim() || null,
      food_preferences: foodPreferences
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      needs_guide: needsGuide,
    })
  }
  return (
    <form className="trip-form" onSubmit={submit}>
      <div className="form-heading">
        <span>01</span>
        <h2>Shape your trip</h2>
      </div>
      <div className="form-grid">
        <label className="field field-wide">
          <span>Where are you going?</span>
          <input
            required
            minLength={2}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City or address"
          />
        </label>
        <label className="field">
          <span>Starting</span>
          <input
            required
            type="date"
            min={today}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Days</span>
          <input
            required
            type="number"
            min={1}
            max={30}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          />
        </label>
        <label className="field">
          <span>
            Coming from <small>optional</small>
          </span>
          <input
            value={travelerLocation}
            onChange={(e) => setTravelerLocation(e.target.value)}
            placeholder="Your current city"
          />
        </label>
        <label className="field field-wide">
          <span>
            Food preferences <small>optional · comma separated</small>
          </span>
          <input
            value={foodPreferences}
            onChange={(e) => setFoodPreferences(e.target.value)}
            placeholder="Vegetarian, local food"
          />
        </label>
      </div>
      <div className="form-actions">
        <label className="check-label">
          <input
            type="checkbox"
            checked={needsGuide}
            onChange={(e) => setNeedsGuide(e.target.checked)}
          />{' '}
          <span>Show local guide options</span>
        </label>
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? 'Planning…' : 'Plan my trip'}{' '}
          <span aria-hidden="true">↗</span>
        </button>
      </div>
    </form>
  )
}
