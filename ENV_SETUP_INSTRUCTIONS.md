# Configuración de Variables de Entorno

El archivo `.env.local` ha sido creado con las siguientes variables:

## Variables Configuradas

✅ `NEXT_PUBLIC_SUPABASE_URL` - Ya configurado
✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Ya configurado  
⚠️ `SUPABASE_SERVICE_ROLE_KEY` - **NECESITA SER COMPLETADO**

## Cómo Obtener el Service Role Key

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard/project/zproheefniynfxbsvuku
2. Navega a **Settings** → **API**
3. Busca la sección **"service_role" key** (NO el "anon" key)
4. Copia el key completo
5. Abre `.env.local` y pega el key después del `=` en la línea:
   ```
   SUPABASE_SERVICE_ROLE_KEY=tu_key_aqui
   ```

## Importante

- ⚠️ El `service_role` key tiene acceso completo a tu base de datos
- ⚠️ NUNCA lo expongas en el código del cliente
- ⚠️ Solo se usa en el servidor (API routes)
- ✅ El archivo `.env.local` ya está en `.gitignore` y no se subirá a Git

## Después de Configurar

1. Guarda el archivo `.env.local`
2. Reinicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
3. Prueba crear un usuario desde el panel de admin

## Verificación

Si el key está configurado correctamente, deberías poder:
- ✅ Crear usuarios desde el admin panel
- ✅ Actualizar usuarios desde el admin panel
- ✅ No ver errores 401 al crear usuarios





