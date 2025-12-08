/**
 * Configuración de NeoPay según el ambiente
 */
export function getNeoPayConfig() {
  const isDevelopment = process.env.NODE_ENV === "development";
  
  return {
    apiUrl: isDevelopment
      ? process.env.NEOPAY_TEST_API_URL
      : process.env.NEOPAY_PROD_API_URL || process.env.NEOPAY_TEST_API_URL,
    merchantUser: isDevelopment
      ? process.env.NEOPAY_TEST_MERCHANT_USER
      : process.env.NEOPAY_PROD_MERCHANT_USER || process.env.NEOPAY_TEST_MERCHANT_USER,
    merchantPasswd: isDevelopment
      ? process.env.NEOPAY_TEST_MERCHANT_PASSWD
      : process.env.NEOPAY_PROD_MERCHANT_PASSWD || process.env.NEOPAY_TEST_MERCHANT_PASSWD,
    terminalId: isDevelopment
      ? process.env.NEOPAY_TEST_TERMINAL_ID
      : process.env.NEOPAY_PROD_TERMINAL_ID || process.env.NEOPAY_TEST_TERMINAL_ID,
    cardAcqId: isDevelopment
      ? process.env.NEOPAY_TEST_CARD_ACQ_ID
      : process.env.NEOPAY_PROD_CARD_ACQ_ID || process.env.NEOPAY_TEST_CARD_ACQ_ID,
    urlCommerce: process.env.NEOPAY_URL_COMMERCE || 
                 `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/pago/3dsecure/callback`,
  };
}

/**
 * Obtiene la IP del cliente desde los headers
 */
export function getClientIP(headers: Headers): string {
  // Intentar obtener la IP real del cliente
  const forwarded = headers.get("x-forwarded-for");
  const realIP = headers.get("x-real-ip");
  const cfConnectingIP = headers.get("cf-connecting-ip");
  
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // En desarrollo, usar IP de prueba
  return "1.1.1.1";
}

/**
 * Genera un SystemsTraceNo único (6 dígitos)
 */
export function generateSystemsTraceNo(): string {
  // Generar un número de 6 dígitos (formato: 010101)
  const random = Math.floor(Math.random() * 1000000);
  return random.toString().padStart(6, "0");
}

/**
 * Construye el payload para el Paso 1 de 3DSecure
 */
export interface Paso1Payload {
  MessageTypeId: string;
  ProcessingCode: string;
  SystemsTraceNo: string;
  TimeLocalTrans: string;
  DateLocalTrans: string;
  PosEntryMode: string;
  Nii: string;
  PosConditionCode: string;
  AdditionalData: string;
  OrderInformation: string;
  FormatId: string;
  Merchant: {
    TerminalId: string;
    CardAcqId: string;
  };
  Card: {
    Type: string;
    PrimaryAcctNum: string;
    DateExpiration: string;
    Cvv2: string;
    Track2Data: string;
    CardTokenId: string;
    UniqueCodeofBeneciary: string;
  };
  Amount: {
    AmountTrans: string;
    AmountDiscount: string;
    RateDiscount: string;
    AdditionalAmounts: string;
    TaxDetail: any[];
  };
  PrivateUse60: {
    BatchNumber: string;
  };
  PrivateUse63: {
    LodgingFolioNumber14: string;
    NationalCard25: string;
    HostReferenceData31: string;
    TaxAmount1: string;
  };
  TokenManagement: {
    Type: string;
    ActionMethod: string;
  };
  Customer: {
    CustomerTokenId: string;
    FirstName: string;
    LastName: string;
    TaxId: string;
    IdentificationType: string;
    PersonalId: string;
    Email: string;
    PhoneNumber: string;
  };
  BillTo: {
    FirstName: string;
    LastName: string;
    Company: string;
    AddressOne: string;
    AddressTwo: string;
    Locality: string;
    AdministrativeArea: string;
    PostalCode: string;
    Country: string;
    Email: string;
    PhoneNumber: string;
  };
  ShipTo: {
    DefaultSt: string;
    FirstName: string;
    LastName: string;
    Company: string;
    AddressOne: string;
    AddressTwo: string;
    Locality: string;
    AdministrativeArea: string;
    PostalCode: string;
    Country: string;
    Email: string;
    PhoneNumber: string;
    ShippingAddressTokenId: string;
  };
  PaymentInstrument: {
    PaymentInstrumentTokenId: string;
  };
  CustomerPaymentInstrument: {
    CustomerPaymentInstrumentTokenId: string;
    DefaultCpi: string;
  };
  PayerAuthentication: {
    Step: string;
    UrlCommerce: string;
    ReferenceId: string;
    DirectoryServerTransactionId?: string;
  };
}

export interface TarjetaData {
  numero: string;
  fechaVencimiento: string; // YYMM
  cvv: string;
  nombreTitular: string;
}

export interface ClienteData {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  codigoPostal?: string;
  pais?: string;
}

export function buildPaso1Payload(
  tarjeta: TarjetaData,
  cliente: ClienteData,
  monto: number,
  systemsTraceNo: string,
  urlCommerce: string
): Paso1Payload {
  const config = getNeoPayConfig();
  
  // Convertir fecha de vencimiento de MMYY a YYMM
  // Si el usuario ingresa "1229" (Diciembre 2029), NeoPay espera "2912" (YYMM)
  let dateExpiration = tarjeta.fechaVencimiento;
  if (dateExpiration.length === 4) {
    const mes = dateExpiration.slice(0, 2);
    const anio = dateExpiration.slice(2, 4);
    dateExpiration = anio + mes; // Convertir MMYY a YYMM
  }

  return {
    MessageTypeId: "0200",
    ProcessingCode: "000000",
    SystemsTraceNo: systemsTraceNo,
    TimeLocalTrans: "", // Vacío según el ejemplo de Postman
    DateLocalTrans: "", // Vacío según el ejemplo de Postman
    PosEntryMode: "012",
    Nii: "003",
    PosConditionCode: "00",
    AdditionalData: "", // Vacío para contado, "VC06" para cuotas, "LU" para puntos
    OrderInformation: "",
    FormatId: "1",
    Merchant: {
      TerminalId: config.terminalId || "",
      CardAcqId: config.cardAcqId || "",
    },
    Card: {
      Type: "001",
      PrimaryAcctNum: tarjeta.numero.replace(/\s/g, ""),
      DateExpiration: dateExpiration, // Ya convertido a YYMM
      Cvv2: tarjeta.cvv,
      Track2Data: "",
      CardTokenId: "",
      UniqueCodeofBeneciary: "",
    },
    Amount: {
      AmountTrans: Math.round(monto * 100).toString(), // Convertir a centavos
      AmountDiscount: "",
      RateDiscount: "",
      AdditionalAmounts: "",
      TaxDetail: [],
    },
    PrivateUse60: {
      BatchNumber: "",
    },
    PrivateUse63: {
      LodgingFolioNumber14: "",
      NationalCard25: "",
      HostReferenceData31: "",
      TaxAmount1: "",
    },
    TokenManagement: {
      Type: "",
      ActionMethod: "",
    },
    Customer: {
      CustomerTokenId: "",
      FirstName: "",
      LastName: "",
      TaxId: "",
      IdentificationType: "",
      PersonalId: "",
      Email: "",
      PhoneNumber: "",
    },
    BillTo: {
      FirstName: cliente.nombre,
      LastName: cliente.apellido,
      Company: "NA",
      AddressOne: cliente.direccion,
      AddressTwo: "",
      Locality: cliente.ciudad,
      AdministrativeArea: "GU",
      PostalCode: cliente.codigoPostal || "01010",
      Country: cliente.pais || "GT",
      Email: cliente.email,
      PhoneNumber: cliente.telefono,
    },
    ShipTo: {
      DefaultSt: "",
      FirstName: "",
      LastName: "",
      Company: "",
      AddressOne: "",
      AddressTwo: "",
      Locality: "",
      AdministrativeArea: "",
      PostalCode: "",
      Country: "",
      Email: "",
      PhoneNumber: "",
      ShippingAddressTokenId: "",
    },
    PaymentInstrument: {
      PaymentInstrumentTokenId: "",
    },
    CustomerPaymentInstrument: {
      CustomerPaymentInstrumentTokenId: "",
      DefaultCpi: "",
    },
    PayerAuthentication: {
      Step: "1",
      UrlCommerce: urlCommerce,
      ReferenceId: "",
    },
  };
}

/**
 * Construye el payload para anulación de una transacción
 * Según el manual: MessageTypeId "0200", ProcessingCode "020000"
 */
export interface AnulacionData {
  systemsTraceNoOriginal: string; // SystemsTraceNo de la transacción original
  montoOriginal: number; // Monto original de la transacción
  retrievalRefNo?: string; // Número de referencia (opcional pero recomendado)
}

export function buildAnulacionPayload(
  anulacionData: AnulacionData
): Paso1Payload {
  const config = getNeoPayConfig();

  return {
    MessageTypeId: "0200",
    ProcessingCode: "020000", // Código de procesamiento para anulación
    SystemsTraceNo: anulacionData.systemsTraceNoOriginal,
    TimeLocalTrans: "",
    DateLocalTrans: "",
    PosEntryMode: "012",
    Nii: "003",
    PosConditionCode: "00",
    AdditionalData: "",
    OrderInformation: "",
    FormatId: "1",
    Merchant: {
      TerminalId: config.terminalId || "",
      CardAcqId: config.cardAcqId || "",
    },
    Card: {
      Type: "001", // Tipo genérico (Visa)
      PrimaryAcctNum: "", // Vacío - NeoPay puede permitir anular solo con SystemsTraceNo
      DateExpiration: "",
      Cvv2: "",
      Track2Data: "",
      CardTokenId: "",
      UniqueCodeofBeneciary: "",
    },
    Amount: {
      AmountTrans: Math.round(anulacionData.montoOriginal * 100).toString(), // Convertir a centavos
      AmountDiscount: "",
      RateDiscount: "",
      AdditionalAmounts: "",
      TaxDetail: [],
    },
    PrivateUse60: {
      BatchNumber: "",
    },
    PrivateUse63: {
      LodgingFolioNumber14: "",
      NationalCard25: "",
      HostReferenceData31: anulacionData.retrievalRefNo || "", // Usar RetrievalRefNo como referencia
      TaxAmount1: "",
    },
    TokenManagement: {
      Type: "",
      ActionMethod: "",
    },
    Customer: {
      CustomerTokenId: "",
      FirstName: "",
      LastName: "",
      TaxId: "",
      IdentificationType: "",
      PersonalId: "",
      Email: "",
      PhoneNumber: "",
    },
    BillTo: {
      FirstName: "",
      LastName: "",
      Company: "",
      AddressOne: "",
      AddressTwo: "",
      Locality: "",
      AdministrativeArea: "",
      PostalCode: "",
      Country: "",
      Email: "",
      PhoneNumber: "",
    },
    ShipTo: {
      DefaultSt: "",
      FirstName: "",
      LastName: "",
      Company: "",
      AddressOne: "",
      AddressTwo: "",
      Locality: "",
      AdministrativeArea: "",
      PostalCode: "",
      Country: "",
      Email: "",
      PhoneNumber: "",
      ShippingAddressTokenId: "",
    },
    PaymentInstrument: {
      PaymentInstrumentTokenId: "",
    },
    CustomerPaymentInstrument: {
      CustomerPaymentInstrumentTokenId: "",
      DefaultCpi: "",
    },
    PayerAuthentication: {
      Step: "",
      UrlCommerce: "",
      ReferenceId: "",
    },
  };
}

/**
 * Construye el payload para reversa automática de una transacción
 * Según el manual: MessageTypeId "0400", ProcessingCode "000000"
 * Es idéntica a una venta, solo cambia el MessageTypeId
 */
export interface ReversaData {
  systemsTraceNoOriginal: string; // SystemsTraceNo de la transacción original
  montoOriginal: number; // Monto original de la transacción
  retrievalRefNo?: string; // Número de referencia (opcional pero recomendado)
}

export function buildReversaPayload(
  reversaData: ReversaData
): Paso1Payload {
  const config = getNeoPayConfig();

  return {
    MessageTypeId: "0400", // Código para reversa automática
    ProcessingCode: "000000",
    SystemsTraceNo: reversaData.systemsTraceNoOriginal,
    TimeLocalTrans: "",
    DateLocalTrans: "",
    PosEntryMode: "012",
    Nii: "003",
    PosConditionCode: "00",
    AdditionalData: "",
    OrderInformation: "",
    FormatId: "1",
    Merchant: {
      TerminalId: config.terminalId || "",
      CardAcqId: config.cardAcqId || "",
    },
    Card: {
      Type: "001", // Tipo genérico (Visa)
      PrimaryAcctNum: "", // Vacío - NeoPay puede permitir reversar solo con SystemsTraceNo
      DateExpiration: "",
      Cvv2: "",
      Track2Data: "",
      CardTokenId: "",
      UniqueCodeofBeneciary: "",
    },
    Amount: {
      AmountTrans: Math.round(reversaData.montoOriginal * 100).toString(), // Convertir a centavos
      AmountDiscount: "",
      RateDiscount: "",
      AdditionalAmounts: "",
      TaxDetail: [],
    },
    PrivateUse60: {
      BatchNumber: "",
    },
    PrivateUse63: {
      LodgingFolioNumber14: "",
      NationalCard25: "",
      HostReferenceData31: reversaData.retrievalRefNo || "", // Usar RetrievalRefNo como referencia
      TaxAmount1: "",
    },
    TokenManagement: {
      Type: "",
      ActionMethod: "",
    },
    Customer: {
      CustomerTokenId: "",
      FirstName: "",
      LastName: "",
      TaxId: "",
      IdentificationType: "",
      PersonalId: "",
      Email: "",
      PhoneNumber: "",
    },
    BillTo: {
      FirstName: "",
      LastName: "",
      Company: "",
      AddressOne: "",
      AddressTwo: "",
      Locality: "",
      AdministrativeArea: "",
      PostalCode: "",
      Country: "",
      Email: "",
      PhoneNumber: "",
    },
    ShipTo: {
      DefaultSt: "",
      FirstName: "",
      LastName: "",
      Company: "",
      AddressOne: "",
      AddressTwo: "",
      Locality: "",
      AdministrativeArea: "",
      PostalCode: "",
      Country: "",
      Email: "",
      PhoneNumber: "",
      ShippingAddressTokenId: "",
    },
    PaymentInstrument: {
      PaymentInstrumentTokenId: "",
    },
    CustomerPaymentInstrument: {
      CustomerPaymentInstrumentTokenId: "",
      DefaultCpi: "",
    },
    PayerAuthentication: {
      Step: "",
      UrlCommerce: "",
      ReferenceId: "",
    },
  };
}

/**
 * Construye el payload para el Paso 3 de 3DSecure
 * Ahora recibe los valores del Paso 1 para reutilizarlos según el manual
 */
export interface Paso3Data {
  systemsTraceNo: string;
  referenceId: string;
  // Valores del Paso 1 que deben reutilizarse según el manual
  messageTypeId?: string;
  processingCode?: string;
  posEntryMode?: string;
  nii?: string;
  posConditionCode?: string;
  orderInformation?: string;
  additionalData?: string;
  // ✅ Datos adicionales necesarios para Paso 3
  amountTrans?: string; // Monto en centavos
  cardType?: string;
  billTo?: {
    FirstName: string;
    LastName: string;
    Company: string;
    AddressOne: string;
    AddressTwo: string;
    Locality: string;
    AdministrativeArea: string;
    PostalCode: string;
    Country: string;
    Email: string;
    PhoneNumber: string;
  };
}

export function buildPaso3Payload(
  paso3Data: Paso3Data | string,
  referenceId?: string
): Partial<Paso1Payload> {
  const config = getNeoPayConfig();

  // Compatibilidad con la firma anterior
  let data: Paso3Data;
  if (typeof paso3Data === "string") {
    data = {
      systemsTraceNo: paso3Data,
      referenceId: referenceId || "",
    };
  } else {
    data = paso3Data;
  }

  return {
    MessageTypeId: data.messageTypeId || "0200",
    ProcessingCode: data.processingCode || "000000",
    SystemsTraceNo: data.systemsTraceNo,
    TimeLocalTrans: "", // Vacío según el ejemplo de Postman
    DateLocalTrans: "", // Vacío según el ejemplo de Postman
    PosEntryMode: data.posEntryMode || "012",
    Nii: data.nii || "003",
    PosConditionCode: data.posConditionCode || "00",
    AdditionalData: data.additionalData || "", // ✅ Pasar AdditionalData del Paso 1
    OrderInformation: data.orderInformation || "", // ✅ Pasar OrderInformation del Paso 1
    FormatId: "1",
    Merchant: {
      TerminalId: config.terminalId || "",
      CardAcqId: config.cardAcqId || "",
    },
    Card: {
      Type: "", // ✅ Vacío en Paso 3 según el ejemplo de Postman
      PrimaryAcctNum: "", // Vacío en Paso 3 según el manual
      DateExpiration: "", // Vacío en Paso 3
      Cvv2: "", // Vacío en Paso 3
      Track2Data: "",
      CardTokenId: "",
      UniqueCodeofBeneciary: "",
    },
    Amount: {
      AmountTrans: "", // ✅ Vacío en Paso 3 según el ejemplo de Postman
      AmountDiscount: "",
      RateDiscount: "",
      AdditionalAmounts: "",
      TaxDetail: [],
    },
    PrivateUse60: {
      BatchNumber: "",
    },
    PrivateUse63: {
      LodgingFolioNumber14: "",
      NationalCard25: "",
      HostReferenceData31: "",
      TaxAmount1: "",
    },
    TokenManagement: {
      Type: "",
      ActionMethod: "",
    },
    Customer: {
      CustomerTokenId: "",
      FirstName: "",
      LastName: "",
      TaxId: "",
      IdentificationType: "",
      PersonalId: "",
      Email: "",
      PhoneNumber: "",
    },
    BillTo: {
      FirstName: "", // ✅ Vacío en Paso 3 según el ejemplo de Postman
      LastName: "",
      Company: "",
      AddressOne: "",
      AddressTwo: "",
      Locality: "",
      AdministrativeArea: "",
      PostalCode: "",
      Country: "",
      Email: "",
      PhoneNumber: "",
    },
    ShipTo: {
      DefaultSt: "",
      FirstName: "",
      LastName: "",
      Company: "",
      AddressOne: "",
      AddressTwo: "",
      Locality: "",
      AdministrativeArea: "",
      PostalCode: "",
      Country: "",
      Email: "",
      PhoneNumber: "",
      ShippingAddressTokenId: "",
    },
    PaymentInstrument: {
      PaymentInstrumentTokenId: "",
    },
    CustomerPaymentInstrument: {
      CustomerPaymentInstrumentTokenId: "",
      DefaultCpi: "",
    },
    PayerAuthentication: {
      Step: "3",
      UrlCommerce: "",
      ReferenceId: data.referenceId || "",
    },
  };
}

/**
 * Construye el payload para el Paso 5 de 3DSecure (después del Paso 4)
 * Similar al Paso 3, pero con Step: "5"
 */
export interface Paso5Data {
  systemsTraceNo: string;
  referenceId: string;
  directoryServerTransactionId?: string;
  // Valores del Paso 1 que deben reutilizarse
  messageTypeId?: string;
  processingCode?: string;
  posEntryMode?: string;
  nii?: string;
  posConditionCode?: string;
  orderInformation?: string;
  additionalData?: string;
}

export function buildPaso5Payload(
  paso5Data: Paso5Data
): Partial<Paso1Payload> {
  const config = getNeoPayConfig();

  return {
    MessageTypeId: paso5Data.messageTypeId || "0200",
    ProcessingCode: paso5Data.processingCode || "000000",
    SystemsTraceNo: paso5Data.systemsTraceNo,
    TimeLocalTrans: "",
    DateLocalTrans: "",
    PosEntryMode: paso5Data.posEntryMode || "012",
    Nii: paso5Data.nii || "003",
    PosConditionCode: paso5Data.posConditionCode || "00",
    AdditionalData: paso5Data.additionalData || "",
    OrderInformation: paso5Data.orderInformation || "",
    FormatId: "1",
    Merchant: {
      TerminalId: config.terminalId || "",
      CardAcqId: config.cardAcqId || "",
    },
    Card: {
      Type: "",
      PrimaryAcctNum: "",
      DateExpiration: "",
      Cvv2: "",
      Track2Data: "",
      CardTokenId: "",
      UniqueCodeofBeneciary: "",
    },
    Amount: {
      AmountTrans: "",
      AmountDiscount: "",
      RateDiscount: "",
      AdditionalAmounts: "",
      TaxDetail: [],
    },
    PrivateUse60: {
      BatchNumber: "",
    },
    PrivateUse63: {
      LodgingFolioNumber14: "",
      NationalCard25: "",
      HostReferenceData31: "",
      TaxAmount1: "",
    },
    TokenManagement: {
      Type: "",
      ActionMethod: "",
    },
    Customer: {
      CustomerTokenId: "",
      FirstName: "",
      LastName: "",
      TaxId: "",
      IdentificationType: "",
      PersonalId: "",
      Email: "",
      PhoneNumber: "",
    },
    BillTo: {
      FirstName: "",
      LastName: "",
      Company: "",
      AddressOne: "",
      AddressTwo: "",
      Locality: "",
      AdministrativeArea: "",
      PostalCode: "",
      Country: "",
      Email: "",
      PhoneNumber: "",
    },
    ShipTo: {
      DefaultSt: "",
      FirstName: "",
      LastName: "",
      Company: "",
      AddressOne: "",
      AddressTwo: "",
      Locality: "",
      AdministrativeArea: "",
      PostalCode: "",
      Country: "",
      Email: "",
      PhoneNumber: "",
      ShippingAddressTokenId: "",
    },
    PaymentInstrument: {
      PaymentInstrumentTokenId: "",
    },
    CustomerPaymentInstrument: {
      CustomerPaymentInstrumentTokenId: "",
      DefaultCpi: "",
    },
    PayerAuthentication: {
      Step: "5",
      UrlCommerce: "",
      ReferenceId: paso5Data.referenceId,
      DirectoryServerTransactionId: paso5Data.directoryServerTransactionId || "",
    },
  };
}

/**
 * Realiza una llamada a la API de NeoPay
 * @param payload - Payload a enviar a NeoPay
 * @param headers - Headers de la petición HTTP
 * @param timeoutMs - Timeout en milisegundos (por defecto 60 segundos)
 */
export async function callNeoPayAPI(
  payload: any,
  headers: Headers,
  timeoutMs: number = 60000 // 60 segundos por defecto
): Promise<any> {
  const config = getNeoPayConfig();
  const clientIP = getClientIP(headers);

  if (!config.apiUrl) {
    throw new Error("NEOPAY_API_URL no está configurado");
  }

  if (!config.merchantUser || !config.merchantPasswd) {
    throw new Error("Credenciales de NeoPay no están configuradas");
  }

  // Log del payload (sin datos sensibles completos)
  const payloadLog = {
    ...payload,
    Card: {
      ...payload.Card,
      PrimaryAcctNum: payload.Card?.PrimaryAcctNum ? `****${payload.Card.PrimaryAcctNum.slice(-4)}` : "",
      Cvv2: "***",
    },
  };
  console.log("=== Enviando a NeoPay ===");
  console.log("URL:", config.apiUrl);
  console.log("Payload (sanitizado):", JSON.stringify(payloadLog, null, 2));

  // Implementar timeout configurable (por defecto 60 segundos según el manual)
  // Para el Paso 3, usamos 90 segundos porque NeoPay puede estar esperando la respuesta de Cardinal Commerce
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // PaymentgwIP debe ser una IP, no un hostname
    // Según el Postman collection, debe ser la misma IP que ShopperIP y MerchantServerIP
    // En producción, esto debería ser la IP pública del servidor del comerciante
    // Por ahora, usamos la IP del cliente como fallback
    const paymentgwIP: string = clientIP;

    const response = await fetch(config.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ShopperIP": clientIP,
        "PaymentgwIP": paymentgwIP, // ✅ Corregido: usar IP (igual que ShopperIP según Postman)
        "MerchantServerIP": clientIP,
        "MerchantUser": config.merchantUser || "",
        "MerchantPasswd": config.merchantPasswd || "",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("=== Error en NeoPay API ===");
      console.error("Status:", response.status);
      console.error("Error:", errorText);
      throw new Error(`Error en NeoPay API: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log("=== Respuesta de NeoPay ===");
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(responseData, null, 2));

    return responseData;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    // Si el error es por timeout, lanzar un error específico
    if (error.name === "AbortError" || error.message?.includes("aborted")) {
      console.error("=== Timeout en NeoPay API ===");
      console.error("La transacción excedió el tiempo límite de 60 segundos");
      const timeoutError: any = new Error(`TIMEOUT: La transacción excedió el tiempo límite de ${timeoutMs / 1000} segundos. Se requiere reversa automática.`);
      timeoutError.isTimeout = true;
      timeoutError.payload = payload;
      throw timeoutError;
    }
    
    // Re-lanzar otros errores
    throw error;
  }                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
}

/**
 * Ejecuta una reversa automática cuando hay timeout o fallo
 */
export async function ejecutarReversaAutomatica(
  reversaData: ReversaData,
  headers: Headers
): Promise<any> {
  console.log("=== Ejecutando Reversa Automática ===");
  console.log("SystemsTraceNo Original:", reversaData.systemsTraceNoOriginal);
  console.log("Monto:", reversaData.montoOriginal);

  const payload = buildReversaPayload(reversaData);
  
  try {
    const response = await callNeoPayAPI(payload, headers);
    console.log("=== Reversa Automática Exitosa ===");
    console.log("ResponseCode:", response.ResponseCode);
    return response;
  } catch (error: any) {
    console.error("=== Error en Reversa Automática ===");
    console.error("Error:", error.message);
    throw error;
  }
}

/**
 * Extrae los últimos 4 dígitos de una tarjeta
 */
export function getLast4Digits(numeroTarjeta: string): string {
  const cleaned = numeroTarjeta.replace(/\s/g, "");
  return cleaned.slice(-4);
}

/**
 * Determina el tipo de tarjeta basado en el número
 */
export function getCardType(numeroTarjeta: string): string {
  const cleaned = numeroTarjeta.replace(/\s/g, "");
  if (cleaned.startsWith("4")) {
    return "Visa";
  }
  if (cleaned.startsWith("5") || cleaned.startsWith("2")) {
    return "Mastercard";
  }
  if (cleaned.startsWith("3")) {
    return "American Express";
  }
  return "Desconocida";
}

/**
 * Mapea códigos de respuesta de NeoPay a mensajes descriptivos
 * Basado en el catálogo de códigos de respuesta del manual
 */
export function getResponseCodeMessage(code: string | number | null | undefined): string {
  if (!code) return "Código no disponible";
  
  const codeStr = code.toString();
  
  const codes: Record<string, string> = {
    "00": "APROBADA",
    "01": "REFIERASE AL EMISOR",
    "02": "REFIERASE AL EMISOR",
    "03": "PROVEEDOR DE SERVICIOS NO VALIDO",
    "04": "RECOGER",
    "05": "TRANSACCION NO ACEPTADA",
    "06": "ERROR GENERAL",
    "07": "TARJETA RECOGIDA, CONDICION ESPECIAL",
    "08": "HONOR CON IDENTIFICACION",
    "09": "SOLICITUD EN CURSO",
    "10": "APROBACION PARCIAL",
    "11": "APROBACION VIP",
    "12": "TRANSACCION INVALIDA",
    "13": "MONTO INVALIDO",
    "14": "NUMERO DE CUENTA INVALIDO",
    "15": "NO EXISTE EL EMISOR",
    "16": "FONDOS INSUFICIENTES",
    "17": "CANCELACION DE CLIENTES",
    "18": "DISPUTA DEL CLIENTE",
    "19": "TRANSACCION NO REALIZADA, INTENTE DE NUEVO",
    "20": "RESPUESTA INVALIDA",
    "21": "NINGUNA ACCION TOMADA",
    "22": "TRANSACCION NO PERMITIDA",
    "23": "TARIFA DE TRANSACCION INACEPTABLE",
    "24": "LA ACTUALIZACION DE ARCHIVOS NO ES COMPATIBLE CON EL RECEPTOR",
    "25": "NO SE LOCALIZO EL REGISTRO EN EL ARCHIVO O FALTA NUMERO DE CUENTA",
    "28": "EL ARCHIVO NO ESTA DISPONIBLE TEMPORALMENTE",
    "29": "LA ACTUALIZACION DEL ARCHIVO NO SE REALIZO CORRECTAMENTE, COMUNIQUESE CON EL ADQUIRIENTE",
    "30": "ERROR DE FORMATO",
    "31": "TARJETA NO SOPORTADA POR SWITCH",
    "32": "COMPLETADO PARCIALMENTE",
    "33": "TARJETA EXPIRADA",
    "34": "TRANSACCION NO PERMITIDA",
    "35": "TRANSACCION NO PERMITIDA",
    "36": "TRANSACCION NO PERMITIDA",
    "37": "TRANSACCION NO PERMITIDA",
    "38": "TRANSACCION NO PERMITIDA",
    "39": "SIN CUENTA DE CREDITO",
    "40": "FUNCION SOLICITADA NO ADMITIDA",
    "41": "TARJETA EXTRAVIADA",
    "42": "SIN CUENTA UNIVERSAL",
    "43": "TARJETA ROBADA",
    "44": "SIN CUENTA DE INVERSION",
    "51": "NO TIENE FONDOS DISPONIBLES",
    "52": "NO TIENE CUENTA CORRIENTE",
    "53": "NO TIENE CUENTA DE AHORROS",
    "54": "TARJETA EXPIRADA",
    "55": "PIN INCORRECTO",
    "56": "SIN REGISTRO DE TARJETA",
    "57": "TRANSACCION NO PERMITIDA AL TARJETAHABIENTE",
    "58": "TRANSACCION NO PERMITIDA A LA TERMINAL",
    "59": "TRANSACCION NO PERMITIDA",
    "60": "TRANSACCION NO PERMITIDA",
    "61": "LIMITE DE MONTO EXCEDIDO",
    "62": "TARJETA RESTRINGIDA",
    "63": "TRANSACCION NO PERMITIDA",
    "64": "MONTO ORIGINAL INCORRECTO",
    "65": "LIMITE DE CANTIDAD EXCEDIDO",
    "66": "TRANSACCION NO PERMITIDA",
    "67": "TRANSACCION NO PERMITIDA",
    "68": "RESPUESTA EXCEDIO TIEMPO DE ESPERA",
    "75": "LIMITE DE ENTRADA PIN EXCEDIDO",
    "76": "NO SE PUEDE LOCALIZAR EL MENSAJE ANTERIOR (NO COINCIDE REFERENCIA)",
    "77": "DATOS INCONSISTENTES CON EL MENSAJE ORIGINAL",
    "78": "BLOQUEADO, PRIMER USO",
    "80": "TRANSACCION DE VISA, EMISOR NO DISPONIBLE",
    "81": "TRANSACCION NO PERMITIDA",
    "82": "TRANSACCION NO PERMITIDA",
    "83": "TRANSACCION NO PERMITIDA",
    "85": "TRANSACCION NO PERMITIDA",
    "89": "TERMINAL INVALIDA",
    "91": "TIEMPO DE ESPERA EXCEDIDO",
    "92": "NO SE PUEDE ENCONTRAR EL DESTINO DE ENRUTAMIENTO",
    "93": "TRANSACCION NO PUEDE SER COMPLETADA",
    "94": "TRANSACCION DUPLICADA",
    "95": "ERROR DE RECONCILIACION",
    "96": "NO SE PUEDE PROCESAR LA OPERACION",
    "98": "TIEMPO DE ESPERA EXCEDIDO",
    "-1": "ERROR GENERAL EN LA OPERACIÓN",
    "-2": "ERROR GENERAL EN OPERACIÓN TOKENIZACION (TMS)",
    "-3": "ERROR GENERAL EN 3D SECURE",
    "-4": "ERROR GENERAL EN 3D SECURE",
    "-6": "ERROR GENERAL EN TOKEN DE RED",
    "-7": "ERROR GENERAL EN OPERACIÓN TOKEN DE RED",
  };
  
  return codes[codeStr] || `Código desconocido: ${codeStr}`;
}

/**
 * Verifica si un código de respuesta indica timeout
 * Códigos: 68, 91, 98
 */
export function isTimeoutResponseCode(code: string | number | null | undefined): boolean {
  if (!code) return false;
  const codeStr = code.toString();
  return codeStr === "68" || codeStr === "91" || codeStr === "98";
}

/**
 * Verifica si un código de respuesta indica aprobación
 * Códigos: 00, 10
 */
export function isApprovedResponseCode(code: string | number | null | undefined): boolean {
  if (!code) return false;
  const codeStr = code.toString();
  return codeStr === "00" || codeStr === "10";
}

/**
 * Verifica si un código de respuesta indica autorización parcial
 * Código: 10
 */
export function isPartialAuthorizationCode(code: string | number | null | undefined): boolean {
  if (!code) return false;
  return code.toString() === "10";
}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        