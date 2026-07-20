import { Location } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { MainService } from 'src/app/services/main.service';
import { UsuarioService } from 'src/app/services/usuario.service';
import { HoraServidorService } from 'src/app/services/hora-servidor.service';
import { ReconocimientoFacialHelperService } from 'src/app/services/reconocimiento-facial-helper.service';
import { CamaraService } from 'src/app/services/camara.service';
import { MarcacionService } from '../../../marcar-horario/service/marcacion.service';
import { MarcacionInput, TipoMarcacion } from '../../../marcar-horario/models/marcacion.model';
import { Usuario } from 'src/app/domains/personas/usuario.model';
import {
  EmbeddingGaleria,
  FrameCalidadFacial,
  FRAMES_MINIMOS_VERIFICACION,
  HITS_CONSECUTIVOS_VERIFICACION,
  parsearGaleriaFacial,
  SCORE_MINIMO_GALERIA,
  UMBRAL_SIMILITUD_VERIFICACION
} from 'src/app/services/embedding-galeria.util';
import {
  MENSAJE_ERROR_RED_CLIENTE,
  MENSAJE_RECHAZADO_SCORE_CLIENTE,
  notificarResultadoIncorporacionPerfil
} from '../../models/incorporar-embedding-result.model';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-identificacion-marcacion',
  templateUrl: './identificacion-marcacion.component.html',
  styleUrls: ['./identificacion-marcacion.component.scss']
})
export class IdentificacionMarcacionComponent implements OnInit, OnDestroy {
  sucursalId: number;
  tipo: TipoMarcacion = TipoMarcacion.ENTRADA;
  esSalidaAlmuerzo = false;
  usuarioId: number;
  usuarioIdentificado: Usuario | null = null;
  tipoLabel = '';
  headerTitle = '';
  nombreUsuario = '';
  esMarcacionTercero = false;

  isLoading = false;
  cameraActive = false;
  videoElement: HTMLVideoElement;

  similarityPercent: number | null = null;
  isVerified = false;
  verificationMessage = '';
  snapshotUrl: string | null = null;
  currentTime: Date;
  formattedTime = '';
  private timeInterval: ReturnType<typeof setInterval>;

  private storedGaleriaPromise: Promise<EmbeddingGaleria | null> | null = null;
  private storedGaleriaCache: EmbeddingGaleria | null = null;
  private storedGaleriaLoaded = false;
  private framesVerificacion: FrameCalidadFacial[] = [];
  private hitsConsecutivosVerificacion = 0;
  private embeddingVerificado: number[] | null = null;
  private embeddingScoreVerificado: number | null = null;
  private deteccionLoopActivo = false;
  private ultimoFrameProcesado = 0;
  private procesandoFrame = false;
  private readonly INTERVALO_DETECCION_MS = 400;

  constructor(
    private usuarioService: UsuarioService,
    private route: ActivatedRoute,
    private mainService: MainService,
    private location: Location,
    private notificacionService: NotificacionService,
    private faceHelper: ReconocimientoFacialHelperService,
    private camaraService: CamaraService,
    private marcacionService: MarcacionService,
    private router: Router,
    private horaServidorService: HoraServidorService
  ) { }

  async ngOnInit(): Promise<void> {
    this.route.paramMap.pipe(untilDestroyed(this)).subscribe(() => {
      this.sucursalId = +this.route.snapshot.paramMap.get('sucId');
      this.tipo = (this.route.snapshot.queryParamMap.get('tipo') as TipoMarcacion) || TipoMarcacion.ENTRADA;
      this.esSalidaAlmuerzo = this.route.snapshot.queryParamMap.get('esSalidaAlmuerzo') === 'true';
      const customUsuarioId = this.route.snapshot.queryParamMap.get('usuarioId');
      this.usuarioId = customUsuarioId ? +customUsuarioId : this.mainService.usuarioActual.id;
      this.esMarcacionTercero = this.usuarioId !== this.mainService.usuarioActual?.id;
      this.actualizarTipoLabel();
      this.cargarDatosUsuario();
    });

    await this.faceHelper.inicializarMotorFacial();
    this.storedGaleriaPromise = this.cargarGaleriaReferencia();
    this.startCamera();

    this.currentTime = this.horaServidorService.obtenerHoraActual();
    this.actualizarFormattedTime();
    this.timeInterval = setInterval(() => {
      this.currentTime = this.horaServidorService.obtenerHoraActual();
      this.actualizarFormattedTime();
    }, 1000);
  }

  async startCamera() {
    this.cameraActive = true;
    this.isVerified = false;
    this.similarityPercent = null;
    this.verificationMessage = 'Mire de frente a la cámara';
    this.snapshotUrl = null;
    this.framesVerificacion = [];
    this.hitsConsecutivosVerificacion = 0;
    this.embeddingVerificado = null;
    this.embeddingScoreVerificado = null;
    this.actualizarHeaderTitle();

    try {
      const stream = await this.camaraService.iniciarCamara();
      this.videoElement = await this.getVideoElementWithRetry();
      if (!this.videoElement) {
        throw new Error('No se encontró el elemento de video');
      }

      this.videoElement.srcObject = stream;
      this.videoElement.muted = true;
      this.videoElement.playsInline = true;
      await this.videoElement.play();
      await this.waitForVideoReady(this.videoElement);
      await new Promise((resolve) => setTimeout(resolve, 300));
      this.iniciarBucleDeteccion();
    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
      this.notificacionService.danger('No se pudo acceder a la cámara.');
    }
  }

  private iniciarBucleDeteccion(): void {
    this.deteccionLoopActivo = true;
    void this.bucleDeteccion();
  }

  private detenerDeteccionContinua(): void {
    this.deteccionLoopActivo = false;
  }

  private async bucleDeteccion(): Promise<void> {
    if (!this.deteccionLoopActivo || !this.cameraActive || !this.videoElement || this.isVerified) {
      return;
    }

    const video = this.videoElement;
    if (video.paused || video.ended || video.videoWidth === 0) {
      setTimeout(() => this.bucleDeteccion(), 100);
      return;
    }

    const ahora = Date.now();
    if (!this.procesandoFrame && ahora - this.ultimoFrameProcesado >= this.INTERVALO_DETECCION_MS) {
      this.ultimoFrameProcesado = ahora;
      this.procesandoFrame = true;

      try {
        const galeriaReferencia = this.storedGaleriaPromise
          ? await this.storedGaleriaPromise
          : await this.cargarGaleriaReferencia();

        if (!galeriaReferencia) {
          this.isVerified = false;
          this.similarityPercent = null;
          this.verificationMessage = 'Sin registro facial. Configure su perfil con 3 fotos antes de marcar.';
        } else {
          const umbralSimilitud = UMBRAL_SIMILITUD_VERIFICACION;
          const evaluacion = await this.faceHelper.evaluarFrameVerificacion(
            video,
            galeriaReferencia,
            umbralSimilitud,
            this.usuarioId
          );
          this.verificationMessage = evaluacion.mensaje;
          this.similarityPercent = evaluacion.similitud != null
            ? Math.round(evaluacion.similitud * 100)
            : null;

          if (evaluacion.calidadOk && evaluacion.embedding && evaluacion.score != null) {
            this.hitsConsecutivosVerificacion++;
            this.framesVerificacion.push({
              embedding: evaluacion.embedding,
              score: evaluacion.score,
              similitud: evaluacion.similitud
            });
            if (this.framesVerificacion.length > 6) {
              this.framesVerificacion.shift();
            }

            if (
              this.hitsConsecutivosVerificacion >= HITS_CONSECUTIVOS_VERIFICACION
              && this.framesVerificacion.length >= FRAMES_MINIMOS_VERIFICACION
            ) {
              const verificado = this.faceHelper.confirmarVerificacionFinal(
                this.framesVerificacion,
                galeriaReferencia,
                umbralSimilitud
              );
              if (!verificado) {
                this.reiniciarAcumulacionVerificacion();
                this.verificationMessage = 'Mantenga el rostro estable frente a la cámara';
              } else {
                this.embeddingVerificado = verificado.embedding;
                this.embeddingScoreVerificado = verificado.score;
                this.similarityPercent = Math.round(verificado.similitud * 100);
                this.isVerified = true;
                this.verificationMessage = `Identidad verificada (${this.similarityPercent}%)`;
                this.detenerDeteccionContinua();
                this.captureSnapshot();
                return;
              }
            }
          } else if (!evaluacion.rostroDetectado) {
            this.reiniciarAcumulacionVerificacion();
          } else if (evaluacion.similitud != null && evaluacion.similitud < umbralSimilitud) {
            this.reiniciarAcumulacionVerificacion();
          } else if (evaluacion.rostroDetectado) {
            this.hitsConsecutivosVerificacion = 0;
          }
        }
      } catch (e) {
        console.error('Error en detección:', e);
      } finally {
        this.procesandoFrame = false;
      }
    }

    if (this.deteccionLoopActivo && !this.isVerified) {
      setTimeout(() => this.bucleDeteccion(), 50);
    }
  }

  captureSnapshot() {
    if (!this.videoElement) return;
    try {
      this.snapshotUrl = this.camaraService.capturarFoto(this.videoElement, true);
      this.actualizarHeaderTitle();
      this.videoElement.pause();
      this.stopCamera();
    } catch (e) {
      console.error('Error al capturar snapshot:', e);
    }
  }

  private reiniciarAcumulacionVerificacion(): void {
    this.hitsConsecutivosVerificacion = 0;
    this.framesVerificacion = [];
  }

  async cargarGaleriaReferencia(): Promise<EmbeddingGaleria | null> {
    if (this.storedGaleriaLoaded) {
      return this.storedGaleriaCache;
    }

    try {
      const usuario = await this.obtenerUsuarioConEmbedding();
      const galeriaDesdeBd = parsearGaleriaFacial(usuario?.persona?.embeddingFacial);
      if (galeriaDesdeBd) {
        this.storedGaleriaCache = galeriaDesdeBd;
        this.storedGaleriaLoaded = true;
        return galeriaDesdeBd;
      }
    } catch (e) {
      console.warn('No se pudo cargar galería facial desde BD:', e);
    }

    this.storedGaleriaLoaded = true;
    return null;
  }

  private async obtenerUsuarioConEmbedding(): Promise<Usuario | null> {
    if (this.usuarioIdentificado?.persona?.embeddingFacial) {
      return this.usuarioIdentificado;
    }
    if (this.usuarioId === this.mainService.usuarioActual?.id && this.mainService.usuarioActual?.persona?.embeddingFacial) {
      return this.mainService.usuarioActual;
    }

    return await new Promise<Usuario | null>((resolve) => {
      this.usuarioService.onGetUsuario(this.usuarioId).subscribe({
        next: (res: Usuario) => {
          this.usuarioIdentificado = res;
          this.actualizarNombreUsuario();
          resolve(res);
        },
        error: () => resolve(null)
      });
    });
  }

  actualizarTipoLabel(): void {
    if (this.tipo === TipoMarcacion.ENTRADA) {
      this.tipoLabel = this.esSalidaAlmuerzo ? 'ENTRADA ALMUERZO' : 'ENTRADA';
    } else {
      this.tipoLabel = this.esSalidaAlmuerzo ? 'SALIDA ALMUERZO' : 'SALIDA';
    }
  }

  private actualizarHeaderTitle(): void {
    this.headerTitle = this.snapshotUrl ? 'Identidad verificada' : 'Posicione su rostro';
  }

  private actualizarFormattedTime(): void {
    if (!this.currentTime) return;
    this.formattedTime = this.currentTime.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  private actualizarNombreUsuario(): void {
    this.nombreUsuario = this.usuarioIdentificado?.persona?.nombreCompleto || this.usuarioIdentificado?.nickname || '';
  }

  async onMarcar() {
    if (!this.isVerified) {
      this.notificacionService.warn('Debe verificar su identidad primero.');
      return;
    }

    const embedding = this.embeddingVerificado;
    if (!embedding?.length) {
      this.notificacionService.warn('No se detectó ningún rostro.');
      return;
    }

    const galeria = this.storedGaleriaCache ?? await this.cargarGaleriaReferencia();
    if (!galeria || !this.faceHelper.embeddingCumpleUmbralVerificacion(embedding, galeria, UMBRAL_SIMILITUD_VERIFICACION)) {
      this.isVerified = false;
      this.notificacionService.danger('El rostro verificado no coincide con el usuario seleccionado.');
      return;
    }

    this.isLoading = true;
    const validacionCache = await this.faceHelper.validarEmbeddingConCache(embedding, this.usuarioId);
    if (!validacionCache.valido) {
      this.isLoading = false;
      this.isVerified = false;
      this.notificacionService.danger(validacionCache.mensaje);
      return;
    }

    try {
      const now = this.horaServidorService.obtenerHoraActual();
      const fechaLocal = this.toLocalIsoString(now);

      const input: MarcacionInput = {
        usuarioId: this.usuarioId,
        tipo: this.tipo,
        sucursalId: this.sucursalId,
        embedding,
        distanciaSucursalMetros: 0,
        esSalidaAlmuerzo: this.esSalidaAlmuerzo,
        sucursalEntradaId: this.sucursalId
      };

      if (this.tipo === TipoMarcacion.ENTRADA) {
        input.fechaEntrada = fechaLocal;
      } else {
        input.fechaSalida = fechaLocal;
        input.sucursalSalidaId = this.sucursalId;
      }

      (await this.marcacionService.onSaveMarcacion(input)).subscribe({
        next: async () => {
          this.isLoading = false;
          this.stopCamera();
          this.notificacionService.success(`${this.tipoLabel} registrada correctamente`);

          await this.incorporarPerfilPostMarcacion(embedding);

          setTimeout(() => {
            const isAdmin = this.mainService.usuarioActual?.nickname?.toUpperCase() === 'ADMIN';
            this.router.navigate(
              isAdmin ? ['/marcacion/ingreso-persona'] : ['/marcacion'],
              { replaceUrl: true }
            );
          }, 2200);
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error al marcar:', err);

          let errorMsg = 'Error al realizar la marcación';
          if (err?.message) {
            errorMsg = err.message;
          } else if (err?.graphQLErrors?.length > 0) {
            errorMsg = err.graphQLErrors[0].message;
          }
          this.notificacionService.danger(errorMsg);
        }
      });

    } catch (e) {
      this.isLoading = false;
      this.notificacionService.danger('Error procesando marcación.');
    }
  }

  private async incorporarPerfilPostMarcacion(embedding: number[]): Promise<void> {
    if (!this.usuarioId || !embedding?.length || this.embeddingScoreVerificado == null) {
      return;
    }

    if (this.embeddingScoreVerificado < SCORE_MINIMO_GALERIA) {
      notificarResultadoIncorporacionPerfil(this.notificacionService, {
        resultado: 'RECHAZADO_SCORE',
        mensaje: MENSAJE_RECHAZADO_SCORE_CLIENTE
      });
      return;
    }

    try {
      const resultado = await this.usuarioService.onIncorporarEmbeddingMarcacion(
        this.usuarioId,
        embedding,
        this.embeddingScoreVerificado
      );
      notificarResultadoIncorporacionPerfil(this.notificacionService, resultado);
    } catch (error) {
      console.warn('No se pudo enriquecer la galería facial tras marcación', error);
      notificarResultadoIncorporacionPerfil(this.notificacionService, {
        resultado: 'ERROR_RED',
        mensaje: MENSAJE_ERROR_RED_CLIENTE
      });
    }
  }

  stopCamera() {
    this.cameraActive = false;
    this.detenerDeteccionContinua();
    this.camaraService.detenerCamara(this.videoElement);
  }

  onBack() {
    this.stopCamera();
    this.location.back();
  }

  ngOnDestroy() {
    this.stopCamera();
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  private toLocalIsoString(date: Date): string {
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, -1);
    return localISOTime;
  }

  private waitForVideoReady(video: HTMLVideoElement): Promise<void> {
    if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const onReady = () => {
        video.removeEventListener('loadeddata', onReady);
        video.removeEventListener('canplay', onReady);
        resolve();
      };
      video.addEventListener('loadeddata', onReady, { once: true });
      video.addEventListener('canplay', onReady, { once: true });
    });
  }

  private async getVideoElementWithRetry(maxAttempts = 10): Promise<HTMLVideoElement | null> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const video = document.getElementById('camera-feed') as HTMLVideoElement | null;
      if (video) {
        return video;
      }
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    }
    return null;
  }

  async cargarDatosUsuario() {
    if (!this.usuarioId) return;
    if (this.usuarioId === this.mainService.usuarioActual?.id) {
      this.usuarioIdentificado = this.mainService.usuarioActual;
      this.actualizarNombreUsuario();
      return;
    }
    this.usuarioService.onGetUsuario(this.usuarioId).subscribe((res: Usuario) => {
      this.usuarioIdentificado = res;
      this.actualizarNombreUsuario();
    });
  }
}
