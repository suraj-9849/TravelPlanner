import { useState } from 'react'
import { bookGuide } from '../lib/api'
import type { Guide, TripPlanResponse } from '../lib/types'
import { formatDate, prettyValue } from '../utils/format'

export function TripResults({ response }: { response: TripPlanResponse }) {
  const { plan, request } = response
  return (
    <section className="results" aria-live="polite">
      <div className="results-heading">
        <div>
          <p className="eyebrow">your itinerary</p>
          <h2>{plan.destination || request.location}</h2>
        </div>
        <span className="date-chip">
          {formatDate(request.start_date)} · {request.days} days
        </span>
      </div>
      {plan.warnings?.map((warning, index) => (
        <p className="warning" key={index}>
          Note · {warning}
        </p>
      ))}
      <div className="result-grid">
        <section className="result-card weather-card">
          <p className="card-label">weather</p>
          <div className="weather-value">{prettyValue(plan.weather)}</div>
        </section>
        <section className="result-card">
          <p className="card-label">places to see</p>
          <ItemList items={plan.attractions} />
        </section>
        <section className="result-card">
          <p className="card-label">food stops</p>
          <ItemList items={plan.food_stops} />
        </section>
      </div>
      <section className="daily-plan">
        <p className="card-label">day by day</p>
        {Array.isArray(plan.daily_plan) ? (
          plan.daily_plan.map((day, index) => (
            <article className="day" key={index}>
              <div className="day-number">
                {String(index + 1).padStart(2, '0')}
              </div>
              <div>
                <h3>{String(day.title || day.day || 'Day ' + (index + 1))}</h3>
                <p>
                  {prettyValue(day.activities || day.stops || day.plan || day)}
                </p>
              </div>
            </article>
          ))
        ) : (
          <p>{prettyValue(plan.daily_plan)}</p>
        )}
      </section>
      {plan.guides?.length > 0 && (
        <GuideList guides={plan.guides} request={request} />
      )}
    </section>
  )
}

function ItemList({ items }: { items: unknown }) {
  const values = Array.isArray(items) ? items : Object.values(items || {})
  return values.length ? (
    <ul className="item-list">
      {values.map((item, index) => (
        <li key={index}>{prettyValue(item)}</li>
      ))}
    </ul>
  ) : (
    <p className="muted">No recommendations returned.</p>
  )
}

function GuideList({
  guides,
  request,
}: {
  guides: Guide[]
  request: TripPlanResponse['request']
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const [travelerName, setTravelerName] = useState('')
  const [status, setStatus] = useState('')
  async function submit(guide: Guide) {
    if (!travelerName.trim()) {
      setStatus('Enter your name to request a booking.')
      return
    }
    try {
      const booking = await bookGuide(guide.id, {
        traveler_name: travelerName.trim(),
        start_date: request.start_date,
        days: request.days,
      })
      setStatus('Request #' + booking.booking_id + ' sent · ' + booking.status)
    } catch {
      setStatus('We could not send that request. Please try again.')
    }
  }
  return (
    <section className="guides">
      <div className="section-heading">
        <p className="card-label">local guides</p>
        <span>Top matches for {request.location}</span>
      </div>
      <div className="guide-list">
        {guides.map((guide) => (
          <article className="guide" key={guide.id}>
            <div>
              <h3>{guide.name}</h3>
              <p>
                {guide.specialties || 'Local guide'} ·{' '}
                {Array.isArray(guide.languages)
                  ? guide.languages.join(', ')
                  : guide.languages || 'Languages not provided'}
              </p>
              <span className="rating">
                ★ {Number(guide.rating || 0).toFixed(1)} ·{' '}
                {guide.price_per_day || 'Price not provided'} / day
              </span>
            </div>
            <button
              className="text-button"
              onClick={() => {
                setSelected(selected === guide.id ? null : guide.id)
                setStatus('')
              }}
            >
              {selected === guide.id ? 'Close' : 'Request'}
            </button>
            {selected === guide.id && (
              <div className="booking">
                <input
                  placeholder="Your name"
                  value={travelerName}
                  onChange={(e) => setTravelerName(e.target.value)}
                />
                <button className="small-button" onClick={() => submit(guide)}>
                  Send request
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
      {status && (
        <p className="booking-status" role="status">
          {status}
        </p>
      )}
    </section>
  )
}
