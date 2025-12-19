import '@testing-library/jest-dom'
import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../AppTask'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

const API_BASE = import.meta.env.VITE_API_BASE_URL
const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD
const USER_USERNAME = import.meta.env.VITE_USER_USERNAME
const USER_PASSWORD = import.meta.env.VITE_USER_PASSWORD

const tasks = [
  { id: 1, title: 'Initial', description: 'Seeded', completed: false, createdBy: { username: ADMIN_USERNAME || 'admin' } },
]

const server = setupServer(
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    const body = await request.json()
    if (body.username === ADMIN_USERNAME && body.password === ADMIN_PASSWORD) {
      return HttpResponse.json({ token: 't', role: 'ADMIN', username: ADMIN_USERNAME })
    }
    if (body.username === USER_USERNAME && body.password === USER_PASSWORD) {
      return HttpResponse.json({ token: 't', role: 'USER', username: USER_USERNAME })
    }
    return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }),
  http.get(`${API_BASE}/tasks`, () => HttpResponse.json(tasks)),
  http.post(`${API_BASE}/tasks`, () => HttpResponse.json({ id: 2, title: 'New', description: 'D', completed: false, createdBy: { username: ADMIN_USERNAME || 'admin' } })),
  http.put(`${API_BASE}/tasks/:id`, () => HttpResponse.json({ id: 1, title: 'Edited', description: 'Seeded', completed: true, createdBy: { username: ADMIN_USERNAME || 'admin' } })),
  http.delete(`${API_BASE}/tasks/:id`, () => HttpResponse.json({ message: 'Deleted' })),
  http.get(`${API_BASE}/activity`, () => HttpResponse.json([])),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
beforeEach(() => {
  localStorage.clear()
})

it('shows login and authenticates', async () => {
  render(<App />)
  await userEvent.type(screen.getByPlaceholderText(/username/i), ADMIN_USERNAME)
  await userEvent.type(screen.getByPlaceholderText(/password/i), ADMIN_PASSWORD)
  await userEvent.click(screen.getByRole('button', { name: /login/i }))
  expect(await screen.findByText(new RegExp(`logged in as ${ADMIN_USERNAME}`, 'i'))).toBeInTheDocument()
})

it('admin sees add task form', async () => {
  render(<App />)
  await userEvent.type(screen.getByPlaceholderText(/username/i), ADMIN_USERNAME)
  await userEvent.type(screen.getByPlaceholderText(/password/i), ADMIN_PASSWORD)
  await userEvent.click(screen.getByRole('button', { name: /login/i }))
  expect(await screen.findByText(/add task/i)).toBeInTheDocument()
})