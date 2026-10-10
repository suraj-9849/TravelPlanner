import { useState } from 'react'
import { TripForm } from './components/TripForm'
import { TripResults } from './components/TripResults'
import { planTrip } from './lib/api'
import type { TripPlanResponse, TripRequest } from './lib/types'
import { formatApiError } from './utils/errors'

function App() {
  const [result, setResult] = useState<TripPlanResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handlePlan(request: TripRequest) {
    setLoading(true)
    setError('')
    try {
      setResult(await planTrip(request))
    } catch (requestError) {
      setError(formatApiError(requestError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-mark">w</span>
          <span>wayfarer</span>
        </a>
        <span className="topbar-note">thoughtful trips, made simple</span>
      </header>
      <section className="hero-copy">
        <p className="eyebrow">your next good idea</p>
        <h1>
          Go somewhere
          <br />
          <em>worth remembering.</em>
        </h1>
        <p className="intro">
          Build a practical itinerary around the places, food, weather, and
          local guides that make a trip feel like yours.
        </p>
      </section>
      <TripForm onSubmit={handlePlan} loading={loading} />
      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}
      {result && <TripResults response={result} />}
      <footer className="footer">wayfarer · plan with curiosity</footer>
    </main>
  )
}

export default App
