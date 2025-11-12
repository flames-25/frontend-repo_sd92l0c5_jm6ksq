import { useEffect, useMemo, useState } from 'react'
import Spline from '@splinetool/react-spline'
import Timer from './components/Timer'

const backend = import.meta.env.VITE_BACKEND_URL

function useAuth() {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [user, setUser] = useState(null)

  async function loginDemo() {
    // Create or login demo user
    const email = 'demo@blitz.local'
    const password = 'demo12345'
    try {
      const res = await fetch(`${backend}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      if (!res.ok) throw new Error('login')
      const data = await res.json()
      setToken(data.token)
      localStorage.setItem('token', data.token)
      setUser(data.user)
    } catch (e) {
      const res = await fetch(`${backend}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Demo', email, password }) })
      const data = await res.json()
      setToken(data.token)
      localStorage.setItem('token', data.token)
      setUser(data.user)
    }
  }

  return { token, user, loginDemo }
}

function App() {
  const { token, user, loginDemo } = useAuth()
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [currentProject, setCurrentProject] = useState(null)
  const [currentTask, setCurrentTask] = useState(null)

  useEffect(() => {
    if (!token) return
    ;(async () => {
      const ps = await fetch(`${backend}/projects`, { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.json())
      setProjects(ps)
      const ts = await fetch(`${backend}/tasks`, { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.json())
      setTasks(ts)
    })()
  }, [token])

  async function addProject() {
    const name = prompt('New project name?')
    if (!name) return
    const p = await fetch(`${backend}/projects`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ name }) }).then(r=>r.json())
    setProjects(prev => [...prev, p])
  }

  async function addTask() {
    const title = prompt('Task title?')
    if (!title) return
    const t = await fetch(`${backend}/tasks`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ title, project_id: currentProject?.id || 'inbox', priority: 'medium' }) }).then(r=>r.json())
    setTasks(prev => [...prev, t])
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-black dark:to-neutral-900 text-neutral-900 dark:text-white">
      {/* Hero with Spline */}
      <section className="relative h-[340px] overflow-hidden">
        <Spline scene="https://prod.spline.design/VJLoxp84lCdVfdZu/scene.splinecode" style={{ width: '100%', height: '100%' }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <h1 className="text-4xl md:text-6xl font-semibold drop-shadow-sm">BlitzNow</h1>
          <p className="mt-3 text-neutral-700 dark:text-neutral-300 text-center max-w-xl">Organize projects, track tasks, and focus with a lightning-fast Pomodoro timer.</p>
          {!token && (
            <button onClick={loginDemo} className="pointer-events-auto mt-6 px-5 py-2 rounded bg-blue-600 text-white shadow hover:bg-blue-700">Try Demo</button>
          )}
        </div>
      </section>

      {/* App Shell */}
      {token && (
        <div className="grid grid-cols-12 gap-4 p-4">
          <aside className="col-span-12 md:col-span-3 lg:col-span-2 bg-white/70 dark:bg-neutral-900/70 border rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">Projects</h2>
              <button onClick={addProject} className="text-sm px-2 py-1 rounded bg-blue-600 text-white">Add</button>
            </div>
            <ul className="space-y-1">
              {projects.map(p => (
                <li key={p.id}>
                  <button onClick={() => setCurrentProject(p)} className={`w-full text-left px-2 py-1 rounded ${currentProject?.id===p.id?'bg-blue-50 dark:bg-blue-900/40':''}`}>{p.name}</button>
                </li>
              ))}
            </ul>
          </aside>

          <main className="col-span-12 md:col-span-6 lg:col-span-7 bg-white/70 dark:bg-neutral-900/70 border rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">Tasks</h2>
              <button onClick={addTask} className="text-sm px-2 py-1 rounded bg-green-600 text-white">Quick Add (Ctrl+K)</button>
            </div>
            <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {tasks.filter(t=>!currentProject || t.project_id===currentProject.id).map(t => (
                <li key={t.id} className="py-2 flex items-center justify-between">
                  <button onClick={()=> setCurrentTask(t)} className="text-left">
                    <div className="font-medium">{t.title}</div>
                    <div className="text-xs text-neutral-500">{t.priority}</div>
                  </button>
                  <button onClick={()=> setCurrentTask(t)} className="text-sm px-2 py-1 rounded bg-purple-600 text-white">Blitz Now</button>
                </li>
              ))}
            </ul>
          </main>

          <section className="col-span-12 md:col-span-3 lg:col-span-3 space-y-3">
            <div className="bg-white/70 dark:bg-neutral-900/70 border rounded-xl p-3">
              <h2 className="font-semibold mb-2">Details</h2>
              {currentTask ? (
                <div>
                  <div className="text-lg font-medium">{currentTask.title}</div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-300">{currentTask.description || 'No description.'}</div>
                </div>
              ) : (
                <div className="text-sm text-neutral-500">Select a task to see details.</div>
              )}
            </div>
            <Timer token={token} currentTask={currentTask} />
          </section>
        </div>
      )}
    </div>
  )
}

export default App
