'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SectionCardProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  children: ReactNode
  className?: string
  loading?: boolean
}

export default function SectionCard({ 
  title, 
  subtitle, 
  icon, 
  children, 
  className,
  loading = false 
}: SectionCardProps) {
  return (
    <div className={cn(
      "bg-card border border-border rounded-xl p-6 shadow-sm",
      className
    )}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {icon && <div className="text-primary">{icon}</div>}
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          </div>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        children
      )}
    </div>
  )
}

