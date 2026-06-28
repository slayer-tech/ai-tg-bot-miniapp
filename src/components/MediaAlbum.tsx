import { Sparkle } from '@phosphor-icons/react'
import { GlassButton } from './primitives/GlassButton'
import { GlassModal } from './primitives/GlassSheet'
import { GlassTextarea } from './primitives/GlassField'

export function MediaPickerDialog({
  title,
  count,
  onPick,
  onCancel,
}: {
  title: string
  count: number
  onPick: (index: number) => void
  onCancel: () => void
}) {
  return (
    <GlassModal open onClose={onCancel}>
      <div className="p-5 flex flex-col gap-3">
        <strong className="text-sm">{title}</strong>
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              type="button"
              className="rounded-xl py-3 text-sm font-medium bg-[color-mix(in_srgb,var(--glass-text)_6%,transparent)] ring-1 ring-[var(--glass-border)] active:scale-[0.98] transition-transform"
              onClick={() => onPick(i)}
            >
              Фото {i + 1}
            </button>
          ))}
        </div>
        <GlassButton variant="secondary" full onClick={onCancel}>
          Отмена
        </GlassButton>
      </div>
    </GlassModal>
  )
}

export function AiImageEditDialog({
  photoIndex,
  photoCount,
  prompt,
  busy,
  onPromptChange,
  onSubmit,
  onCancel,
}: {
  photoIndex: number
  photoCount: number
  prompt: string
  busy: boolean
  onPromptChange: (v: string) => void
  onSubmit: () => void
  onCancel: () => void
}) {
  return (
    <GlassModal open onClose={onCancel}>
      <div className="p-5 flex flex-col gap-3">
        <strong className="text-sm">ИИ-редакт фото {photoIndex + 1}{photoCount > 1 ? ` из ${photoCount}` : ''}</strong>
        <p className="text-xs text-[var(--glass-hint)] m-0">
          Опишите, что изменить: убрать водяной знак, поменять фон, добавить деталь…
        </p>
        <GlassTextarea
          rows={4}
          placeholder="Например: убери логотип в углу, сделай фон светлее"
          value={prompt}
          disabled={busy}
          onChange={(e) => onPromptChange(e.target.value)}
        />
        <GlassButton
          disabled={busy || prompt.trim().length < 2}
          full
          trailing={<Sparkle size={14} weight="fill" />}
          onClick={onSubmit}
        >
          {busy ? 'Обработка…' : 'Доработать'}
        </GlassButton>
        <GlassButton variant="secondary" disabled={busy} full onClick={onCancel}>
          Отмена
        </GlassButton>
      </div>
    </GlassModal>
  )
}

const GRID: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-2',
  5: 'grid-cols-3',
  6: 'grid-cols-3',
  7: 'grid-cols-3',
  8: 'grid-cols-4',
  9: 'grid-cols-3',
  10: 'grid-cols-4',
}

export function MediaAlbumGrid({
  items,
  editable,
  onPhotoClick,
}: {
  items: { src: string; index: number }[]
  editable: boolean
  onPhotoClick: (index: number) => void
}) {
  const count = items.length
  const cols = GRID[Math.min(count, 10)] || 'grid-cols-3'

  return (
    <div className={`grid ${cols} gap-2`}>
      {items.map((item) => (
        <button
          key={item.index}
          type="button"
          className={`relative overflow-hidden rounded-xl aspect-square ring-1 ring-[var(--glass-border)] ${
            editable ? 'active:scale-[0.98] transition-transform' : 'cursor-default'
          } ${count === 1 ? 'col-span-full max-h-64' : ''}`}
          onClick={() => editable && onPhotoClick(item.index)}
          disabled={!editable}
        >
          <img src={item.src} alt="" className="h-full w-full object-cover" />
          {editable && count > 1 && (
            <span className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[10px] font-mono text-white">
              {item.index + 1}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
