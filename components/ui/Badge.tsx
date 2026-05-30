import { cn } from '@/lib/utils'

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  size?: 'sm' | 'md'
  className?: string
  children: React.ReactNode
}

export function Badge({ variant = 'default', size = 'sm', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        {
          'bg-gray-100 text-gray-700':    variant === 'default',
          'bg-green-100 text-green-700':  variant === 'success',
          'bg-yellow-100 text-yellow-700': variant === 'warning',
          'bg-red-100 text-red-700':      variant === 'error',
          'bg-blue-100 text-blue-700':    variant === 'info',
        },
        {
          'px-2 py-0.5 text-xs': size === 'sm',
          'px-3 py-1 text-sm':   size === 'md',
        },
        className
      )}
    >
      {children}
    </span>
  )
}
