# 🌐 Configuración de Dominio para Quantor Analytics

Esta guía te ayudará a conectar tu aplicación Next.js a un dominio personalizado.

## 📋 Requisitos Previos

- Aplicación desplegada en Vercel (o tu plataforma de hosting)
- Dominio registrado
- Acceso al panel de control de tu proveedor de DNS

---

## 🚀 Opción 1: Vercel (Recomendado)

### Paso 1: Conectar el Dominio en Vercel

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** → **Domains**
4. Ingresa tu dominio (ej: `analytics.quantor.com` o `quantor.com`)
5. Haz clic en **Add**

### Paso 2: Configurar DNS

Vercel te dará instrucciones específicas. Generalmente necesitas agregar estos registros:

**Para dominio raíz (quantor.com):**
```
Tipo: A
Nombre: @
Valor: 76.76.21.21
```

**Para subdominio (analytics.quantor.com):**
```
Tipo: CNAME
Nombre: analytics
Valor: cname.vercel-dns.com
```

### Paso 3: Esperar Propagación DNS

- Puede tomar de 5 minutos a 48 horas
- Verifica el estado en Vercel Dashboard → Domains

### Paso 4: Configurar SSL

- Vercel configura SSL automáticamente (Let's Encrypt)
- Espera a que el certificado se genere (puede tomar unos minutos)

---

## 🔧 Opción 2: Otra Plataforma (Netlify, Railway, etc.)

### Netlify

1. Ve a **Site settings** → **Domain management**
2. Agrega tu dominio
3. Sigue las instrucciones de DNS
4. Netlify configurará SSL automáticamente

### Railway / Render

1. Ve a **Settings** → **Domains**
2. Agrega tu dominio
3. Configura los registros DNS según las instrucciones
4. Espera la propagación DNS

---

## ⚙️ Configuración de Supabase

Una vez que tu dominio esté activo, actualiza Supabase:

### Paso 1: Ir a Supabase Dashboard

1. Ve a: https://supabase.com/dashboard/project/zproheefniynfxbsvuku
2. Navega a: **Authentication** → **URL Configuration**

### Paso 2: Actualizar Redirect URLs

Agrega tu dominio de producción a **"Redirect URLs"**:

```
https://tu-dominio.com/auth/reset-password
https://tu-dominio.com/auth/callback
```

**Mantén también los de desarrollo:**
```
http://localhost:3000/auth/reset-password
http://localhost:3000/auth/callback
```

### Paso 3: Actualizar Site URL

Cambia **"Site URL"** a tu dominio de producción:

```
https://tu-dominio.com
```

### Paso 4: Guardar Cambios

Haz clic en **"Save"** al final de la página.

---

## 🔐 Variables de Entorno

Asegúrate de que las variables de entorno estén configuradas en tu plataforma de hosting:

### En Vercel:
1. Ve a **Settings** → **Environment Variables**
2. Verifica que estas variables estén configuradas:

```env
NEXT_PUBLIC_SUPABASE_URL=https://zproheefniynfxbsvuku.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

### En otras plataformas:
- Agrega las variables de entorno en la configuración del proyecto
- Reinicia el despliegue después de agregar variables

---

## ✅ Verificación

### 1. Verificar que el dominio funciona

Abre en tu navegador:
```
https://tu-dominio.com
```

Deberías ver la aplicación funcionando.

### 2. Verificar autenticación

1. Ve a: `https://tu-dominio.com/auth/login`
2. Intenta iniciar sesión
3. Verifica que funcione correctamente

### 3. Verificar reset de contraseña

1. Ve a: `https://tu-dominio.com/auth/reset-password`
2. Solicita un reset de contraseña
3. Verifica que el email llegue con el link correcto
4. El link debería apuntar a tu dominio, no a localhost

---

## 🐛 Solución de Problemas

### El dominio no carga

1. **Verifica DNS:**
   ```bash
   # En terminal (Mac/Linux) o PowerShell (Windows)
   nslookup tu-dominio.com
   # o
   dig tu-dominio.com
   ```

2. **Espera propagación DNS:** Puede tomar hasta 48 horas

3. **Verifica en Vercel:** Ve a Domains y revisa el estado

### SSL no funciona

1. Espera unos minutos (Vercel genera certificados automáticamente)
2. Verifica que el dominio esté correctamente configurado
3. Si después de 1 hora no funciona, contacta soporte de Vercel

### Autenticación no funciona

1. Verifica que las Redirect URLs en Supabase incluyan tu dominio
2. Verifica que Site URL esté configurado correctamente
3. Revisa la consola del navegador para errores
4. Verifica que las variables de entorno estén configuradas

### Redirecciones incorrectas

El código ya usa `window.location.origin` automáticamente, así que debería funcionar. Si hay problemas:

1. Verifica que no haya URLs hardcodeadas
2. Limpia la caché del navegador
3. Verifica que estés usando HTTPS (no HTTP)

---

## 📝 Notas Importantes

1. **HTTPS es obligatorio:** Asegúrate de que tu dominio use HTTPS (Vercel lo configura automáticamente)

2. **Variables de entorno:** No necesitas cambiar nada en el código, las variables de entorno se cargan automáticamente

3. **CORS:** Supabase ya está configurado para aceptar requests de cualquier origen (usando anon key)

4. **Cookies:** Las cookies de autenticación funcionarán automáticamente con tu dominio

---

## 🎯 Checklist Final

- [ ] Dominio agregado en Vercel/plataforma de hosting
- [ ] DNS configurado correctamente
- [ ] SSL activo (certificado generado)
- [ ] Redirect URLs actualizadas en Supabase
- [ ] Site URL actualizada en Supabase
- [ ] Variables de entorno configuradas
- [ ] Aplicación accesible en el dominio
- [ ] Login funciona correctamente
- [ ] Reset de contraseña funciona correctamente

---

## 🆘 Soporte

Si tienes problemas:

1. Revisa los logs en Vercel Dashboard → Deployments
2. Revisa la consola del navegador (F12)
3. Verifica la configuración de Supabase
4. Contacta soporte de tu plataforma de hosting

---

**¡Listo! Tu aplicación debería estar funcionando en tu dominio personalizado.** 🎉

