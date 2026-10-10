export function formatApiError(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'We could not plan that trip. Please try again.'
}
