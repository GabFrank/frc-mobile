import { Location } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { GeoLocationService } from 'src/app/services/geo-location.service';
import { MainService } from 'src/app/services/main.service';
import { UsuarioService } from 'src/app/services/usuario.service';
import { FaceRecognitionService } from 'src/app/services/face-recognition.service';
import { HoraServidorService } from 'src/app/services/hora-servidor.service';
import { MarcacionService } from '../../../marcar-horario/service/marcacion.service';
import { Jornada, MarcacionInput, TipoMarcacion } from '../../../marcar-horario/models/marcacion.model';
import { Result } from '@vladmandic/human';

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

  isLoading = false;
  detection: Result | null = null;
  cameraActive = false;
  videoElement: HTMLVideoElement;

  similarityPercent: number | null = null;
  isVerified = false;
  verificationMessage = '';
  isPrimerRegistro = false;
  snapshotUrl: string | null = null;
  currentTime: Date;
  private timeInterval: any;

  constructor(
    private usuarioService: UsuarioService,
    private route: ActivatedRoute,
    private mainService: MainService,
    private location: Location,
    private notificacionService: NotificacionService,
    private faceRecognitionService: FaceRecognitionService,
    private marcacionService: MarcacionService,
    private geoLocation: GeoLocationService,
    private router: Router,
    private horaServidorService: HoraServidorService
  ) { }

  async ngOnInit(): Promise<void> {
    this.route.paramMap.pipe(untilDestroyed(this)).subscribe(async (res) => {
      this.sucursalId = +res.get('sucId');
      this.tipo = (this.route.snapshot.queryParamMap.get('tipo') as TipoMarcacion) || TipoMarcacion.ENTRADA;
      this.esSalidaAlmuerzo = this.route.snapshot.queryParamMap.get('esSalidaAlmuerzo') === 'true';
    });

    await this.faceRecognitionService.init();

    // Siempre ir directo a la cámara. Si no tiene foto de perfil,
    // el flujo de "primer registro facial" se encarga de guardarla.
    setTimeout(() => {
      this.startCamera();
    }, 500);

    this.currentTime = this.horaServidorService.obtenerHoraActual();
    this.timeInterval = setInterval(() => {
      this.currentTime = this.horaServidorService.obtenerHoraActual();
    }, 1000);
  }

  async startCamera() {
    this.cameraActive = true;
    this.isVerified = false;
    this.similarityPercent = null;
    this.verificationMessage = '';
    this.snapshotUrl = null;

    setTimeout(() => {
      this.videoElement = document.getElementById('camera-feed') as HTMLVideoElement;
      if (this.videoElement) {
        navigator.mediaDevices
          .getUserMedia({ video: { facingMode: 'user' } })
          .then((stream) => {
            this.videoElement.srcObject = stream;
            this.videoElement.play();
            this.detectAndVerify();
          })
          .catch((err) => {
            console.error('Error al acceder a la cámara:', err);
            this.notificacionService.danger('No se pudo acceder a la cámara.');
          });
      }
    }, 100);
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
      this.videoElement.pause();
      this.stopCamera();
    } catch (e) {
      console.error('Error al capturar snapshot:', e);
    }
  }

  async detectAndVerify() {
    if (!this.cameraActive || !this.videoElement) return;

    try {
      const result = await this.faceRecognitionService.detect(this.videoElement);
      this.detection = result;

      if (result.face && result.face.length > 0 && result.face[0].score > 0.6) {
        const currentEmbedding = result.face[0].embedding as unknown as number[];

        if (currentEmbedding && currentEmbedding.length > 0) {
          const storedEmbedding = await this.getStoredEmbedding();

          if (storedEmbedding) {
            const similarity = this.faceRecognitionService.similarity(currentEmbedding, storedEmbedding);
            this.similarityPercent = Math.round(similarity * 100);

            if (similarity >= 0.6) {
              this.isVerified = true;
              this.verificationMessage = `Identidad verificada (${this.similarityPercent}% similitud)`;
              this.captureSnapshot();
              return;
            } else {
              this.isVerified = false;
              this.verificationMessage = `No coincide (${this.similarityPercent}% similitud)`;
            }
          } else {
            this.isVerified = true;
            this.isPrimerRegistro = true;
            this.similarityPercent = 100;
            this.verificationMessage = 'Primer registro facial - se guardará su rostro';
            this.captureSnapshot();
            return;
          }
        }
      } else {
        this.isVerified = false;
        this.similarityPercent = null;
        this.verificationMessage = 'Posicione su rostro frente a la cámara';
      }
    } catch (e) {
      console.error('Error en detección:', e);
    }

    if (this.cameraActive) {
      requestAnimationFrame(() => this.detectAndVerify());
    }
  }

  private storedEmbeddingCache: number[] | null = null;
  private storedEmbeddingLoaded = false;

  async getStoredEmbedding(): Promise<number[] | null> {
    if (this.storedEmbeddingLoaded) {
      return this.storedEmbeddingCache;
    }

    try {
      const perfilImages = await new Promise<string[]>((resolve, reject) => {
        this.usuarioService.onGetUsuarioImages(
          this.mainService.usuarioActual.id,
          'perfil'
        ).then(obs => {
          obs.subscribe({
            next: imgs => resolve(imgs),
            error: err => reject(err)
          });
        });
      });

      if (perfilImages && perfilImages.length > 0) {
        const descriptor = await this.faceRecognitionService.getDescriptor(perfilImages[0]);
        if (descriptor) {
          this.storedEmbeddingCache = descriptor;
          this.storedEmbeddingLoaded = true;
          console.log('Descriptor de referencia obtenido de imagen de perfil');
          return descriptor;
        }
      }
    } catch (e) {
      console.warn('No se encontró imagen de perfil:', e);
    }

    this.storedEmbeddingLoaded = true;
    return null;
  }

  getTipoLabel(): string {
    if (this.tipo === TipoMarcacion.ENTRADA) {
      if (this.esSalidaAlmuerzo) return 'ENTRADA ALMUERZO';
      return 'ENTRADA';
    } else {
      if (this.esSalidaAlmuerzo) return 'SALIDA ALMUERZO';
      return 'SALIDA';
    }
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
      const location = await this.geoLocation.getCurrentLocation();

      const now = this.horaServidorService.obtenerHoraActual();
      const fechaLocal = this.toLocalIsoString(now);

      // Si es primer registro facial, guardar la foto como perfil con embedding
      if (this.isPrimerRegistro && this.snapshotUrl) {
        try {
          (await this.usuarioService.onSaveUsuarioImage(
            this.mainService.usuarioActual.id,
            'perfil',
            this.snapshotUrl,
            embedding
          )).subscribe({
            next: (res) => {
              console.log('Foto de perfil guardada con embedding en primer registro facial');
            },
            error: (err) => {
              console.error('Error al guardar foto de perfil:', err);
            }
          });
        } catch (e) {
          console.error('Error al guardar foto de perfil en primer registro:', e);
        }
      }

      const input: MarcacionInput = {
        usuarioId: this.mainService.usuarioActual.id,
        tipo: this.tipo,
        sucursalId: this.sucursalId,
        embedding: embedding,
        latitud: location.latitude,
        longitud: location.longitude,
        precisionGps: location.accuracy,
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

          const tipoLabel = this.getTipoLabel();
          this.notificacionService.success(`${tipoLabel} registrada correctamente`);

          setTimeout(() => {
            this.router.navigate(['/marcacion']);
          }, 1500);
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
      this.notificacionService.danger('Error obteniendo ubicación o procesando marcación.');
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
}
