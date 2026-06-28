export function MeshBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10" aria-hidden>
      <div className="mesh-orb-emerald absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-60" />
      <div className="mesh-orb-rose absolute top-1/3 -right-20 h-64 w-64 rounded-full blur-3xl opacity-40" />
      <div className="mesh-orb-emerald absolute bottom-0 left-1/4 h-56 w-56 rounded-full blur-3xl opacity-30" />
    </div>
  )
}
