import { Injectable } from '@angular/core';
import { FaceRecognitionService } from './face-recognition.service';
import { CamaraService } from './camara.service';
import { UsuarioService } from './usuario.service';
import { Usuario } from '../domains/personas/usuario.model';
import {
  EmbeddingGaleria,
  FrameCalidadFacial,
  FRAMES_MINIMOS_VERIFICACION,
  parsearGaleriaFacial,
  promediarEmbeddingsConScore,
  SCORE_MINIMO_DETECCION,
  SCORE_MINIMO_FRAME_VERIFICACION,
  scorePromedioFrames,
  UMBRAL_SIMILITUD_FACIAL,
  UMBRAL_SIMILITUD_VERIFICACION
} from './embedding-galeria.util';

export interface EvaluacionFrameVerificacion {
  calidadOk: boolean;
  rostroDetectado: boolean;
  similitud?: number;
  embedding?: number[];
  score?: number;
  mensaje: string;
}

export interface EvaluacionFrameBusqueda {
  rostroDetectado: boolean;
  embedding?: number[];
  score?: number;
  mensaje: string;
}

export interface ResultadoBusqueda {
  usuario: Usuario;
  similitudBackend: number;
  similitudLocal: number;
  confiable: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ReconocimientoFacialHelperService {

  private ultimaConsultaServidor = 0;
  private readonly INTERVALO_CONSULTA_SERVIDOR_MS = 1500;

  constructor(
    private faceService: FaceRecognitionService,
    private camaraService: CamaraService,
    private usuarioService: UsuarioService
  ) { }

  async inicializarMotorFacial(): Promise<void> {
    await this.faceService.init();
  }

  obtenerGaleriaDesdeUsuario(usuario: Usuario | null | undefined): EmbeddingGaleria | null {
    return parsearGaleriaFacial(usuario?.persona?.embeddingFacial);
  }

  async evaluarFrameVerificacion(
    video: HTMLVideoElement,
    referenciaGaleria: EmbeddingGaleria,
    umbralSimilitud = UMBRAL_SIMILITUD_VERIFICACION,
    usuarioIdEsperado?: number
  ): Promise<EvaluacionFrameVerificacion> {
    const captura = await this.capturarFrameConScore(video);
    if (!captura) {
      return {
        calidadOk: false,
        rostroDetectado: false,
        mensaje: 'No se detecta rostro. Centra tu cara.'
      };
    }

    const tensor = captura.embedding;
    const score = captura.score;
    let similarity = this.faceService.calcularMejorSimilitudConGaleria(tensor, referenciaGaleria);

    if (usuarioIdEsperado != null) {
      const ahora = Date.now();
      if (ahora - this.ultimaConsultaServidor >= this.INTERVALO_CONSULTA_SERVIDOR_MS) {
        this.ultimaConsultaServidor = ahora;
        const similitudServidor = await this.evaluarSimilitudConServidor(usuarioIdEsperado, tensor);
        if (similitudServidor != null) {
          similarity = Math.max(similarity, similitudServidor);
        }
      }
    }

    const pct = Math.round(similarity * 100);
    const umbralPct = Math.round(umbralSimilitud * 100);

    if (score < SCORE_MINIMO_DETECCION) {
      return {
        calidadOk: false,
        rostroDetectado: true,
        similitud: similarity,
        embedding: tensor,
        score,
        mensaje: `Rostro detectado (${pct}%). Acérquese con mejor iluminación.`
      };
    }

    if (similarity < umbralSimilitud) {
      return {
        calidadOk: false,
        rostroDetectado: true,
        similitud: similarity,
        embedding: tensor,
        score,
        mensaje: `Similitud insuficiente (${pct}%). Se requiere al menos ${umbralPct}%.`
      };
    }

    if (score < SCORE_MINIMO_FRAME_VERIFICACION) {
      return {
        calidadOk: false,
        rostroDetectado: true,
        similitud: similarity,
        embedding: tensor,
        score,
        mensaje: `Coincidencia ${pct}%. Mejore iluminación para confirmar.`
      };
    }

    return {
      calidadOk: true,
      rostroDetectado: true,
      similitud: similarity,
      embedding: tensor,
      score,
      mensaje: `Identidad verificada (${pct}%)`
    };
  }

  async evaluarFrameBusqueda(video: HTMLVideoElement): Promise<EvaluacionFrameBusqueda> {
    const captura = await this.capturarFrameConScore(video);
    if (!captura) {
      return {
        rostroDetectado: false,
        mensaje: 'Centra tu rostro en la cámara'
      };
    }

    const embedding = captura.embedding;
    const score = captura.score;

    if (score < SCORE_MINIMO_DETECCION) {
      return {
        rostroDetectado: true,
        embedding,
        score,
        mensaje: 'Rostro detectado. Acérquese con mejor iluminación.'
      };
    }

    return {
      rostroDetectado: true,
      embedding,
      score,
      mensaje: 'Rostro detectado, buscando...'
    };
  }

  confirmarVerificacionFinal(
    frames: FrameCalidadFacial[],
    referenciaGaleria: EmbeddingGaleria,
    umbralSimilitud = UMBRAL_SIMILITUD_VERIFICACION
  ): { embedding: number[]; score: number; similitud: number } | null {
    const framesValidos = frames.filter(
      (f) =>
        f.embedding?.length > 0 &&
        f.score >= SCORE_MINIMO_FRAME_VERIFICACION &&
        (f.similitud == null || f.similitud >= umbralSimilitud)
    );
    if (framesValidos.length < FRAMES_MINIMOS_VERIFICACION) {
      return null;
    }

    const embedding = promediarEmbeddingsConScore(framesValidos);
    if (!embedding) {
      return null;
    }

    const similitudFinal = this.faceService.calcularMejorSimilitudConGaleria(embedding, referenciaGaleria);
    if (similitudFinal < umbralSimilitud) {
      return null;
    }

    const similitudPromedio =
      framesValidos.reduce((sum, f) => sum + (f.similitud ?? 0), 0) / framesValidos.length;
    if (similitudPromedio < umbralSimilitud) {
      return null;
    }

    return {
      embedding,
      score: scorePromedioFrames(framesValidos),
      similitud: similitudFinal
    };
  }

  embeddingCumpleUmbralVerificacion(
    embedding: number[],
    referenciaGaleria: EmbeddingGaleria,
    umbralSimilitud = UMBRAL_SIMILITUD_VERIFICACION
  ): boolean {
    if (!embedding?.length || !referenciaGaleria) {
      return false;
    }
    return this.faceService.calcularMejorSimilitudConGaleria(embedding, referenciaGaleria) >= umbralSimilitud;
  }

  async buscarYValidarUsuario(embedding: number[]): Promise<ResultadoBusqueda | null> {
    try {
      const resultado = await this.usuarioService.onGetUsuarioPorEmbedding(embedding, []);
      if (!resultado?.usuario) {
        return null;
      }

      const usuario: Usuario = resultado.usuario;
      const similitudBackend: number = resultado.similitud ?? 0;
      const galeriaPerfil = parsearGaleriaFacial(usuario.persona?.embeddingFacial);

      if (!galeriaPerfil) {
        return {
          usuario,
          similitudBackend,
          similitudLocal: 0,
          confiable: false
        };
      }

      const similitudLocal = this.faceService.calcularMejorSimilitudConGaleria(embedding, galeriaPerfil);

      return {
        usuario,
        similitudBackend,
        similitudLocal,
        confiable: similitudBackend > 0.55 && similitudLocal > 0.55
      };
    } catch (error) {
      console.error('Error en búsqueda y validación de usuario', error);
      return null;
    }
  }

  async buscarUsuarioPorEmbedding(embedding: number[], excludeIds: number[] = []): Promise<ResultadoBusqueda | null> {
    try {
      const resultado = await this.usuarioService.onGetUsuarioPorEmbedding(embedding, excludeIds);
      if (!resultado?.usuario) {
        return null;
      }

      const similitudBackend: number = resultado.similitud ?? 0;
      return {
        usuario: resultado.usuario,
        similitudBackend,
        similitudLocal: similitudBackend,
        confiable: similitudBackend >= UMBRAL_SIMILITUD_FACIAL
      };
    } catch (error) {
      console.error('Error en búsqueda por embedding', error);
      return null;
    }
  }

  async validarEmbeddingConCache(
    embedding: number[],
    usuarioIdEsperado: number
  ): Promise<{ valido: boolean; mensaje: string }> {
    const resultado = await this.buscarYValidarUsuario(embedding);
    if (!resultado?.confiable || !resultado.usuario?.id) {
      return {
        valido: false,
        mensaje: 'El servidor no confirmó la identidad facial.'
      };
    }

    if (+resultado.usuario.id !== +usuarioIdEsperado) {
      const pct = Math.round(resultado.similitudBackend * 100);
      return {
        valido: false,
        mensaje: `La caché identificó a otra persona (${pct}%). Debe ser el usuario seleccionado.`
      };
    }

    const galeria = this.obtenerGaleriaDesdeUsuario(resultado.usuario);
    if (galeria) {
      const similitudLocal = this.faceService.calcularMejorSimilitudConGaleria(embedding, galeria);
      if (similitudLocal < UMBRAL_SIMILITUD_VERIFICACION) {
        return {
          valido: false,
          mensaje: 'La verificación local no coincide con la galería del usuario.'
        };
      }
    }

    return { valido: true, mensaje: '' };
  }

  async capturarFrameConScore(
    videoElement: HTMLVideoElement
  ): Promise<{ imageBase64: string; embedding: number[]; score: number } | null> {
    if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      return null;
    }

    const imageBase64 = this.camaraService.capturarFoto(videoElement, true);
    if (!imageBase64) {
      return null;
    }

    const imagenOptimizada = await this.faceService.prepararImagen(imageBase64);
    const resultado = await this.faceService.getDescriptorConScoreDesdeImagen(imagenOptimizada);
    if (!resultado) {
      return null;
    }

    return {
      imageBase64: imagenOptimizada,
      embedding: resultado.embedding,
      score: resultado.score
    };
  }

  async evaluarSimilitudConServidor(usuarioIdEsperado: number, embedding: number[]): Promise<number | null> {
    try {
      const resultado = await this.usuarioService.onGetUsuarioPorEmbedding(embedding, []);
      if (!resultado?.usuario || +resultado.usuario.id !== +usuarioIdEsperado) {
        return null;
      }
      return resultado.similitud ?? null;
    } catch {
      return null;
    }
  }

}
