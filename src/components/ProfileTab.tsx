import type { Me } from '../lib/api'
import { Btn, Card, StatGrid } from './ui'

export function ProfileTab({
  me,
  billing,
  onRefresh,
}: {
  me: Me
  billing: { text_credits: number; image_credits: number; unlimited: boolean } | null
  onRefresh: () => void
}) {
  return (
    <>
      <Card title="Аккаунт">
        <div className="profile-row">
          <div className="avatar">{me.username?.[0]?.toUpperCase() || 'U'}</div>
          <div>
            <strong>{me.username ? `@${me.username}` : `ID ${me.id}`}</strong>
            <p className="muted">Telegram ID: {me.id}</p>
          </div>
        </div>
      </Card>

      <Card title="Лимиты">
        {billing?.unlimited ? (
          <p className="unlimited">∞ Безлимитный dev-тариф</p>
        ) : (
          <StatGrid
            items={[
              { label: 'Текстовые посты', value: billing?.text_credits ?? me.text_credits },
              { label: 'Картинки', value: billing?.image_credits ?? me.image_credits },
            ]}
          />
        )}
        <Btn variant="secondary" onClick={onRefresh} full>
          Обновить
        </Btn>
      </Card>
    </>
  )
}
