'use client'

import { ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  title: string
  value: string | number
  icon: ReactNode
  change?: number // Percentage change vs previous period
  changeLabel?: string
  subtitle?: string
  loading?: boolean
}

export default function KpiCard({ 
  title, 
  value, 
  icon, 
  change, 
  changeLabel,
  subtitle,
  loading = false 
}: KpiCardProps) {
  const isPositive = change !== undefined && change > 0
  const isNegative = change !== undefined && change < 0
  const isNeutral = change === undefined || change === 0

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-24 mb-4"></div>
          <div className="h-10 bg-muted rounded w-32 mb-2"></div>
          <div className="h-3 bg-muted rounded w-16"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
          <p className="text-3xl font-bold text-foreground mb-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="p-3 bg-primary/10 rounded-lg text-primary">
          {icon}
        </div>
      </div>
      
      {change !== undefined && (
        <div className="flex items-center gap-2 mt-4">
          {isPositive && (
            <>
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                +{Math.abs(change).toFixed(1)}%
              </span>
            </>
          )}
          {isNegative && (
            <>
              <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="text-sm font-medium text-red-600 dark:text-red-400">
                {change.toFixed(1)}%
              </span>
            </>
          )}
          {isNeutral && (
            <>
              <Minus className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                0%
              </span>
            </>
          )}
          {changeLabel && (
            <span className="text-xs text-muted-foreground ml-1">
              {changeLabel}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

