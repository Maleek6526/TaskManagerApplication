import '@testing-library/jest-dom'
import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from 'vitest'
import { render, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../AppTask'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

const API_BASE = import.meta.env.VITE_API_BASE_URL
const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'
const USER_USERNAME = import.meta.env.VITE_USER_USERNAME || 'user'
const USER_PASSWORD = import.meta.env.VITE_USER_PASSWORD || 'user123'

let tasks = [
  { id: 1, title: 'Initial', description: 'Seeded', completed: false, createdBy: { username: ADMIN_USERNAME || 'admin' } },
]

const server = setupServer(
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    const body = await request.json()
    if (body.username === USER_USERNAME && body.password === USER_PASSWORD) {
      return HttpResponse.json({ token: 't', role: 'USER', username: USER_USERNAME })
    }
    if (body.username === ADMIN_USERNAME && body.password === ADMIN_PASSWORD) {
      return HttpResponse.json({ token: 't', role: 'ADMIN', username: ADMIN_USERNAME })
    }
    return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }),
  http.get(`${API_BASE}/tasks`, () => HttpResponse.json(tasks)),
  http.post(`${API_BASE}/tasks`, async ({ request }) => {
    const body = await request.json()
    const nextId = tasks.length ? Math.max(...tasks.map(t => t.id)) + 1 : 1
    const created = { id: nextId, completed: false, createdBy: { username: ADMIN_USERNAME || 'admin' }, ...body }
    tasks = [created, ...tasks]
    return HttpResponse.json(created)
  }),
  http.put(`${API_BASE}/tasks/:id`, async ({ params, request }) => {
    const id = Number(params.id)
    const body = await request.json()
    tasks = tasks.map((t) => (t.id === id ? { ...t, ...body } : t))
    return HttpResponse.json(tasks.find((t) => t.id === id))
  }),
  http.delete(`${API_BASE}/tasks/:id`, async ({ params }) => {
    const id = Number(params.id)
    tasks = tasks.filter((t) => t.id !== id)
    return HttpResponse.json({ message: 'Deleted' })
  }),
  http.get(`${API_BASE}/activity`, () => HttpResponse.json([])),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
beforeEach(() => {
  localStorage.clear()
  tasks = [
    { id: 1, title: 'Initial', description: 'Seeded', completed: false, createdBy: { username: ADMIN_USERNAME || 'admin' } },
  ]
})

it('user can edit and complete a task', async () => {
  render(<App />)
  await userEvent.type(screen.getByPlaceholderText(/username/i), USER_USERNAME)
  await userEvent.type(screen.getByPlaceholderText(/password/i), USER_PASSWORD)
  await userEvent.click(screen.getByRole('button', { name: /login/i }))

  // Edit
  const editButton = await screen.findByRole('button', { name: /edit/i })
  await userEvent.click(editButton)
  const titleInput = screen.getByDisplayValue('Initial')
  await userEvent.clear(titleInput)
  await userEvent.type(titleInput, 'Edited')
  await userEvent.click(screen.getByRole('button', { name: /save/i }))
  expect(await screen.findByText('Edited')).toBeInTheDocument()

  // Complete
  const completeButton = screen.getByRole('button', { name: /complete/i })
  await userEvent.click(completeButton)
  await waitFor(() => expect(screen.getByText(/completed: yes/i)).toBeInTheDocument())
})

it('admin can delete a task', async () => {
  render(<App />)
  await userEvent.type(screen.getByPlaceholderText(/username/i), ADMIN_USERNAME)
  await userEvent.type(screen.getByPlaceholderText(/password/i), ADMIN_PASSWORD)
  await userEvent.click(screen.getByRole('button', { name: /login/i }))
  // Ensure at least one task exists
  await userEvent.type(screen.getByPlaceholderText(/title/i), 'EraseMe')
  await userEvent.type(screen.getByPlaceholderText(/description/i), 'D')
  await userEvent.click(screen.getByRole('button', { name: /save/i }))
  expect(await screen.findByText('EraseMe')).toBeInTheDocument()

  // Delete all tasks to reach empty state
  const deleteButtons = await screen.findAllByRole('button', { name: /delete/i })
  for (const btn of deleteButtons) {
    await userEvent.click(btn)
  }
  await waitFor(() => expect(screen.queryByText(/no tasks yet/i)).toBeInTheDocument())
})