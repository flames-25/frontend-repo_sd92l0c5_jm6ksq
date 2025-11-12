import { useEffect, useRef, useState } from 'react'

export default function Timer({ token, currentTask, onSessionStart, onSessionStop }) {
  const [mode, setMode] = useState('pomodoro')
  const [seconds, setSeconds] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [sessionId, setSessionId] = useState(null)

  const tickRef = useRef(null)

  useEffect(() => {
    if (running) {
      tickRef.current = setInterval(() => {
        setSeconds((s) => (mode === 'pomodoro' ? Math.max(0, s - 1) : s + 1))
      }, 1000)
    }
    return () => clearInterval(tickRef.current)
  }, [running, mode])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === ' ') {
        e.preventDefault()
        if (!running) start()
        else pause()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [running])

  const backend = import.meta.env.VITE_BACKEND_URL

  async function start() {
    setRunning(true)
    if (!sessionId) {
      const res = await fetch(`${backend}/sessions/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ task_id: currentTask?.id || null, mode }),
      })
      const data = await res.json()
      setSessionId(data.id)
      onSessionStart?.(data)
    }
  }

  function pause() {
    setRunning(false)
  }

  async function stop() {
    setRunning(false)
    if (sessionId) {
      await fetch(`${backend}/sessions/${sessionId}/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      })
      onSessionStop?.()
      setSessionId(null)
    }
    if (mode === 'pomodoro') setSeconds(25 * 60)
    else setSeconds(0)
  }

  function format(s) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  return (
    <div className="rounded-xl border bg-white/70 backdrop-blur p-4 shadow-sm dark:bg-neutral-900/70">
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-2">
          <button className={`px-2 py-1 rounded ${mode==='pomodoro'?'bg-blue-600 text-white':'bg-neutral-100 dark:bg-neutral-800'}`} onClick={() => { setMode('pomodoro'); setSeconds(25*60); }}>Pomodoro</button>
          <button className={`px-2 py-1 rounded ${mode==='stopwatch'?'bg-blue-600 text-white':'bg-neutral-100 dark:bg-neutral-800'}`} onClick={() => { setMode('stopwatch'); setSeconds(0); }}>Stopwatch</button>
        </div>
        <span className="text-sm text-neutral-500">Space: start/stop</span>
      </div>
      <div className="text-5xl font-semibold text-center tabular-nums mb-4">{format(seconds)}</div>
      <div className="flex items-center justify-center gap-3">
        {!running ? (
          <button onClick={start} className="px-4 py-2 rounded bg-green-600 text-white">Start</button>
        ) : (
          <button onClick={pause} className="px-4 py-2 rounded bg-yellow-500 text-white">Pause</button>
        )}
        <button onClick={stop} className="px-4 py-2 rounded bg-neutral-200 dark:bg-neutral-800">Stop</button>
        <button onClick={() => { setMode('pomodoro'); setSeconds(25*60); setRunning(false) }} className="px-4 py-2 rounded bg-blue-100 text-blue-700">Reset</button>
      </div>
      {currentTask && (
        <div className="mt-3 text-center text-sm text-neutral-600 dark:text-neutral-300">Focused on: <strong>{currentTask.title}</strong></div>
      )}
    </div>
  )
}
