import axios, { type AxiosError } from 'axios'

export class ApiError extends Error {
  status: number
  detail: string

  constructor(status: number, detail: string) {
    super(detail)
    this.status = status
    this.detail = detail
  }
}

const client = axios.create()

client.interceptors.response.use(
  (r) => r,
  (err: AxiosError<{ detail?: string }>) => {
    const status = err.response?.status ?? 0
    const detail = err.response?.data?.detail ?? err.message
    return Promise.reject(new ApiError(status, detail))
  },
)

export default client
