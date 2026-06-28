import { Btn } from './ui'

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
    <div className="rte-link-overlay" onClick={onCancel}>
      <div className="rte-link-dialog media-picker-dialog" onClick={(e) => e.stopPropagation()}>
        <strong>{title}</strong>
        <div className="media-picker-list">
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              type="button"
              className="media-picker-item"
              onClick={() => onPick(i)}
            >
              Фото {i + 1}
            </button>
          ))}
        </div>
        <Btn variant="secondary" onClick={onCancel} full>
          Отмена
        </Btn>
      </div>
    </div>
  )
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
  const cls = `media-album count-${Math.min(count, 10)}`

  return (
    <div className={cls}>
      {items.map((item) => (
        <button
          key={item.index}
          type="button"
          className={`media-album-item${editable ? ' editable' : ''}`}
          onClick={() => editable && onPhotoClick(item.index)}
          disabled={!editable}
        >
          <img src={item.src} alt="" />
          {editable && count > 1 && <span className="media-album-badge">{item.index + 1}</span>}
        </button>
      ))}
    </div>
  )
}
