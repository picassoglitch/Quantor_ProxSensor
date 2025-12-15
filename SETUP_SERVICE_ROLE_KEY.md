# Configurar Service Role Key para Crear Usuarios

El endpoint `/api/admin/create-user` requiere el `service_role` key de Supabase para crear usuarios. Este key tiene permisos administrativos completos y **NUNCA debe exponerse en el cliente**.

## Pasos para Configurar

1. **Obtén el Service Role Key:**
   - Ve a tu proyecto en Supabase Dashboard
   - Settings → API
   - Copia el **"service_role" key** (NO el "anon" key)
   - ⚠️ **ADVERTENCIA**: Este key puede hacer CUALQUIER operación en tu base de datos. Manténlo secreto.

2. **Agrega el Key a las Variables de Entorno:**
   
   Crea o edita `.env.local` en la raíz del proyecto:
   
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://zproheefniynfxbsvuku.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_d0ruWfE2tQTIk39fdbwnDA_mqIuQXz_
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
   ```

3. **Verifica que el archivo esté en .gitignore:**
   
   Asegúrate de que `.env.local` esté en tu `.gitignore` para no subirlo a Git:
   
   ```
   .env.local
   .env*.local
   ```

4. **Reinicia el servidor de desarrollo:**
   
   ```bash
   npm run dev
   ```

## Seguridad

- ✅ El `service_role` key solo se usa en el servidor (API routes)
- ✅ Nunca se expone al cliente
- ✅ El endpoint verifica que el usuario sea admin antes de crear usuarios
- ✅ Solo admins autenticados pueden usar este endpoint

## Prueba

Después de configurar, intenta crear un usuario desde el panel de admin. Debería funcionar sin el error 401.





