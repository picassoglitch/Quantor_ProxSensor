'use client'

import { Lightbulb, Download, TrendingUp, Eye, Calendar } from 'lucide-react'
import { Insight } from '@/lib/types'

interface InsightsPanelProps {
  insights: Insight[]
  onExportSlide?: (insightId: string) => void
  onComparePeriod?: (insightId: string) => void
  onViewSegment?: (insightId: string) => void
}

export default function InsightsPanel({ 
  insights, 
  onExportSlide,
  onComparePeriod,
  onViewSegment 
}: InsightsPanelProps) {
  if (insights.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Insights y Acciones</h3>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No hay insights disponibles en este momento</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Lightbulb className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Insights y Acciones</h3>
      </div>
      
      <div className="space-y-4">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className="p-4 bg-muted/50 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {insight.type === 'traffic' && <TrendingUp className="h-4 w-4 text-primary" />}
                  {insight.type === 'engagement' && <Eye className="h-4 w-4 text-primary" />}
                  {insight.type === 'timing' && <Calendar className="h-4 w-4 text-primary" />}
                  <span className="text-xs font-medium text-primary uppercase">
                    {insight.category}
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  {insight.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {insight.description}
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-3">
              {onExportSlide && (
                <button
                  onClick={() => onExportSlide(insight.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-background border border-border rounded-md hover:bg-accent transition-colors"
                >
                  <Download className="h-3 w-3" />
                  Exportar Slide
                </button>
              )}
              {onComparePeriod && (
                <button
                  onClick={() => onComparePeriod(insight.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-background border border-border rounded-md hover:bg-accent transition-colors"
                >
                  <TrendingUp className="h-3 w-3" />
                  Comparar Período
                </button>
              )}
              {onViewSegment && (
                <button
                  onClick={() => onViewSegment(insight.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-background border border-border rounded-md hover:bg-accent transition-colors"
                >
                  <Eye className="h-3 w-3" />
                  Ver Segmento
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

