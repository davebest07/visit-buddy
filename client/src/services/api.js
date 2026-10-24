// The only place the app talks to the server.
const BASE = '/api'

async function request(path, { method = 'GET', body } = {}) {
  const init = { method }

  if (body !== undefined) {
    init.headers = { 'Content-Type': 'application/json' }
    init.body = JSON.stringify(body)
  }

  const response = await fetch(BASE + path, init)

  if (!response.ok) {
    let message = 'Something went wrong. Please try again.'
    try {
      const data = await response.json()
      if (data?.error) message = data.error
    } catch {
      // Keep the plain message.
    }
    throw new Error(message)
  }

  if (response.status === 204) return null
  return response.json()
}

export const listVisits = () => request('/visits')

export const getVisit = (id) => request(`/visits/${id}`)

export const createVisit = (visit) => request('/visits', { method: 'POST', body: visit })

export const updateVisit = (id, patch) =>
  request(`/visits/${id}`, { method: 'PATCH', body: patch })

export const deleteVisit = (id) => request(`/visits/${id}`, { method: 'DELETE' })

export const deleteAllVisits = () => request('/visits', { method: 'DELETE' })
