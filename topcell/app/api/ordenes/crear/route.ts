import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";

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

    if (!metodoPago || (metodoPago !== "CONTRA_ENTREGA" && metodoPago !== "TRANSFERENCIA")) {
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
      let precioUnitario = new Prisma.Decimal(item.precio);
      let stockDisponible = 0;

      if (item.tipo === "telefono-nuevo") {
        producto = await prisma.telefonoNuevo.findUnique({
          where: { id: item.productoId },
          include: { variantes: true },
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
          include: { variantes: true },
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
          include: { colores: true },
        });

        if (!producto) {
          return NextResponse.json(
            { error: `Producto no encontrado: ${item.productoId}` },
            { status: 404 }
          );
        }

        const colorItem = producto.colores.find((c: any) => c.colorId === item.colorId);
        if (!colorItem) {
          return NextResponse.json(
            { error: `Color no encontrado: ${item.colorId}` },
            { status: 404 }
          );
        }

        stockDisponible = colorItem.stock;
        precioUnitario = new Prisma.Decimal(producto.precio);
      }

      // Validar stock
      if (stockDisponible < item.cantidad) {
        return NextResponse.json(
          { error: `Stock insuficiente para ${producto.modelo}. Disponible: ${stockDisponible}, Solicitado: ${item.cantidad}` },
          { status: 400 }
        );
      }

      // Calcular subtotal del item
      const itemSubtotal = precioUnitario.mul(item.cantidad);
      subtotal = subtotal.add(itemSubtotal);

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
          metodoPago: metodoPago as "CONTRA_ENTREGA" | "TRANSFERENCIA",
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

