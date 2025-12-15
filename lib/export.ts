import { ActivityItem } from '@/lib/types'

export function exportToCSV(items: ActivityItem[], filename: string = 'actividad') {
  const headers = ['Fecha/Hora', 'Ubicación', 'ID de Visitante', 'Distancia', 'Señal (dBm)']
  
  const rows = items.map(item => [
    new Date(item.timestamp).toLocaleString('es-ES'),
    item.location,
    maskMac(item.mac),
    `${item.distance.toFixed(2)}m`,
    item.rssi.toString(),
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportToPDF() {
  // Simple print-to-PDF approach
  window.print()
}

function maskMac(mac: string): string {
  const parts = mac.split(':')
  if (parts.length >= 3) {
    return `${parts[0]}:${parts[1]}:**:**:${parts[parts.length - 1]}`
  }
  return mac
}

