import { API_BASE_URL } from '../config/env'
import type {
  BookingRequest,
  BookingResponse,
  TripPlanResponse,
  TripRequest,
} from './types'
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(API_BASE_URL + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.detail || 'Something went wrong.')
  }
  return response.json() as Promise<T>
}
export const planTrip = (payload: TripRequest) =>
  request<TripPlanResponse>('/api/trips/plan', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
export const bookGuide = (guideId: number, payload: BookingRequest) =>
  request<BookingResponse>('/api/guides/' + guideId + '/book', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
