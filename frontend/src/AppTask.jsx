import { useEffect, useState, useMemo, memo } from 'react'
import './index.css'
import { login, getTasks, createTask, updateTask, deleteTask, getActivity, getAuth, logout as apiLogout } from './api'
import Logo from './brand/Logo'
import swal from 'sweetalert'

function LoginForm({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await login(username, password)
      onLogin(data)
      swal({ title: 'Logged in', text: `Welcome ${data.username}`, icon: 'success', timer: 1500, buttons: false })
    } catch (err) {
      setError('Invalid credentials')
      swal({ title: 'Login failed', text: 'Check your username or password.', icon: 'error', timer: 2000, buttons: false })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleLogin} className="card space-y-3 max-w-md mx-auto">
      <label htmlFor="login-username" className="text-sm sm:text-base">Username</label>
      <input id="login-username" className="input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
      <label htmlFor="login-password" className="text-sm sm:text-base">Password</label>
      <div className="relative">
        <input
          id="login-password"
          className="input pr-10"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <button
          type="button"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-neutral-300 hover:text-neutral-100"
          onClick={() => setShowPassword((v) => !v)}
        >
          {showPassword ? '🙈' : '👁️'}
        </button>
      </div>
      {error && <div className="text-red-400 text-sm">{error}</div>}
      <button type="submit" className="btn btn-primary" disabled={loading || !username.trim() || !password.trim()}>
        {loading ? 'Logging in…' : 'Login'}
      </button>
    </form>
  )
}

function AddTaskForm({ onAdd, submitting }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    await onAdd({ title, description })
    setTitle('')
    setDescription('')
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-3">
      <h3 className="font-semibold text-lg sm:text-xl">Add Task</h3>
      <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (required)" />
      <textarea className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" />
      <button type="submit" className="btn btn-primary" disabled={submitting || !title.trim()}>{submitting ? 'Saving…' : 'Save'}</button>
    </form>
  )
}

const TaskItem = memo(function TaskItem({ task, canDelete, onSave, onComplete, onDelete, currentUser }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ title: task.title, description: task.description })

  async function handleSave() {
    if (!form.title.trim()) return
    await onSave({ ...task, ...form })
    setEditing(false)
  }

  const authorLabel = task.createdBy?.username
    ? (task.createdBy.username === currentUser?.username ? 'You' : task.createdBy.username)
    : null

  return (
    <div className="card space-y-2">
      {editing ? (
        <div className="space-y-2">
          <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title (required)" />
          <textarea className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)" />
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary" aria-label="Save task" onClick={handleSave} disabled={!form.title.trim()}>Save</button>
            <button className="btn btn-secondary" aria-label="Cancel edit" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="font-semibold text-base sm:text-lg">{task.title}</div>
          <div className="text-neutral-300 text-sm">{task.description}</div>
          <div className="text-neutral-400 text-xs">
            {authorLabel ? `By ${authorLabel} · ` : ''}Completed: {task.completed ? 'Yes' : 'No'}
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <button className="btn btn-secondary" aria-label="Edit task" onClick={() => setEditing(true)}>Edit</button>
            <button className="btn btn-success" aria-label="Complete task" onClick={() => onComplete(task)}>Complete</button>
            {canDelete && (
              <button className="btn btn-danger" aria-label="Delete task" onClick={() => onDelete(task)}>Delete</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
})

function ActivityItem({ log, taskTitle }) {
  const icons = {
    CREATE_TASK: { label: 'Created', color: 'text-emerald-400', glyph: '➕' },
    UPDATE_TASK: { label: 'Updated', color: 'text-blue-400', glyph: '✏️' },
    COMPLETE_TASK: { label: 'Completed', color: 'text-emerald-400', glyph: '✅' },
    DELETE_TASK: { label: 'Deleted', color: 'text-red-400', glyph: '🗑️' },
    default: { label: log.action, color: 'text-neutral-300', glyph: '🔔' },
  }
  const meta = icons[log.action] || icons.default
  const time = new Date(log.createdAt)

  const [expanded, setExpanded] = useState(false)
  const hasLongDetails = typeof log.details === 'string' && log.details.length > 140
  const shownDetails = expanded || !hasLongDetails ? log.details : log.details.slice(0, 140) + '…'

  return (
    <div className="card flex flex-col gap-2">
      <div className="flex items-start gap-3">
        <span className={`text-lg ${meta.color}`} aria-hidden>{meta.glyph}</span>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{meta.label}</span>
            {log.userId && (
              <span className="px-2 py-1 rounded bg-neutral-800 text-neutral-200 text-xs" title={`User ID: ${log.userId}`}>
                User #{log.userId}
              </span>
            )}
            {log.taskId && (
              <span className="px-2 py-1 rounded bg-neutral-800 text-neutral-200 text-xs" title={`Task ID: ${log.taskId}`}>
                {taskTitle ? taskTitle : `Task #${log.taskId}`}
              </span>
            )}
            <span className="text-neutral-400 text-xs ml-auto">
              {time.toLocaleString()}
            </span>
          </div>

          {log.details && (
            <div className="text-neutral-300 text-sm mt-1">
              {shownDetails}
              {hasLongDetails && (
                <button
                  type="button"
                  className="ml-2 text-xs underline hover:no-underline text-blue-300 motion-safe:transition-colors"
                  onClick={() => setExpanded((v) => !v)}
                >
                  {expanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AppTask() {
  const [user, setUser] = useState(getAuth())
  const [tasks, setTasks] = useState([])
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [filter, setFilter] = useState('all')

  const role = user?.role
  const isAdmin = role === 'ADMIN'

  useEffect(() => {
    async function load() {
      if (!user) return
      setLoading(true)
      try {
        const [ts, act] = await Promise.all([
          getTasks(),
          isAdmin ? getActivity() : Promise.resolve([]),
        ])
        setTasks(ts)
        setActivity(act)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, isAdmin])

  async function handleAdd(newTask) {
    setAdding(true)
    try {
      const created = await createTask(newTask)
      setTasks((prev) => [created, ...prev])
      swal({ title: 'Task created', text: 'Your task was added.', icon: 'success', timer: 1500, buttons: false })
    } catch (e) {
      swal({ title: 'Could not create task', text: 'Please try again.', icon: 'error', timer: 2000, buttons: false })
    } finally {
      setAdding(false)
    }
  }

  async function handleSave(updated) {
    try {
      const res = await updateTask(updated.id, { title: updated.title, description: updated.description })
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? res : t)))
      swal({ title: 'Task updated', text: 'Changes saved.', icon: 'success', timer: 1200, buttons: false })
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? { ...t, title: updated.title, description: updated.description } : t)))
      swal({ title: 'Saved locally', text: 'Network failed, kept your changes.', icon: 'warning', timer: 2000, buttons: false })
    }
  }

  async function handleComplete(t) {
    try {
      const res = await updateTask(t.id, { completed: true })
      setTasks((prev) => prev.map((x) => (x.id === t.id ? res : x)))
      swal({ title: 'Task completed', text: 'Marked as done.', icon: 'success', timer: 1200, buttons: false })
    } catch {
      setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, completed: true } : x)))
      swal({ title: 'Completed locally', text: 'Network failed, kept your change.', icon: 'warning', timer: 2000, buttons: false })
    }
  }

  async function handleDelete(t) {
    // optimistic removal
    setTasks((prev) => prev.filter((x) => x.id !== t.id))
    // non-blocking undo prompt
    swal({
      title: 'Task deleted',
      text: 'Undo this action?',
      icon: 'info',
      buttons: {
        cancel: 'Dismiss',
        undo: {
          text: 'Undo',
          value: 'undo',
        },
      },
      timer: 5000,
    }).then((value) => {
      if (value === 'undo') {
        // Re-create task
        createTask({ title: t.title, description: t.description }).then((created) => {
          setTasks((prev) => [created, ...prev])
          swal({ title: 'Restored', text: 'Task has been restored.', icon: 'success', timer: 1500, buttons: false })
        })
      }
    })
    try {
      await deleteTask(t.id)
    } catch {
      // noop in tests; UI already updated optimistically
    }
  }

  function handleLogout() {
    apiLogout()
    setUser(null)
    setTasks([])
    setActivity([])
    setFilter('all')
    swal({ title: 'Logged out', text: 'You have been signed out.', icon: 'success', timer: 1500, buttons: false })
  }

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filter === 'active') return !t.completed
      if (filter === 'completed') return t.completed
      return true
    })
  }, [tasks, filter])

  const tasksById = useMemo(() => {
    const map = new Map()
    tasks.forEach((t) => map.set(t.id, t))
    return map
  }, [tasks])

  const [visibleCount, setVisibleCount] = useState(20)
  const visibleActivity = useMemo(() => activity.slice(0, visibleCount), [activity, visibleCount])

  const groupedByDay = useMemo(() => {
    const groups = []
    let currentKey = null
    let currentItems = []
    for (const a of visibleActivity) {
      const d = new Date(a.createdAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      if (key !== currentKey) {
        if (currentItems.length) groups.push({ key: currentKey, items: currentItems })
        currentKey = key
        currentItems = [a]
      } else {
        currentItems.push(a)
      }
    }
    if (currentItems.length) groups.push({ key: currentKey, items: currentItems })
    return groups
  }, [visibleActivity])

  return (
    <div className="min-h-screen bg-brandBlack text-white">
      <header className="border-b border-neutral-800">
        <div className="mx-auto max-w-3xl px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Logo />
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-sm sm:text-base text-neutral-400">
              {user ? `Logged in as ${user.username} (${user.role})` : 'Not logged in'}
            </div>
            {user && (
              <button className="btn btn-secondary" onClick={handleLogout} aria-label="Logout">Logout</button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 pb-[env(safe-area-inset-bottom)] space-y-6">
        {!user ? (
          <LoginForm onLogin={setUser} />
        ) : (
          <>
            {isAdmin && <AddTaskForm onAdd={handleAdd} submitting={adding} />}

            <section className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <h2 className="text-xl sm:text-2xl font-semibold">Tasks</h2>
                <div className="sm:ml-auto flex flex-wrap gap-2 text-sm sm:text-base">
                  <label className="flex items-center gap-1">
                    <input type="radio" name="filter" checked={filter==='all'} onChange={() => setFilter('all')} /> All
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="radio" name="filter" checked={filter==='active'} onChange={() => setFilter('active')} /> Active
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="radio" name="filter" checked={filter==='completed'} onChange={() => setFilter('completed')} /> Completed
                  </label>
                </div>
              </div>
              {loading && (
                <div className="space-y-2" aria-live="polite">
                  <div className="motion-safe:animate-pulse h-6 bg-neutral-800 rounded" />
                  <div className="motion-safe:animate-pulse h-6 bg-neutral-800 rounded" />
                  <div className="motion-safe:animate-pulse h-6 bg-neutral-800 rounded" />
                </div>
              )}
              {!loading && filteredTasks.length === 0 && (
                <div className="text-neutral-400">No tasks yet</div>
              )}
              <div className="grid grid-cols-1 gap-3">
                {filteredTasks.map((t) => (
                  <TaskItem
                    key={t.id}
                    task={t}
                    canDelete={isAdmin}
                    onSave={handleSave}
                    onComplete={handleComplete}
                    onDelete={handleDelete}
                    currentUser={user}
                  />
                ))}
              </div>
            </section>

            {isAdmin && (
              <section className="space-y-3">
                <h2 className="text-xl sm:text-2xl font-semibold">Activity Log</h2>
                <div className="space-y-2">
                  {activity.length === 0 && <div className="text-neutral-400">No activity yet</div>}

                  {groupedByDay.map((group) => (
                    <div key={group.key} className="space-y-2">
                      <div className="sticky top-0 bg-neutral-900/80 backdrop-blur py-1 px-2 rounded text-neutral-300 text-xs">
                        {group.key}
                      </div>
                      {group.items.map((a) => (
                        <ActivityItem key={a.id} log={a} taskTitle={tasksById.get(a.taskId)?.title} />
                      ))}
                    </div>
                  ))}

                  {visibleCount < activity.length && (
                    <div className="flex justify-center">
                      <button
                        type="button"
                        className="btn btn-secondary min-w-[140px]"
                        onClick={() => setVisibleCount((c) => Math.min(c + 20, activity.length))}
                      >
                        Load more
                      </button>
                    </div>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}