import { cn } from '../../lib/cn'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('rounded-xl shimmer', className)} />
}

export function AppSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-4 pt-2">
      <Skeleton className="h-14 w-full rounded-2xl" />
      <Skeleton className="h-32 w-full rounded-[2rem]" />
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-40 w-full rounded-[2rem]" />
    </div>
  )
}
