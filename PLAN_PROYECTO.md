# Plan de Desarrollo - Ecommerce TopCell

## Fase 1: Base de Datos ✅

### Tablas Principales

#### 1. **Productos y Catálogo**
- **Marca**: nombre
- **Color**: color (relación muchos a muchos con productos)
- **TelefonoNuevo**: marca, modelo, precio, procesador, RAM, ROM, MPXls camara, tamaño pantalla, tipo entrada, stock, descripcion, imagenes
- **TelefonoSeminuevo**: todas las propiedades de nuevo + estado batería, ciclos carga
- **Accesorio**: marca, precio, descripcion, stock, imagenes
- **ImagenProducto**: url (Cloudinary), tipo, producto relacionado

#### 2. **Contenido de la Tienda**
- **ContenidoTienda**: tipo (hero, logo, banner, etc.), url (Cloudinary), descripcion, activo

#### 3. **Ecommerce Core**
- **Usuario**: información de clientes (email, nombre, dirección, etc.)
- **UsuarioAdmin**: administradores del sistema
- **Orden**: pedidos con estados (pendiente, procesando, enviado, entregado, cancelado)
- **ItemOrden**: productos en cada orden (cantidad, precio al momento de compra)
- **Carrito**: opcional (puede ser en sesión o persistente)

#### 4. **Inventario**
- Campo `stock` en cada producto
- Lógica: al crear orden → restar stock, al cancelar → sumar stock

---

## Fase 2: Portal de Administración

### Módulos del Admin

#### 1. **Gestión de Productos**
- ✅ Crear/Editar/Eliminar Telefonos Nuevos
- ✅ Crear/Editar/Eliminar Telefonos Seminuevos
- ✅ Crear/Editar/Eliminar Accesorios
- ✅ Gestión de stock
- ✅ Subida de imágenes a Cloudinary
- ✅ Asignación de colores a productos

#### 2. **Gestión de Catálogo**
- ✅ CRUD de Marcas
- ✅ CRUD de Colores
- ✅ Vista de inventario (stock disponible)

#### 3. **Gestión de Contenido**
- ✅ Gestionar imágenes Hero Section
- ✅ Gestionar espacios publicitarios
- ✅ Gestionar logos
- ✅ Subida a Cloudinary

#### 4. **Gestión de Órdenes**
- ✅ Ver todas las órdenes
- ✅ Cambiar estado de órdenes
- ✅ Cancelar órdenes (restaurar inventario)
- ✅ Ver detalles de cada orden

#### 5. **Gestión de Usuarios**
- ✅ Ver usuarios/clientes
- ✅ CRUD de administradores
- ✅ Permisos y roles

#### 6. **Dashboard**
- ✅ Estadísticas de ventas
- ✅ Productos más vendidos
- ✅ Inventario bajo
- ✅ Órdenes pendientes

---

## Fase 3: Integración Cloudinary

### Configuración
- Variables en `.env`: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
- SDK de Cloudinary para subida de imágenes
- Endpoints API para subir imágenes desde admin

---

## Stack Tecnológico

- **Frontend**: Next.js 16 (App Router)
- **Backend**: Next.js API Routes
- **Base de Datos**: MySQL (Railway)
- **ORM**: Prisma
- **Imágenes**: Cloudinary
- **Autenticación**: NextAuth.js (recomendado para admin)
- **UI**: Tailwind CSS (ya configurado)

---

## Próximos Pasos

1. ✅ Crear schema de Prisma completo
2. ⏳ Configurar Cloudinary en .env
3. ⏳ Crear estructura de carpetas para admin
4. ⏳ Implementar autenticación de admin
5. ⏳ Desarrollar módulos del portal admin uno por uno

