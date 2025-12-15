'use client'

export default function BrandingBadge() {
  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg backdrop-blur-sm bg-opacity-95">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 quantor-logo rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">Q</span>
          </div>
          <span className="text-xs font-medium text-foreground">Quantor</span>
        </div>
      </div>
    </div>
  )
}

