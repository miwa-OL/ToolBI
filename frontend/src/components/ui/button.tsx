import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const variants = {
  default: 'bg-[#007AFF] text-white hover:bg-[#006CE6] active:bg-[#0062CC] shadow-sm',
  outline: 'border border-black/[0.12] bg-white text-[#1C1C1E] hover:bg-black/[0.04] shadow-sm',
  ghost: 'text-[#3A3A3C] hover:bg-black/[0.06] hover:text-[#1C1C1E]',
  destructive: 'bg-[#FF3B30] text-white hover:bg-[#E0352B] active:bg-[#CC3027] shadow-sm',
}

const sizes = {
  sm: 'h-7 px-3 text-xs',
  default: 'h-8 px-4 text-sm',
  lg: 'h-10 px-5 text-sm',
  icon: 'h-8 w-8 p-0',
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/50 focus-visible:ring-offset-1',
        'disabled:pointer-events-none disabled:opacity-40',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
)
Button.displayName = 'Button'

export { Button }
