'use client'

import { LayoutDashboard, BarChart3, Table } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ViewMode = 'executive' | 'analyst' | 'raw'

interface ViewToggleProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}

export default function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
  const views: Array<{ mode: ViewMode; label: string; icon: React.ReactNode }> = [
    { mode: 'executive', label: 'Ejecutivo', icon: <LayoutDashboard className="h-4 w-4" /> },
    { mode: 'analyst', label: 'Analista', icon: <BarChart3 className="h-4 w-4" /> },
    { mode: 'raw', label: 'Datos Crudos', icon: <Table className="h-4 w-4" /> },
  ]

  return (
    <div className="flex gap-1 bg-muted p-1 rounded-lg">
      {views.map((view) => (
        <button
          key={view.mode}
          onClick={() => onViewModeChange(view.mode)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors',
            viewMode === view.mode
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {view.icon}
          <span>{view.label}</span>
        </button>
      ))}
    </div>
  )
}

