import { gql } from "apollo-angular";
import { RecepcionMercaderia } from '../../../../domains/operaciones/pedido/recepcion-mercaderia.model';
import { RecepcionMercaderiaItem } from '../../../../domains/operaciones/pedido/recepcion-mercaderia-item.model';

export const notasPendientes = gql`
    query notasPendientes($sucursalId: ID!, $proveedorId: ID) {
        data: notasPendientes(sucursalId: $sucursalId, proveedorId: $proveedorId) {
            id
            numero
            fecha
            estado
            pedido {
                id
                proveedor {
                    id
                    persona {
                        id
                        nombre
                        documento
                        telefono
                    }
                }
            }
            compra {
                id
                proveedor {
                    id
                    persona {
                        id
                        nombre
                        documento
                        telefono
                    }
                }
            }
            moneda {
                id
                denominacion
                simbolo
            }
        }
    }
`;

export const notasPendientesPage = gql`
    query notasPendientesPage($sucursalId: ID!, $proveedorId: ID, $page: Int = 0, $size: Int = 20) {
        data: notasPendientesPage(sucursalId: $sucursalId, proveedorId: $proveedorId, page: $page, size: $size) {
            getTotalPages
            getTotalElements
            getNumberOfElements
            isFirst
            isLast
            hasNext
            hasPrevious
            getContent {
                id
                numero
                fecha
                estado
                pedido {
                    id
                    proveedor {
                        id
                        persona {
                            id
                            nombre
                            documento
                            telefono
                        }
                    }
                }
                compra {
                    id
                    proveedor {
                        id
                        persona {
                            id
                            nombre
                            documento
                            telefono
                        }
                    }
                }
                moneda {
                    id
                    denominacion
                    simbolo
                }
            }
        }
    }
`;

export const recepcionesVigentes = gql`
    query recepcionesVigentes($sucursalId: ID!, $usuarioId: ID!, $estados: [RecepcionMercaderiaEstado!] = [PENDIENTE, EN_PROCESO]) {
        data: recepcionMercaderiaConFiltros(
            sucursalId: $sucursalId,
            estados: $estados,
            usuarioId: $usuarioId,
            page: 0,
            size: 10
        ) {
            getTotalPages
            getTotalElements
            getNumberOfElements
            isFirst
            isLast
            hasNext
            hasPrevious
            getContent {
                id
                estado
                fecha
                proveedor {
                    id
                    persona {
                        id
                        nombre
                    }
                }
                sucursalRecepcion {
                    id
                    nombre
                }
                items {
                    id
                    notaRecepcionItem {
                        id
                        notaRecepcion {
                            id
                            numero
                        }
                    }
                }
            }
        }
    }
`;

export const productosAgrupadosPorNotas = gql`
    query productosAgrupadosPorNotas($notaRecepcionIds: [ID!]) {
        data: productosAgrupadosPorNotas(notaRecepcionIds: $notaRecepcionIds) {
            producto {
                id
                nombre
                imagen
            }
            cantidadTotalEsperada
            presentacionConsolidada {
                id
                descripcion
            }
            distribuciones {
                id
                cantidad
                notaRecepcionItem {
                    id
                    notaRecepcion {
                        id
                        numero
                    }
                }
            }
        }
    }
`;

export const notasPorRecepcion = gql`
    query notasPorRecepcion($recepcionId: ID!) {
        data: recepcionMercaderiaNotasPorRecepcion(recepcionId: $recepcionId) {
            id
            notaRecepcion {
                id
                numero
                fecha
                estado
                proveedor {
                    id
                    persona {
                        nombre
                    }
                }
            }
        }
    }
`;

export const recepcionMercaderiaPorId = gql`
    query recepcionMercaderiaPorId($id: ID!) {
        data: recepcionMercaderia(id: $id) {
            id
            fecha
            estado
            sucursalRecepcion {
                id
                nombre
                localizacion
                ciudad {
                    id
                    descripcion
                }
            }
            usuario {
                id
                persona {
                    nombre
                }
            }
            proveedor {
                id
                persona {
                    nombre
                    documento
                }
            }
            moneda {
                id
                denominacion
                simbolo
            }
            cotizacion
        }
    }
`;

// Interfaces de respuesta
export interface RecepcionMercaderiaPorIdResponse {
    data: RecepcionMercaderia;
}

export interface RecepcionMercaderiaItemsPorRecepcionResponse {
    data: RecepcionMercaderiaItem[];
}

export interface RecepcionMercaderiaItemsPorRecepcionPaginadosResponse {
    data: {
        getTotalPages: number;
        getTotalElements: number;
        getNumberOfElements: number;
        isFirst: boolean;
        isLast: boolean;
        hasNext: boolean;
        hasPrevious: boolean;
        getContent: RecepcionMercaderiaItem[];
    };
}

export const recepcionMercaderiaItemsPorRecepcion = gql`
    query recepcionMercaderiaItemsPorRecepcion($recepcionId: ID!) {
        data: recepcionMercaderiaItemsPorRecepcion(recepcionId: $recepcionId) {
            id
            recepcionMercaderia {
                id
                fecha
                estado
            }
            notaRecepcionItem {
                id
                cantidadEnNota
                precioUnitarioEnNota
                presentacionEnNota {
                    id
                    descripcion
                }
                esBonificacion
                vencimientoEnNota
            }
            notaRecepcionItemDistribucion {
                id
                cantidad
                sucursalEntrega {
                    id
                    nombre
                }
            }
            producto {
                id
                codigoPrincipal
                descripcion
                imagenPrincipal
                vencimiento
                lote
            }
            presentacionRecibida {
                id
                descripcion
            }
            sucursalEntrega {
                id
                nombre
            }
            usuario {
                id
                persona {
                    nombre
                }
            }
            cantidadRecibida
            cantidadRechazada
            esBonificacion
            vencimientoRecibido
            lote
            motivoRechazo
            observaciones
            metodoVerificacion
            motivoVerificacionManual
            estadoVerificacion
            variaciones {
                id
                presentacion {
                    id
                    descripcion
                    cantidad
                }
                cantidad
                vencimiento
                lote
                rechazado
                motivoRechazo
            }
        }
    }
`;

export const recepcionMercaderiaItemsPorRecepcionPaginados = gql`
    query recepcionMercaderiaItemsPorRecepcionPaginados($recepcionId: ID!, $page: Int = 0, $size: Int = 20, $filtroTexto: String, $estados: [EstadoVerificacion!]) {
        data: recepcionMercaderiaItemsPorRecepcionPaginados(
            recepcionId: $recepcionId, 
            page: $page, 
            size: $size, 
            filtroTexto: $filtroTexto,
            estados: $estados
        ) {
            getTotalPages
            getTotalElements
            getNumberOfElements
            isFirst
            isLast
            hasNext
            hasPrevious
            getContent {
                id
                recepcionMercaderiaId
                recepcionMercaderia {
                    id
                    estado
                    fecha
                    usuario {
                        id
                        persona {
                            id
                            nombre
                        }
                    }
                }
                notaRecepcionItem {
                    id
                    cantidadEnNota
                    precioUnitarioEnNota
                    presentacionEnNota {
                        id
                        descripcion
                    }
                    notaRecepcion {
                        id
                        numero
                        fecha
                        estado
                        pedido {
                            id
                            proveedor {
                                id
                                persona {
                                    id
                                    nombre
                                    documento
                                    telefono
                                }
                            }
                        }
                        compra {
                            id
                            proveedor {
                                id
                                persona {
                                    id
                                    nombre
                                    documento
                                    telefono
                                }
                            }
                        }
                    }
                    producto {
                        id
                        descripcion
                        imagenPrincipal
                        codigoPrincipal
                        vencimiento
                        lote
                        presentaciones {
                            id
                            descripcion
                        }
                    }
                }
                notaRecepcionItemDistribucion {
                    id
                    cantidad
                    sucursalEntrega {
                        id
                        nombre
                        ciudad {
                            id
                            descripcion
                        }
                    }
                }
                presentacionRecibida {
                    id
                    descripcion
                }
                sucursalEntrega {
                    id
                    nombre
                    ciudad {
                        id
                        descripcion
                    }
                }
                usuario {
                    id
                    persona {
                        id
                        nombre
                    }
                }
                cantidadRecibida
                cantidadRechazada
                vencimientoRecibido
                lote
                esBonificacion
                motivoRechazo
                observaciones
                metodoVerificacion
                motivoVerificacionManual
                estadoVerificacion
                variaciones {
                    id
                    presentacion {
                        id
                        descripcion
                        cantidad
                    }
                    cantidad
                    vencimiento
                    lote
                    rechazado
                    motivoRechazo
                }
            }
            getPageable {
                getPageNumber
                getPageSize
            }
        }
    }
`;

export const findPendienteRecepcionItemPorProducto = gql`
  query FindPendienteRecepcionItemPorProducto($recepcionId: ID!, $productoId: ID!) {
   data: findPendienteRecepcionItemPorProducto(recepcionId: $recepcionId, productoId: $productoId) {
      id
      estadoVerificacion
      metodoVerificacion
      motivoVerificacionManual
      cantidadRecibida
      cantidadRechazada
      esBonificacion
      observaciones
      notaRecepcionItem {
        id
        cantidadEnNota
        precioUnitarioEnNota
        presentacionEnNota {
          id
          descripcion
        }
        producto {
          id
          descripcion
          imagenPrincipal
          vencimiento
          lote
        }
        notaRecepcion {
          id
          numero
        }
      }
      notaRecepcionItemDistribucion {
        id
        cantidad
        sucursalEntrega {
          id
          nombre
        }
      }
      variaciones {
        id
        presentacion {
          id
          descripcion
          cantidad
        }
        cantidad
        vencimiento
        lote
        rechazado
        motivoRechazo
      }
    }
  }
`;

export const obtenerSumarioRecepcion = gql`
  query ObtenerSumarioRecepcion($recepcionId: ID!) {
    data: obtenerSumarioRecepcion(recepcionId: $recepcionId) {
      recepcionId
      estadoRecepcion
      nombreProveedor
      nombreSucursal
      totalItems
      itemsVerificados
      itemsPendientes
      itemsConDiferencia
      itemsRechazados
      progresoPorcentaje
      estadoProgreso
      totalProductosUnicos
      productosVerificados
      productosPendientes
      fechaCreacion
      fechaUltimaVerificacion
    }
  }
`;

export interface ObtenerSumarioRecepcionResponse {
  obtenerSumarioRecepcion: {
    recepcionId: string;
    estadoRecepcion: string;
    nombreProveedor: string;
    nombreSucursal: string;
    totalItems: number;
    itemsVerificados: number;
    itemsPendientes: number;
          itemsConDiferencia: number;
    itemsRechazados: number;
    progresoPorcentaje: number;
    estadoProgreso: string;
    totalProductosUnicos: number;
    productosVerificados: number;
    productosPendientes: number;
    fechaCreacion: string;
    fechaUltimaVerificacion: string;
  };
}

// Interfaces para las respuestas de las queries
export interface FindPendienteRecepcionItemPorProductoResponse {
    data: RecepcionMercaderiaItem;
}

export const itemsNotaPaginados = gql`
    query itemsNotaPaginados($notaId: ID!, $page: Int!, $size: Int!, $sort: String, $direction: String) {
        data: itemsNotaPaginados(notaId: $notaId, page: $page, size: $size, sort: $sort, direction: $direction) {
            content {
                id
                producto {
                    id
                    nombre
                    codigo
                    descripcion
                }
                presentacion {
                    id
                    nombre
                    codigo
                    factorConversion
                }
                cantidad
                estado
                precioUnitario
                moneda {
                    id
                    nombre
                    simbolo
                }
            }
            totalElements
            totalPages
            size
            number
            first
            last
            numberOfElements
        }
    }
`;

export const resumenItemsNota = gql`
    query resumenItemsNota($notaIds: [ID!]!) {
        data: resumenItemsNota(notaIds: $notaIds) {
            totalItems
            totalCantidad
            itemsPorEstado {
                estado
                count
                cantidad
            }
            resumenPorNota {
                notaId
                totalItems
                totalCantidad
                estado
            }
        }
    }
`;

export const generarConstanciaRecepcionPDF = gql`
    query generarConstanciaRecepcionPDF($recepcionId: ID!) {
        data: generarConstanciaRecepcionPDF(recepcionId: $recepcionId) {
            pdfBase64
            nombreArchivo
            tamanioBytes
            fechaGeneracion
        }
    }
`;