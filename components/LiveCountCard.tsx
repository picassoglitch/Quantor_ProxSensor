'use client'

import { Users } from 'lucide-react'
import { useEffect, useState } from 'react'

interface LiveCountCardProps {
  count: number
  location: string
}

export default function LiveCountCard({ count, location }: LiveCountCardProps) {
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    setPulse(true)
    const timer = setTimeout(() => setPulse(false), 500)
    return () => clearTimeout(timer)
  }, [count])

  return (
    <div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-8 text-white shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white/80 mb-2">Personas Dentro Ahora</p>
          <p className="text-5xl font-bold mb-1">{count}</p>
          <p className="text-sm text-white/70">{location}</p>
        </div>
        <div className={`p-4 bg-white/20 rounded-full ${pulse ? 'animate-pulse' : ''}`}>
          <Users className="h-12 w-12" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
        <p className="text-xs text-white/80">Datos en vivo • Actualización cada 25 segundos</p>
      </div>
    </div>
  )
}

