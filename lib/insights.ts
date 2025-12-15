import { MarketingStats, Insight } from '@/lib/types'

export function generateInsights(stats: MarketingStats, previousStats?: MarketingStats): Insight[] {
  const insights: Insight[] = []

  // Traffic insights
  if (stats.uniqueToday > 100 && stats.avgDwellTime < 2) {
    insights.push({
      id: 'high-traffic-low-dwell',
      type: 'traffic',
      category: 'Tráfico',
      title: 'Alto tráfico, baja permanencia',
      description: `Tienes ${stats.uniqueToday} visitantes hoy pero un tiempo promedio de permanencia de solo ${stats.avgDwellTime.toFixed(1)} minutos. Considera mejorar el gancho o CTA en tu ubicación.`,
      severity: 'warning',
    })
  }

  if (stats.returningVisitorsPercent > 30) {
    insights.push({
      id: 'strong-return-rate',
      type: 'engagement',
      category: 'Compromiso',
      title: 'Tasa de retorno fuerte',
      description: `${stats.returningVisitorsPercent.toFixed(1)}% de tus visitantes son recurrentes. Esto indica un fuerte reconocimiento de marca y lealtad.`,
      severity: 'success',
    })
  }

  if (stats.peakHour > 0 && stats.peakHourCount > 10) {
    insights.push({
      id: 'peak-hour-identified',
      type: 'timing',
      category: 'Timing',
      title: 'Hora pico identificada',
      description: `La hora pico es ${stats.peakHour}:00 con ${stats.peakHourCount} visitantes. Programa personal adicional o promociones durante esta hora para maximizar el impacto.`,
      severity: 'info',
    })
  }

  if (stats.engagementScore > 70) {
    insights.push({
      id: 'high-engagement',
      type: 'engagement',
      category: 'Compromiso',
      title: 'Alto nivel de compromiso',
      description: `Tu puntuación de compromiso es ${stats.engagementScore.toFixed(0)}/100. Los visitantes están pasando tiempo significativo en tu ubicación.`,
      severity: 'success',
    })
  }

  if (previousStats) {
    const visitorChange = stats.changeVsYesterday.visitors
    if (Math.abs(visitorChange) > 20) {
      insights.push({
        id: 'significant-visitor-change',
        type: 'traffic',
        category: 'Tráfico',
        title: `Cambio significativo en visitantes`,
        description: `Los visitantes ${visitorChange > 0 ? 'aumentaron' : 'disminuyeron'} ${Math.abs(visitorChange).toFixed(1)}% comparado con ayer.`,
        severity: visitorChange > 0 ? 'success' : 'warning',
      })
    }
  }

  if (stats.avgDwellTime > 15) {
    insights.push({
      id: 'long-dwell-time',
      type: 'engagement',
      category: 'Compromiso',
      title: 'Tiempo de permanencia extendido',
      description: `El tiempo promedio de permanencia es ${stats.avgDwellTime.toFixed(1)} minutos, lo que indica un alto interés del visitante.`,
      severity: 'success',
    })
  }

  return insights
}

export function calculateEngagementScore(stats: MarketingStats): number {
  // Simple scoring: combine dwell time, return rate, and traffic
  const dwellScore = Math.min((stats.avgDwellTime / 30) * 50, 50) // Max 50 points
  const returnScore = (stats.returningVisitorsPercent / 100) * 30 // Max 30 points
  const trafficScore = Math.min((stats.uniqueToday / 200) * 20, 20) // Max 20 points
  
  return Math.round(dwellScore + returnScore + trafficScore)
}

