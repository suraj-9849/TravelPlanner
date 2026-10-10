export type TripRequest = {
  location: string
  start_date: string
  days: number
  traveler_location: string | null
  food_preferences: string[]
  needs_guide: boolean
}
export type Guide = {
  id: number
  name: string
  location: string
  phone_number: string
  languages: string[] | string
  specialties?: string
  price_per_day?: number
  rating?: number
}
export type TripPlan = {
  destination: string
  weather: unknown
  attractions: unknown
  food_stops: unknown
  daily_plan: Array<Record<string, unknown>> | Record<string, unknown>
  guides: Guide[]
  warnings: string[]
}
export type TripPlanResponse = { request: TripRequest; plan: TripPlan }
export type BookingRequest = {
  traveler_name: string
  start_date: string
  days: number
}
export type BookingResponse = {
  booking_id: number
  guide_id: number
  status: string
}
