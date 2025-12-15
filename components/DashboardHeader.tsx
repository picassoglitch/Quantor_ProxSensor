'use client'

import { Moon, Sun, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardHeaderProps {
  locations: string[]
  selectedLocation: string
  onLocationChange: (location: string) => void
  dateRange: 'today' | 'yesterday' | '7days' | '30days' | 'custom'
  onDateRangeChange: (range: 'today' | 'yesterday' | '7days' | '30days' | 'custom') => void
  darkMode: boolean
  onDarkModeToggle: () => void
}

export default function DashboardHeader({
  locations,
  selectedLocation,
  onLocationChange,
  dateRange,
  onDateRangeChange,
  darkMode,
  onDarkModeToggle,
}: DashboardHeaderProps) {
  return (
    <header className="border-b bg-card sticky top-0 z-50 backdrop-blur-sm bg-opacity-95 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Quantor Logo/Branding */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 quantor-logo rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">Q</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-foreground">Quantor</h1>
                  <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                    Analytics
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Panel de Conteo de Personas</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Location Selector */}
            <select
              value={selectedLocation}
              onChange={(e) => onLocationChange(e.target.value)}
              className="px-4 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">Todas las Ubicaciones</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>

            {/* Date Range Selector */}
            <div className="flex gap-1 bg-muted p-1 rounded-lg">
              {(['today', 'yesterday', '7days', '30days'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => onDateRangeChange(range)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-md transition-colors',
                    dateRange === range
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {range === 'today' && 'Hoy'}
                  {range === 'yesterday' && 'Ayer'}
                  {range === '7days' && '7 Días'}
                  {range === '30days' && '30 Días'}
                </button>
              ))}
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={onDarkModeToggle}
              className="p-2 rounded-lg border border-input hover:bg-accent transition-colors"
              aria-label="Alternar modo oscuro"
            >
              {darkMode ? (
                <Sun className="h-5 w-5 text-foreground" />
              ) : (
                <Moon className="h-5 w-5 text-foreground" />
              )}
            </button>

            {/* Profile Link */}
            <a
              href="/profile"
              className="p-2 rounded-lg border border-input hover:bg-accent transition-colors"
              title="Mi Perfil"
            >
              <User className="h-5 w-5 text-foreground" />
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}

