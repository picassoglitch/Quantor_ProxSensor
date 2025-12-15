# Guía de Despliegue en Vercel - Quantor Prox

## ✅ Configuración del Proyecto en Vercel

### 1. Configuración Básica (Ya completada)
- **Repositorio**: `picassoglitch/Quantor_ProxSensor`
- **Branch**: `main`
- **Project Name**: `quantor-prox-sensor`
- **Framework Preset**: `Next.js`
- **Root Directory**: `./`

### 2. Variables de Entorno (IMPORTANTE)

En la sección **"Environment Variables"** de Vercel, agrega las siguientes variables:

#### Variables Requeridas:

```
NEXT_PUBLIC_SUPABASE_URL=https://zproheefniynfxbsvuku.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwcm9oZWVmbml5bmZ4YnN2dWt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MDI3NTgsImV4cCI6MjA4MTA3ODc1OH0.bOabo29iBmq_lxKDhzzIFFwrnq5G8RiJKpPH68KwNvk
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

#### Cómo agregar variables en Vercel:

1. En el dashboard de Vercel, ve a tu proyecto
2. Click en **Settings** → **Environment Variables**
3. Agrega cada variable:
   - **Name**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: `https://zproheefniynfxbsvuku.supabase.co`
   - **Environment**: Selecciona `Production`, `Preview`, y `Development`
4. Repite para las otras variables

### 3. Configuración de Build

Vercel detectará automáticamente Next.js, pero verifica:

- **Build Command**: `npm run build` (automático)
- **Output Directory**: `.next` (automático)
- **Install Command**: `npm install` (automático)

### 4. Configuración de Dominio Personalizado (Opcional)

Si quieres usar un dominio personalizado:

1. Ve a **Settings** → **Domains**
2. Agrega tu dominio (ej: `dashboard.quantor.com`)
3. Configura los registros DNS según las instrucciones de Vercel:
   - **Tipo A**: Apunta a la IP de Vercel
   - **Tipo CNAME**: Apunta a `cname.vercel-dns.com`

### 5. Configuración de Supabase para Producción

Asegúrate de configurar en Supabase:

1. **Redirect URLs** en Supabase Dashboard:
   - Ve a **Authentication** → **URL Configuration**
   - Agrega tu URL de Vercel:
     - `https://quantor-prox-sensor.vercel.app/auth/callback`
     - `https://tu-dominio.com/auth/callback` (si usas dominio personalizado)

2. **Site URL**:
   - `https://quantor-prox-sensor.vercel.app`
   - O tu dominio personalizado

### 6. Después del Despliegue

Una vez desplegado:

1. Verifica que la aplicación funcione en: `https://quantor-prox-sensor.vercel.app`
2. Prueba el login
3. Verifica que los datos se carguen correctamente
4. Revisa los logs en Vercel si hay errores

### 7. Troubleshooting

Si hay errores:

- **Error 401**: Verifica las variables de entorno
- **Error de conexión a Supabase**: Verifica `NEXT_PUBLIC_SUPABASE_URL`
- **Error de autenticación**: Verifica las Redirect URLs en Supabase

## 🔒 Seguridad

- **NUNCA** subas `.env.local` al repositorio (ya está en `.gitignore`)
- Usa **Environment Variables** de Vercel para secretos
- `SUPABASE_SERVICE_ROLE_KEY` debe ser secreto (no público)

## 📝 Notas

- Cada push a `main` desplegará automáticamente
- Los pull requests crearán preview deployments
- Los logs están disponibles en el dashboard de Vercel

