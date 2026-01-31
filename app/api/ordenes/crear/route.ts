import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { sendOrdenCreatedEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      usuario,
      tipoEnvio,
      metodoPago,
      direccionEnvio,
      ciudadEnvio,
      codigoPostalEnvio,
      nombreRecibe,
      telefonoRecibe,
      boletaPagoUrl,
      notas,
      items,
      envio, // Costo de envío calculado en el frontend
    } = body;

    // Validar datos requeridos
    if (!usuario || !usuario.email || !usuario.nombre || !usuario.telefono) {
      return NextResponse.json(
        { error: "Faltan datos requeridos del usuario" },
        { status: 400 }
      );
    }

    if (!tipoEnvio || (tipoEnvio !== "ENVIO" && tipoEnvio !== "RECOGER_BODEGA")) {
      return NextResponse.json(
        { error: "Tipo de envío inválido" },
        { status: 400 }
      );
    }

    if (!metodoPago || (metodoPago !== "CONTRA_ENTREGA" && metodoPago !== "TRANSFERENCIA" && metodoPago !== "TARJETA")) {
      return NextResponse.json(
        { error: "Método de pago inválido" },
        { status: 400 }
      );
    }

    if (tipoEnvio === "ENVIO") {
      if (!direccionEnvio || !ciudadEnvio) {
        return NextResponse.json(
          { error: "Falta la dirección de envío" },
          { status: 400 }
        );
      }
      if (!nombreRecibe || !telefonoRecibe) {
        return NextResponse.json(
          { error: "Faltan los datos de quien recibirá el pedido" },
          { status: 400 }
        );
      }
    }

    if (metodoPago === "TRANSFERENCIA" && !boletaPagoUrl) {
      return NextResponse.json(
        { error: "Debes subir la boleta de pago" },
        { status: 400 }
      );
    }

    // Para pago con tarjeta, no se requiere boleta de pago
    // El pago se procesará después de crear la orden

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "El carrito está vacío" },
        { status: 400 }
      );
    }

    // Buscar o crear usuario
    let usuarioDb = await prisma.usuario.findUnique({
      where: { email: usuario.email },
    });

    if (!usuarioDb) {
      usuarioDb = await prisma.usuario.create({
        data: {
          email: usuario.email,
          nombre: usuario.nombre,
          apellido: usuario.apellido || null,
          telefono: usuario.telefono,
          direccion: usuario.direccion,
          ciudad: usuario.ciudad,
          codigoPostal: usuario.codigoPostal || null,
        },
      });
    } else {
      // Actualizar datos del usuario si han cambiado
      usuarioDb = await prisma.usuario.update({
        where: { id: usuarioDb.id },
        data: {
          nombre: usuario.nombre,
          apellido: usuario.apellido || usuarioDb.apellido,
          telefono: usuario.telefono,
          direccion: usuario.direccion,
          ciudad: usuario.ciudad,
          codigoPostal: usuario.codigoPostal || usuarioDb.codigoPostal,
        },
      });
    }

    // Validar stock y calcular totales
    let subtotal = new Prisma.Decimal(0);
    const itemsToCreate: any[] = [];
    const stockUpdates: Array<{ tipo: string; id: number; cantidad: number }> = [];

    for (const item of items) {
      let producto: any = null;
      let variante: any = null;
      let colorItem: any = null;
      let precioUnitario = new Prisma.Decimal(item.precio);
      let stockDisponible = 0;

      if (item.tipo === "telefono-nuevo") {
        producto = await prisma.telefonoNuevo.findUnique({
          where: { id: item.productoId },
          include: { 
            variantes: {
              include: {
                color: true,
              },
            },
          },
        });

        if (!producto) {
          return NextResponse.json(
            { error: `Producto no encontrado: ${item.productoId}` },
            { status: 404 }
          );
        }

        variante = producto.variantes.find((v: any) => v.id === item.varianteId);
        if (!variante) {
          return NextResponse.json(
            { error: `Variante no encontrada: ${item.varianteId}` },
            { status: 404 }
          );
        }

        stockDisponible = variante.stock;
        precioUnitario = new Prisma.Decimal(variante.precio);
      } else if (item.tipo === "telefono-seminuevo") {
        producto = await prisma.telefonoSeminuevo.findUnique({
          where: { id: item.productoId },
          include: { 
            marca: true,
            modelo: true,
            variantes: {
              include: {
                color: true,
              },
            },
          },
        });

        if (!producto) {
          return NextResponse.json(
            { error: `Producto no encontrado: ${item.productoId}` },
            { status: 404 }
          );
        }

        variante = producto.variantes.find((v: any) => v.id === item.varianteId);
        if (!variante) {
          return NextResponse.json(
            { error: `Variante no encontrada: ${item.varianteId}` },
            { status: 404 }
          );
        }

        stockDisponible = variante.stock;
        precioUnitario = new Prisma.Decimal(variante.precio);
      } else if (item.tipo === "accesorio") {
        producto = await prisma.accesorio.findUnique({
          where: { id: item.productoId },
          include: { 
            colores: {
              include: {
                color: true,
              },
            },
          },
        });

        if (!producto) {
          return NextResponse.json(
            { error: `Producto no encontrado: ${item.productoId}` },
            { status: 404 }
          );
        }

        if (!producto.colores || !Array.isArray(producto.colores) || producto.colores.length === 0) {
          return NextResponse.json(
            { error: `El accesorio ${item.productoId} no tiene colores configurados` },
            { status: 400 }
          );
        }

        if (!item.colorId) {
          return NextResponse.json(
            { error: `ColorId no proporcionado para el accesorio ${item.productoId}` },
            { status: 400 }
          );
        }

        colorItem = producto.colores.find((c: any) => c.colorId === item.colorId);
        if (!colorItem) {
          return NextResponse.json(
            { error: `Color no encontrado: ${item.colorId} para el accesorio ${item.productoId}. Colores disponibles: ${producto.colores.map((c: any) => c.colorId).join(", ")}` },
            { status: 404 }
          );
        }

        stockDisponible = colorItem.stock;
        precioUnitario = new Prisma.Decimal(producto.precio);
      }

      // Validar stock
      if (stockDisponible < item.cantidad) {
        // Obtener el nombre del producto según el tipo
        let nombreProducto = "producto";
        if (item.tipo === "telefono-nuevo") {
          nombreProducto = `${producto.marca.nombre} ${producto.modelo}`;
        } else if (item.tipo === "telefono-seminuevo") {
          nombreProducto = `${producto.marca.nombre} ${producto.modelo?.nombre || "Sin modelo"}`;
        } else if (item.tipo === "accesorio") {
          nombreProducto = `${producto.marca.nombre} ${producto.modelo}`;
        }
        
        return NextResponse.json(
          { error: `Stock insuficiente para ${nombreProducto}. Disponible: ${stockDisponible}, Solicitado: ${item.cantidad}` },
          { status: 400 }
        );
      }

      // Calcular subtotal del item
      const itemSubtotal = precioUnitario.mul(item.cantidad);
      subtotal = subtotal.add(itemSubtotal);

      // Preparar detalles de la variante para almacenar
      let detallesVariante: any = null;
      
      if (item.tipo === "telefono-nuevo" && variante) {
        detallesVariante = {
          color: variante.color?.color || "N/A",
          rom: variante.rom || "N/A",
        };
      } else if (item.tipo === "telefono-seminuevo" && variante) {
        detallesVariante = {
          color: variante.color?.color || "N/A",
          rom: variante.rom || "N/A",
          estado: variante.estado || null,
          porcentajeBateria: variante.porcentajeBateria || null,
          ciclosCarga: variante.ciclosCarga || null,
        };
      } else if (item.tipo === "accesorio" && colorItem) {
        detallesVariante = {
          color: colorItem.color?.color || "N/A",
        };
      }

      // Preparar item para crear
      let tipoProducto: "TELEFONO_NUEVO" | "TELEFONO_SEMINUEVO" | "ACCESORIO";
      if (item.tipo === "telefono-nuevo") {
        tipoProducto = "TELEFONO_NUEVO";
      } else if (item.tipo === "telefono-seminuevo") {
        tipoProducto = "TELEFONO_SEMINUEVO";
      } else {
        tipoProducto = "ACCESORIO";
      }

      const itemData: any = {
        tipoProducto,
        cantidad: item.cantidad,
        precioUnitario,
        subtotal: itemSubtotal,
        detallesVariante: detallesVariante ? JSON.stringify(detallesVariante) : null,
      };

      if (item.tipo === "telefono-nuevo") {
        itemData.telefonoNuevoId = item.productoId;
      } else if (item.tipo === "telefono-seminuevo") {
        itemData.telefonoSeminuevoId = item.productoId;
      } else if (item.tipo === "accesorio") {
        itemData.accesorioId = item.productoId;
      }

      itemsToCreate.push(itemData);

      // Preparar actualización de stock
      if (item.tipo === "telefono-nuevo" || item.tipo === "telefono-seminuevo") {
        stockUpdates.push({
          tipo: item.tipo,
          id: variante.id,
          cantidad: item.cantidad,
        });
      } else if (item.tipo === "accesorio") {
        stockUpdates.push({
          tipo: "accesorio-color",
          id: colorItem.id,
          cantidad: item.cantidad,
        });
      }
    }

    // Calcular totales
    const impuestos = new Prisma.Decimal(0);
    // El envío viene del body (calculado en el frontend)
    const envioCalculado = body.envio !== undefined ? new Prisma.Decimal(body.envio) : (tipoEnvio === "ENVIO" ? new Prisma.Decimal(35) : new Prisma.Decimal(0));
    const total = subtotal.add(impuestos).add(envioCalculado);

    // Generar número de orden único
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const numeroOrden = `ORD-${timestamp}-${random}`;

    // Crear orden y items en una transacción
    const orden = await prisma.$transaction(async (tx) => {
      // Crear la orden
      const nuevaOrden = await tx.orden.create({
        data: {
          usuarioId: usuarioDb.id,
          numeroOrden,
          estado: "PENDIENTE",
          subtotal,
          impuestos,
          envio: envioCalculado,
          total,
          tipoEnvio: tipoEnvio as "ENVIO" | "RECOGER_BODEGA",
          metodoPago: metodoPago as "CONTRA_ENTREGA" | "TRANSFERENCIA" | "TARJETA",
          direccionEnvio,
          ciudadEnvio: ciudadEnvio || null,
          codigoPostalEnvio: codigoPostalEnvio || null,
          nombreRecibe: nombreRecibe || null,
          telefonoRecibe: telefonoRecibe || null,
          boletaPagoUrl: boletaPagoUrl || null,
          notas: notas || null,
          items: {
            create: itemsToCreate,
          },
        },
        include: {
          items: true,
        },
      });

      // Actualizar stock
      for (const update of stockUpdates) {
        if (update.tipo === "telefono-nuevo") {
          await tx.telefonoNuevoVariante.update({
            where: { id: update.id },
            data: {
              stock: {
                decrement: update.cantidad,
              },
            },
          });
        } else if (update.tipo === "telefono-seminuevo") {
          await tx.telefonoSeminuevoVariante.update({
            where: { id: update.id },
            data: {
              stock: {
                decrement: update.cantidad,
              },
            },
          });
        } else if (update.tipo === "accesorio-color") {
          await tx.accesorioColor.update({
            where: { id: update.id },
            data: {
              stock: {
                decrement: update.cantidad,
              },
            },
          });
        }
      }

      return nuevaOrden;
    });

    // Obtener la orden completa con toda la información para el email
    const ordenCompleta = await prisma.orden.findUnique({
      where: { id: orden.id },
      include: {
        usuario: true,
        items: {
          include: {
            telefonoNuevo: {
              include: {
                marca: true,
                imagenes: {
                  orderBy: { orden: "asc" },
                  take: 1,
                },
              },
            },
            telefonoSeminuevo: {
              include: {
                marca: true,
                modelo: {
                  include: {
                    imagenes: {
                      orderBy: { orden: "asc" },
                      take: 1,
                    },
                  },
                },
              },
            },
            accesorio: {
              include: {
                marca: true,
                imagenes: {
                  orderBy: { orden: "asc" },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    // Obtener logo para el email
    const logoContent = await prisma.contenidoTienda.findFirst({
      where: {
        tipo: "logo",
        activo: true,
      },
      orderBy: {
        orden: "asc",
      },
    });

    // Enviar email de confirmación solo cuando la transacción está confirmada
    // Para TARJETA: el email se envía cuando el pago es aprobado (paso1, paso3 o paso5)
    // Para CONTRA_ENTREGA y TRANSFERENCIA: la orden está confirmada al crearse
    if (ordenCompleta && metodoPago !== "TARJETA") {
      try {
        const itemsParaEmail = ordenCompleta.items.map((item) => {
          let nombreProducto = "Producto";
          let variante = null;
          let imagenUrl = null;

          // Intentar parsear detallesVariante si existe
          let detalles: any = null;
          if (item.detallesVariante) {
            try {
              detalles = JSON.parse(item.detallesVariante);
            } catch (e) {
              // Si no se puede parsear, usar null
            }
          }

          if (item.tipoProducto === "TELEFONO_NUEVO" && item.telefonoNuevo) {
            nombreProducto = `${item.telefonoNuevo.marca.nombre} ${item.telefonoNuevo.modelo}`;
            if (detalles) {
              const partesVariante = [];
              if (detalles.color) partesVariante.push(detalles.color);
              if (detalles.rom) partesVariante.push(detalles.rom);
              variante = partesVariante.length > 0 ? partesVariante.join(", ") : null;
            }
            imagenUrl = item.telefonoNuevo.imagenes[0]?.url || null;
          } else if (item.tipoProducto === "TELEFONO_SEMINUEVO" && item.telefonoSeminuevo) {
            nombreProducto = `${item.telefonoSeminuevo.marca.nombre} ${item.telefonoSeminuevo.modelo?.nombre || "Sin modelo"}`;
            if (detalles) {
              const partesVariante = [];
              if (detalles.color) partesVariante.push(detalles.color);
              if (detalles.rom) partesVariante.push(detalles.rom);
              if (detalles.estado) partesVariante.push(`Estado: ${detalles.estado}/10`);
              if (detalles.porcentajeBateria) partesVariante.push(`Batería: ${detalles.porcentajeBateria}%`);
              variante = partesVariante.length > 0 ? partesVariante.join(", ") : null;
            }
            imagenUrl = item.telefonoSeminuevo.modelo?.imagenes[0]?.url || null;
          } else if (item.tipoProducto === "ACCESORIO" && item.accesorio) {
            nombreProducto = `${item.accesorio.marca.nombre} ${item.accesorio.modelo}`;
            if (detalles && detalles.color) {
              variante = detalles.color;
            }
            imagenUrl = item.accesorio.imagenes[0]?.url || null;
          }

          return {
            id: item.id,
            cantidad: item.cantidad,
            precioUnitario: Number(item.precioUnitario),
            subtotal: Number(item.subtotal),
            tipoProducto: item.tipoProducto,
            nombreProducto,
            variante,
            imagenUrl,
          };
        });

        await sendOrdenCreatedEmail(
          {
          id: ordenCompleta.id,
          numeroOrden: ordenCompleta.numeroOrden,
          estado: ordenCompleta.estado,
          subtotal: Number(ordenCompleta.subtotal),
          impuestos: Number(ordenCompleta.impuestos),
          envio: Number(ordenCompleta.envio),
          total: Number(ordenCompleta.total),
          tipoEnvio: ordenCompleta.tipoEnvio,
          metodoPago: ordenCompleta.metodoPago,
          direccionEnvio: ordenCompleta.direccionEnvio,
          ciudadEnvio: ordenCompleta.ciudadEnvio,
          codigoPostalEnvio: ordenCompleta.codigoPostalEnvio,
          nombreRecibe: ordenCompleta.nombreRecibe,
          telefonoRecibe: ordenCompleta.telefonoRecibe,
          notas: ordenCompleta.notas,
          createdAt: ordenCompleta.createdAt,
          usuario: {
            email: ordenCompleta.usuario.email,
            nombre: ordenCompleta.usuario.nombre,
            apellido: ordenCompleta.usuario.apellido,
            telefono: ordenCompleta.usuario.telefono,
          },
          items: itemsParaEmail,
          },
          logoContent?.url || null
        );
      } catch (emailError: any) {
        // No fallar la creación de la orden si el email falla
        console.error("Error al enviar email de confirmación (orden creada exitosamente):", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      ordenId: orden.id,
      numeroOrden: orden.numeroOrden,
    });
  } catch (error: any) {
    console.error("Error al crear orden:", error);
    return NextResponse.json(
      { error: error.message || "Error al procesar la orden" },
      { status: 500 }
    );
  }
}

