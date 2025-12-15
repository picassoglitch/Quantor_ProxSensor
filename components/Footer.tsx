'use client'

import { Building2, Mail, Globe } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t bg-card mt-12">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 quantor-logo rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">Q</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Quantor</p>
              <p className="text-xs text-muted-foreground">Solución de Analytics Profesional</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              <span>Powered by Quantor</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              <span>© 2025 Quantor. Todos los derechos reservados.</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

