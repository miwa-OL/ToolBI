import { cn } from '@/lib/utils'

const variants = {
  text: 'bg-blue-50 text-blue-600',
  number: 'bg-green-50 text-green-600',
  date: 'bg-orange-50 text-orange-600',
  boolean: 'bg-purple-50 text-purple-600',
  default: 'bg-black/[0.06] text-[#3A3A3C]',
}

interface BadgeProps {
  children: React.ReactNode
  variant?: keyof typeof variants
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium tracking-tight',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
