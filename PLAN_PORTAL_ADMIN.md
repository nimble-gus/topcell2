# Plan Detallado - Portal de Administración

## Estructura de Carpetas Propuesta

```
topcell/
├── app/
│   ├── admin/                    # Portal de administración
│   │   ├── layout.tsx            # Layout del admin (con sidebar, header)
│   │   ├── page.tsx              # Dashboard principal
│   │   ├── login/                # Página de login
│   │   ├── productos/            # Gestión de productos
│   │   │   ├── nuevos/
│   │   │   │   ├── page.tsx      # Lista de teléfonos nuevos
│   │   │   │   ├── nuevo/        # Crear nuevo
│   │   │   │   └── [id]/         # Editar existente
│   │   │   ├── seminuevos/       # Similar estructura
│   │   │   └── accesorios/       # Similar estructura
│   │   ├── catalogo/             # Gestión de catálogo
│   │   │   ├── marcas/
│   │   │   └── colores/
│   │   ├── contenido/            # Gestión de contenido
│   │   │   ├── hero/
│   │   │   ├── banners/
│   │   │   └── logos/
│   │   ├── ordenes/              # Gestión de órdenes
│   │   │   ├── page.tsx          # Lista de órdenes
│   │   │   └── [id]/             # Detalle de orden
│   │   ├── usuarios/             # Gestión de usuarios
│   │   │   ├── clientes/
│   │   │   └── administradores/
│   │   └── inventario/           # Vista de inventario
│   ├── api/                      # API Routes
│   │   ├── admin/
│   │   │   ├── auth/             # Autenticación
│   │   │   ├── productos/        # CRUD productos
│   │   │   ├── contenido/        # CRUD contenido
│   │   │   ├── ordenes/          # Gestión de órdenes
│   │   │   └── upload/           # Subida a Cloudinary
│   └── (public)/                 # Páginas públicas
├── lib/
│   ├── prisma.ts                 # Cliente de Prisma singleton
│   ├── cloudinary.ts             # Configuración de Cloudinary
│   ├── auth.ts                   # Configuración de NextAuth
│   └── utils/                    # Utilidades
└── components/
    ├── admin/                    # Componentes del admin
    └── ui/                       # Componentes UI reutilizables
```

---

## Módulos del Portal Admin

### 1. **Dashboard** (`/admin`)
**Funcionalidades:**
- Estadísticas generales (ventas del día/mes, órdenes pendientes)
- Gráfico de ventas (últimos 30 días)
- Productos más vendidos
- Alertas de inventario bajo (stock < 10)
- Órdenes recientes (últimas 5)

**Componentes necesarios:**
- `StatsCard` - Tarjetas de estadísticas
- `SalesChart` - Gráfico de ventas
- `LowStockAlert` - Alertas de inventario
- `RecentOrders` - Lista de órdenes recientes

---

### 2. **Gestión de Productos** (`/admin/productos`)

#### 2.1 Teléfonos Nuevos (`/admin/productos/nuevos`)
**Funcionalidades:**
- ✅ Lista de teléfonos nuevos (tabla con paginación)
- ✅ Crear nuevo teléfono
- ✅ Editar teléfono existente
- ✅ Eliminar teléfono (soft delete: cambiar `activo = false`)
- ✅ Subir múltiples imágenes a Cloudinary
- ✅ Asignar colores disponibles
- ✅ Gestionar stock

**Formulario de creación/edición:**
```
- Marca (select/dropdown)
- Modelo (input)
- Precio (input numérico)
- Procesador (input)
- RAM (input)
- ROM (input)
- MPXls de cámara (input)
- Tamaño de pantalla (input)
- Tipo de entrada (select: USB-C, Lightning, etc.)
- Colores disponibles (multi-select)
- Stock (input numérico)
- Descripción (textarea)
- Imágenes (drag & drop o file input, múltiples)
```

#### 2.2 Teléfonos Seminuevos (`/admin/productos/seminuevos`)
**Funcionalidades similares a nuevos, más:**
- Estado de batería (input numérico, porcentaje)
- Ciclos de carga (input numérico)
- Validación: solo mostrar estos campos si la marca es "iPhone"

#### 2.3 Accesorios (`/admin/productos/accesorios`)
**Formulario:**
```
- Marca (select)
- Color (multi-select)
- Precio (input numérico)
- Descripción (textarea)
- Stock (input numérico)
- Imágenes (múltiples)
```

---

### 3. **Gestión de Catálogo** (`/admin/catalogo`)

#### 3.1 Marcas (`/admin/catalogo/marcas`)
- Lista de marcas
- Crear/Editar/Eliminar marca
- Validación: no permitir eliminar si hay productos asociados

#### 3.2 Colores (`/admin/catalogo/colores`)
- Lista de colores
- Crear/Editar/Eliminar color
- Vista previa del color (si es posible)

---

### 4. **Gestión de Contenido** (`/admin/contenido`)

#### 4.1 Hero Section (`/admin/contenido/hero`)
- Lista de imágenes hero
- Subir nueva imagen a Cloudinary
- Activar/Desactivar imágenes
- Ordenar imágenes (drag & drop)

#### 4.2 Banners Publicitarios (`/admin/contenido/banners`)
- Similar a hero

#### 4.3 Logos (`/admin/contenido/logos`)
- Similar a hero

**Componente compartido:**
- `ImageUploader` - Componente para subir a Cloudinary
- `ImageGallery` - Galería de imágenes con opción de activar/desactivar

---

### 5. **Gestión de Órdenes** (`/admin/ordenes`)

#### 5.1 Lista de Órdenes
**Tabla con:**
- Número de orden
- Cliente
- Fecha
- Estado (badge con colores)
- Total
- Acciones (ver detalles, cambiar estado)

**Filtros:**
- Por estado
- Por fecha
- Por cliente (búsqueda)

#### 5.2 Detalle de Orden (`/admin/ordenes/[id]`)
**Información mostrada:**
- Datos del cliente
- Dirección de envío
- Items de la orden (tabla)
- Totales (subtotal, impuestos, envío, total)
- Historial de cambios de estado
- Botones de acción:
  - Cambiar estado (dropdown)
  - Cancelar orden (con confirmación y restauración de inventario)

**Lógica de cancelación:**
```typescript
// Al cancelar una orden:
1. Cambiar estado a CANCELADO
2. Para cada item en la orden:
   - Identificar tipo de producto
   - Sumar la cantidad al stock del producto correspondiente
```

---

### 6. **Gestión de Usuarios** (`/admin/usuarios`)

#### 6.1 Clientes (`/admin/usuarios/clientes`)
- Lista de clientes
- Ver detalles del cliente
- Ver historial de órdenes del cliente
- Activar/Desactivar cliente

#### 6.2 Administradores (`/admin/usuarios/administradores`)
- Lista de administradores
- Crear nuevo administrador
- Editar administrador
- Cambiar rol (admin/superadmin)
- Activar/Desactivar administrador
- Ver último login

---

### 7. **Inventario** (`/admin/inventario`)
**Vista de tabla con:**
- Tipo de producto
- Nombre/Modelo
- Stock actual
- Alerta si stock < 10 (rojo)
- Última actualización
- Filtros:
  - Por tipo de producto
  - Solo productos con stock bajo
  - Por marca

---

## API Routes Necesarias

### Autenticación
- `POST /api/admin/auth/login` - Login
- `POST /api/admin/auth/logout` - Logout
- `GET /api/admin/auth/session` - Verificar sesión

### Productos
- `GET /api/admin/productos/nuevos` - Listar
- `POST /api/admin/productos/nuevos` - Crear
- `GET /api/admin/productos/nuevos/[id]` - Obtener uno
- `PUT /api/admin/productos/nuevos/[id]` - Actualizar
- `DELETE /api/admin/productos/nuevos/[id]` - Eliminar
- (Similar para seminuevos y accesorios)

### Contenido
- `GET /api/admin/contenido` - Listar
- `POST /api/admin/contenido` - Crear
- `PUT /api/admin/contenido/[id]` - Actualizar
- `DELETE /api/admin/contenido/[id]` - Eliminar
- `POST /api/admin/upload` - Subir imagen a Cloudinary

### Órdenes
- `GET /api/admin/ordenes` - Listar (con filtros)
- `GET /api/admin/ordenes/[id]` - Obtener detalle
- `PUT /api/admin/ordenes/[id]/estado` - Cambiar estado
- `POST /api/admin/ordenes/[id]/cancelar` - Cancelar orden

### Usuarios
- `GET /api/admin/usuarios/clientes` - Listar clientes
- `GET /api/admin/usuarios/administradores` - Listar admins
- `POST /api/admin/usuarios/administradores` - Crear admin

---

## Tecnologías Adicionales Recomendadas

### Autenticación
- **NextAuth.js** - Para autenticación de administradores
- **bcrypt** - Para hashear contraseñas

### UI Components
- **shadcn/ui** - Componentes UI modernos y accesibles
- **React Hook Form** - Para formularios
- **Zod** - Validación de esquemas

### Utilidades
- **date-fns** - Manejo de fechas
- **recharts** - Gráficos para el dashboard

---

## Orden de Implementación Sugerido

1. ✅ **Base de datos** (COMPLETADO)
2. ⏳ **Autenticación de admin** (NextAuth + login)
3. ⏳ **Layout del admin** (sidebar, header, navegación)
4. ⏳ **Dashboard básico** (estadísticas simples)
5. ⏳ **Gestión de productos** (CRUD completo)
6. ⏳ **Subida de imágenes a Cloudinary**
7. ⏳ **Gestión de contenido**
8. ⏳ **Gestión de órdenes** (con lógica de inventario)
9. ⏳ **Gestión de usuarios**
10. ⏳ **Inventario y reportes**

---

## Consideraciones Importantes

### Seguridad
- ✅ Todas las rutas `/admin/*` deben estar protegidas
- ✅ Validar permisos de administrador en cada API route
- ✅ Sanitizar inputs en formularios
- ✅ Validar tipos de archivo en subida de imágenes

### Performance
- ✅ Usar paginación en listas grandes
- ✅ Implementar búsqueda y filtros eficientes
- ✅ Optimizar imágenes de Cloudinary (transformaciones)
- ✅ Cachear datos del dashboard cuando sea posible

### UX
- ✅ Feedback visual en todas las acciones (loading, success, error)
- ✅ Confirmaciones para acciones destructivas
- ✅ Validación en tiempo real en formularios
- ✅ Mensajes de error claros y útiles

