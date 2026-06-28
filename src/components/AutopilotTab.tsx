import { useEffect, useState } from 'react'
import { api, type Autopilot } from '../lib/api'
import { Btn, Card, Field, StatGrid } from './ui'

const QUEUE_LABELS: Record<string, string> = {
  pending: 'Ожидание',
  generating: 'Генерация',
  ready: 'Готовы',
  published: 'Опублик.',
  failed: 'Ошибки',
}

export function AutopilotTab({
  autopilot,
  onUpdate,
}: {
  autopilot: Autopilot | null
  onUpdate: () => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const [postsPerDay, setPostsPerDay] = useState(autopilot?.posts_per_day ?? 1)
  const [genDays, setGenDays] = useState(autopilot?.generation_days ?? 7)

  useEffect(() => {
    if (autopilot) {
      setPostsPerDay(autopilot.posts_per_day)
      setGenDays(autopilot.generation_days)
    }
  }, [autopilot])

  if (!autopilot) return null

  const running = autopilot.enabled && !autopilot.paused

  const saveConfig = async () => {
    setBusy(true)
    try {
      await api.patchAutopilot({
        posts_per_day: postsPerDay,
        generation_days: genDays,
      })
      await onUpdate()
    } finally {
      setBusy(false)
    }
  }

  const toggleRun = async () => {
    setBusy(true)
    try {
      if (running) await api.pauseAutopilot()
      else await api.resumeAutopilot()
      await onUpdate()
    } finally {
      setBusy(false)
    }
  }

  const stats = Object.entries(autopilot.queue_stats).filter(([, v]) => v > 0)

  return (
    <>
      <Card title="Autopilot">
        <div className={`status-pill ${running ? 'running' : 'paused'}`}>
          {running ? '● Работает' : '⏸ На паузе'}
        </div>

        <StatGrid
          items={stats.length
            ? stats.map(([k, v]) => ({ label: QUEUE_LABELS[k] || k, value: v }))
            : [{ label: 'Очередь', value: 'пусто' }]}
        />

        <div className="btn-row">
          <Btn onClick={toggleRun} disabled={busy} full>
            {running ? 'Поставить на паузу' : 'Запустить'}
          </Btn>
        </div>
      </Card>

      <Card title="Параметры">
        <Field label="Постов в день" hint="1–10">
          <input
            type="range"
            min={1}
            max={10}
            value={postsPerDay}
            onChange={(e) => setPostsPerDay(Number(e.target.value))}
            className="range"
          />
          <div className="range-value">{postsPerDay}</div>
        </Field>

        <Field label="Глубина генерации (дней)" hint="Сколько дней вперёд наполнять очередь">
          <select
            className="input"
            value={genDays}
            onChange={(e) => setGenDays(Number(e.target.value))}
          >
            {[1, 2, 3, 5, 7, 10, 14].map((n) => (
              <option key={n} value={n}>
                {n} дн.
              </option>
            ))}
          </select>
        </Field>

        <Btn onClick={saveConfig} disabled={busy} full>
          Сохранить параметры
        </Btn>
      </Card>
    </>
  )
}
