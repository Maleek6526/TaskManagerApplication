const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

// Detect hard reloads and clear auth to force login screen
function isHardReload() {
  try {
    const entries = typeof performance.getEntriesByType === 'function'
      ? performance.getEntriesByType('navigation')
      : [];
    if (entries && entries[0] && entries[0].type) return entries[0].type === 'reload';
    if (performance && performance.navigation && typeof performance.navigation.type === 'number') {
      return performance.navigation.type === 1; // legacy API: 1 = reload
    }
    return false;
  } catch {
    return false;
  }
}

if (isHardReload()) {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('username');
}

function getToken() {
  return localStorage.getItem('token') || '';
}

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error('Login failed');
  const data = await res.json();
  localStorage.setItem('token', data.token);
  localStorage.setItem('role', data.role);
  localStorage.setItem('username', data.username);
  return data;
}

export async function fetchTasks() {
  const res = await fetch(`${API_BASE}/tasks`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return res.json();
}

export async function createTask(payloadOrTitle, description) {
  const payload = typeof payloadOrTitle === 'object' ? payloadOrTitle : { title: payloadOrTitle, description };
  const res = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create task');
  return res.json();
}

export async function updateTask(id, payload) {
  const res = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update task');
  return res.json();
}

export async function deleteTask(id) {
  const res = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to delete task');
  return res.json();
}

export async function fetchActivity() {
  const res = await fetch(`${API_BASE}/activity`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to fetch activity');
  return res.json();
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('username');
}

// Compatibility exports expected by AppTask.jsx
export function getAuth() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  return {
    token,
    role: localStorage.getItem('role') || 'USER',
    username: localStorage.getItem('username') || '',
  };
}

export async function getTasks() {
  return fetchTasks();
}

export async function getActivity() {
  return fetchActivity();
}