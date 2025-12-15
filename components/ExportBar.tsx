'use client'

import { Download, FileText, Share2, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface ExportBarProps {
  onExportCSV?: () => void
  onExportPDF?: () => void
  onCopyShareLink?: () => void
  className?: string
}

export default function ExportBar({ 
  onExportCSV, 
  onExportPDF, 
  onCopyShareLink,
  className 
}: ExportBarProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = () => {
    if (onCopyShareLink) {
      onCopyShareLink()
    }
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn(
      "flex flex-wrap items-center gap-2 p-4 bg-muted/50 rounded-lg border border-border",
      className
    )}>
      <span className="text-sm font-medium text-foreground mr-2">Exportar:</span>
      
      {onExportCSV && (
        <button
          onClick={onExportCSV}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-background border border-border rounded-md hover:bg-accent transition-colors"
        >
          <Download className="h-4 w-4" />
          CSV
        </button>
      )}
      
      {onExportPDF && (
        <button
          onClick={onExportPDF}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-background border border-border rounded-md hover:bg-accent transition-colors"
        >
          <FileText className="h-4 w-4" />
          PDF
        </button>
      )}
      
      <button
        onClick={handleCopyLink}
        className="flex items-center gap-2 px-4 py-2 text-sm bg-background border border-border rounded-md hover:bg-accent transition-colors"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-green-600" />
            <span>¡Copiado!</span>
          </>
        ) : (
          <>
            <Share2 className="h-4 w-4" />
            <span>Compartir Enlace</span>
          </>
        )}
      </button>
    </div>
  )
}

