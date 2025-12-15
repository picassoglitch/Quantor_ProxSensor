'use client'

import { ActivityItem } from '@/lib/types'
import { formatTimeAgo, formatDistance } from '@/lib/utils'
import { Radio, MapPin } from 'lucide-react'

interface ActivityFeedProps {
  items: ActivityItem[]
}

export default function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Radio className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Feed de Actividad en Vivo</h3>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No hay actividad reciente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={`${item.mac}-${item.timestamp}-${index}`}
              className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Radio className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-mono text-sm font-medium text-foreground truncate">
                      {item.mac}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(new Date(item.timestamp))}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {item.location}
                    </div>
                    <span>{formatDistance(item.distance)} de distancia</span>
                    <span>{item.rssi} dBm</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

