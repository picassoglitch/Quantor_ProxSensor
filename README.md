# Quantor Prox - WiFi People Counter Dashboard

Sistema completo de conteo de personas mediante detección WiFi con dashboard de analíticas en tiempo real, desarrollado por Quantor.

## 🚀 Características

- **Detección WiFi Pasiva**: Detecta dispositivos móviles mediante WiFi sniffer (ESP32)
- **Dashboard en Tiempo Real**: Visualización de métricas de tráfico y engagement
- **Panel de Administración**: Gestión de usuarios, clientes, tiendas y asignaciones
- **Multi-tenant**: Soporte para múltiples clientes con aislamiento de datos
- **Fingerprinting Avanzado**: Identificación de dispositivos incluso con MAC randomization
- **Analíticas de Marketing**: KPIs, insights y exportación de reportes

## 📋 Requisitos

- Node.js 18+ 
- Supabase (Base de datos y autenticación)
- ESP32 (C6, C3 o S3) para sensores

## 🛠️ Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/Quantor_Prox.git
   cd Quantor_Prox
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env.local
   ```
   
   Editar `.env.local` con tus credenciales de Supabase:
   ```
   NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
   ```

4. **Configurar base de datos**
   - Ejecutar `database-schema.sql` en Supabase SQL Editor
   - Configurar políticas RLS según tus necesidades

5. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

## 📁 Estructura del Proyecto

```
Quantor_Prox/
├── app/                    # Next.js App Router
│   ├── admin/              # Panel de administración
│   ├── auth/               # Autenticación
│   ├── dashboard/          # Dashboard de clientes
│   └── profile/            # Perfil de usuario
├── components/             # Componentes React
├── lib/                    # Utilidades y clientes
├── quantor_Sensor/         # Código del sensor ESP32
└── database-schema.sql      # Esquema de base de datos
```

## 🔧 Configuración del Sensor ESP32

1. Abrir `quantor_Sensor/quantor_Sensor.ino` en Arduino IDE
2. Configurar credenciales WiFi y Supabase
3. Subir al ESP32

Ver `quantor_Sensor/quantor_Sensor.ino` para más detalles.

## 👥 Roles de Usuario

- **Admin**: Acceso completo, gestión de usuarios y clientes
- **Cliente**: Vista limitada a sus tiendas asignadas

## 📊 Dashboard

El dashboard incluye:
- KPIs en tiempo real (Visitantes, Retorno, Dwell Time)
- Gráficos de tráfico y engagement
- Segmentación de audiencia
- Tabla de actividad reciente
- Exportación CSV/PDF

## 🔐 Seguridad

- Autenticación mediante Supabase Auth
- Row Level Security (RLS) para aislamiento de datos
- Políticas de acceso basadas en roles
- API keys protegidas en variables de entorno

## 📝 Licencia

Copyright © 2025 Quantor. Todos los derechos reservados.

## 🤝 Soporte

Para soporte, contacta a: support@quantor.com

---

Desarrollado con ❤️ por Quantor
