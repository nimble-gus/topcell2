# Checklist de Configuración - TopCell Admin

## ✅ Completado

- [x] Base de datos MySQL configurada (Railway)
- [x] Schema de Prisma creado y aplicado
- [x] Dependencias instaladas (Cloudinary, NextAuth, bcrypt)
- [x] Cliente de Prisma configurado (`lib/prisma.ts`)
- [x] Configuración de Cloudinary (`lib/cloudinary.ts`)
- [x] Configuración de NextAuth (`lib/auth.ts`)
- [x] Middleware de autenticación
- [x] Estructura base del portal admin
- [x] Página de login
- [x] Dashboard básico
- [x] Layout del admin con Sidebar y Header

## ⏳ Pendiente (Próximos Pasos)

### 1. Crear Primer Administrador
```bash
npm run create-admin
```
Este comando te pedirá:
- Email
- Nombre
- Contraseña
- Rol (admin/superadmin)

### 2. Verificar Configuración
- [ ] Verificar que `.env` tenga todas las variables:
  - `DATABASE_URL`
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
  - `NEXTAUTH_URL`
  - `NEXTAUTH_SECRET`

### 3. Probar el Sistema
1. Iniciar servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Navegar a `http://localhost:3000/admin/login`
3. Iniciar sesión con las credenciales del administrador creado
4. Verificar que el dashboard se muestre correctamente

### 4. Desarrollar Módulos del Admin

#### Prioridad Alta:
- [ ] **Gestión de Productos Nuevos** (`/admin/productos/nuevos`)
  - Lista de productos
  - Crear/Editar producto
  - Subir imágenes a Cloudinary
  - Asignar colores

- [ ] **Gestión de Productos Seminuevos** (`/admin/productos/seminuevos`)
  - Similar a nuevos + campos de batería

- [ ] **Gestión de Accesorios** (`/admin/productos/accesorios`)

#### Prioridad Media:
- [ ] **Gestión de Catálogo**
  - CRUD de Marcas
  - CRUD de Colores

- [ ] **Gestión de Contenido**
  - Hero Section
  - Banners
  - Logos

#### Prioridad Baja:
- [ ] **Gestión de Órdenes**
  - Lista de órdenes
  - Detalle de orden
  - Cambiar estado
  - Cancelar orden (restaurar inventario)

- [ ] **Gestión de Usuarios**
  - Ver clientes
  - CRUD de administradores

- [ ] **Inventario**
  - Vista de stock
  - Alertas de stock bajo

## 📝 Notas Importantes

### Seguridad
- Las rutas `/admin/*` están protegidas por middleware
- Solo usuarios autenticados pueden acceder
- Las contraseñas se hashean con bcrypt

### Base de Datos
- El cliente de Prisma usa singleton pattern para evitar múltiples instancias
- Las relaciones están correctamente configuradas
- El inventario se maneja con el campo `stock` en cada producto

### Cloudinary
- Las funciones de subida están en `lib/cloudinary.ts`
- Las imágenes se almacenan como URLs en la base de datos
- Se pueden aplicar transformaciones al obtener las URLs

## 🐛 Solución de Problemas

### Error: "Cannot find module '@/lib/prisma'"
- Verificar que `tsconfig.json` tenga el path alias `@/*` configurado
- Reiniciar el servidor de desarrollo

### Error de autenticación
- Verificar que `NEXTAUTH_SECRET` esté configurado en `.env`
- Verificar que el administrador exista en la base de datos
- Verificar que la contraseña esté correctamente hasheada

### Error de conexión a la base de datos
- Verificar que `DATABASE_URL` esté correctamente configurado
- Verificar que Railway MySQL esté activo
- Probar conexión con `npm run prisma:studio`

