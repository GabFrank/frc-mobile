import { gql } from "apollo-angular";

export const iniciarRecepcion = gql`
    mutation iniciarRecepcion($sucursalId: ID!, $notaRecepcionIds: [ID!]!, $proveedorId: ID!, $monedaId: ID!, $usuarioId: ID!, $cotizacion: Float) {
        data: iniciarRecepcion(sucursalId: $sucursalId, notaRecepcionIds: $notaRecepcionIds, proveedorId: $proveedorId, monedaId: $monedaId, usuarioId: $usuarioId, cotizacion: $cotizacion) {
            id
            estado
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
            fecha
        }
    }
`;

export const finalizarRecepcion = gql`
    mutation finalizarRecepcion($recepcionMercaderiaId: ID!) {
        data: finalizarRecepcion(recepcionMercaderiaId: $recepcionMercaderiaId) {
            id
            codigoVerificacion
            fechaEmision
            estado
        }
    }
`;

export const saveRecepcionMercaderiaItem = gql`
    mutation saveRecepcionMercaderiaItem($entity: RecepcionMercaderiaItemInput!) {
        data: saveRecepcionMercaderiaItem(entity: $entity) {
            id
            cantidadRecibida
            metodoVerificacion
            motivoVerificacionManual
            estadoVerificacion
        }
    }
`;

export const cancelarVerificacion = gql`
  mutation cancelarVerificacion($notaRecepcionItemId: ID!, $sucursalId: ID!) {
    data: cancelarVerificacion(notaRecepcionItemId: $notaRecepcionItemId, sucursalId: $sucursalId)
  }
`;

export const resetearVerificacion = gql`
  mutation resetearVerificacion($recepcionMercaderiaItemId: ID!) {
    data: resetearVerificacion(recepcionMercaderiaItemId: $recepcionMercaderiaItemId)
  }
`;

export const cancelarRechazo = gql`
    mutation cancelarRechazo($notaRecepcionItemId: ID!, $sucursalId: ID!) {
        data: cancelarRechazo(notaRecepcionItemId: $notaRecepcionItemId, sucursalId: $sucursalId)
    }
`;

