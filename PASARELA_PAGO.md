# Documentación de la Pasarela de Pago con Tarjeta (NeoPay 3DSecure)

## 📋 Índice

1. [Resumen General](#resumen-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Flujo de Transacción](#flujo-de-transacción)
4. [Archivos Importantes](#archivos-importantes)
5. [Funcionalidades Implementadas](#funcionalidades-implementadas)
6. [Configuración y Variables de Entorno](#configuración-y-variables-de-entorno)
7. [Uso del Postman Collection](#uso-del-postman-collection)
8. [Manejo de Errores](#manejo-de-errores)
9. [Seguridad](#seguridad)

---

## 📌 Resumen General

La aplicación utiliza **NeoPay 3DSecure** como pasarela de pago para procesar transacciones con tarjeta de crédito/débito. La integración implementa un flujo de **3 pasos simplificado** que incluye:

- **Paso 1**: Iniciación de la transacción y autenticación 3DSecure
- **Paso 2**: Device Data Collection (DDC) mediante Cardinal Commerce (iframe oculto)
- **Paso 3**: Confirmación de la transacción después de la autenticación

**Nota**: El sistema soporta el flujo completo de 5 pasos. Si NeoPay requiere autenticación adicional con PIN (Paso 4), el sistema redirige automáticamente al usuario para completar esta autenticación antes de proceder con el Paso 5.

---

## 🏗️ Arquitectura del Sistema

### Componentes Principales

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  /checkout (Formulario de pago)                      │  │
│  │  /pago/3dsecure (Autenticación 3DSecure)            │  │
│  │  /pago/3dsecure/callback (Callback después de 3DS)  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              API Routes (Next.js API Routes)                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  /api/pagos/tarjeta/paso1                           │  │
│  │  /api/pagos/tarjeta/paso3                           │  │
│  │  /api/pagos/tarjeta/anular                          │  │
│  │  /api/pagos/tarjeta/reversa                         │  │
│  │  /api/ordenes/[id]/voucher                          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Utilidades (lib/neopay.ts)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  • buildPaso1Payload()                               │  │
│  │  • buildPaso3Payload()                               │  │
│  │  • buildAnulacionPayload()                           │  │
│  │  • buildReversaPayload()                            │  │
│  │  • callNeoPayAPI()                                   │  │
│  │  • ejecutarReversaAutomatica()                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    NeoPay API                                │
│  https://epaytestvisanet.com.gt:4433/V3/api/...            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Transacción

### 1. Inicio de la Transacción (Paso 1)

**Archivo**: `app/api/pagos/tarjeta/paso1/route.ts`

**Proceso**:
1. El usuario completa el formulario de pago en `/checkout`
2. Se envía una petición POST a `/api/pagos/tarjeta/paso1` con:
   - `ordenId`: ID de la orden creada previamente
   - `tarjeta`: Datos de la tarjeta (número, fecha vencimiento, CVV)
   - `cliente`: Información del cliente (BillTo)
   - `monto`: Monto total de la transacción

3. El servidor construye el payload usando `buildPaso1Payload()`:
   - `MessageTypeId`: "0200" (request)
   - `ProcessingCode`: "000000" (venta)
   - `SystemsTraceNo`: Número único de 6 dígitos
   - `AmountTrans`: Monto en centavos (ej: Q3535.00 = "353500")
   - `Card`: Datos de la tarjeta (sanitizados)
   - `BillTo`: Información de facturación
   - `PayerAuthentication.Step`: "1"

4. Se llama a NeoPay API usando `callNeoPayAPI()`

5. **Respuestas posibles**:
   - **Aprobación directa** (`ResponseCode: "00"`, `Step: "1"`): La transacción se aprueba sin 3DSecure
   - **Requiere 3DSecure** (`ResponseCode: "00"`, `Step: "2"`): Se requiere autenticación adicional
   - **Rechazada**: La transacción se rechaza inmediatamente

6. Si requiere 3DSecure, se construye un formulario HTML con:
   - `AccessToken`: Token JWT de Cardinal Commerce
   - `DeviceDataCollectionUrl`: URL de Cardinal Commerce para DDC
   - Se redirige al usuario a `/pago/3dsecure`

### 2. Device Data Collection (Paso 2)

**Archivo**: `app/pago/3dsecure/page.tsx`

**Proceso**:
1. Se muestra un iframe **oculto** (`height="1" width="1"`) que contiene el formulario de DDC
2. El formulario se auto-submitea a Cardinal Commerce usando el `AccessToken` y `DeviceDataCollectionUrl`
3. Cardinal Commerce recopila datos del dispositivo (fingerprinting)
4. Cuando se completa, Cardinal Commerce envía un mensaje `profile.completed` con `Status: true`
5. Después de **15 segundos** (para dar tiempo a que Cardinal Commerce notifique a NeoPay), se redirige a `/pago/3dsecure/callback`

**Nota**: El delay de 15 segundos es crítico para asegurar que NeoPay reciba la notificación de Cardinal Commerce antes de ejecutar el Paso 3.

### 4. Autenticación Adicional con PIN (Paso 4)

**Archivo**: `app/pago/3dsecure/paso4/page.tsx`

**Proceso**:
1. Si NeoPay responde con `Step: "4"` en el Paso 3, se redirige al usuario a `/pago/3dsecure/paso4`
2. Se muestra un iframe **visible** con el formulario de Step-Up de Cardinal Commerce
3. El usuario ingresa su PIN o completa la autenticación adicional requerida por el banco
4. Cuando se completa, Cardinal Commerce envía un mensaje `profile.completed` con `Status: true`
5. Después de **15 segundos** (para dar tiempo a que Cardinal Commerce notifique a NeoPay), se redirige a `/pago/3dsecure/callback?paso=5`

**Nota**: El Paso 4 solo se ejecuta cuando el banco emisor requiere autenticación adicional (generalmente para transacciones de mayor monto o tarjetas específicas).

### 5. Confirmación Final (Paso 5)

**Archivo**: `app/api/pagos/tarjeta/paso5/route.ts`

**Proceso**:
1. El callback (`/pago/3dsecure/callback`) detecta `paso=5` y llama a `/api/pagos/tarjeta/paso5`
2. Se recuperan los valores del Paso 1 y Paso 3 desde `orden.respuestaPago`:
   - `MessageTypeId`, `ProcessingCode`, `SystemsTraceNo`, etc. del Paso 1
   - `DirectoryServerTransactionId` del Paso 3 (cuando se detectó `Step: "4"`)

3. Se construye el payload del Paso 5 usando `buildPaso5Payload()`:
   - `PayerAuthentication.Step`: "5"
   - `PayerAuthentication.ReferenceId`: El ReferenceId original
   - `PayerAuthentication.DirectoryServerTransactionId`: El ID recibido en Paso 3

4. Se llama a NeoPay con un timeout de **90 segundos**

5. **Validaciones**:
   - Si `ResponseCode === "00"` o `"10"`: Transacción aprobada
   - Si hay timeout o códigos de error específicos (68, 91, 98): Se ejecuta reversa automática

6. Se actualiza la orden con el estado final (APROBADO o RECHAZADO)

### 3. Confirmación de Transacción (Paso 3)

**Archivo**: `app/api/pagos/tarjeta/paso3/route.ts`

**Proceso**:
1. El callback (`/pago/3dsecure/callback`) llama a `/api/pagos/tarjeta/paso3`
2. Se recuperan los valores del Paso 1 desde `orden.respuestaPago.paso1Data`:
   - `MessageTypeId`: "0200"
   - `ProcessingCode`: "000000"
   - `SystemsTraceNo`: El mismo del Paso 1
   - `PosEntryMode`, `Nii`, `PosConditionCode`, etc.

3. Se construye el payload del Paso 3 usando `buildPaso3Payload()`:
   - Los campos `Amount.AmountTrans`, `Card.Type`, y `BillTo` van **vacíos** según el manual
   - Se reutilizan los valores del Paso 1 para mantener consistencia
   - `PayerAuthentication.Step`: "3"
   - `PayerAuthentication.ReferenceId`: El ReferenceId recibido en Paso 1

4. Se llama a NeoPay con un timeout de **90 segundos**

5. **Validaciones**:
   - Si `Step === "4"`: Se guardan los datos del Paso 3 y se redirige al usuario a Paso 4
   - Si `ResponseCode === "00"` o `"10"`: Transacción aprobada
   - Si hay timeout o códigos de error específicos (68, 91, 98): Se ejecuta reversa automática

6. Se actualiza la orden con:
   - `estadoPago`: "APROBADO" o "RECHAZADO"
   - `codigoRespuesta`: Código de respuesta de NeoPay
   - `mensajeRespuesta`: Mensaje descriptivo
   - `retrievalRefNo`: Número de referencia (12 dígitos)
   - `authIdResponse`: Número de autorización (6 caracteres)
   - `respuestaPago`: JSON completo de la respuesta

---

## 📁 Archivos Importantes

### Backend (API Routes)

| Archivo | Descripción |
|---------|-------------|
| `app/api/pagos/tarjeta/paso1/route.ts` | Inicia la transacción y maneja la respuesta del Paso 1 |
| `app/api/pagos/tarjeta/paso3/route.ts` | Confirma la transacción después de 3DSecure (Paso 3) |
| `app/api/pagos/tarjeta/paso5/route.ts` | Confirma la transacción después de autenticación adicional (Paso 5) |
| `app/api/pagos/tarjeta/anular/route.ts` | Anula una transacción aprobada |
| `app/api/pagos/tarjeta/reversa/route.ts` | Ejecuta una reversa manual de una transacción |
| `app/api/ordenes/crear/route.ts` | Crea la orden inicial antes del pago |
| `app/api/ordenes/[id]/voucher/route.ts` | Genera el PDF del voucher/comprobante |

### Frontend (Páginas)

| Archivo | Descripción |
|---------|-------------|
| `app/checkout/page.tsx` | Formulario de checkout con opción de pago con tarjeta |
| `app/pago/3dsecure/page.tsx` | Página que muestra el iframe oculto para DDC (Paso 2) |
| `app/pago/3dsecure/callback/page.tsx` | Callback después de completar 3DSecure, ejecuta Paso 3 o redirige a Paso 4 |
| `app/pago/3dsecure/paso4/page.tsx` | Página para autenticación adicional con PIN (Paso 4) |
| `app/orden/[id]/page.tsx` | Página de confirmación de orden con botón para descargar voucher |

### Utilidades

| Archivo | Descripción |
|---------|-------------|
| `lib/neopay.ts` | **Archivo principal** con todas las funciones de NeoPay: construcción de payloads, llamadas a API, reversas automáticas, helpers |
| `lib/voucher.ts` | Generación de PDFs de vouchers/comprobantes usando `pdfkit` |
| `lib/cart.ts` | Manejo del carrito de compras (localStorage) |

### Base de Datos

| Modelo | Campos Importantes |
|--------|-------------------|
| `Orden` | `estadoPago`, `metodoPago`, `systemsTraceNoOriginal`, `referenciaPago`, `retrievalRefNo`, `authIdResponse`, `respuestaPago`, `codigoRespuesta`, `mensajeRespuesta` |

---

## ✅ Funcionalidades Implementadas

### 1. ✅ Venta con Tarjeta (3DSecure)

**Estado**: ✅ **Completamente Implementado**

- Iniciación de transacción (Paso 1)
- Device Data Collection mediante Cardinal Commerce (Paso 2)
- Confirmación después de 3DSecure (Paso 3)
- Manejo de aprobaciones directas (sin 3DSecure)
- Manejo de autorizaciones parciales (`ResponseCode: "10"`)

**Archivos relacionados**:
- `app/api/pagos/tarjeta/paso1/route.ts`
- `app/api/pagos/tarjeta/paso3/route.ts`
- `app/pago/3dsecure/page.tsx`
- `app/pago/3dsecure/callback/page.tsx`

### 2. ✅ Reversas Automáticas

**Estado**: ✅ **Completamente Implementado**

- Se ejecutan automáticamente cuando:
  - Hay un timeout en Paso 1 o Paso 3 (60-90 segundos)
  - NeoPay responde con códigos de timeout específicos (`68`, `91`, `98`)
  - Hay un error de comunicación con NeoPay

**Implementación**:
- Función `ejecutarReversaAutomatica()` en `lib/neopay.ts`
- Se llama automáticamente desde `paso1/route.ts` y `paso3/route.ts`
- Usa `AbortController` para detectar timeouts

**Archivos relacionados**:
- `lib/neopay.ts` (función `ejecutarReversaAutomatica`)
- `app/api/pagos/tarjeta/paso1/route.ts`
- `app/api/pagos/tarjeta/paso3/route.ts`

### 3. ✅ Anulaciones

**Estado**: ✅ **Completamente Implementado**

- Anulación de transacciones aprobadas desde el panel de administración
- Se ejecuta cuando un admin cancela una orden con pago aprobado
- Incluye reversa de pago en NeoPay
- Genera voucher de anulación (monto negativo)

**Archivos relacionados**:
- `app/api/pagos/tarjeta/anular/route.ts`
- `app/api/admin/ordenes/[id]/route.ts` (llama a anular cuando se cancela orden)
- `lib/neopay.ts` (función `buildAnulacionPayload`)

### 4. ✅ Reversas Manuales

**Estado**: ✅ **Completamente Implementado**

- Endpoint para ejecutar reversas manuales desde el admin
- Útil para casos donde la reversa automática falló o se necesita ejecutar manualmente

**Archivos relacionados**:
- `app/api/pagos/tarjeta/reversa/route.ts`
- `lib/neopay.ts` (función `buildReversaPayload`)

### 5. ✅ Vouchers/Comprobantes de Pago

**Estado**: ✅ **Completamente Implementado**

- Generación de PDFs con información completa de la transacción
- Incluye:
  - Información de la orden
  - Información del cliente
  - Detalles del pago (número de tarjeta, tipo, referencia, autorización)
  - Fecha y hora de transacción
  - Items de la orden
  - Totales
- Soporte para vouchers de anulación (monto negativo)

**Archivos relacionados**:
- `app/api/ordenes/[id]/voucher/route.ts`
- `lib/voucher.ts` (función `generarVoucherPDF`)

### 6. ✅ Paso 4 y Paso 5 (Autenticación Adicional)

**Estado**: ✅ **COMPLETAMENTE IMPLEMENTADO**

- El sistema soporta el flujo completo de 5 pasos
- Si NeoPay requiere Paso 4 (autenticación con PIN), el sistema redirige automáticamente al usuario
- Paso 4: Autenticación adicional mediante Cardinal Commerce Step-Up (iframe visible)
- Paso 5: Confirmación final de la transacción después de completar Paso 4
- Se guarda `DirectoryServerTransactionId` del Paso 3 para usar en Paso 5

**Archivos relacionados**:
- `app/pago/3dsecure/paso4/page.tsx` ✅
- `app/api/pagos/tarjeta/paso5/route.ts` ✅
- `lib/neopay.ts` (función `buildPaso5Payload`) ✅

### 7. ❌ Tokenización (TMS & Network Token)

**Estado**: ❌ **NO IMPLEMENTADO**

- Funcionalidad futura opcional según el manual de NeoPay
- No es requerida para el flujo básico de ventas

---

## 🔧 Configuración y Variables de Entorno

### Variables Requeridas

```env
# NeoPay - Ambiente de Pruebas
NEOPAY_TEST_API_URL=https://epaytestvisanet.com.gt:4433/V3/api/AuthorizationPaymentCommerce
NEOPAY_TEST_MERCHANT_USER=tu_usuario_test
NEOPAY_TEST_MERCHANT_PASSWD=tu_password_test
NEOPAY_TEST_TERMINAL_ID=tu_terminal_id_test
NEOPAY_TEST_CARD_ACQ_ID=tu_card_acq_id_test

# NeoPay - Ambiente de Producción (epayserver.neonet.com.gt)
NEOPAY_PROD_API_URL=https://epayserver.neonet.com.gt/api/AuthorizationPaymentCommerce
NEOPAY_PROD_MERCHANT_USER=     # Del archivo adjunto de NeoPay
NEOPAY_PROD_MERCHANT_PASSWD=   # Del archivo adjunto de NeoPay
NEOPAY_PROD_TERMINAL_ID=99578298
NEOPAY_PROD_CARD_ACQ_ID=049379012
# IP fija del gateway productivo (obligatorio)
NEOPAY_PROD_PAYMENTGW_IP=181.114.3.133
# IP del servidor donde corre la app (recomendado para producción)
# NEOPAY_PROD_MERCHANT_SERVER_IP=tu_ip_publica

# URL de Callback (para desarrollo con ngrok)
NEOPAY_URL_COMMERCE=https://tu-dominio-ngrok.ngrok-free.dev/pago/3dsecure/callback

# URL del sitio (para producción)
NEXT_PUBLIC_SITE_URL=https://tu-dominio.com
```

### Configuración Automática

El sistema detecta automáticamente el ambiente usando `NODE_ENV`:
- **Development**: Usa credenciales de prueba (`NEOPAY_TEST_*`)
- **Production**: Usa credenciales de producción (`NEOPAY_PROD_*`), con fallback a prueba si no están configuradas

**Archivo**: `lib/neopay.ts` → función `getNeoPayConfig()`

### Producción (Quetzales - epayserver.neonet.com.gt)

Parámetros de producción según NeoPay:
- **paymentgwIP**: 181.114.3.133 (IP fija del gateway)
- **shopperIP**: IP del cliente (se obtiene automáticamente del request)
- **merchantServerIP**: IP del servidor (configurable con `NEOPAY_PROD_MERCHANT_SERVER_IP`)
- **CardAcqId**: 049379012
- **TerminalId**: 99578298
- **merchantUser** y **merchantPasswd**: Del archivo adjunto enviado por NeoPay

**Importante**: Conexión TLS 1.2 requerida (Node.js la usa por defecto).

---

## 📮 Uso del Postman Collection

### ¿Se usó el Postman Collection?

**Respuesta**: ✅ **SÍ, se usó como referencia**

El archivo `epayServerRest con 3DSecure 2025(Contadoo, Cuotas, Puntos).postman_collection.json` fue utilizado como referencia para:

1. **Estructura de Payloads**: Los payloads de Paso 1, Paso 3, Anulación y Reversa se basan en los ejemplos del Postman
2. **Headers de Autenticación**: Se implementaron los headers exactos del Postman:
   - `ShopperIP`
   - `PaymentgwIP` (IP del cliente)
   - `MerchantServerIP`
   - `MerchantUser`
   - `MerchantPasswd`
3. **Formato de Campos**: Se siguieron los formatos exactos del Postman:
   - `SystemsTraceNo`: 6 dígitos
   - `DateExpiration`: YYMM (convertido desde MMYY del formulario)
   - `AmountTrans`: Monto en centavos (string)
   - Campos vacíos en Paso 3 según ejemplos

### Diferencias con el Postman

1. **Flujo Simplificado**: El Postman incluye ejemplos de Paso 4 y Paso 5, pero el sistema solo implementa hasta Paso 3
2. **Manejo de Timeouts**: El sistema implementa `AbortController` para timeouts, no está en el Postman
3. **Reversas Automáticas**: El sistema ejecuta reversas automáticas en caso de timeout, el Postman solo muestra reversas manuales

---

## ⚠️ Manejo de Errores

### Códigos de Respuesta Comunes

| Código | Significado | Acción |
|--------|-------------|--------|
| `00` | Transacción aprobada | ✅ Continuar |
| `10` | Autorización parcial | ✅ Continuar (fondos insuficientes para monto completo) |
| `15` | Emisor inválido | ❌ Rechazar |
| `68` | Timeout | 🔄 Ejecutar reversa automática |
| `91` | Timeout | 🔄 Ejecutar reversa automática |
| `98` | Timeout | 🔄 Ejecutar reversa automática |
| `-3` | Error de autenticación | ❌ Rechazar (verificar AlternateHostResponse22) |

### Funciones de Helper

**Archivo**: `lib/neopay.ts`

- `getResponseCodeMessage(code)`: Convierte códigos de respuesta a mensajes legibles
- `isTimeoutResponseCode(code)`: Detecta códigos de timeout (68, 91, 98)
- `isApprovedResponseCode(code)`: Detecta códigos de aprobación (00, 10)
- `isPartialAuthorizationCode(code)`: Detecta autorización parcial (10)

### Logging

Todos los endpoints incluyen logging detallado:
- Payloads enviados (sanitizados, sin CVV ni números completos de tarjeta)
- Respuestas completas de NeoPay
- Errores con stack traces
- Timeouts y reversas automáticas

**Ejemplo de log**:
```
=== Enviando a NeoPay ===
URL: https://epaytestvisanet.com.gt:4433/V3/api/AuthorizationPaymentCommerce
Payload (sanitizado): { ... }
=== Respuesta de NeoPay ===
Status: 200
Response: { ... }
```

---

## 🔒 Seguridad

### Protecciones Implementadas

1. **Sanitización de Datos Sensibles**:
   - Los números de tarjeta se muestran solo con los últimos 4 dígitos
   - El CVV nunca se almacena ni se muestra en logs
   - Los payloads en logs están sanitizados

2. **Validación de Referencias**:
   - Se valida que el `ReferenceId` del Paso 3 coincida con el del Paso 1
   - Se valida que el `SystemsTraceNo` sea consistente

3. **Timeouts**:
   - Paso 1: 60 segundos
   - Paso 3: 90 segundos
   - Reversas automáticas en caso de timeout

4. **HTTPS Obligatorio**:
   - En producción, todas las comunicaciones son HTTPS
   - Cardinal Commerce requiere HTTPS para el callback

5. **Validación de Estados**:
   - Solo se pueden anular transacciones con estado "APROBADO"
   - Se previene la ejecución duplicada de callbacks usando `useRef`

### Campos Sensibles en Base de Datos

- `respuestaPago`: Contiene la respuesta completa de NeoPay (incluye datos de tarjeta parciales)
- `systemsTraceNoOriginal`: Número de trazabilidad único
- `referenciaPago`: ReferenceId de 3DSecure

**Recomendación**: Considerar encriptar estos campos en producción si se requiere cumplimiento PCI-DSS estricto.

---

## 📝 Notas Importantes

### SystemsTraceNo

**Estado Actual**: Se genera aleatoriamente (6 dígitos)

**Según Manual**: Debe ser un contador secuencial de 000001 a 999999, reiniciando después de 999999.

**Recomendación Futura**: Implementar un contador persistente en base de datos para cumplir con el manual.

### Flujo Completo de 5 Pasos

El sistema soporta el flujo completo de 5 pasos:

1. **Paso 1**: Iniciación de transacción
2. **Paso 2**: Device Data Collection (DDC)
3. **Paso 3**: Confirmación después de 3DSecure
4. **Paso 4**: Autenticación adicional con PIN (si es requerida por el banco)
5. **Paso 5**: Confirmación final después de Paso 4

Si NeoPay no requiere Paso 4, la transacción se aprueba directamente en Paso 3.

### Testing

Para probar en desarrollo:
1. Usar `ngrok` para exponer `localhost:3000`
2. Configurar `NEOPAY_URL_COMMERCE` con la URL de ngrok
3. Usar tarjetas de prueba proporcionadas por NeoPay

---

## 🔗 Referencias

- **Manual de Integración NeoPay**: Documentación proporcionada por NeoPay
- **Postman Collection**: `epayServerRest con 3DSecure 2025(Contadoo, Cuotas, Puntos).postman_collection.json`
- **Cardinal Commerce**: Proveedor de autenticación 3DSecure utilizado por NeoPay

---

**Última actualización**: Diciembre 2024
**Versión del Sistema**: 1.0
**Ambiente**: Desarrollo y Producción

