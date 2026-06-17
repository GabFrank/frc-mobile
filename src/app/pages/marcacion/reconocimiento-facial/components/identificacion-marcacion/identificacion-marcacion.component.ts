import { Location } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { MainService } from 'src/app/services/main.service';
import { UsuarioService } from 'src/app/services/usuario.service';
import { FaceRecognitionService } from 'src/app/services/face-recognition.service';
import { HoraServidorService } from 'src/app/services/hora-servidor.service';
import { MarcacionService } from '../../../marcar-horario/service/marcacion.service';
import { MarcacionInput, TipoMarcacion } from '../../../marcar-horario/models/marcacion.model';
import { Result } from '@vladmandic/human';
import { Usuario } from 'src/app/domains/personas/usuario.model';
import { EmbeddingGaleria, parsearGaleriaFacial } from 'src/app/services/embedding-galeria.util';

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

  isLoading = false;
  detection: Result | null = null;
  cameraActive = false;
  videoElement: HTMLVideoElement;

  similarityPercent: number | null = null;
  isVerified = false;
  verificationMessage = '';
  snapshotUrl: string | null = null;
  currentTime: Date;
  formattedTime = '';
  private timeInterval: ReturnType<typeof setInterval>;

  livenessStep: 'BLINK' | 'DONE' = 'BLINK';
  livenessInstruction = 'Parpadee para verificar';
  livenessIcon = 'eye-outline';
  livenessColor = 'primary';
  private hasBlinked = false;
  private modelInitPromise: Promise<void> | null = null;
  private storedGaleriaPromise: Promise<EmbeddingGaleria | null> | null = null;

  constructor(
    private usuarioService: UsuarioService,
    private route: ActivatedRoute,
    private mainService: MainService,
    private location: Location,
    private notificacionService: NotificacionService,
    private faceRecognitionService: FaceRecognitionService,
    private marcacionService: MarcacionService,
    private router: Router,
    private horaServidorService: HoraServidorService
  ) { }

  async ngOnInit(): Promise<void> {
    this.route.paramMap.pipe(untilDestroyed(this)).subscribe(async (res) => {
      this.sucursalId = +res.get('sucId');
      this.tipo = (this.route.snapshot.queryParamMap.get('tipo') as TipoMarcacion) || TipoMarcacion.ENTRADA;
      this.esSalidaAlmuerzo = this.route.snapshot.queryParamMap.get('esSalidaAlmuerzo') === 'true';
      const customUsuarioId = this.route.snapshot.queryParamMap.get('usuarioId');
      this.usuarioId = customUsuarioId ? +customUsuarioId : this.mainService.usuarioActual.id;
      this.actualizarTipoLabel();
      this.cargarDatosUsuario();
    });

    this.modelInitPromise = this.faceRecognitionService.init();
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
    this.verificationMessage = '';
    this.snapshotUrl = null;
    this.livenessStep = 'BLINK';
    this.livenessInstruction = 'Parpadee para verificar';
    this.livenessIcon = 'eye-outline';
    this.livenessColor = 'primary';
    this.hasBlinked = false;
    this.actualizarHeaderTitle();

    this.videoElement = await this.getVideoElementWithRetry();
    if (this.videoElement) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'user' } })
        .then(async (stream) => {
          this.videoElement.srcObject = stream;
          await this.videoElement.play();
          await this.waitForVideoReady(this.videoElement);
          this.detectAndVerify();
        })
        .catch((err) => {
          console.error('Error al acceder a la cámara:', err);
          this.notificacionService.danger('No se pudo acceder a la cámara.');
        });
    }
  }

  captureSnapshot() {
    if (!this.videoElement) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = this.videoElement.videoWidth;
      canvas.height = this.videoElement.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
      this.snapshotUrl = canvas.toDataURL('image/jpeg', 0.9);
      this.actualizarHeaderTitle();
      this.videoElement.pause();
      this.stopCamera();
    } catch (e) {
      console.error('Error al capturar snapshot:', e);
    }
  }

  private lastDetectTime = 0;
  private canvasElement: HTMLCanvasElement;

  async detectAndVerify() {
    if (!this.cameraActive || !this.videoElement) return;

    try {
      if (this.modelInitPromise) {
        await this.modelInitPromise;
        this.modelInitPromise = null;
      }

      const now = Date.now();
      if (now - this.lastDetectTime > 250) {
        this.lastDetectTime = now;

        if (!this.canvasElement) {
          this.canvasElement = document.createElement('canvas');
        }
        this.canvasElement.width = this.videoElement.videoWidth;
        this.canvasElement.height = this.videoElement.videoHeight;
        const ctx = this.canvasElement.getContext('2d');
        ctx.drawImage(this.videoElement, 0, 0, this.canvasElement.width, this.canvasElement.height);

        const base64Image = this.canvasElement.toDataURL('image/jpeg', 0.7);

        const faces = await this.faceRecognitionService.fastDetectFace(base64Image);

        if (faces && faces.length > 0) {
          const face = faces[0];

          if (!this.hasBlinked) {
            const leftEyeClosed = face.leftEyeOpenProbability !== undefined && face.leftEyeOpenProbability < 0.2;
            const rightEyeClosed = face.rightEyeOpenProbability !== undefined && face.rightEyeOpenProbability < 0.2;

            if (leftEyeClosed || rightEyeClosed) {
              this.hasBlinked = true;
              this.livenessStep = 'DONE';
              this.livenessInstruction = 'Verificación completa';
              this.livenessIcon = 'checkmark-done-outline';
              this.livenessColor = 'success';
            }
          }

          if (this.livenessStep === 'DONE') {
            const result = await this.faceRecognitionService.detect(this.videoElement);
            this.detection = result;

            if (result.face && result.face.length > 0) {
              const currentEmbedding = result.face[0].embedding as unknown as number[];

              if (currentEmbedding && currentEmbedding.length > 0) {
                const galeriaReferencia = this.storedGaleriaPromise
                  ? await this.storedGaleriaPromise
                  : await this.cargarGaleriaReferencia();

                if (galeriaReferencia) {
                  const similarity = this.faceRecognitionService.calcularMejorSimilitudConGaleria(
                    currentEmbedding,
                    galeriaReferencia
                  );
                  this.similarityPercent = Math.round(similarity * 100);

                  if (similarity >= 0.55) {
                    this.isVerified = true;
                    this.verificationMessage = `Identidad verificada (${this.similarityPercent}% similitud)`;
                    this.captureSnapshot();
                    return;
                  } else {
                    this.isVerified = false;
                    this.verificationMessage = `No coincide (${this.similarityPercent}% similitud)`;
                  }
                } else {
                  this.isVerified = false;
                  this.similarityPercent = null;
                  this.verificationMessage = 'Sin registro facial. Configure su perfil con 3 fotos antes de marcar.';
                }
              }
            }
          } else {
            this.verificationMessage = this.livenessInstruction;
          }
        } else {
          this.isVerified = false;
          this.similarityPercent = null;
          this.verificationMessage = 'Posicione su rostro frente a la cámara';
        }
      }
    } catch (e) {
      console.error('Error en detección:', e);
    }

    if (this.cameraActive) {
      requestAnimationFrame(() => this.detectAndVerify());
    }
  }

  private storedGaleriaCache: EmbeddingGaleria | null = null;
  private storedGaleriaLoaded = false;

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
        console.log('Galería facial cargada desde base de datos');
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

    if (!this.detection || !this.detection.face || this.detection.face.length === 0) {
      this.notificacionService.warn('No se detectó ningún rostro.');
      return;
    }

    this.isLoading = true;
    try {
      const embedding = this.detection.face[0].embedding as unknown as number[];
      const now = this.horaServidorService.obtenerHoraActual();
      const fechaLocal = this.toLocalIsoString(now);

      const input: MarcacionInput = {
        usuarioId: this.usuarioId,
        tipo: this.tipo,
        sucursalId: this.sucursalId,
        embedding: embedding,
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
        next: (res) => {
          this.isLoading = false;
          this.stopCamera();
          this.notificacionService.success(`${this.tipoLabel} registrada correctamente`);

          setTimeout(() => {
            const isAdmin = this.mainService.usuarioActual?.nickname?.toUpperCase() === 'ADMIN';
            this.router.navigate(
              isAdmin ? ['/marcacion/ingreso-persona'] : ['/marcacion'],
              { replaceUrl: true }
            );
          }, 400);
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

  stopCamera() {
    this.cameraActive = false;
    if (this.videoElement && this.videoElement.srcObject) {
      const tracks = (this.videoElement.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
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
