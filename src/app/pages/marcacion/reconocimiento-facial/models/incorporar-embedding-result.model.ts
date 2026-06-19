export type ResultadoIncorporacionEmbedding = 'OK' | 'RECHAZADO_SCORE' | 'RECHAZADO_SIMILITUD';

export type ResultadoIncorporacionEmbeddingCliente = ResultadoIncorporacionEmbedding | 'ERROR_RED';

export interface IncorporarEmbeddingMarcacionResult {
  resultado: ResultadoIncorporacionEmbedding;
  mensaje: string;
}

export const MENSAJE_RECHAZADO_SCORE_CLIENTE =
  'La captura no alcanzó la calidad mínima (70%) para actualizar el perfil facial.';

export const MENSAJE_ERROR_RED_CLIENTE =
  'No se pudo actualizar el perfil facial por un error de conexión.';

export function notificarResultadoIncorporacionPerfil(
  notificacionService: { success: (t: string) => void; warn: (t: string) => void; danger: (t: string) => void },
  resultado: { resultado: ResultadoIncorporacionEmbeddingCliente; mensaje: string } | boolean | null | undefined
): void {
  const normalizado = normalizarResultadoIncorporacion(resultado);
  if (normalizado.resultado === 'OK') {
    notificacionService.success(normalizado.mensaje);
  } else if (normalizado.resultado === 'ERROR_RED') {
    notificacionService.danger(normalizado.mensaje);
  } else {
    notificacionService.warn(normalizado.mensaje);
  }
}

export function normalizarResultadoIncorporacion(
  resultado: { resultado: ResultadoIncorporacionEmbeddingCliente; mensaje: string } | boolean | null | undefined
): { resultado: ResultadoIncorporacionEmbeddingCliente; mensaje: string } {
  if (resultado == null) {
    return { resultado: 'ERROR_RED', mensaje: MENSAJE_ERROR_RED_CLIENTE };
  }
  if (typeof resultado === 'boolean') {
    return resultado
      ? { resultado: 'OK', mensaje: 'Perfil facial actualizado con esta marcación.' }
      : { resultado: 'RECHAZADO_SCORE', mensaje: MENSAJE_RECHAZADO_SCORE_CLIENTE };
  }
  return {
    resultado: resultado.resultado ?? 'ERROR_RED',
    mensaje: resultado.mensaje || MENSAJE_ERROR_RED_CLIENTE
  };
}
