const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

const app = express()
app.use(cors({ origin: '*' }))
app.use(express.json())

// Health check: always reports service readiness
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() })
})

// Global process-level error logging to avoid crashes
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason)
})
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err)
})

const prisma = new PrismaClient()

function verifyToken(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ message: 'Missing token' })
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

function allowRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) return res.status(403).json({ message: 'Forbidden' })
    next()
  }
}

async function recordActivity(action, taskId, userId, details) {
  await prisma.activityLog.create({
    data: { action, taskId: taskId ?? null, userId, details: details ?? null },
  })
}

// Auth
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body || {}
  if (!username || !password) return res.status(400).json({ message: 'Username and password required' })

  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) return res.status(401).json({ message: 'Invalid credentials' })

  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' })

  const token = jwt.sign({ id: user.id, role: user.role, username: user.username }, process.env.JWT_SECRET, { expiresIn: '2h' })
  res.json({ token, role: user.role, username: user.username })
})

// Tasks
app.get('/tasks', verifyToken, async (req, res) => {
  const tasks = await prisma.task.findMany({ orderBy: { id: 'desc' } })
  res.json(tasks)
})

app.post('/tasks', verifyToken, allowRole('ADMIN'), async (req, res) => {
  const { title, description } = req.body || {}
  if (!title || !description) return res.status(400).json({ message: 'Title and description required' })
  const task = await prisma.task.create({ data: { title, description, createdById: req.user.id } })
  await recordActivity('CREATE_TASK', task.id, req.user.id, `Created ${task.title}`)
  res.status(201).json(task)
})

app.put('/tasks/:id', verifyToken, async (req, res) => {
  const id = Number(req.params.id)
  const { title, description, completed } = req.body || {}
  const existing = await prisma.task.findUnique({ where: { id } })
  if (!existing) return res.status(404).json({ message: 'Task not found' })

  const updated = await prisma.task.update({
    where: { id },
    data: {
      title: typeof title === 'string' ? title : existing.title,
      description: typeof description === 'string' ? description : existing.description,
      completed: typeof completed === 'boolean' ? completed : existing.completed,
    },
  })
  const action = typeof completed === 'boolean' && completed ? 'COMPLETE_TASK' : 'UPDATE_TASK'
  await recordActivity(action, updated.id, req.user.id, `Updated ${updated.title}`)
  res.json(updated)
})

app.delete('/tasks/:id', verifyToken, allowRole('ADMIN'), async (req, res) => {
  const id = Number(req.params.id)
  const existing = await prisma.task.findUnique({ where: { id } })
  if (!existing) return res.status(404).json({ message: 'Task not found' })
  await prisma.task.delete({ where: { id } })
  await recordActivity('DELETE_TASK', id, req.user.id, `Deleted ${existing.title}`)
  res.json({ message: 'Deleted' })
})

app.get('/activity', verifyToken, allowRole('ADMIN'), async (req, res) => {
  const logs = await prisma.activityLog.findMany({ orderBy: { id: 'desc' } })
  res.json(logs)
})

app.use((err, req, res, next) => {
  console.error('Unhandled:', err)
  res.status(500).json({ message: 'Internal server error' })
})

async function start() {
  try {
    await prisma.$connect()
    const port = Number(process.env.PORT || 3002)
    app.listen(port, () => console.log(`API running at http://localhost:${port}`))
  } catch (e) {
    console.error('Database connection failed:', e)
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1)
    } else {
      throw e
    }
  }
}

if (process.env.NODE_ENV !== 'test') {
  start()
}

module.exports = app