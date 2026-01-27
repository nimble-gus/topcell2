# Guía: Proceso de compra y anulación

Esta guía describe cómo se realiza el proceso de compra en la tienda y cómo se anula una orden con pago con tarjeta desde el panel de administración.

---

## 1. Proceso de compra (desde la tienda)

### 1.1. Navegación y selección de producto

- **Catálogos principales (menú del header):**
  - **Nuevos** → Teléfonos nuevos (`/catalogo`)
  - **Seminuevos** → Teléfonos seminuevos (`/seminuevos`)
  - **Accesorios** → Accesorios (`/accesorios`)

- **Filtros disponibles:**
  - **Marca:** Solo se muestran las marcas que tienen productos en ese catálogo
  - **Precio:** Rango mínimo y máximo

- **Detalle de producto:**
  - Galería de imágenes (por color/variante)
  - Especificaciones: procesador, RAM, cámara, pantalla, tipo de entrada
  - En teléfonos nuevos: capacidad de batería
  - En seminuevos: estado, porcentaje de batería, ciclos de carga
  - Precio según variante (ROM, color, estado)

### 1.2. Selección de variante y agregar al carrito

- **Teléfonos nuevos:** Seleccionar color y capacidad/ROM (si aplica)
- **Teléfonos seminuevos:** Seleccionar variante (estado, % batería, etc.)
- **Accesorios:** Seleccionar color (si aplica)

- **Agregar al carrito:**
  - Elegir cantidad (si aplica)
  - Pulsar **"Agregar al carrito"**
  - El ícono del carrito en el header muestra la cantidad actualizada

### 1.3. Revisión del carrito

- Ir a **Carrito** (`/carrito`)
- Verificar productos, variantes, cantidades y precios
- Ajustar cantidades o eliminar productos si es necesario

### 1.4. Checkout y datos del cliente

- Pulsar **"Continuar"** o **"Finalizar compra"**
- Completar:
  - **Datos personales:** nombre, correo, teléfono
  - **Dirección / tipo de envío:** envío a domicilio o recoger en bodega
  - **Método de pago:** Tarjeta, Contra entrega u otros (según configuración)

### 1.5. Pago

- **Pago con tarjeta:**
  - Ingresar datos de la tarjeta
  - Validación 3D Secure si aplica
  - Si la transacción es **aprobada**, el estado de pago de la orden pasa a **APROBADO** y se guarda la referencia de la transacción

- **Otros métodos:**
  - Seguir las instrucciones mostradas (ej. subir boleta de pago)

### 1.6. Confirmación

- Se genera el **número de orden**
- Se muestra la pantalla de confirmación
- Se envía correo al cliente con el resumen de la orden (si está configurado)

---

## 2. Proceso de anulación (desde el admin)

> La anulación aplica **solo para órdenes con pago con tarjeta APROBADO**. Se realiza desde el detalle de la orden en el panel de administración.

### 2.1. Localizar la orden

1. Entrar al **panel de administración**
2. Ir a **Órdenes** (`/admin/ordenes`)
3. Buscar la orden por número, cliente o fecha
4. Hacer clic en la orden para abrir el **detalle** (`/admin/ordenes/[id]`)

### 2.2. Revisar el estado antes de anular

En el detalle de la orden se muestra:

- **Estado de la orden:** PENDIENTE, PROCESANDO, ENVIADO, ENTREGADO, CANCELADO
- **Estado de pago** (si es tarjeta): APROBADO, ANULADO, REVERSADO, etc.

Para poder anular:

- La orden debe tener **método de pago = Tarjeta**
- El **estado de pago** debe ser **APROBADO**
- La orden **no** debe estar ya en estado **CANCELADO**

### 2.3. Anular pago y cancelar orden (botón dedicado)

En el panel lateral derecho del detalle de la orden aparece la sección **"Anular Pago y Cancelar"** cuando la orden cumple las condiciones anteriores.

**Pasos:**

1. Leer la descripción de la sección (anulación del cargo en el procesador, cancelación de la orden y restauración de stock)
2. Pulsar el botón **"Anular pago con tarjeta y cancelar orden"**
3. Confirmar en el mensaje que aparece:
   - Se anulará el cargo en el procesador de pagos
   - Si la anulación es exitosa, la orden pasará a CANCELADO y se restaurará el stock
   - Si la anulación falla, la orden **no** se cancelará
4. Si confirmas:
   - Se envía la solicitud de anulación al procesador (NeoPay)
   - Si la anulación es **exitosa:** la orden pasa a estado CANCELADO, el estado de pago a ANULADO y se restaura el stock de los productos
   - Si la anulación **falla:** se muestra el mensaje de error y la orden no se modifica

### 2.4. Cancelar usando el selector de estado (alternativa)

En la misma página, en la sección **"Cambiar Estado"**:

- Si eliges **CANCELADO** en el desplegable y pulsas **"Actualizar Estado"**
- Aparece un mensaje de confirmación indicando que se restaurará el stock y que, si hay pago con tarjeta aprobado, se intentará anular el pago
- Al confirmar, se ejecuta la misma lógica: primero se intenta anular el pago (si aplica) y luego se cancela la orden y se restaura el stock

### 2.5. Resultado después de una anulación exitosa

- **Estado de pago:** ANULADO
- **Estado de la orden:** CANCELADO
- **Stock:** Se restaura el stock de las variantes/colores de los productos de la orden
- **Comprobante:** Se puede descargar el voucher actualizado desde el botón "Descargar Voucher" (refleja la anulación)

---

## Resumen rápido

| Acción | Dónde | Condiciones |
|--------|-------|-------------|
| **Comprar** | Tienda: catálogos → producto → carrito → checkout → pago | Cliente con datos y método de pago válido |
| **Anular pago y cancelar orden** | Admin: Órdenes → detalle de orden → "Anular pago con tarjeta y cancelar orden" | Método = Tarjeta, Estado pago = APROBADO, Orden no cancelada |
| **Solo cancelar (sin tarjeta)** | Admin: Órdenes → detalle → Cambiar Estado → CANCELADO | Orden con otro método de pago o ya anulado |

---

*Documento generado para compartir el flujo de compra y anulación en la plataforma.*
