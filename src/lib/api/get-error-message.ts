import axios from 'axios'

interface ApiErrorResponse { message?: string; error?: { message?: string } }

/** Same helper as apique-web-rmc: the backend's message, else the thrown message, else the fallback. */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const data = error.response?.data
    return data?.message ?? data?.error?.message ?? fallback
  }
  if (error instanceof Error) return error.message
  return fallback
}
