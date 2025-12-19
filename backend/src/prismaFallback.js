const bcrypt = require('bcrypt')

const ADMIN_USERNAME = process.env.ADMIN_USERNAME
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
const USER_USERNAME = process.env.USER_USERNAME
const USER_PASSWORD = process.env.USER_PASSWORD

// Build users only if credentials are provided to avoid crashes
const users = []
if (ADMIN_USERNAME && ADMIN_PASSWORD) {
  users.push({ id: 1, username: ADMIN_USERNAME, passwordHash: bcrypt.hashSync(ADMIN_PASSWORD, 10), role: 'ADMIN' })
}
if (USER_USERNAME && USER_PASSWORD) {
  users.push({ id: users.length ? Math.max(...users.map(u => u.id)) + 1 : 2, username: USER_USERNAME, passwordHash: bcrypt.hashSync(USER_PASSWORD, 10), role: 'USER' })
}

let tasks = []
let activityLogs = []

class PrismaFallback {
  constructor() {}
  user = {
    findUnique: async ({ where: { username } }) => users.find((u) => u.username === username) || null,
  }
  task = {
    findMany: async () => tasks.slice().sort((a, b) => b.id - a.id),
    create: async ({ data }) => {
      const id = tasks.length ? Math.max(...tasks.map((t) => t.id)) + 1 : 1
      const createdBy = users.find((u) => u.id === data.createdById)
      const task = {
        id,
        title: data.title,
        description: data.description,
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: data.createdById,
        createdBy,
        activityLogs: [],
      }
      tasks.push(task)
      return task
    },
    findUnique: async ({ where: { id } }) => tasks.find((t) => t.id === id) || null,
    update: async ({ where: { id }, data }) => {
      const idx = tasks.findIndex((t) => t.id === id)
      if (idx < 0) throw new Error('Not found')
      tasks[idx] = { ...tasks[idx], ...data, updatedAt: new Date() }
      return tasks[idx]
    },
    delete: async ({ where: { id } }) => {
      const idx = tasks.findIndex((t) => t.id === id)
      if (idx < 0) throw new Error('Not found')
      const t = tasks[idx]
      tasks.splice(idx, 1)
      return t
    },
  }
  activityLog = {
    create: async ({ data }) => {
      const id = activityLogs.length ? Math.max(...activityLogs.map((l) => l.id)) + 1 : 1
      const log = {
        id,
        action: data.action,
        details: data.details ?? null,
        createdAt: new Date(),
        userId: data.userId,
        taskId: data.taskId ?? null,
      }
      activityLogs.push(log)
      return log
    },
    findMany: async () => activityLogs.slice().sort((a, b) => b.id - a.id),
  }
}

module.exports = { PrismaFallback }