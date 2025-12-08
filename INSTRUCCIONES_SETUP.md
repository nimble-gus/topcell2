# Instrucciones de Configuración - TopCell Ecommerce

## 1. Configuración de Base de Datos (Railway MySQL)

### Paso 1: Obtener credenciales de Railway
1. Ve a tu proyecto en Railway
2. Selecciona tu servicio MySQL
3. En la pestaña "Variables", encontrarás:
   - `MYSQLHOST`
   - `MYSQLPORT`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE`

### Paso 2: Configurar .env
Crea o edita el archivo `.env` en la raíz del proyecto con:

```env
# Railway MySQL Database Connection
DATABASE_URL="mysql://MYSQLUSER:MYSQLPASSWORD@MYSQLHOST:MYSQLPORT/MYSQLDATABASE"

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME="tu_cloud_name"
CLOUDINARY_API_KEY="tu_api_key"
CLOUDINARY_API_SECRET="tu_api_secret"

# NextAuth Configuration (para autenticación de admin)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="genera_un_secret_aleatorio_aqui"
```

**Ejemplo real:**
```env
DATABASE_URL="mysql://root:abc123@containers-us-west-123.railway.app:3306/railway"
```

### Paso 3: Generar y aplicar el schema
```bash
# Generar el cliente de Prisma
npm run prisma:generate

# Hacer push del schema a la base de datos (crea las tablas)
npm run prisma:push
```

---

## 2. Configuración de Cloudinary

### Paso 1: Crear cuenta en Cloudinary
1. Ve a [cloudinary.com](https://cloudinary.com) y crea una cuenta gratuita
2. En el Dashboard, encontrarás:
   - Cloud Name
   - API Key
   - API Secret

### Paso 2: Agregar al .env
Agrega las credenciales de Cloudinary al archivo `.env`:

```env
CLOUDINARY_CLOUD_NAME="tu_cloud_name"
CLOUDINARY_API_KEY="123456789012345"
CLOUDINARY_API_SECRET="abcdefghijklmnopqrstuvwxyz"
```

### Paso 3: Instalar SDK de Cloudinary
```bash
npm install cloudinary
```

---

## 3. Estructura de la Base de Datos

### Tablas Principales

#### **Productos**
- `Marca` - Marcas de productos
- `Color` - Colores disponibles
- `TelefonoNuevo` - Teléfonos nuevos con todas sus características
- `TelefonoSeminuevo` - Teléfonos seminuevos (incluye estado batería y ciclos)
- `Accesorio` - Accesorios
- `ImagenProducto` - Imágenes de productos (URLs de Cloudinary)

#### **Contenido**
- `ContenidoTienda` - Imágenes de hero, logos, banners (URLs de Cloudinary)

#### **Ecommerce**
- `Usuario` - Clientes
- `UsuarioAdmin` - Administradores
- `Orden` - Pedidos
- `ItemOrden` - Productos en cada orden

### Relaciones Importantes
- **Productos ↔ Colores**: Relación muchos a muchos (un producto puede tener múltiples colores)
- **Productos ↔ Imágenes**: Un producto puede tener múltiples imágenes
- **Órdenes ↔ Items**: Una orden contiene múltiples items
- **Inventario**: Campo `stock` en cada producto que se actualiza automáticamente

---

## 4. Comandos Útiles

```bash
# Generar cliente de Prisma
npm run prisma:generate

# Hacer push del schema (crear/actualizar tablas)
npm run prisma:push

# Crear migración
npm run prisma:migrate

# Abrir Prisma Studio (interfaz visual de la BD)
npm run prisma:studio
```

---

## 5. Próximos Pasos

1. ✅ Configurar `.env` con credenciales de Railway y Cloudinary
2. ⏳ Ejecutar `npm run prisma:push` para crear las tablas
3. ⏳ Instalar dependencias adicionales (Cloudinary SDK, NextAuth)
4. ⏳ Crear estructura de carpetas para el portal admin
5. ⏳ Implementar autenticación de administradores
6. ⏳ Desarrollar módulos del portal admin

